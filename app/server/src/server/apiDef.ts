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
        userId: Int
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
        countSuccessful: Int
        countUnsuccessful: Int
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
        processedCount: Int
    }

    type BinomialStateValues {
        value: Boolean
        updatedAt: String
    }

    type StorageState {
        storageSpaceFull: BinomialStateValues
        imageProcessingDirFull: BinomialStateValues
        videoProcessingDirFull: BinomialStateValues
    }

    type TaskProcessor {
        stopping: Boolean
        isImportingEnabled: Boolean
        workers: [Worker]
        storageStates: StorageState
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
        RANDOM
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

    type PendingTask {
        taskType: String
    }

    type FileInfo {
        address: String
        datetime: String
        location: LatLon
        elevation: Float
        pathOnDropbox: String
        tags: [Tag]
        mainColour: RGB
        pendingTasks: [PendingTask]
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

    type LatestFolder {
        id: Int!
        fileDirectory: String!
        latestDirectoryPath: String!
        latestDate: String
        fileCount: Int!
    }

    type PlantSummary {
        fileId: Int!
        name: String!
        count: Int!
    }

    type NumberplateSummary {
        fileId: Int!
        plate: String!
        count: Int!
    }

    type ExifFieldSummary {
        fileId: Int!
        value: String!
        count: Int!
    }

    type ExifCameraSummary {
        bucket: String!
        summaries: [ExifFieldSummary]!
    }

    type QueryBuilders {
        elevation: MinMax
        videoLength: MinMax
        dateRange: MinMaxString
        folders: [LatestFolder]
        plants: [PlantSummary]
        numberplates: [NumberplateSummary]
        exifCameras: [ExifCameraSummary]
    }

    type UIState {
        queryBuilders: QueryBuilders
    }

    type ValidateTokenResponse {
        isValid: Boolean!
        userId: Int
    }

    type ResourceManagerStats {
        dateTime: String
        isOutOfSpace: Boolean
        isImageProcessingDirOutOfSpace: Boolean
        isVideoProcessingDirOutOfSpace: Boolean
        cpuUsagePercent: Float
        memoryUsagePercent: Float
    }

    type ResourceManager {
        stats: [ResourceManagerStats]
    }

    type ProcessingDirSize {
        IMAGE: Float
        VIDEO: Float
    }

    type DiskSpaceData {
        totalSpaceBytes: Float
        freeSpaceBytes: Float
        usedSpaceBytes: Float
        reservedForPiciliProcessingDirsBytes: Float
        availableForPiciliToUse: Float
        processingDirImageSizeLimitBytes: Float
        processingDirVideoSizeLimitBytes: Float
        processingDirSize: ProcessingDirSize
        thumbsDirSizeBytes: Float
        isOutOfSpace: Boolean
        isImageProcessingDirOutOfSpace: Boolean
        isVideoProcessingDirOutOfSpace: Boolean
    }

    type ServerData {
        diskSpaceData: DiskSpaceData
    }

    type Query {
        validateToken(token: String!): ValidateTokenResponse
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
        UIState(fakeId: Int!): UIState
        resourceManager: ResourceManager
        serverData: ServerData
    }
    type Mutation {
        login(authInput: LoginInput!): AuthResponse
        register(authInput: RegisterInput!): AuthResponse
        dropbox: DropboxMutations
        taskProcessor: TaskProcessorMutations
    }
`
export default typeDefs
