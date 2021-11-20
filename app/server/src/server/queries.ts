import * as AuthUtil from '../util/auth'
import * as DBUtil from '../util/db'
import * as Types from '../declarations'

const getDropboxConnection = async (parents, args, context): Promise<Types.API.Response.DropboxConnection> => {
    AuthUtil.verifyRequestIsAuthenticated(context)
    const { userId } = context
    if (!userId) {
        return undefined
    }

    const connection = await DBUtil.getDropboxConnection(userId)

    const { syncPath, syncEnabled } = connection
    return { syncPath, syncEnabled }
}

const queries = {
    validateToken: (parent, args, ctx) => AuthUtil.requestHasValidCookieToken(ctx),
    dropboxConnection: getDropboxConnection,
}

export default queries
