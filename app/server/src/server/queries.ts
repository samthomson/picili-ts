import * as AuthUtil from '../util/auth'
import * as DBUtil from '../util/db'
import * as Types from '../declarations'

const getDropboxConnection = async (parents, args, context): Promise<Types.API.Response.DropboxConnection> => {
    const { userId } = context
    if (!userId) {
        return undefined
    }

    const connection = await DBUtil.getDropboxConnection(userId)

    const { syncPath, syncEnabled } = connection
    return { syncPath, syncEnabled }
}

const queries = {
    ping: (parent, args, ctx) => {
        AuthUtil.verifyRequestIsAuthenticated(ctx)
        return `${ctx?.userId} pinged ${Math.random()}`
    },
    validateToken: (parent, args, ctx) => AuthUtil.requestHasValidCookieToken(ctx),
    dropboxConnection: getDropboxConnection,
}

export default queries
