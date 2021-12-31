import * as DBUtil from '../util/db'
import * as AuthUtil from '../util/auth'
import * as DropboxUtil from '../util/dropbox'
import * as TasksUtil from '../util/tasks'
import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'

const login = async (parent, args, context): Promise<Types.API.Response.Auth> => {
    const user = await DBUtil.getUser(args.authInput.email, args.authInput.password)

    if (user) {
        const token = AuthUtil.generateJWT(user.id)

        context.setCookies.push({
            name: 'picili-token',
            value: token,
            options: {
                SameSite: 'Strict',
                maxAge: 1000 * 60 * 60 * 24 * 31,
            },
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

    const connection = await DBUtil.createDropboxConnection(userId, refreshToken)

    // ensure task processor is running
    TasksUtil.ensureTaskProcessorIsRunning()

    return {
        success: !!connection,
        connection: connection
            ? {
                  syncPath: connection.syncPath,
                  syncEnabled: connection.syncEnabled,
              }
            : undefined,
    }
}
const dropboxUpdate = async (parent, args, context): Promise<any> => {
    AuthUtil.verifyRequestIsAuthenticated(args)
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

    // todo: if enabled, ensure sync task exists
    await DBUtil.ensureTaskExists(Enums.TaskType.DROPBOX_SYNC, userId)

    // todo: if disabled, remove sync tasks

    // todo: remove all old import tasks?

    return {
        success: true,
        dropboxConnection: {
            syncPath: updatedConnection?.syncPath,
            syncEnabled: updatedConnection?.syncEnabled,
        },
    }
}
const dropboxDisconnect = async (parent, args, context): Promise<any> => {
    AuthUtil.verifyRequestIsAuthenticated(args)
    const { userId } = args

    await DBUtil.removeDropboxConnection(userId)
    return {
        success: true,
    }
}

const dropbox = () => ({
    connect: dropboxConnect,
    update: dropboxUpdate,
    disconnect: dropboxDisconnect,
})

const mutations = {
    login,
    register,
    dropbox,
}

export default mutations
