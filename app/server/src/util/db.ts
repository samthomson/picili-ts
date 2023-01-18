import * as Sequelize from 'sequelize'
import bcrypt from 'bcrypt'
import moment from 'moment'

import * as Types from '@shared/declarations'
import * as Models from '../db/models'
import Database from '../db/connection'
import * as Enums from '../../../shared/enums'
import * as TasksUtil from './tasks'
import * as HelperUtil from './helper'
import Logger from '../services/logging'

export const getUser = async (email: string, password: string): Promise<Models.UserInstance> => {
    const user = await Models.UserModel.findOne({
        where: {
            email,
        },
    })

    if (!user) {
        return undefined
    }

    const { password: hashedPassword } = user
    const passwordsMatch = await bcrypt.compare(password, hashedPassword)

    return passwordsMatch ? user : undefined
}

export const getUserById = async (id: number): Promise<Models.UserInstance> => {
    const user = await Models.UserModel.findByPk(id)

    if (!user) {
        return undefined
    }

    return user
}

export const getFileById = async (id: number): Promise<Models.FileInstance> => {
    const file = await Models.FileModel.findByPk(id)

    if (!file) {
        return undefined
    }

    return file
}

export const userWithEmailExists = async (email: string): Promise<boolean> => {
    const user = await Models.UserModel.findOne({
        where: {
            email,
        },
    })

    return !!user
}

export const createUser = async (email: string, password: string): Promise<Models.UserInstance> => {
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await Models.UserModel.create({
        email,
        password: hashedPassword,
    })

    return user
}

export const getDropboxConnection = async (userId: number): Promise<Models.DropboxConnectionInstance | null> => {
    // check not already created
    const existingDropboxConnection = await Models.DropboxConnectionModel.findOne({ where: { userId } })

    return existingDropboxConnection
}

export const createDropboxConnection = async (
    userId: number,
    refreshToken: string,
): Promise<Models.DropboxConnectionInstance> => {
    const dropboxConnection = await Models.DropboxConnectionModel.create({
        userId,
        refreshToken,
        syncEnabled: true,
    })

    return dropboxConnection
}

export const updateDropboxConnection = async (
    userId: number,
    updateObject: Types.API.DropboxConnectionEditableAttributes,
): Promise<Models.DropboxConnectionInstance | null> => {
    await Models.DropboxConnectionModel.update(updateObject, {
        where: { userId },
    })
    return getDropboxConnection(userId)
}

export const removeDropboxConnection = async (userId: number): Promise<void> => {
    await Models.DropboxConnectionModel.destroy({
        where: { userId },
    })
}

export const bulkInsertNewDropboxFiles = async (newFiles: Types.ShadowDropboxAPIFile[], userId: number) => {
    const newDropboxFiles = newFiles.map(({ path, id: dropboxId, hash }) => ({ path, dropboxId, userId, hash }))

    await Models.DropboxFileModel.bulkCreate(newDropboxFiles)
}

export const insertNewDropboxFile = async (
    newDropboxFile: Types.ShadowDropboxAPIFile,
    userId: number,
): Promise<number> => {
    const newDropboxFileInstance = await Models.DropboxFileModel.create({
        path: newDropboxFile.path,
        dropboxId: newDropboxFile.id,
        hash: newDropboxFile.hash,
        userId,
    })
    return newDropboxFileInstance.id
}

export const removeDropboxFile = async (dropboxFileId: number) => {
    await Models.DropboxFileModel.destroy({
        where: {
            id: dropboxFileId,
        },
    })
}

export const updateDropboxFile = async (changedDropboxFile: Types.ChangedDropboxFile) => {
    await Models.DropboxFileModel.update(
        {
            hash: changedDropboxFile.hash,
        },
        {
            where: {
                id: changedDropboxFile.dropboxFileId,
            },
        },
    )
}

export const getAllDropboxFilesFromDB = async (userId: number) => {
    return await Models.DropboxFileModel.findAll({
        where: { userId },
    })
}

export const createSyncLog = async (userId: number) => {
    const syncLog = await Models.SyncLogModel.create({
        userId,
    })

    return syncLog.id
}

export const updateSyncLog = async (
    id: number,
    newCount: number,
    changedCount: number,
    deletedCount: number,
    runTime: number,
) => {
    await Models.SyncLogModel.update(
        {
            newCount,
            changedCount,
            deletedCount,
            runTime,
        },
        {
            where: {
                id,
            },
        },
    )
}

