import * as DBUtil from './db'
import * as DropboxUtil from './dropbox'
import * as TasksUtil from './tasks'
import * as FileUtil from './file'
import * as Types from '@shared/declarations'
import moment from 'moment'
import Logger from '../services/logging'
import * as Enums from '../../../shared/enums'
import * as Models from '../db/models'

export const processTask = async (taskId: number) => {
    console.log('processTask: ', taskId)
    // start timing
    const startTime = moment()
    let success = undefined
    const task = await DBUtil.getTask(taskId)

    if (!task) {
        Logger.warn('no task found when went to process', taskId)
    }
    try {
        // 'start' task (inc update its from time)
        await DBUtil.startProcessingATask(task)

        const { taskType } = task
        switch (taskType) {
            case Enums.TaskType.DROPBOX_SYNC:
                success = await DropboxUtil.checkForDropboxChanges(task.relatedPiciliFileId)
                break
            case Enums.TaskType.DROPBOX_FILE_IMPORT:
                success = await fileImport(task.relatedPiciliFileId)
                break
            // todo: PROCESS_IMAGE_FILE
            // todo: PROCESS_VIDEO_FILE
            // todo: REMOVE_FILE
            // todo: ADDRESS_LOOKUP
            // todo: ELEVATION_LOOKUP
            // todo: PLANT_LOOKUP
            // todo: OCR_GENERIC
            // todo: OCR_NUMBERPLATE
            // todo: SUBJECT_DETECTION
            default:
                success = false
                Logger.warn('unknown task type', { taskType })
                break
        }

        // finish a task (inc reschedule dropbox sync)
        if (success) {
            await finishATask(task)
        } else {
            Logger.info('task manager processed a task, but was not successful. id:', { taskId })
        }
    } catch (err) {
        Logger.error('error processing task: ', err)
        success = false
    }
    // end timing
    const endTime = moment()
    const milliseconds = endTime.diff(startTime)

    // log task processing
    await DBUtil.createTaskProcessedLog({
        taskType: task.taskType,
        processingTime: milliseconds,
        success: success,
    })
}

export const finishATask = async (task: Models.TaskInstance): Promise<void> => {
    const { id, taskType, relatedPiciliFileId } = task
    // update other tasks dependent on this one
    await DBUtil.updateDependentTasks(id)
    // delete/remove task
    await DBUtil.removeTask(id)
    // if dropbox sync, requeue
    if (taskType === Enums.TaskType.DROPBOX_SYNC) {
        await DBUtil.createTask({
            taskType,
            relatedPiciliFileId,
            from: moment().add(15, 'minutes').toISOString(),
            // todo: use an enum or something
            priority: TasksUtil.taskTypeToPriority(Enums.TaskType.DROPBOX_SYNC),
        })
    }
}

export const fileImport = async (fileId: number): Promise<boolean> => {
    // get local picili file
    // todo: define file->dropboxFile relation, and so do this with one ORM operation
    const file = await Models.FileModel.findByPk(fileId)
    const { dropboxFileId, uuid, fileExtension } = file
    const dropboxFile = await Models.DropboxFileModel.findByPk(dropboxFileId)
    const { dropboxId, userId } = dropboxFile

    return await DropboxUtil.downloadDropboxFile(dropboxId, userId, uuid, fileExtension)
}

export const taskTypeToPriority = (taskType: Enums.TaskType): number => {
    switch (taskType) {
        case Enums.TaskType.DROPBOX_SYNC:
            return 8
        case Enums.TaskType.DROPBOX_FILE_IMPORT:
            return 1
        case Enums.TaskType.PROCESS_IMAGE_FILE:
            return 7
        case Enums.TaskType.PROCESS_VIDEO_FILE:
            return 7
        case Enums.TaskType.REMOVE_FILE:
            return 10 // removing processed files is the highest priority, so that once processed we free up disk space
        case Enums.TaskType.ADDRESS_LOOKUP:
            return 6
        case Enums.TaskType.ELEVATION_LOOKUP:
            return 3
        case Enums.TaskType.PLANT_LOOKUP:
            return 3
        case Enums.TaskType.OCR_GENERIC:
            return 3
        case Enums.TaskType.OCR_NUMBERPLATE:
            return 3
        case Enums.TaskType.SUBJECT_DETECTION:
            return 4
    }
}

export const processImage = async (fileId: number): Promise<boolean> => {
    const file = await Models.FileModel.findByPk(fileId)
    const { userId, uuid, fileExtension } = file
    const processingPath = FileUtil.getProcessingPath(uuid, fileExtension)

    // create thumbnails, while testing if corrupt and getting other image data
    const thumbnailingResult = await FileUtil.generateThumbnails(userId, uuid, fileExtension)
    // get medium width/height dimensions
    const { success: isThumbnailed, mediumWidth, mediumHeight, isCorrupt, exifData } = thumbnailingResult

    console.log({ thumbnailingResult })

    // update file model with gleamed data
    file.isCorrupt = isCorrupt
    if (!isCorrupt) {
        file.isThumbnailed = isThumbnailed
        file.mediumWidth = mediumWidth
        file.mediumHeight = mediumHeight
    }
    await file.save()

    // todo: something with exif data, and lat/long/elevation

    // todo: set on row: isThumbnailed, isCorrupt, latitude, longitude, elevation, datetime, mediumHeight, mediumWidth

    return true
}
