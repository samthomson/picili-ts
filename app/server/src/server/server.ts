import { ApolloServer, gql } from 'apollo-server-express'
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import express from 'express'
import http from 'http'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import * as DropboxUtil from '../dropboxConnector'
import Query from './queries'
import Mutation from './mutations'

import * as AuthUtil from '../util/auth'

const typeDefs = gql`
    input LoginInput {
        email: String!
        password: String!
    }
    input RegisterInput {
        email: String!
        password: String!
        passwordConfirmation: String!
    }
    type AuthResponse {
        token: String
        error: String
    }

    input DropboxUpdateInput {
        token: String
        syncPath: String
        syncEnabled: Boolean
    }
    type DropboxUpdateResponse {
        success: Boolean!
        error: String
    }
    type DropboxDisconnectResponse {
        success: Boolean!
        error: String
    }

    type DropboxMutations {
        update(dropboxUpdateInput: DropboxUpdateInput!): DropboxUpdateResponse
        disconnect: DropboxDisconnectResponse
    }
    type Query {
        ping: String
        validateToken(token: String!): Boolean
    }
    type Mutation {
        login(authInput: LoginInput!): AuthResponse
        register(authInput: RegisterInput!): AuthResponse
        dropbox: DropboxMutations
    }
`

const resolvers = {
    Query,
    Mutation,
}

const startApolloServer = async (typeDefs, resolvers) => {
    const app = express()

    app.use(cookieParser())
    const corsOptions = {
        origin: true, // anyone can connect, simpler - for now - than specifying client host which will change with deployment
        credentials: true, // <-- REQUIRED backend setting
    }
    app.use(cors(corsOptions))

    app.get('/oauth/dropbox', async (req, res) => {
        const redirectURL = await DropboxUtil.getConnectionURL()
        res.writeHead(302, { Location: redirectURL })
        res.end()
    })

    const httpServer = http.createServer(app)
    const server = new ApolloServer({
        typeDefs,
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
    })

    await server.start()

    server.applyMiddleware({ app, cors: false })

    httpServer.listen({ port: 4000 }, () => {
        console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
    })
}

startApolloServer(typeDefs, resolvers)