export const createTask = async (createTaskInput: Types.Core.Inputs.CreateTaskInput): Promise<number> => {
    // use overloaded priority or standard priority for that task type
    const priority = createTaskInput?.priority ?? TasksUtil.taskTypeToPriority(createTaskInput.taskType)
    const newTask = await Models.TaskModel.upsert({
        ...createTaskInput,
        priority,
    })

    return newTask[0].id
}

export const ensureTaskExists = async (taskType: Types.TaskTypeEnum, relatedPiciliFileId: number): Promise<void> => {
    // task type
    // related id
    const exists = await Models.TaskModel.findOne({ where: { taskType, relatedPiciliFileId, isProcessed: false } })

    if (!exists) {
        await Models.TaskModel.create({
            taskType,
            relatedPiciliFileId,
            priority: TasksUtil.taskTypeToPriority(taskType),
        })
    } else {
        // if it already existed, reschedule it for asap
        exists.from = moment().toISOString()
        await exists.save()
    }
}

export const startProcessingATask = async (task: Models.TaskInstance): Promise<void> => {
    task.timesSeen = task.timesSeen + 1
    // block this task for next 2 mins
    task.from = moment().add(2, 'minute').toISOString()
    await task.save()
}

export const postponeTask = async (task: Models.TaskInstance, delayByMinutes: number): Promise<void> => {
    task.from = moment().add(delayByMinutes, 'minute').toISOString()
    await task.save()
}

export const postponeAllTasksOfType = async (
    taskType: Enums.TaskType,
    minutesFromNowToDelayBy: number,
): Promise<void> => {
    await Models.TaskModel.update(
        {
            from: moment().add(minutesFromNowToDelayBy, 'minute').toISOString(),
        },
        {
            where: {
                taskType,
            },
        },
    )
}

const taskSelectionWhere = (isStopping: boolean, isVideoCapable: boolean) => {
    const baseWhere = {
        from: {
            [Sequelize.Op.lte]: moment().toISOString(),
        },
        after: null,
        // if !isVideoCapable then don't allow video tasks (PROCESS_VIDEO_FILE) - otherwise nevermind
        ...(!isVideoCapable && { taskType: { [Sequelize.Op.not]: 'PROCESS_VIDEO_FILE' } }),
        isProcessed: false,
    }

    return isStopping ? { ...baseWhere, importTask: false } : { ...baseWhere }
}

export const getAndReserveNextTaskId = async (
    isStopping: boolean,
    isVideoCapable: boolean,
): Promise<Models.TaskInstance | null> => {
    try {
        const result = await Database.transaction(async (getAndReserveTaskTransaction) => {
            const nextTask = await Models.TaskModel.findOne({
                where: taskSelectionWhere(isStopping, isVideoCapable),
                order: [
                    ['priority', 'DESC'],
                    ['created_at', 'ASC'],
                ],
                lock: true,
                skipLocked: true,
                transaction: getAndReserveTaskTransaction,
            })

            if (nextTask) {
                const { timesSeen, id } = nextTask

                await Models.TaskModel.update(
                    {
                        timesSeen: timesSeen + 1,
                        from: moment().add(2, 'minute').toISOString(),
                    },
                    { where: { id }, transaction: getAndReserveTaskTransaction },
                )

                return nextTask
            } else {
                return null
            }
        })

        return result
    } catch (err) {
        Logger.warn('DB error reserving next task', { err })
        return null
    }
}

export const reReserveTask = async (id: number): Promise<void> => {
    await Models.TaskModel.update(
        {
            from: moment().add(2, 'minute').toISOString(),
        },
        { where: { id } },
    )
}

export const howManyTasksAreThere = async (): Promise<number> => {
    return await Models.TaskModel.count({
        where: {
            isProcessed: false,
        },
    })
}
export const howManyProcessableTasksAreThere = async (isStopping: boolean, isVideoCapable = true): Promise<number> => {
    return await Models.TaskModel.count({
        where: taskSelectionWhere(isStopping, isVideoCapable),
    })
}
export const howManyTasksToProcessAreThere = async (): Promise<number> => {
    return await Models.TaskModel.count({
        where: {
            taskType: {
                [Sequelize.Op.not]: Enums.TaskType.DROPBOX_SYNC,
            },
        },
    })
}

export const getTask = async (taskId: number): Promise<Models.TaskInstance> => {
    return await Models.TaskModel.findByPk(taskId)
}

