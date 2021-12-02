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
    await DBUtil.createTask({
        taskType: Enums.TaskType.DROPBOX_FILE_IMPORT,
        relatedPiciliFileId: newFileId,
        priority: 1,
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
