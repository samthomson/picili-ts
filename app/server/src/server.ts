import { ApolloServer, gql } from 'apollo-server-express'
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import express from 'express'
import http from 'http'

import * as DropboxUtil from './dropboxConnector'

const typeDefs = gql`
    type Query {
        ping: String
    }
`

const resolvers = {
    Query: {
        ping: () => 'pinged',
    },
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
    })

    await server.start()

    server.applyMiddleware({ app })

    httpServer.listen({ port: 4000 }, () => {
        console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
    })
}

startApolloServer(typeDefs, resolvers)
