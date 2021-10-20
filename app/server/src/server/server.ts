import { ApolloServer, gql } from 'apollo-server-express'
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import express from 'express'
import http from 'http'

import * as DropboxUtil from '../dropboxConnector'
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
    type Query {
        ping: String
    }
    type Mutation {
        login(authInput: LoginInput!): AuthResponse
        register(authInput: RegisterInput!): AuthResponse
    }
`

const resolvers = {
    Query: {
        ping: () => 'pinged',
    },
    Mutation,
}

const startApolloServer = async (typeDefs, resolvers) => {
    const app = express()

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
            return {
                setCookies: [],
                setHeaders: [],
                userId: AuthUtil.userIdFromRequestCookie(ctx.req),
            }
        },
    })

    await server.start()

    server.applyMiddleware({ app })

    httpServer.listen({ port: 4000 }, () => {
        console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
    })
}

startApolloServer(typeDefs, resolvers)