export const getTaskTypeBreakdown = async (): Promise<Types.API.TaskQueue[]> => {
    // const query = `SELECT task_type as type, COUNT(qyer) as count FROM tasks WHERE is_processed=FALSE GROUP BY type; `
    // todo: maybe later relate tasks to file via file_id to only include users tasks. For now showing all tasks the system is working on is fine and perhaps preferable.
    const query = `
    SELECT query1.task_type as type, COUNT(query1.id) as count, COALESCE(count2, 0) as unblocked, COALESCE(count3, 0) as actionable
    FROM tasks as query1
    LEFT JOIN (
        SELECT task_type, COUNT(id) as count2 
        FROM tasks
        WHERE is_processed=FALSE
        AND after IS NULL
        GROUP BY task_type
    ) query2 ON query1.task_type = query2.task_type
    LEFT JOIN (
        SELECT task_type, COUNT(id) as count3 
        FROM tasks
        WHERE is_processed=FALSE
        AND after IS NULL
        AND TIMESTAMP(tasks.from) <= NOW()
        GROUP BY task_type
    ) query3 ON query1.task_type = query3.task_type
    WHERE query1.is_processed=FALSE GROUP BY type;
    `
    const taskBreakdownResult: { type: string; count: number; unblocked: number; actionable: number }[] =
        await Database.query(query, {
            type: Sequelize.QueryTypes.SELECT,
        })

    // @ts-ignore
    return (
        taskBreakdownResult?.map(({ type, count, unblocked, actionable }) => ({
            type,
            count,
            unblocked,
            actionable,
        })) ?? []
    )
}

export const createTaskProcessedLog = async (createObject: Types.Core.Inputs.CreateTaskProcessedLog) => {
    await Models.TaskProcessingLogModel.create(createObject)
}

export const taskProcessorMonthLog = async (): Promise<Types.API.TasksProcessedSummary[]> => {
    const query = `
    SELECT DATE(query1.created_at) as date, query2.count2 as countSuccessful, query3.count3 as countUnsuccessful 
	FROM task_processed_logs as query1
	LEFT JOIN (
		SELECT DATE(created_at) as date, COUNT(*) as count2 
		FROM task_processed_logs
		WHERE success=TRUE
		GROUP BY date
	) query2 ON DATE(query1.created_at) = query2.date
	LEFT JOIN (
	    SELECT DATE(created_at) as date, COUNT(*) as count3 
	    FROM task_processed_logs
	    WHERE success=FALSE
	    GROUP BY date
	) query3 ON DATE(query1.created_at) = query3.date
	WHERE query1.created_at > (NOW() - INTERVAL 1 MONTH) GROUP BY date;
    `
    const taskProcessorMonthLogResult: { date; countSuccessful; countUnsuccessful }[] = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
    })

    return (
        taskProcessorMonthLogResult?.map(({ date, countSuccessful, countUnsuccessful }) => ({
            date,
            countSuccessful,
            countUnsuccessful,
        })) ?? []
    )
}

export const updateDependentTasks = async (taskId: number) => {
    await Models.TaskModel.update({ after: null }, { where: { after: taskId } })
}

export const completeATask = async (taskId: number): Promise<void> => {
    await Models.TaskModel.update(
        {
            isProcessed: true,
        },
        { where: { id: taskId } },
    )
}

export const getOldestTaskDate = async (): Promise<string | null> => {
    const oldestTask = await Models.TaskModel.findOne({
        where: taskSelectionWhere(false, true),
        order: [['created_at', 'ASC']],
    })

    return oldestTask?.createdAt.toISOString() ?? null
}

export const createFile = async (fileCreationParams: Types.Core.Inputs.CreateFileInput): Promise<number> => {
    const newFile = await Models.FileModel.create({
        ...fileCreationParams,
        // default to a co-ordinate off map
        location: { type: 'Point', coordinates: [-200, -200] },
    })
    return newFile.id
}

export const createTag = async (tagCreationParams: Types.Core.Inputs.CreateTagInput): Promise<number> => {
    const newTag = await Models.TagModel.upsert(tagCreationParams)
    return newTag[0].id
}

export const createMultipleTags = async (tagCreationParams: Types.Core.Inputs.CreateTagInput[]): Promise<boolean> => {
    const lowerCased = tagCreationParams.map((params) => ({
        ...params,
        type: params.type.toLowerCase(),
        subtype: params?.subtype?.toLowerCase() ?? '',
        value: params.value.toLowerCase(),
    }))
    await Database.transaction(async (saveMultipleTagsTransaction) => {
        await Models.TagModel.bulkCreate(lowerCased, {
            updateOnDuplicate: ['confidence'],
            transaction: saveMultipleTagsTransaction,
        })
    })

    return true
}

