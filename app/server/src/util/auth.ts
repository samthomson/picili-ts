import * as jwt from 'jsonwebtoken'
// import * as DBUtil from './db'
// import * as Models from '../db/models'

// declare module 'jsonwebtoken' {
//     export interface UserIDJwtPayload extends jwt.JwtPayload {
//         userId: string
//     }
// }

export const generateJWT = (userId: string): string => {
    return jwt.sign({ 'picili-user': true, userId }, process.env.JWT_COOKIE_SECRET || 'MISSING_SECRET', {
        expiresIn: '30 days',
    })
}

export const userIdFromJWT = (jwtToken: string): string | undefined => {
    try {
        const { userId } = <jwt.UserIDJwtPayload>jwt.verify(jwtToken, process.env.JWT_COOKIE_SECRET || 'MISSING_SECRET')

        return userId
    } catch (error) {
        return undefined
    }
}

export const requestHasValidCookieToken = (ctx): boolean => {
    // if it did, middleware will have set it already
    return !!ctx.userId
}

export const userIdFromRequestCookie = (req): string | undefined => {
    const authCookie = req?.cookies?.['picili-token']

    return userIdFromJWT(authCookie)
}

export const verifyRequestIsAuthenticated = (ctx): boolean => {
    if (ctx?.userId) {
        return true
    }
    throw new Error('401')
}
