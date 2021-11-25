import * as DropboxUtil from '../util/dropbox'
import * as DBUtil from '../util/db'
import * as fs from 'fs'

const main = async () => {
    // console.log('get all dropbox files')
    // await DropboxUtil.listAllDropboxfiles(3)
    // await readDropboxFileData()
    await DropboxUtil.checkForDropboxChanges(3)
}

const readDropboxFileData = async () => {
    const files = DropboxUtil.listAllDropboxFilesFromJSONFile()
    console.log('# files: ', files.length)
    await DBUtil.bulkInsertNewDropboxFiles(files, 3)
}

main()
