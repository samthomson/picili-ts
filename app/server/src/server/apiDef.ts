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
        invalidPathDetected: Boolean
    }
    type TaskQueue {
        type: String
        count: Int
    }
    type TasksProcessable {
        "total number of tasks"
        total: Int
        "number of tasks that are ready to be processed now (considering both dependencies and start from)"
        processable: Int
        "tasks which can be actioned (also considering the task processor stopping state)"
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

    type Task {
        id: Int
        taskType: String
        importTask: Boolean
        timesSeen: Int
    }

    type TaskProcessor {
        stopping: Boolean
        isImportingEnabled: Boolean
        currentTasksBeingProcessed: [Task]
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

    type TaskProcessorMutations {
        stopProcessingImportTasks: Boolean
    }

    type AdminOverview {
        corruptFiles: [String]
        dropboxFileCount: Int
        fileCount: Int
        searchableFilesCount: Int
    }

    input IndividualQuery {
        type: String
        subtype: String
        value: String!
    }

    input SearchFilter {
        individualQueries: [IndividualQuery]
    }

    type SearchResult {
        fileId: Int
        uuid: String
        userId: Int
        mediumWidth: Int
        mediumHeight: Int
        latitude: Float
        longitude: Float
        address: String
    }

    type PaginationInfo {
        totalPages: Int!
        totalItems: Int!
        page: Int!
        perPage: Int!
        hasNextPage: Boolean!
        hasPreviousPage: Boolean!
    }

    type SearchStats {
        speed: Int!
    }

    type SearchQueryResponse {
        items: [SearchResult]!
        pageInfo: PaginationInfo!
        stats: SearchStats!
    }

    type TagSuggestion {
        type: String!
        subtype: String
        value: String!
        confidence: Int!
        uuid: String!
    }

    type AutoCompleteResponse {
        tagSuggestions: [TagSuggestion]
    }

    type Query {
        validateToken(token: String!): Boolean
        dropboxConnection: DropboxConnection
        taskSummary: TaskSummary
        taskProcessor: TaskProcessor
        adminOverview: AdminOverview
        # todo: add sort enum param
        search(filter: SearchFilter!, page: Int! = 1, perPage: Int! = 100): SearchQueryResponse
        autoComplete(query: IndividualQuery): AutoCompleteResponse
    }
    type Mutation {
        login(authInput: LoginInput!): AuthResponse
        register(authInput: RegisterInput!): AuthResponse
        dropbox: DropboxMutations
        taskProcessor: TaskProcessorMutations
    }
`
export default typeDefs
