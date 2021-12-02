import * as AuthUtil from '../util/auth'
import * as DBUtil from '../util/db'
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

const taskSummary = async (): Promise<Types.API.TaskSummary> => {
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

const queries = {
    validateToken: (parent, args, ctx) => AuthUtil.requestHasValidCookieToken(ctx),
    dropboxConnection: getDropboxConnection,
    taskSummary,
}

export default queries
