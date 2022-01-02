import * as Sequelize from 'sequelize'
import bcrypt from 'bcrypt'
import moment from 'moment'

import * as Types from '@shared/declarations'
import * as Models from '../db/models'
import Database from '../db/connection'
import * as Enums from '../../../shared/enums'
import * as TasksUtil from './tasks'

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
    })

    return dropboxConnection
}

export const updateDropboxConnection = async (
    userId: number,
    updateObject: Types.API.DropboxConnection,
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
    const exists = await Models.TaskModel.findOne({ where: { taskType, relatedPiciliFileId } })

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

const taskSelectionWhere = (isStopping: boolean) => {
    const baseWhere = {
        from: {
            [Sequelize.Op.lte]: moment().toISOString(),
        },
        after: null,
    }
    return isStopping ? { ...baseWhere, importTask: false } : { ...baseWhere }
}

export const getNextTaskId = async (isStopping: boolean): Promise<number | null> => {
    const nextTask = await Models.TaskModel.findOne({
        where: taskSelectionWhere(isStopping),
        order: [
            ['priority', 'DESC'],
            ['created_at', 'ASC'],
        ],
    })

    return nextTask?.id ?? null
}

export const howManyTasksAreThere = async (): Promise<number> => {
    return await Models.TaskModel.count()
}
export const howManyProcessableTasksAreThere = async (isStopping: boolean): Promise<number> => {
    return await Models.TaskModel.count({
        where: taskSelectionWhere(isStopping),
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
    const query = `SELECT task_type as type, COUNT(*) as count FROM tasks GROUP BY type; `
    const taskBreakdownResult = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
    })

    // @ts-ignore
    return taskBreakdownResult?.map((row) => ({ type: row.type, count: row.count })) ?? []
}

export const createTaskProcessedLog = async (createObject: Types.Core.Inputs.CreateTaskProcessedLog) => {
    await Models.TaskProcessingLogModel.create(createObject)
}

export const taskProcessorMonthLog = async (): Promise<Types.API.TasksProcessedSummary[]> => {
    const query = `SELECT DATE(created_at) as date, COUNT(*) as count FROM task_processed_logs WHERE created_at > (NOW() - INTERVAL 1 MONTH) GROUP BY date;`
    const taskProcessorMonthLogResult = await Database.query(query, {
        type: Sequelize.QueryTypes.SELECT,
    })

    // @ts-ignore
    return taskProcessorMonthLogResult?.map(({ date, count }) => ({ date, count })) ?? []
}

export const updateDependentTasks = async (taskId: number) => {
    await Models.TaskModel.update({ after: null }, { where: { after: taskId } })
}
export const removeTask = async (taskId: number): Promise<void> => {
    await Models.TaskModel.destroy({
        where: { id: taskId },
    })
}

export const getOldestTaskDate = async (): Promise<string | null> => {
    const oldestTask = await Models.TaskModel.findOne({
        where: taskSelectionWhere(false),
        order: [['created_at', 'ASC']],
    })

    return oldestTask?.createdAt.toISOString() ?? null
}

export const createFile = async (fileCreationParams: Types.Core.Inputs.CreateFileInput): Promise<number> => {
    const newFile = await Models.FileModel.create(fileCreationParams)
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
        subtype: params.subtype.toLowerCase(),
        value: params.value.toLowerCase(),
    }))
    await Models.TagModel.bulkCreate(lowerCased, { updateOnDuplicate: ['confidence'] })
    return true
}

export const performSearchQuery = async (
    userId: number,
    individualQuery: Types.API.IndividualSearchQuery,
): Promise<Types.API.SearchResultItem[]> => {
    const { type, subtype, value } = individualQuery

    // depending on query type, perform relevant query
    switch (type) {
        case 'map':
            // todo: program map query
            return []
            break
        default:
            // todo: add min confidence threshold?
            const query = `SELECT files.id, files.uuid, files.address, files.latitude, files.longitude FROM tags JOIN files ON tags.file_id = files.id where tags.type=:type ${
                subtype ? `and tags.subtype=:subtype ` : ''
            }and tags.value = :value and files.is_thumbnailed and files.user_id = :userId;`
            const results = await Database.query(query, {
                type: Sequelize.QueryTypes.SELECT,
                replacements: {
                    userId,
                    type,
                    subtype,
                    value,
                },
            })
            return results.map((result) => {
                // todo: type above result, and skip ts-ignores
                return {
                    // @ts-ignore
                    fileId: result.id,
                    userId,
                    // @ts-ignore
                    uuid: result.uuid,
                    // @ts-ignore
                    address: result.address,
                    // @ts-ignore
                    latitude: result.latitude,
                    // @ts-ignore
                    longitude: result.longitude,
                }
            })
            break
    }
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

export const getAllDropboxFileIdsForUser = async (userId: number): Promise<number[]> => {
    const result = await Models.FileModel.findAll({
        where: { userId },
        include: [{ model: Models.DropboxFileModel }],
    })
    // @ts-ignore
    const dropboxFileIds = result.map((file) => file.dropbox_file.id)

    return dropboxFileIds
}
