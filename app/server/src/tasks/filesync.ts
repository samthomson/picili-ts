import * as DropboxUtil from '../util/dropbox'
import * as fs from 'fs'

const main = async () => {
    // console.log('get all dropbox files')
    // await DropboxUtil.listAllDropboxfiles(3)
    readDropboxFileData()
}

const readDropboxFileData = () => {
    const data = fs.readFileSync('test-data/dropboxFiles.json', 'utf-8')
    const files = JSON.parse(data)
    console.log('# files: ', files.length)
}

main()
