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
    const { syncPath, syncEnabled } = connection
    return { syncPath, syncEnabled }
}

const taskSummary = async (parents, args, context): Promise<Types.API.TaskSummary> => {
    AuthUtil.verifyRequestIsAuthenticated(context)
    const oldestTaskDate = await DBUtil.getOldestTaskDate()
    const howManyTasksToProcessAreThere = await DBUtil.howManyTasksToProcessAreThere()
    const howManyProcessableTasksAreThere = await DBUtil.howManyProcessableTasksAreThere()
    const queues = await DBUtil.getTaskTypeBreakdown()
    const lastMonthsProcessorLog = await DBUtil.taskProcessorMonthLog()

    return {
        oldest: oldestTaskDate,
        processable: {
            total: howManyTasksToProcessAreThere,
            actionable: howManyProcessableTasksAreThere,
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
