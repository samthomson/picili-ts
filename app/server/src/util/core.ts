import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'
import * as DBUtil from './db'
import * as TaskUtil from './tasks'
import * as HelperUtil from './helper'

import * as UUID from 'uuid'
import moment from 'moment'
import * as OSU from 'node-os-utils'

export const addAFileToTheSystem = async (userId: number, newDropboxFile: Types.ShadowDropboxAPIFile) => {
    // add to dropbox files
    const dropboxFileId = await DBUtil.insertNewDropboxFile(newDropboxFile, userId)

    // create picili file
    const { path } = newDropboxFile
    // split path into file parts
    const { fileDirectory, fileName, fileExtension } = HelperUtil.splitPathIntoParts(path)

    const fileType = HelperUtil.fileTypeFromExtension(fileExtension)

    // todo: strip out uuid, prob redundant now
    const uuid = UUID.v4()
    const fileCreationParams = {
        userId,
        dropboxFileId,
        fileDirectory,
        fileName,
        fileExtension,
        fileType,
        uuid,
    }
    const newFileId = await DBUtil.createFile(fileCreationParams)

    // create import tasks
    const downloadTaskId = await DBUtil.createTask({
        taskType:
            fileType === Enums.FileType.IMAGE
                ? Enums.TaskType.DROPBOX_FILE_IMPORT_IMAGE
                : Enums.TaskType.DROPBOX_FILE_IMPORT_VIDEO,
        relatedPiciliFileId: newFileId,
        importTask: true,
    })
    // processing task (either image or video, need the id so depend delete task on)
    const processingTaskId = await (async (): Promise<number> => {
        if (fileType === Enums.FileType.IMAGE) {
            const imageProcessingTaskId = await DBUtil.createTask({
                taskType: Enums.TaskType.PROCESS_IMAGE_FILE,
                relatedPiciliFileId: newFileId,
                after: downloadTaskId,
                importTask: true,
            })
            return imageProcessingTaskId
        } else {
            // for videos, we create the video but then after also thumbnails (from the still frame generated during video processing)
            const videoProcessingTaskId = await DBUtil.createTask({
                taskType: Enums.TaskType.PROCESS_VIDEO_FILE,
                relatedPiciliFileId: newFileId,
                after: downloadTaskId,
                importTask: true,
            })
            const imageProcessingTaskId = await DBUtil.createTask({
                taskType: Enums.TaskType.PROCESS_IMAGE_FILE,
                relatedPiciliFileId: newFileId,
                after: videoProcessingTaskId,
                importTask: true,
            })
            return imageProcessingTaskId
        }
    })()

    // delete
    await DBUtil.createTask({
        taskType: Enums.TaskType.REMOVE_PROCESSING_FILE,
        relatedPiciliFileId: newFileId,
        after: processingTaskId,
    })
}

export const updateAFileInTheSystem = async (changedDropboxFile: Types.ChangedDropboxFile) => {
    const piciliFile = await DBUtil.getFileByDropboxId(changedDropboxFile.dropboxFileId)

    // remove any import tasks
    await DBUtil.removeImportTasksForFile(piciliFile.id)

    // create tasks to remove/add the file (in the future)
    const removalTaskId = await DBUtil.createTask({
        taskType: Enums.TaskType.REMOVE_FILE,
        relatedPiciliFileId: piciliFile.id,
        from: moment().add(2, 'minute').toISOString(),
    })
    await DBUtil.createTask({
        taskType:
            piciliFile.fileType === Enums.FileType.IMAGE
                ? Enums.TaskType.DROPBOX_FILE_IMPORT_IMAGE
                : Enums.TaskType.DROPBOX_FILE_IMPORT_VIDEO,
        relatedPiciliFileId: piciliFile.id,
        after: removalTaskId,
        importTask: true,
    })

    // update dropbox file
    await DBUtil.updateDropboxFile(changedDropboxFile)
}

export const removeAFileFromTheSystem = async (dropboxFileId: number) => {
    // remove other tasks immediately
    const piciliFile = await DBUtil.getFileByDropboxId(dropboxFileId)

    // in case somehow it has been deleted already
    if (piciliFile) {
        await DBUtil.removeImportTasksForFile(piciliFile.id)

        // then queue removal task for two minutes time (so that any other running tasks have completed) - unless we know there are no tasks running
        const currentlyProcessingFiles = TaskUtil.isTaskProcessorWorkingOnImportTasks()
        const from = currentlyProcessingFiles ? moment().add(2, 'minute').toISOString() : undefined
        await DBUtil.createTask({
            taskType: Enums.TaskType.REMOVE_FILE,
            relatedPiciliFileId: piciliFile.id,
            from,
        })
    }

    // lastly, remove dropbox file entry
    await DBUtil.removeDropboxFile(dropboxFileId)
}

export const raiseEventInvalidDropboxPathDetected = async (userId: number): Promise<void> => {
    // set flag on dropbox connection
    await DBUtil.updateDropboxConnection(userId, { syncEnabled: false, invalidPathDetected: true })
    // create system event
    await DBUtil.createSystemEvent({
        userId,
        message: `Dropbox import path was invalid so syncing has been disabled. Set a correct directory path for syncing to resume.`,
    })
}
// todo: make method like above for invalid token?

export const systemResourceStats = async (): Promise<Types.Core.SystemResourceStats> => {
    const { cpu, mem } = OSU
    const cpuUsagePercent = await cpu.usage()
    const { usedMemMb, totalMemMb } = await mem.used()
    const memoryUsagePercent = (usedMemMb / totalMemMb) * 100

    return {
        cpuUsagePercent,
        memoryUsagePercent,
    }
}