export const performSearchQuery = async (
    userId: number,
    individualQuery: Types.API.IndividualSearchQuery,
): Promise<Types.Core.DBSearchMatch[]> => {
    const { type, subtype, value } = individualQuery
    const { SEARCH_CONFIDENCE_THRESHOLD: confidence } = process.env

    // depending on query type, perform relevant query
    switch (true) {
        case type === Enums.QueryType.MAP:
            const [latLower, latUpper, lngLower, lngUpper] = value.split(',')
            const mapQuery = `
            SELECT files.id as fileId, 100 as score, latitude, longitude 
            FROM files 
            WHERE 
            files.user_id = :userId 
            AND MBRContains( GeomFromText( 'LINESTRING(:latLower :lngLower, :latUpper :lngUpper)' ), files.location)
            
            AND files.is_thumbnailed;`
            const mapResults: Types.Core.DBSearchMatch[] = await Database.query(mapQuery, {
                type: Sequelize.QueryTypes.SELECT,
                replacements: {
                    userId,
                    latLower: +latLower,
                    latUpper: +latUpper,
                    lngLower: +lngLower,
                    lngUpper: +lngUpper,
                },
            })
            return mapResults.map(({ fileId, score, latitude, longitude }) => ({
                fileId,
                score,
                latitude,
                longitude,
            }))
            break

        case type === Enums.QueryType.ELEVATION:
            const [lowerBounds, upperBounds] = value.split(':').map((literal) => +literal)

            if (!HelperUtil.isNumber(lowerBounds) || !HelperUtil.isNumber(upperBounds)) {
                Logger.warn('malformed elevation query', { userId, individualQuery })
                return []
            }

            const elevationQuery = `
                SELECT files.id as fileId, 100 as score, latitude, longitude 
                FROM files 
                WHERE 
                files.user_id = :userId 
                AND files.elevation >= :lowerBounds AND files.elevation <= :upperBounds            
                AND files.is_thumbnailed;`
            const elevationResults: Types.Core.DBSearchMatch[] = await Database.query(elevationQuery, {
                type: Sequelize.QueryTypes.SELECT,
                replacements: {
                    userId,
                    lowerBounds,
                    upperBounds,
                },
            })
            return elevationResults.map(({ fileId, score, latitude, longitude }) => ({
                fileId,
                score,
                latitude,
                longitude,
            }))

        case type === Enums.QueryType.VIDEO && subtype === Enums.QuerySubtype.LENGTH:
            const [videoLengthLowerBounds, videoLengthUpperBounds] = value.split(':').map((literal) => +literal)

            if (!HelperUtil.isNumber(videoLengthLowerBounds) || !HelperUtil.isNumber(videoLengthUpperBounds)) {
                Logger.warn('malformed video length query', { userId, individualQuery })
                return []
            }

            const videoLengthQuery = `
            SELECT files.id as fileId, 100 as score, latitude, longitude 
            FROM files 
            JOIN tags on tags.file_id = files.id
            WHERE 
            files.user_id = 6 
            AND files.file_type = 'VIDEO'
            AND tags.type = 'metadata' AND tags.subtype = 'length'  
            AND tags.value >= :lowerBounds AND tags.value <= :upperBounds            
            AND files.is_thumbnailed;
            `
            const videoLengthResults: Types.Core.DBSearchMatch[] = await Database.query(videoLengthQuery, {
                type: Sequelize.QueryTypes.SELECT,
                replacements: {
                    userId,
                    lowerBounds: videoLengthLowerBounds,
                    upperBounds: videoLengthUpperBounds,
                },
            })
            return videoLengthResults.map(({ fileId, score, latitude, longitude }) => ({
                fileId,
                score,
                latitude,
                longitude,
            }))

        case type === Enums.QueryType.DATE_RANGE:
            const [dateLowerBounds, dateUpperBounds] = value.split(':')

            // todo: validate dates? eg make isValidDateTime function
            // if (!HelperUtil.isValidDateTime(dateLowerBounds) || !HelperUtil.isValidDateTime(dateUpperBounds)) {
            //     Logger.warn('malformed date range query', { userId, individualQuery })
            //     return []
            // }

            const dateRangeQuery = `
                SELECT files.id as fileId, 100 as score, latitude, longitude 
                FROM files 
                WHERE files.user_id = :userId
                AND files.datetime >= :lowerBounds AND files.datetime <= :upperBounds           
                AND files.is_thumbnailed;
                `
            const dateRangeResults: Types.Core.DBSearchMatch[] = await Database.query(dateRangeQuery, {
                type: Sequelize.QueryTypes.SELECT,
                replacements: {
                    userId,
                    lowerBounds: moment(dateLowerBounds).startOf('day').format(),
                    upperBounds: moment(dateUpperBounds).endOf('day').format(),
                },
            })
            return dateRangeResults.map(({ fileId, score, latitude, longitude }) => ({
                fileId,
                score,
                latitude,
                longitude,
            }))

        case type === Enums.QueryType.COLOUR:
            const [r, g, b] = value.split(',').map((val) => +val)

            // todo: validate colours? eg make isValidRGBColour function
            // if (!HelperUtil.isValidRGBColour(r) || !HelperUtil.isValidRGBColour(g) || !HelperUtil.isValidRGBColour(b))) {
            //     Logger.warn('malformed colour query', { userId, individualQuery })
            //     return []
            // }

            const colourQuery = `
            SELECT files.id as fileId, 100 as score, latitude, longitude 
            FROM files 
            WHERE files.user_id = :userId AND files.is_thumbnailed
            ORDER BY ((CAST(r as SIGNED)-:r)*(CAST(r as SIGNED)-:r))+((CAST(g as SIGNED)-:g)*(CAST(g as SIGNED)-:g))+((CAST(b as SIGNED)-:b)*(CAST(b as SIGNED)-:b)) 
            DESC LIMIT 0, 100
            `
            const colourResults: Types.Core.DBSearchMatch[] = await Database.query(colourQuery, {
                type: Sequelize.QueryTypes.SELECT,
                replacements: {
                    userId,
                    r,
                    g,
                    b,
                },
            })
            return colourResults.map(({ fileId, score, latitude, longitude }) => ({
                fileId,
                score,
                latitude,
                longitude,
            }))

        default:
            const query = (() => {
                if (value === '*') {
                    // wildcard query, select all.
                    // todo: don't get lat/lon, just on map query?
                    return `SELECT files.id as fileId, 100 as score, latitude, longitude  
                    FROM files
                    WHERE files.is_thumbnailed AND files.user_id = :userId 
                    `
                }

                // normal term query (with type and subtype optional)
                // todo: don't get lat/lon, just on map query?
                return `SELECT files.id as fileId, tags.confidence as score, latitude, longitude FROM tags JOIN files ON tags.file_id = files.id where ${
                    type ? `tags.type=:type and ` : ''
                }${
                    subtype ? `tags.subtype=:subtype and ` : ''
                } tags.value = :value and tags.confidence >= :confidence and files.is_thumbnailed and files.user_id = :userId`
            })()

            const results: Types.Core.DBSearchMatch[] = await Database.query(query, {
                type: Sequelize.QueryTypes.SELECT,
                replacements: {
                    userId,
                    type,
                    subtype,
                    value,
                    confidence,
                },
            })
            return results.map(({ fileId, score }) => ({ fileId, score }))
            break
    }
}

