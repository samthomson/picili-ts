import * as AuthUtil from '../util/auth'
import * as DBUtil from '../util/db'
import * as Models from '../db/models'
import * as SearchUtil from '../util/search'
import { TaskManager } from '../services/TaskManager'
import * as Types from '@shared/declarations'
import moment from 'moment'

const getDropboxConnection = async (parents, args, context): Promise<Types.API.DropboxConnection> => {
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
    const howManyProcessableTasksAreThereThatAreActionable = await DBUtil.howManyProcessableTasksAreThere(
        taskManager.getStopping(),
    )

    const queues = await DBUtil.getTaskTypeBreakdown()
    const lastMonthsProcessorLog = await DBUtil.taskProcessorMonthLog()

    return {
        oldest: oldestTaskDate,
        processable: {
            total: howManyTasksAreThere,
            processable: howManyProcessableTasksAreThere,
            actionable: howManyProcessableTasksAreThereThatAreActionable,
            queues,
        },
        processed: {
            recent: lastMonthsProcessorLog,
        },
    }
}

const search = async (parents, args, context): Promise<Types.API.SearchResult> => {
    AuthUtil.verifyRequestIsAuthenticated(context)
    const timeAtStart = moment()

    // lift arguments
    // search query
    const searchQuery = args.filter
    let page = args?.page ?? 1
    let perPage = args?.perPage ?? 100

    // user
    const { userId } = context

    const results = await SearchUtil.search(userId, searchQuery)

    const totalItems = results.length
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
    }

    const timeAtEnd = moment()
    const searchTime = timeAtEnd.diff(timeAtStart)

    return {
        items: results,
        pageInfo,
        stats: { speed: searchTime }
    }
}

const taskProcessor = async (parents, args, context): Promise<Types.API.TaskProcessor> => {
    AuthUtil.verifyRequestIsAuthenticated(context)

    const taskManager = TaskManager.getInstance()

    const stopping = taskManager.getStopping()
    const isImportingEnabled = taskManager.getImportingEnabled()
    const currentTasksBeingProcessed = taskManager.getTasksBeingProcessed()

    return {
        stopping,
        isImportingEnabled,
        currentTasksBeingProcessed,
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
    const {query} = args

    // user
    const { userId } = context

    const tagSuggestions = await SearchUtil.autoComplete(userId, query)


    const timeAtEnd = moment()
    const searchTime = timeAtEnd.diff(timeAtStart)

    return {
        userId,
        tagSuggestions
    }
}

const queries = {
    validateToken: (parent, args, ctx) => AuthUtil.requestHasValidCookieToken(ctx),
    dropboxConnection: getDropboxConnection,
    taskSummary,
    search,
    taskProcessor,
    adminOverview,
    autoComplete
}

export default queries
