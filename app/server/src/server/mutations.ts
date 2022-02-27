import * as DBUtil from '../util/db'
import * as AuthUtil from '../util/auth'
import * as DropboxUtil from '../util/dropbox'
import * as TasksUtil from '../util/tasks'
import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'
import { TaskManager } from '../services/TaskManager'
import Logger from '../services/logging'

const login = async (parent, args, context): Promise<Types.API.Response.Auth> => {
    const user = await DBUtil.getUser(args.authInput.email, args.authInput.password)

    if (user) {
        const token = AuthUtil.generateJWT(user.id)

        context.res.cookie('picili-token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 31,
        })

        return {
            token,
            error: undefined,
        }
    } else {
        return {
            token: undefined,
            error: `credentials didn't match a user`,
        }
    }
}

const register = async (parent, args, context): Promise<Types.API.Response.Auth> => {
    const { email, password, passwordConfirmation } = args.authInput

    // check email not in use
    const userWithEmailExists = await DBUtil.userWithEmailExists(email)
    if (userWithEmailExists) {
        return {
            error: 'User with email exists',
        }
    }

    // check passwords match
    if (password !== passwordConfirmation) {
        return {
            error: "Passwords don't match",
        }
    }

    // create user
    const user = await DBUtil.createUser(email, password)

    // authenticate user

    const token = AuthUtil.generateJWT(user.id)

    context.setCookies.push({
        name: 'picili-token',
        value: token,
        options: {
            SameSite: 'Strict',
            maxAge: 1000 * 60 * 60 * 24 * 31,
        },
    })

    // return token or error
    return {
        token: user ? token : undefined,
        error: !user ? `user creation failed` : undefined,
    }
}

const dropboxConnect = async (parent, args, context): Promise<any> => {
    AuthUtil.verifyRequestIsAuthenticated(args)
    const { token } = parent.dropboxConnectInput
    const { userId } = args

    if (!userId) {
        return {
            success: false,
            error: 'missing userId - not logged in?',
        }
    }
    if (!token) {
        Logger.warn('dropbox oauth didn\'t come back with a token')
        return {
            success: false,
            error: 'missing dropbox oauth token',
        }
    }

    const existingDropboxConnection = await DBUtil.getDropboxConnection(userId)

    if (existingDropboxConnection) {
        return {
            success: false,
            error: 'dropbox connection already exists',
        }
    }

    // swap the dropbox code for a long life 'refresh token'
    const refreshToken = await DropboxUtil.exchangeCodeForRefreshToken(token)

    if (!refreshToken) {
        Logger.warn('wasn\'t able to swap auth code for an access token')
        return {
            success: false,
            error: 'failed to exchange code for a refresh token, please try connecting again.',
        }
    }

    const connection = await DBUtil.createDropboxConnection(userId, refreshToken)

    // ensure task processor is running
    TasksUtil.ensureTaskProcessorIsRunning()

    return {
        success: !!connection,
        connection: connection
            ? {
                syncPath: connection.syncPath,
                syncEnabled: connection.syncEnabled,
                invalidPathDetected: connection.invalidPathDetected,
            }
            : undefined,
    }
}

const dropboxUpdate = async (parent, args, context): Promise<any> => {
    AuthUtil.verifyRequestIsAuthenticated(args)

    // don't allow a change to the dropbox connection if the task manager is working on a task
    // gets number of processable tasks.
    // todo: block submitting form and display why on the dropbox connection form in the first place
    if (TasksUtil.isTaskProcessorTooBusyToBeInterrupted()) {
        return {
            success: false,
            error: 'task processor too busy to interrupt'
        }
    }

    const { syncPath, syncEnabled } = parent.dropboxUpdateInput
    const { userId } = args

    if (!syncPath && syncEnabled === undefined) {
        return {
            success: false,
            error: 'no arguments provided to update with',
        }
    }

    const updatedConnection = await DBUtil.updateDropboxConnection(userId, { syncPath, syncEnabled })

    // ensure task processor is running
    TasksUtil.ensureTaskProcessorIsRunning()

    // if enabled, ensure sync task exists
    if (syncEnabled) {
        await DBUtil.ensureTaskExists(Enums.TaskType.DROPBOX_SYNC, userId)
    } else {
        // if disabled, remove sync tasks
        await DBUtil.removeDropboxImportTask(userId)
    }

    return {
        success: true,
        dropboxConnection: {
            syncPath: updatedConnection?.syncPath,
            syncEnabled: updatedConnection?.syncEnabled,
            invalidPathDetected: updatedConnection?.invalidPathDetected,
        },
    }
}

const dropboxDisconnect = async (parent, args, context): Promise<any> => {
    AuthUtil.verifyRequestIsAuthenticated(args)

    // don't allow a change to the dropbox connection if the task manager is working on a task
    if (TasksUtil.isTaskProcessorTooBusyToBeInterrupted()) {
        return {
            error: 'task processor too busy to be interrupted',
            success: false,
        }
    }

    const { userId } = args

    // remove dropbox sync task
    await DBUtil.removeDropboxImportTask(userId)

    // remove all import tasks
    await DBUtil.removeAllImportTasks()

    // likewise update any remaining non-import tasks to not be dependent on other tasks (that have just been removed)
    await DBUtil.updateNonImportTasksToHaveNoDependencies()

    // get all files for user with their dropbox file, and queue remove file task
    const piciliFileIds = await DBUtil.getAllPiciliFileIdsForUser(userId)
    await TasksUtil.bulkCreateRemovalTasks(piciliFileIds)
    // then remove the dropbox files themselves
    await DBUtil.removeUsersDropboxFiles(userId)

    // finally remove the dropbox connection
    await DBUtil.removeDropboxConnection(userId)

    // ensure task processor continues to run (for cleanup tasks)
    TasksUtil.ensureTaskProcessorIsRunning()
    return {
        success: true,
    }
}

const stopProcessingImportTasks = (): boolean => {
    const taskManager = TaskManager.getInstance()
    taskManager.setStopping(true)

    return true
}

const dropbox = () => ({
    connect: dropboxConnect,
    update: dropboxUpdate,
    disconnect: dropboxDisconnect,
})

const taskProcessor = () => ({
    stopProcessingImportTasks,
})

const mutations = {
    login,
    register,
    dropbox,
    taskProcessor,
}

export default mutations
