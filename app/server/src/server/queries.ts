import * as AuthUtil from '../util/auth'
import * as DBUtil from '../util/db'
import * as SearchUtil from '../util/search'
import { TaskManager } from '../services/TaskManager'
import * as Types from '@shared/declarations'

const getDropboxConnection = async (parents, args, context): Promise<Types.API.DropboxConnection> => {
    AuthUtil.verifyRequestIsAuthenticated(context)
    const { userId } = context
    if (!userId) {
        return undefined
    }

    const connection = await DBUtil.getDropboxConnection(userId)

    if (!connection) {
        return null
    }
    const { syncPath, syncEnabled, invalidPathDetected } = connection
    return { syncPath, syncEnabled, invalidPathDetected }
}

const taskSummary = async (parents, args, context): Promise<Types.API.TaskSummary> => {
    AuthUtil.verifyRequestIsAuthenticated(context)
    const oldestTaskDate = await DBUtil.getOldestTaskDate()
    const howManyTasksAreThere = await DBUtil.howManyTasksAreThere()
    // we pass false, as we want to know all the tasks not just those that can be done in the current state
    const howManyProcessableTasksAreThere = await DBUtil.howManyProcessableTasksAreThere(false)

    // get a second count with the real is stopping value as that is interesting too
    const taskManager = TaskManager.getInstance()
    const howManyProcessableTasksAreThereThatAreActionable = await DBUtil.howManyProcessableTasksAreThere(
        taskManager.getStopping(),
    )

    const queues = await DBUtil.getTaskTypeBreakdown()
    const lastMonthsProcessorLog = await DBUtil.taskProcessorMonthLog()

    return {
        oldest: oldestTaskDate,
        processable: {
            total: howManyTasksAreThere,
            processable: howManyProcessableTasksAreThere,
            actionable: howManyProcessableTasksAreThereThatAreActionable,
            queues,
        },
        processed: {
            recent: lastMonthsProcessorLog,
        },
    }
}

const search = async (parents, args, context): Promise<Types.API.SearchResult> => {
    AuthUtil.verifyRequestIsAuthenticated(context)
    // lift arguments
    // search query
    const searchQuery = args.filter
    // user
    const { userId } = context

    const results = await SearchUtil.search(userId, searchQuery)

    return {
        items: results,
    }
}

const taskProcessor = async (parents, args, context): Promise<Types.API.TaskProcessor> => {
    AuthUtil.verifyRequestIsAuthenticated(context)

    const taskManager = TaskManager.getInstance()

    const stopping = taskManager.getStopping()
    const isImportingEnabled = taskManager.getImportingEnabled()
    const currentTasksBeingProcessed = taskManager.getTasksBeingProcessed()

    return {
        stopping,
        isImportingEnabled,
        currentTasksBeingProcessed,
    }
}

const queries = {
    validateToken: (parent, args, ctx) => AuthUtil.requestHasValidCookieToken(ctx),
    dropboxConnection: getDropboxConnection,
    taskSummary,
    search,
    taskProcessor,
}

export default queries
