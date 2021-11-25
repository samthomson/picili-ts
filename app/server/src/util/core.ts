import * as Types from '@shared/declarations'
import * as DBUtil from './db'

export const addAFileToTheSystem = async (userId: number, newDropboxFile: Types.DropboxFile) => {
    // todo: create import tasks
    // add to dropbox files
    DBUtil.insertNewDropboxFile(newDropboxFile, userId)
}
export const updateAFileInTheSystem = async (changedDropboxFile: Types.ChangedDropboxFile) => {
    // todo: remove old picili file
    // todo: remove old thumbs
    // todo: remove old tags
    // update dropbox file
    DBUtil.updateDropboxFile(changedDropboxFile)
}
export const removeAFileFromTheSystem = async (dropboxFileId: number) => {
    // todo: remove tags
    // todo: remove thumbnails
    // todo: remove picili file
    // remove dropbox file entry
    await DBUtil.removeDropboxFile(dropboxFileId)
}
