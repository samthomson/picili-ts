import { ApolloServer } from 'apollo-server-express'
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import express from 'express'
import http from 'http'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import APITypeDefs from './apiDef'
import Query from './queries'
import Mutation from './mutations'
import Logger from '../services/logging'
import * as DBConnection from '../db/connection'

import * as AuthUtil from '../util/auth'
import * as DropboxUtil from '../util/dropbox'

import { TaskManager } from '../services/TaskManager'
import { ResourceManager } from '../services/ResourceManager'

const resolvers = {
    Query,
    Mutation,
}

const taskManager = TaskManager.getInstance()
const resourceManager = ResourceManager.getInstance()

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
        introspection: true,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), ApolloServerPluginLandingPageGraphQLPlayground()],
        context: async (ctx) => {
            const userId = await AuthUtil.userIdFromRequestCookie(ctx.req)
            return {
                ...ctx, // needed to set cookies
                userId: typeof userId === 'number' ? userId : null,
            }
        },
        // set so that we always can get the error's stacktrace
        // https://www.apollographql.com/docs/apollo-server/v2/data/errors/#omitting-or-including-stacktrace
        debug: true,
        formatError: (err) => {
            Logger.error('GraphQL Error', err)
            return new Error('GraphQL Error - check the logs to see what went wrong.')
        },
        logger: Logger,
    })

    await server.start()

    server.applyMiddleware({ app, cors: false })

    const port = process.env.API_INTERNAL_PORT
    const APIHost = process.env.API_HOST

    httpServer.listen({ port }, () => {
        Logger.info(`🚀 Server ready at http://${APIHost}:${port}${server.graphqlPath}`)
    })

    if (process.env.NODE_ENV === 'production') {
        taskManager.start()
        // intentionally synchronous
        resourceManager.start()
    }

    process.on('SIGTERM', async () => {
        Logger.info('SIGTERM received, shutting down...')
        // close server to the world
        await httpServer.close()
        await server.stop()
        // gracefully shutdown the task manager
        await taskManager.safelyShutDown()
        // close db connection
        await DBConnection.disconnect()
        Logger.info('...finished shutting down')
        process.exit(0)
    })
}

startApolloServer(APITypeDefs, resolvers)
