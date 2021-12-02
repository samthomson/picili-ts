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
    return {
        oldest: 'todo: real date',
        processable: {
            total: 0,
            queues: [
                {
                    type: 'todo: type 1',
                    count: 58,
                },
                {
                    type: 'todo: type 2',
                    count: 235,
                },
                {
                    type: 'todo: type 4',
                    count: 654,
                },
            ],
        },
        processed: {
            recent: [
                {
                    from: 'todo: date',
                    to: 'todo: date',
                    count: 325,
                },
            ],
        },
    }
}

const queries = {
    validateToken: (parent, args, ctx) => AuthUtil.requestHasValidCookieToken(ctx),
    dropboxConnection: getDropboxConnection,
    taskSummary,
}

export default queries
