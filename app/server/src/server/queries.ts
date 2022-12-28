import * as AuthUtil from '../util/auth'
import * as DBUtil from '../util/db'
import * as Models from '../db/models'
import * as SearchUtil from '../util/search'
import { TaskManager } from '../services/TaskManager'
import * as Types from '@shared/declarations'
import moment from 'moment'
import Logger from '../services/logging'
import { SearchSort } from '@shared/enums'

const getDropboxConnection = async (parents, args, context): Promise<Types.API.DropboxConnectionEditableAttributes> => {
    AuthUtil.verifyRequestIsAuthenticated(context)
    const { userId } = context
    if (!userId) {
        return undefined
    }

    const connection = await DBUtil.getDropboxConnection(userId)

    if (!connection) {
        return null
    }
    const { syncPath, syncEnabled, invalidPathDetected } = connection
    return { syncPath, syncEnabled, invalidPathDetected }
}

const taskSummary = async (parents, args, context): Promise<Types.API.TaskSummary> => {
    AuthUtil.verifyRequestIsAuthenticated(context)
    const oldestTaskDate = await DBUtil.getOldestTaskDate()
    const howManyTasksAreThere = await DBUtil.howManyTasksAreThere()
    // we pass false, as we want to know all the tasks not just those that can be done in the current state
    const howManyProcessableTasksAreThere = await DBUtil.howManyProcessableTasksAreThere(false)

    // get a second count with the real is stopping value as that is interesting too
    const taskManager = TaskManager.getInstance()
    const howManyProcessableTasksAreThereThatAreActionableVideoCapable = taskManager.isStopping
        ? await DBUtil.howManyProcessableTasksAreThere(true, true)
        : howManyProcessableTasksAreThere
    const howManyProcessableTasksAreThereThatAreActionableNonVideoCapable =
        await DBUtil.howManyProcessableTasksAreThere(taskManager.isStopping, false)

    const queues = await DBUtil.getTaskTypeBreakdown()
    const lastMonthsProcessorLog = await DBUtil.taskProcessorMonthLog()

    return {
        oldest: oldestTaskDate,
        processable: {
            total: howManyTasksAreThere,
            processable: howManyProcessableTasksAreThere,
            actionable: {
                actionableTasksVideoCapable: howManyProcessableTasksAreThereThatAreActionableVideoCapable,
                actionableTasksNonVideoCapable: howManyProcessableTasksAreThereThatAreActionableNonVideoCapable,
            },
            queues,
        },
        processed: {
            recent: lastMonthsProcessorLog,
        },
    }
}

export const processSearchReqeust = async (
    searchQuery: Types.API.SearchQuery,
    sortOverload: SearchSort,
    userId: number,
    perPage: number,
    page: number,
    withGeoAggregations: boolean,
): Promise<Types.API.SearchResult> => {
    const timeAtStart = moment()

    const { availableSortModes, recommendedSortMode } = SearchUtil.sortsForSearchQuery(searchQuery)

    const sortToUse = sortOverload && availableSortModes.includes(sortOverload) ? sortOverload : recommendedSortMode

    const timeAtStartOfSearchUtil = moment()

    const { searchMatches: resultIds, queryStats } = await SearchUtil.search(userId, searchQuery, sortToUse)
    const results =
        resultIds.length > 0 ? await DBUtil.getAllResultData(resultIds, page, perPage, sortOverload, userId) : []

    const timeAtEndOfSearchUtil = moment().diff(timeAtStartOfSearchUtil)

    const totalItems = resultIds.length
    const totalPages = Math.ceil(totalItems / perPage)

    // in case client provided too high a page
    if (page > totalPages) {
        page = totalPages
    }
    if (page < 1) {
        page = 1
    }

    const pageInfo = {
        totalPages,
        totalItems,
        page,
        perPage,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && page < totalPages,
        queryStats,
    }

    const sorting =
        results.length > 0
            ? {
                  sortModesAvailable: availableSortModes,
                  sortUsed: sortToUse,
              }
            : undefined

    // geo clustering - only if they were on the map page
    const geoAggregations = withGeoAggregations
        ? SearchUtil.geoAggregateResults(
              resultIds,
              ...SearchUtil.extractMapParamsFromSearchQueries(searchQuery.individualQueries),
              userId,
          )
        : undefined

    const timeAtEnd = moment()
    const searchTime = timeAtEnd.diff(timeAtStart)

    Logger[searchTime > 500 ? 'warn' : 'info']('queries.search', { searchTime, timeAtEndOfSearchUtil, searchQuery })

    return {
        items: results,
        pageInfo,
        stats: { speed: searchTime },
        sorting,
        geoAggregations,
    }
}

const search = async (parents, args, context): Promise<Types.API.SearchResult> => {
    AuthUtil.verifyRequestIsAuthenticated(context)

    const { filter: searchQuery, page = 1, perPage = 50, withGeoAggregations = false, sortOverload = undefined } = args
    const { userId } = context

    const searchResult = await processSearchReqeust(
        searchQuery,
        sortOverload,
        userId,
        perPage,
        page,
        withGeoAggregations,
    )

    return searchResult
}

const taskProcessor = async (parents, args, context): Promise<Types.API.TaskProcessor> => {
    AuthUtil.verifyRequestIsAuthenticated(context)

    const taskManager = TaskManager.getInstance()

    const stopping = taskManager.isStopping
    const isImportingEnabled = taskManager.isImportingEnabled
    const workers = taskManager.getWorkers()

    return {
        stopping,
        isImportingEnabled,
        workers,
    }
}

const adminOverview = async (parents, args, context): Promise<Types.API.AdminOverview> => {
    AuthUtil.verifyRequestIsAuthenticated(context)

    const { userId } = context

    const corruptFiles = await DBUtil.getCorruptFilesDropboxPaths(userId)
    const dropboxFileCount = await Models.DropboxFileModel.count({ where: { userId } })
    const fileCount = await Models.FileModel.count({ where: { userId } })
    const searchableFilesCount = await Models.FileModel.count({
        where: { userId, isCorrupt: false, isThumbnailed: true },
    })

    return {
        corruptFiles,
        dropboxFileCount,
        fileCount,
        searchableFilesCount,
    }
}

const autoComplete = async (parents, args, context): Promise<Types.API.AutoCompleteResponse> => {
    AuthUtil.verifyRequestIsAuthenticated(context)
    const timeAtStart = moment()

    // lift arguments
    // search query
    const { query } = args

    // user
    const { userId } = context

    const tagSuggestions = await SearchUtil.autoComplete(userId, query)

    const timeAtEnd = moment()
    const searchTime = timeAtEnd.diff(timeAtStart)

    return {
        userId,
        tagSuggestions,
    }
}

const fileInfo = async (parents, args, context): Promise<Types.API.FileInfo> => {
    AuthUtil.verifyRequestIsAuthenticated(context)

    const { fileId } = args

    // user
    const { userId } = context

    const fileInfo = await DBUtil.getFileWithTagsAndDropboxFile(userId, fileId)

    return fileInfo
}

const systemEvents = async (parents, args, context): Promise<Types.API.SystemEventsResponse> => {
    AuthUtil.verifyRequestIsAuthenticated(context)

    const { userId } = context

    const items = await DBUtil.getLatestSystemEvents(userId)

    return {
        items,
    }
}

const queries = {
    validateToken: (parent, args, ctx) => AuthUtil.requestHasValidCookieToken(ctx),
    dropboxConnection: getDropboxConnection,
    taskSummary,
    search,
    taskProcessor,
    adminOverview,
    autoComplete,
    fileInfo,
    systemEvents,
}

export default queries
