import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'
import * as DBUtil from './db'

export const addAFileToTheSystem = async (userId: number, newDropboxFile: Types.DropboxFile) => {
    // todo: create picili file
    // create import tasks
    await DBUtil.createTask({
        taskType: Enums.TaskType.DROPBOX_FILE_IMPORT,
        // todo: what related id to go here?
        relatedPiciliFileId: 55,
        priority: 1,
    })
    // add to dropbox files
    await DBUtil.insertNewDropboxFile(newDropboxFile, userId)
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
