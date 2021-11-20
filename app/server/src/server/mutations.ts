import * as DBUtil from '../util/db'
import * as AuthUtil from '../util/auth'
import * as Types from '../declarations'

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
    AuthUtil.verifyRequestIsAuthenticated(context)
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

    const connection = await DBUtil.createDropboxConnection(userId, token)
    console.log('got args for connect', { token, parent, args })
    return {
        success: !!connection,
    }
}
const dropboxUpdate = async (parent, args, context): Promise<any> => {
    AuthUtil.verifyRequestIsAuthenticated(context)
    const { syncPath, syncEnabled } = parent.dropboxUpdateInput
    const { userId } = args

    if (!userId) {
        return {
            success: false,
            error: 'missing userId - not logged in?',
        }
    }

    if (!syncPath && syncEnabled === undefined) {
        return {
            success: false,
            error: 'no arguments provided to update with',
        }
    }

    await DBUtil.updateDropboxConnection(userId, { syncPath, syncEnabled })

    return {
        success: true,
    }
}
const dropboxDisconnect = async (parent, args, context): Promise<any> => {
    AuthUtil.verifyRequestIsAuthenticated(context)
    const { userId } = args

    if (!userId) {
        return {
            success: false,
            error: 'missing userId - not logged in?',
        }
    }

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