export const getAllResultData = async (
    matches: Types.Core.DBSearchMatch[],
    page: number,
    perPage: number,
    sortOverload: Enums.SearchSort,
    userId: number,
): Promise<Types.API.SearchResultItem[]> => {
    const sortSQL = (() => {
        switch (sortOverload) {
            case Enums.SearchSort.RELEVANCE:
                // todo: what was this about?
                // if (type !== 'map') {
                const sortedIds = matches.map(({ fileId }) => fileId)
                return `ORDER BY FIELD(id, ${sortedIds.join(', ')}) DESC`
            // } else {
            //     return `ORDER BY files.datetime DESC`
            // }
            case Enums.SearchSort.ELEVATION_HIGHEST:
                return `ORDER BY files.elevation DESC`
            case Enums.SearchSort.ELEVATION_LOWEST:
                return `ORDER BY files.elevation ASC`
            case Enums.SearchSort.OLDEST:
                return `ORDER BY files.datetime ASC`
            case Enums.SearchSort.RANDOM:
                return `ORDER BY RAND()`
            case Enums.SearchSort.LATEST:
            default:
                return `ORDER BY files.datetime DESC`
        }
    })()
    const fileIds = matches.map(({ fileId }) => fileId)
    const query = `SELECT files.id as fileId, files.address, files.latitude, files.longitude, files.elevation, 
    files.datetime, files.medium_width AS mediumWidth, files.medium_height AS mediumHeight, files.file_type AS fileType 
    FROM files
    WHERE id IN (${fileIds.join(',')})
    ${sortSQL}
    LIMIT :offset, :perPage`

    const results: Types.Core.DBSearchResult[] = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
            ids: fileIds.join(','),
            perPage,
            offset: perPage * (page - 1),
        },
    })

    return results.map((result) => {
        return {
            fileId: result.fileId,
            // todo: would be better to have this elsewhere
            userId,
            // uuid: result.uuid,
            address: result.address,
            latitude: result.latitude,
            longitude: result.longitude,
            mediumWidth: result.mediumWidth,
            mediumHeight: result.mediumHeight,
            fileType: result.fileType,
        }
    })
}

