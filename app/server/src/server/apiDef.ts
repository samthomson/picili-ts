import { gql } from 'apollo-server-express'

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
    type DropboxConnection {
        syncPath: String
        syncEnabled: Boolean
    }
    type TaskQueue {
        type: String
        count: Int
    }
    type TasksProcessable {
        total: Int
        actionable: Int
        queues: [TaskQueue]
    }
    type TasksProcessedSummary {
        date: String
        count: Int
    }
    type TasksProcessed {
        recent: [TasksProcessedSummary]
    }
    type TaskSummary {
        oldest: String
        processable: TasksProcessable
        processed: TasksProcessed
    }

    input DropboxConnectInput {
        token: String!
    }
    input DropboxUpdateInput {
        syncPath: String
        syncEnabled: Boolean
    }
    type DropboxMutationResponse {
        success: Boolean!
        error: String
        dropboxConnection: DropboxConnection
    }

    type DropboxMutations {
        connect(dropboxConnectInput: DropboxConnectInput!): DropboxMutationResponse
        update(dropboxUpdateInput: DropboxUpdateInput!): DropboxMutationResponse
        disconnect: DropboxMutationResponse
    }
    input LatLong {
        latitude: Float!
        longitude: Float!
    }

    input MapBounds {
        ne: LatLong!
        sw: LatLong!
    }

    input SearchFilter {
        mapBounds: MapBounds
    }

    type SearchResult {
        uuid: String
        mediumWidth: Int
        mediumHeight: Int
        latitude: Float
        longitude: Float
        address: String
    }

    type SearchQueryResponse {
        items: [SearchResult]
        # pageInfo: PaginationInfo
    }
    type Query {
        validateToken(token: String!): Boolean
        dropboxConnection: DropboxConnection
        taskSummary: TaskSummary
        # todo: add sort enum param
        # todo: add pagination params
        search(filter: SearchFilter): SearchQueryResponse
    }
    type Mutation {
        login(authInput: LoginInput!): AuthResponse
        register(authInput: RegisterInput!): AuthResponse
        dropbox: DropboxMutations
    }
`
export default typeDefs
