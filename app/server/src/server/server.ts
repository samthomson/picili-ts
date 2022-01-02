import { ApolloServer, gql } from 'apollo-server-express'
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import express from 'express'
import http from 'http'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import * as DropboxUtil from '../dropboxConnector'

import APITypeDefs from './apiDef'
import Query from './queries'
import Mutation from './mutations'
import Logger from '../services/logging'
import * as DBConnection from '../db/connection'

import * as AuthUtil from '../util/auth'

import { TaskManager } from '../services/TaskManager'

const resolvers = {
    Query,
    Mutation,
}

const taskManager = TaskManager.getInstance()

const startApolloServer = async (typeDefs, resolvers) => {
    const app = express()

    app.use(cookieParser())
    const corsOptions = {
        origin: true, // anyone can connect, simpler - for now - than specifying client host which will change with deployment
        credentials: true, // <-- REQUIRED backend setting
    }
    app.use(cors(corsOptions))

    app.use('/thumbs', express.static('./thumbs'))

    app.get('/oauth/dropbox', async (req, res) => {
        const redirectURL = await DropboxUtil.getConnectionURL()
        res.writeHead(302, { Location: redirectURL })
        res.end()
    })

    const httpServer = http.createServer(app)
    const server = new ApolloServer({
        typeDefs: APITypeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), ApolloServerPluginLandingPageGraphQLPlayground()],
        context: (ctx) => {
            const userId = AuthUtil.userIdFromRequestCookie(ctx.req)
            return {
                setCookies: [],
                setHeaders: [],
                userId,
            }
        },
        formatError: (err) => {
            // log internal - issues with my code - errors
            if (err.extensions.code === 'INTERNAL_SERVER_ERROR') {
                Logger.error(err)
            }
            // return underlying error - to client - either way
            return err
        },
    })

    await server.start()

    server.applyMiddleware({ app, cors: false })

    httpServer.listen({ port: 4000 }, () => {
        Logger.info(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
    })

    // todo: reinstate this?
    taskManager.start()

    process.on('SIGTERM', async () => {
        Logger.info('SIGTERM received, shutting down...')
        // close server to the world
        await httpServer.close()
        await server.stop()
        // close db connection
        await DBConnection.disconnect()
        Logger.info('...finished shutting down')
        process.exit(0)
    })
}

startApolloServer(APITypeDefs, resolvers)
