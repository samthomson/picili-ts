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
        unblocked: Int
        actionable: Int
    }
    type TasksActionable {
        actionableTasksVideoCapable: Int
        actionableTasksNonVideoCapable: Int
    }
    type TasksProcessable {
        "total number of tasks"
        total: Int
        "number of tasks that are ready to be processed now (considering both dependencies and start from)"
        processable: Int
        "tasks which can be actioned (also considering the task processor stopping state)"
        actionable: TasksActionable
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

    type Worker {
        id: Int
        currentTaskBeingProcessed: Task
        isVideoCapable: Boolean
        timeLastStartedATask: String
        timeLastFinishedATask: String
        threadNo: Int
    }

    type TaskProcessor {
        stopping: Boolean
        isImportingEnabled: Boolean
        workers: [Worker]
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

    # // todo: merge these two types?
    input IndividualQuery {
        type: String
        subtype: String
        value: String!
        isNotQuery: Boolean
    }

    type IndividualQueryType {
        type: String
        subtype: String
        value: String!
        isNotQuery: Boolean
    }

    input SearchFilter {
        individualQueries: [IndividualQuery]
    }

    type SearchResult {
        fileId: Int
        # uuid: String
        userId: Int
        mediumWidth: Int
        mediumHeight: Int
        latitude: Float
        longitude: Float
        address: String
        fileType: FileType
    }

    type QueryStats {
        query: IndividualQueryType
        resultCount: Int
        # firstResultUUID: String
        firstResultFileId: String
    }

    type PaginationInfo {
        totalPages: Int!
        totalItems: Int!
        page: Int!
        perPage: Int!
        hasNextPage: Boolean!
        hasPreviousPage: Boolean!
        queryStats: [QueryStats]!
        userId: Int!
    }

    type SearchStats {
        speed: Int!
    }

    type SearchResultsSorting {
        sortModesAvailable: [SearchSort]!
        sortUsed: SearchSort!
    }

    type GeoCluster {
        latitude: Float!
        longitude: Float!
        fileCount: Int!
        fileId: Int
        # uuid: String
        userId: Int
    }

    type GeoAggregations {
        clusters: [GeoCluster]!
    }

    type SearchQueryResponse {
        items: [SearchResult]!
        pageInfo: PaginationInfo!
        stats: SearchStats!
        sorting: SearchResultsSorting
        geoAggregations: GeoAggregations
    }

    type TagSuggestion {
        type: String!
        subtype: String
        value: String!
        # uuid: String!
        fileId: String!
    }

    type AutoCompleteResponse {
        tagSuggestions: [TagSuggestion]!
        userId: Int!
    }

    enum SearchSort {
        LATEST
        OLDEST
        RELEVANCE
        ELEVATION_HIGHEST
        ELEVATION_LOWEST
    }

    enum FileType {
        IMAGE
        VIDEO
    }

    type LatLon {
        latitude: Float
        longitude: Float
    }

    type Tag {
        type: String!
        subtype: String
        value: String!
        confidence: Int!
    }

    type RGB {
        r: Int!
        g: Int!
        b: Int!
    }

    type FileInfo {
        address: String
        datetime: String
        location: LatLon
        elevation: Float
        pathOnDropbox: String
        tags: [Tag]
        mainColour: RGB
    }

    type SystemEvent {
        id: Int!
        message: String!
        datetime: String!
    }

    type SystemEventsResponse {
        items: [SystemEvent]!
    }

    type MinMax {
        min: Int
        max: Int
    }
    type MinMaxString {
        min: String
        max: String
    }

    type QueryBuilders {
        elevation: MinMax
        videoLength: MinMax
        dateRange: MinMaxString
    }

    type UIState {
        queryBuilders: QueryBuilders
    }

    type Query {
        validateToken(token: String!): Boolean
        dropboxConnection: DropboxConnection
        taskSummary: TaskSummary
        systemEvents: SystemEventsResponse
        taskProcessor: TaskProcessor
        adminOverview: AdminOverview
        # todo: add sort enum param
        search(
            filter: SearchFilter!
            page: Int! = 1
            perPage: Int! = 50
            sortOverload: SearchSort
            withGeoAggregations: Boolean = false
        ): SearchQueryResponse
        autoComplete(query: IndividualQuery): AutoCompleteResponse
        fileInfo(fileId: Int!): FileInfo
        UIState: UIState
    }
    type Mutation {
        login(authInput: LoginInput!): AuthResponse
        register(authInput: RegisterInput!): AuthResponse
        dropbox: DropboxMutations
        taskProcessor: TaskProcessorMutations
    }
`
export default typeDefs
