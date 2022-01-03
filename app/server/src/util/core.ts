import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'
import * as DBUtil from './db'
import * as HelperUtil from './helper'

import * as UUID from 'uuid'
import moment from 'moment'

export const addAFileToTheSystem = async (userId: number, newDropboxFile: Types.ShadowDropboxAPIFile) => {
    // add to dropbox files
    const dropboxFileId = await DBUtil.insertNewDropboxFile(newDropboxFile, userId)

    // create picili file
    const { path } = newDropboxFile
    // split path into file parts
    const { fileDirectory, fileName, fileExtension } = HelperUtil.splitPathIntoParts(path)

    const fileType = HelperUtil.fileTypeFromExtension(fileExtension)

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
        taskType: Enums.TaskType.DROPBOX_FILE_IMPORT,
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
            const videoProcessingTaskId = await DBUtil.createTask({
                taskType: Enums.TaskType.PROCESS_VIDEO_FILE,
                relatedPiciliFileId: newFileId,
                after: downloadTaskId,
                importTask: true,
            })
            return videoProcessingTaskId
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
        taskType: Enums.TaskType.DROPBOX_FILE_IMPORT,
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

        // then queue removal task for two minutes time (so that any other running tasks have completed)
        await DBUtil.createTask({
            taskType: Enums.TaskType.REMOVE_FILE,
            relatedPiciliFileId: piciliFile.id,
            from: moment().add(2, 'minute').toISOString(),
        })
    }

    // lastly, remove dropbox file entry
    await DBUtil.removeDropboxFile(dropboxFileId)
}