export const performAutoCompleteQuery = async (
    userId: number,
    partialQuery: Types.API.IndividualSearchQuery,
): Promise<Types.API.TagSuggestion[]> => {
    const { type, subtype, value } = partialQuery
    const { SEARCH_CONFIDENCE_THRESHOLD: confidence } = process.env

    /*
    SELECT
        tags.file_id as fileId,
        tags.type,
        tags.subtype,
        tags.value,
        tags.confidence,
        files.uuid
    FROM
        tags
    JOIN files ON files.id = tags.file_id
    WHERE  files.user_id=3 AND (file_id, type, subtype, value, confidence) IN (
        SELECT file_id, type, subtype, tags.value, MAX(confidence) max_confidence
        FROM tags
        WHERE tags.confidence >= 35 and tags.value LIKE 'chin%'
        GROUP BY tags.type, tags.subtype, tags.value )

    GROUP BY tags.value, tags.confidence
    ORDER BY confidence DESC;
    */

    // todo: define limit in a consts file and share with typeahead component in spa
    const query = `
    SELECT sub.fileId, sub.type, sub.subtype, sub.value, sub.conf FROM (select tags.file_id as fileId, tags.type, tags.subtype, tags.value, tags.confidence as conf, files.datetime FROM tags JOIN files ON files.id = tags.file_id WHERE tags.value LIKE :valueLike AND tags.value != :value AND tags.confidence >= :confidence AND files.is_thumbnailed=TRUE AND files.user_id=:userId GROUP BY tags.type, tags.subtype, tags.value) as sub ORDER BY sub.conf DESC, sub.datetime DESC, sub.value ASC LIMIT 50;`

    const results: Types.Core.DBAutoCompleteResult[] = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
            userId,
            type,
            subtype,
            valueLike: `${value}%`,
            // true = show results which exactly match what the user typed, false = only show options with more text than the user typed - literally type'aheads'
            value: true ? `${value}%` : value,
            confidence,
        },
    })

    return results.map((result) => ({
        type: result.type,
        subtype: result.subtype,
        value: result.value,
        fileId: result.fileId,
        // uuid: result.uuid,
    }))
}

export const removeImportTasksForFile = async (fileId: number) => {
    await Models.TaskModel.destroy({
        where: { relatedPiciliFileId: fileId, importTask: true },
    })
}

export const removeAllImportTasks = async () => {
    await Models.TaskModel.destroy({
        where: { importTask: true },
    })
}

export const updateNonImportTasksToHaveNoDependencies = async () => {
    await Models.TaskModel.update(
        { after: null },
        {
            where: { importTask: false },
        },
    )
}

export const getFileByDropboxId = async (dropboxFileId: number): Promise<Models.FileInstance> => {
    return await Models.FileModel.findOne({ where: { dropboxFileId } })
}

export const removeTagsForFile = async (fileId: number) => {
    await Models.TagModel.destroy({
        where: { fileId },
    })
}

export const removeFile = async (fileId: number) => {
    await Models.FileModel.destroy({
        where: { id: fileId },
    })
}
export const setNoThumbnailsOnFile = async (fileId: number) => {
    await Models.FileModel.update(
        { isThumbnailed: false },
        {
            where: { id: fileId },
        },
    )
}

export const removeDropboxImportTask = async (userId: number): Promise<void> => {
    await Models.TaskModel.destroy({
        where: { relatedPiciliFileId: userId, taskType: Enums.TaskType.DROPBOX_SYNC },
    })
}

