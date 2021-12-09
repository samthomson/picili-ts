import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'
import * as DBUtil from './db'
import * as HelperUtil from './helper'

import * as UUID from 'uuid'

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
    })
    // processing task (either image or video, need the id so depend delete task on)
    const processingTaskId = await (async (): Promise<number> => {
        if (fileType === Enums.FileType.IMAGE) {
            const imageProcessingTaskId = await DBUtil.createTask({
                taskType: Enums.TaskType.PROCESS_IMAGE_FILE,
                relatedPiciliFileId: newFileId,
                after: downloadTaskId,
            })
            return imageProcessingTaskId
        } else {
            const videoProcessingTaskId = await DBUtil.createTask({
                taskType: Enums.TaskType.PROCESS_VIDEO_FILE,
                relatedPiciliFileId: newFileId,
                after: downloadTaskId,
            })
            return videoProcessingTaskId
        }
    })()

    // if it was an image, queue for subject detection
    if (fileType === Enums.FileType.IMAGE) {
        await DBUtil.createTask({
            taskType: Enums.TaskType.SUBJECT_DETECTION,
            relatedPiciliFileId: newFileId,
            after: processingTaskId,
        })
    }

    // delete
    await DBUtil.createTask({
        taskType: Enums.TaskType.REMOVE_PROCESSING_FILE,
        relatedPiciliFileId: newFileId,
        after: processingTaskId,
    })
}

export const updateAFileInTheSystem = async (changedDropboxFile: Types.ChangedDropboxFile) => {
    // todo: remove old picili file
    // todo: remove old thumbs
    // todo: remove old tags
    // todo: remove other import tasks for this file
    // todo: create import tasks
    // update dropbox file
    await DBUtil.updateDropboxFile(changedDropboxFile)
}

export const removeAFileFromTheSystem = async (dropboxFileId: number) => {
    // todo: remove tags
    // todo: remove thumbnails
    // todo: remove picili file
    // todo: remove other import tasks for this file
    // remove dropbox file entry
    await DBUtil.removeDropboxFile(dropboxFileId)
}
