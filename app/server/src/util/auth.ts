import * as jwt from 'jsonwebtoken'
import * as DBUtil from './db'
import * as Types from '@shared/declarations'
// import * as Models from '../db/models'

// declare module 'jsonwebtoken' {
//     export interface UserIDJwtPayload extends jwt.JwtPayload {
//         userId: string
//     }
// }

export const generateJWT = (userId: string): string => {
    // todo: fail if JWT_COOKIE_SECRET is not set / blank
    return jwt.sign({ 'picili-user': true, userId }, process.env.JWT_COOKIE_SECRET || 'MISSING_SECRET', {
        expiresIn: '30 days',
    })
}

export const userIdFromJWT = async (jwtToken: string): Promise<string | undefined> => {
    try {
        const { userId } = <jwt.UserIDJwtPayload>jwt.verify(jwtToken, process.env.JWT_COOKIE_SECRET || 'MISSING_SECRET')

        // check the jwt user id actually corresponds to a user
        const user = await DBUtil.getUserById(userId)

        return user ? userId : undefined
    } catch (error) {
        return undefined
    }
}

export const requestHasValidCookieToken = (ctx): Types.API.Response.VerifyToken => {
    // if it did, middleware will have set it already
    return { isValid: !!ctx.userId, userId: !!ctx.userId ? ctx.userId : undefined }
}

export const userIdFromRequestCookie = async (req): Promise<string | undefined> => {
    const authCookie = req?.cookies?.['picili-token']

    return await userIdFromJWT(authCookie)
}

export const verifyRequestIsAuthenticated = (ctx): boolean => {
    if (ctx?.userId) {
        return true
    }
    throw new Error('401')
}