export const removeUsersDropboxFiles = async (userId: number): Promise<void> => {
    await Models.DropboxFileModel.destroy({
        where: { userId },
    })
}

export const getAllPiciliFileIdsForUser = async (userId: number): Promise<number[]> => {
    const result = await Models.FileModel.findAll({
        where: { userId },
    })
    const piciliFileIds = result.map((file) => file.id)

    return piciliFileIds
}

export const getCorruptFilesDropboxPaths = async (userId: number): Promise<string[]> => {
    const result = await Models.FileModel.findAll({
        where: { userId, isCorrupt: true },
        include: [{ model: Models.DropboxFileModel }],
    })
    // @ts-ignore
    const dropboxFilePaths = result.map((file) => file.dropbox_file.path)

    return dropboxFilePaths
}

export const getFileWithTagsAndDropboxFile = async (
    userId: number,
    fileId: number,
): Promise<Types.API.FileInfo | undefined> => {
    const file = await Models.FileModel.findOne({
        where: { id: fileId, userId },
        include: [
            { model: Models.DropboxFileModel },
            {
                model: Models.TagModel,
                required: false,
                where: {
                    confidence: {
                        [Sequelize.Op.gte]: process.env.SEARCH_CONFIDENCE_THRESHOLD,
                    },
                },
            },
            {
                model: Models.TaskModel,
                required: false,
                where: {
                    isProcessed: false,
                },
            },
        ],
        order: [[Models.TagModel, 'confidence', 'DESC']],
    })

    if (!file) {
        return undefined
    }

    // @ts-ignore
    const { address, latitude, longitude, datetime, elevation, dropbox_file, tags, r, g, b, tasks } = file

    const location = latitude && longitude ? { latitude, longitude } : undefined

    const fileInfo: Types.API.FileInfo = {
        address,
        location,
        datetime: moment(datetime).toISOString(),
        elevation,
        pathOnDropbox: dropbox_file?.path ?? undefined,
        tags: tags.map(({ type, subtype, value, confidence }) => ({
            type,
            subtype,
            value,
            confidence,
        })),
        mainColour:
            HelperUtil.isNumber(r) && HelperUtil.isNumber(g) && HelperUtil.isNumber(b) ? { r, g, b } : undefined,
        pendingTasks: tasks
            .filter(({ taskType }) => taskType !== 'DROPBOX_SYNC')
            .map(({ taskType }) => ({
                taskType,
            })),
    }

    return fileInfo
}

export const createSystemEvent = async (
    systemEventCreationParams: Types.Core.Inputs.CreateSystemEventInput,
): Promise<void> => {
    await Models.SystemEventModel.create(systemEventCreationParams)
}

export const getLatestSystemEvents = async (userId: number): Promise<Types.API.SystemEvent[]> => {
    const result = await Models.SystemEventModel.findAll({
        where: { userId },
        limit: 100,
        order: [['created_at', 'DESC']],
    })

    const parsedEvents = result.map(({ id, message, createdAt: datetime }) => ({
        id,
        message,
        datetime: moment(datetime).toISOString(),
    }))

    return parsedEvents
}

export const getElevationMinMax = async (userId: number): Promise<{ min: number; max: number } | undefined> => {
    const query = `
    SELECT MIN(elevation) as min, MAX(elevation) as max FROM files
    where files.user_id = :userId AND files.is_thumbnailed;
    `
    const elevationMinMax: { min: number; max: number }[] = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
            userId,
        },
    })

    return elevationMinMax?.[0]
        ? { min: Math.floor(elevationMinMax[0].min), max: Math.ceil(elevationMinMax[0].max) }
        : undefined
}

export const getVideoLengthMinMax = async (userId: number): Promise<{ min: number; max: number } | undefined> => {
    const query = `
    SELECT MIN(CAST(value AS UNSIGNED)) as min, MAX(CAST(value AS UNSIGNED)) as max FROM tags
    join files on files.id = tags.file_id 
    where files.user_id = :userId
    AND files.file_type = 'VIDEO'
    AND tags.type  = 'metadata' AND tags.subtype = 'length'
    AND files.is_thumbnailed;
    `
    const videoLengthMinMax: { min: number; max: number }[] = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
            userId,
        },
    })

    return videoLengthMinMax?.[0]
        ? { min: Math.floor(videoLengthMinMax[0].min), max: Math.ceil(videoLengthMinMax[0].max) }
        : undefined
}

export const getDateRangeMinMax = async (userId: number): Promise<{ min: string; max: string } | undefined> => {
    const query = `
    SELECT MIN(datetime) as min, MAX(datetime) as max FROM files
    where files.user_id = :userId AND files.is_thumbnailed;
    `
    const dateRangeMinMax: { min: string; max: string }[] = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
            userId,
        },
    })

    return dateRangeMinMax?.[0]
        ? {
              min: moment(dateRangeMinMax[0].min).format(),
              max: moment(dateRangeMinMax[0].max).format(),
          }
        : undefined
}

export const getFolderSummary = async (userId: number): Promise<Types.API.FolderSummary[]> => {
    const query = `SELECT file_directory as fileDirectory, files.id, COUNT(files.id) as fileCount, MAX(datetime) as latestDate, dropbox_files.path as latestFilePath
    FROM files
    JOIN dropbox_files on dropbox_files.id = files.dropbox_file_id 
    WHERE files.is_thumbnailed AND files.user_id = :userId
    GROUP BY files.file_directory
    ORDER BY files.datetime desc`

    const dbFolders: Types.Core.DBFolderSummary[] = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
            userId,
        },
    })

    return dbFolders.map(({ id, fileDirectory, latestFilePath, latestDate, fileCount }) => {
        const pathWithoutFile = latestFilePath.substring(0, latestFilePath.lastIndexOf('/'))
        return {
            id,
            fileDirectory,
            latestDirectoryPath: pathWithoutFile,
            latestDate: latestDate && moment(latestDate).format(),
            fileCount,
        }
    })
}

export const getPlantSummary = async (userId: number): Promise<Types.API.PlantSummary[]> => {
    const query = `SELECT files.id as fileId, tags.value as name, count(files.id) as count FROM tags
    JOIN files ON files.id = tags.file_id 
    where type='plant' and subtype='scientificname' AND confidence >= :confidence AND files.user_id=:userId AND files.is_thumbnailed = TRUE
    GROUP BY value 
    ORDER BY count DESC;`

    const { SEARCH_CONFIDENCE_THRESHOLD: confidence } = process.env

    const dbPlants: Types.API.PlantSummary[] = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
            userId,
            confidence,
        },
    })

    return dbPlants
}

export const getNumberplateSummary = async (userId: number): Promise<Types.API.NumberplateSummary[]> => {
    const query = `SELECT files.id as fileId, tags.value as plate, count(files.id) as count FROM tags 
    RIGHT JOIN files ON files.id = tags.file_id
    WHERE type='ocr.numberplate' and subtype='plate' AND confidence >= :confidence AND files.user_id=:userId AND files.is_thumbnailed = TRUE
    GROUP BY value 
    ORDER BY count DESC`

    const { SEARCH_CONFIDENCE_THRESHOLD: confidence } = process.env

    const dbNumberplates: Types.API.NumberplateSummary[] = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
            userId,
            confidence,
        },
    })

    return dbNumberplates
}

export const getExifSummary = async (userId: number): Promise<Types.API.ExifCameraSummary[]> => {
    const query = `SELECT files.id as fileId, tags.subtype, tags.value as value, count(files.id) as count FROM tags 
    JOIN files ON files.id = tags.file_id 
    WHERE tags.type='exif' and (tags.subtype='cameramake' OR tags.subtype='cameramodel' OR tags.subtype='lensmodel') AND tags.confidence >= :confidence AND files.user_id=:userId AND files.is_thumbnailed = TRUE
    GROUP BY tags.value 
    ORDER BY count DESC;`

    const { SEARCH_CONFIDENCE_THRESHOLD: confidence } = process.env

    const dbExifSummaries: Types.Core.DBExifFieldSummary[] = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
            userId,
            confidence,
        },
    })

    const dbCameraAggregations = {}

    for (let i = 0; i < dbExifSummaries.length; i++) {
        const { fileId, subtype, value, count } = dbExifSummaries[i]

        if (!dbCameraAggregations?.[subtype]) {
            dbCameraAggregations[subtype] = []
        }
        dbCameraAggregations[subtype].push({ fileId, value, count })
    }

    const aggs = []

    for (const [key, value] of Object.entries(dbCameraAggregations)) {
        aggs.push({
            bucket: key,
            summaries: value,
        })
    }

    return aggs
}

export const getBinomialStateData = async (): Promise<Models.BinomialStateInstance[]> => {
    return await Models.BinomialStateModel.findAll()
}
