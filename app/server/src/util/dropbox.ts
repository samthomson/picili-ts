import * as Types from '@shared/declarations'
import * as Models from '../db/models'
import * as DBUtil from './db'
import * as CoreUtil from './core'
import * as FileUtil from './file'
import fetch from 'node-fetch'
import Logger from '../services/logging'
import * as fs from 'fs'
import FSExtra from 'fs-extra'
import moment from 'moment'

export const listAllDropboxfiles = async (userId: number): Promise<Types.ShadowDropboxAPIFile[]> => {
    // get dropbox connection details for user
    const dropboxConnection = await DBUtil.getDropboxConnection(userId)
    const { refreshToken: token, syncPath } = dropboxConnection
    const access = await exchangeRefreshTokenForAccessToken(token)

    // query dropbox and get all files for that directory (recursively)
    const allDropboxFiles: Types.DropboxAPI.DropboxFile[] = []
    let stillReadingDropboxFileList = true
    let requestsMadeToDropbox = 0
    let cursor = undefined

    while (stillReadingDropboxFileList) {
        const listFolderResp = await dropboxListFolder(access, syncPath, cursor)

        stillReadingDropboxFileList = listFolderResp.has_more

        allDropboxFiles.push(...listFolderResp.entries)

        requestsMadeToDropbox++
        cursor = listFolderResp.cursor
    }

    // todo: filter also to just images/videos
    const dropboxFiles = allDropboxFiles
        .filter((file) => file['.tag'] === 'file')
        .map(({ path_lower: path, id, content_hash: hash }) => ({ path, id, hash }))

    return dropboxFiles
}

export const listAllDropboxFilesFromJSONFile = () => {
    const data = fs.readFileSync('test-data/dropboxFiles.json', 'utf-8')
    const files: Types.ShadowDropboxAPIFile[] = JSON.parse(data)
    return files
}

export const exchangeCodeForRefreshToken = async (code: string): Promise<string | null> => {
    try {
        const url = 'https://api.dropbox.com/oauth2/token'

        // create a param object so that node-fetch auto sets the correct form encoding
        const params = new URLSearchParams()
        params.append('code', code)
        params.append('grant_type', 'authorization_code')
        // todo: update this to be url/port agnostic
        params.append('redirect_uri', 'http://localhost:3500/admin/dropbox')
        params.append('client_id', process.env.DROPBOX_APP_KEY)
        params.append('client_secret', process.env.DROPBOX_APP_SECRET)

        const options = {
            method: 'POST',
            body: params,
        }
        const result = await fetch(url, options)
        const data = await result.json()
        return data.refresh_token
    } catch (err) {
        if (err.code === 'EAI_AGAIN') {
            Logger.info('unable to reach dropbox API - no connectivity?')
        } else {
            Logger.error('encountered an error calling dropbox api to exchange code for token', { err })
        }
        return null
    }
}

export const exchangeRefreshTokenForAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
        const url = 'https://api.dropbox.com/oauth2/token'

        // create a param object so that node-fetch auto sets the correct form encoding
        const params = new URLSearchParams()
        params.append('refresh_token', refreshToken)
        params.append('grant_type', 'refresh_token')
        params.append('client_id', process.env.DROPBOX_APP_KEY)
        params.append('client_secret', process.env.DROPBOX_APP_SECRET)

        const options = {
            method: 'POST',
            body: params,
        }
        const result = await fetch(url, options)
        const data = await result.json()
        return data.access_token
    } catch (err) {
        if (err.code === 'EAI_AGAIN') {
            Logger.info('unable to reach dropbox API - no connectivity?')
        } else {
            Logger.error('encountered an error calling dropbox api to exchange refresh token', { err })
        }
        return null
    }
}

const dropboxListFolder = async (
    refreshToken: string,
    path: string,
    cursor?: string,
): Promise<Types.DropboxAPI.ListFolderResponse> => {
    try {
        const url = cursor
            ? 'https://api.dropboxapi.com/2/files/list_folder/continue'
            : 'https://api.dropboxapi.com/2/files/list_folder'

        const endpointSpecificParams = cursor
            ? {
                cursor,
            }
            : {
                path,
                recursive: true,
                limit: 2000,
                include_media_info: false,
            }

        const options = {
            method: 'POST',
            body: JSON.stringify({
                ...endpointSpecificParams,
            }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + refreshToken,
            },
        }
        const result = await fetch(url, options)
        const data = await result.json()

        return data
    } catch (err) {
        if (err.code === 'EAI_AGAIN') {
            Logger.info('unable to reach dropbox API - no connectivity?')
        } else {
            Logger.error('encountered an error calling dropbox api to list folder', { err })
        }
        return null
    }
}

const newUpdatedDeletedFileListComparison = (
    databaseFiles: Models.DropboxFileInstance[],
    dropboxFiles: Types.ShadowDropboxAPIFile[],
): Types.DropboxFileListChanges => {
    const dbFiles = {}
    const apiFiles = {}

    // build path indexed objects of each file list
    for (let i = 0; i < databaseFiles.length; i++) {
        const { path, hash, id, dropboxId } = databaseFiles[i]
        dbFiles[path] = { path, hash, id, dropboxId }
    }
    for (let i = 0; i < dropboxFiles.length; i++) {
        const { path, hash, id } = dropboxFiles[i]
        apiFiles[path] = { path, hash, id }
    }

    const dbFilePathKeys = Object.keys(dbFiles)
    const apiFilePathKeys = Object.keys(apiFiles)

    // files in the API list but not in DB list
    const newFilePaths = apiFilePathKeys.filter((apiFilePath) => !dbFilePathKeys.includes(apiFilePath))
    const deletedFilePaths = dbFilePathKeys.filter((dbFilePath) => !apiFilePathKeys.includes(dbFilePath))

    const newFiles: Types.ShadowDropboxAPIFile[] = newFilePaths.map((filePath) => apiFiles[filePath])
    const deletedFiles: Models.DropboxFileInstance[] = deletedFilePaths.map((filePath) => dbFiles[filePath])

    // changed files
    const filePathsInBothDBAndDropbox = dbFilePathKeys.filter((dbFilePath) => apiFilePathKeys.includes(dbFilePath))

    // build two structures, containing db/api files each, indexed by the respective files id (dropbox) and hash
    const dbFilesByIdHashKey = {}
    const apiFilesByIdHashKey = {}

    for (let i = 0; i < filePathsInBothDBAndDropbox.length; i++) {
        const { dropboxId: dbFileDropboxId, hash: dbFileDropboxHash } = dbFiles[filePathsInBothDBAndDropbox[i]]

        const { id: apiFileDropboxId, hash: apiFileDropboxHash } = apiFiles[filePathsInBothDBAndDropbox[i]]

        dbFilesByIdHashKey[`${dbFileDropboxId}____${dbFileDropboxHash}`] = dbFiles[filePathsInBothDBAndDropbox[i]]

        apiFilesByIdHashKey[`${apiFileDropboxId}____${apiFileDropboxHash}`] = apiFiles[filePathsInBothDBAndDropbox[i]]
    }

    // look for differences between these hash derived signatures
    const dbFilesByIdHashKeyKeys = Object.keys(dbFilesByIdHashKey)
    const apiFilesByIdHashKeyKeys = Object.keys(apiFilesByIdHashKey)

    const different = apiFilesByIdHashKeyKeys.filter(
        (hashDerivedKey) => !dbFilesByIdHashKeyKeys.includes(hashDerivedKey),
    )
    const changedDropboxFiles: Types.ChangedDropboxFile[] = []
    for (let i = 0; i < different.length; i++) {
        const { path, hash } = apiFilesByIdHashKey[different[i]]
        changedDropboxFiles.push({
            dropboxFileId: dbFiles[path].id,
            hash,
        })
    }

    return {
        new: newFiles,
        changed: changedDropboxFiles,
        deleted: deletedFiles,
    }
}

export const checkForDropboxChanges = async (userId: number): Promise<Types.Core.TaskProcessorResult> => {
    try {
        const startTime = moment()
        // create a sync log, and retain it's id.
        const syncLogId = await DBUtil.createSyncLog(userId)
        const databaseFiles = await DBUtil.getAllDropboxFilesFromDB(userId)
        // const apiFiles = await listAllDropboxFilesFromJSONFile()
        const apiFiles = await listAllDropboxfiles(userId)

        const fileDelta = newUpdatedDeletedFileListComparison(databaseFiles, apiFiles)

        // if there were new files, add them to picili
        for (let i = 0; i < fileDelta.new.length; i++) {
            await CoreUtil.addAFileToTheSystem(userId, fileDelta.new[i])
        }

        // if there were deleted files, remove them from picili
        for (let i = 0; i < fileDelta.deleted.length; i++) {
            await CoreUtil.removeAFileFromTheSystem(fileDelta.deleted[i].id)
        }

        // if there were changed files, update them in picili
        for (let i = 0; i < fileDelta.changed.length; i++) {
            await CoreUtil.updateAFileInTheSystem(fileDelta.changed[i])
        }

        // update the sync log with file event numbers and run time.
        const endTime = moment()
        const milliseconds = endTime.diff(startTime)
        await DBUtil.updateSyncLog(
            syncLogId,
            fileDelta.new.length,
            fileDelta.changed.length,
            fileDelta.deleted.length,
            milliseconds,
        )

        // reaching the end is a success - otherwise this task would be re-run until it finishes, meaning all files were processed
        return { success: true }
    } catch (err) {
        Logger.error(err)
        return { success: false }
    }
}

export const downloadDropboxFile = async (
    dropboxFileId: string,
    userId: number,
    uuid: string,
    fileExtension: string,
): Promise<boolean> => {
    try {
        const dropboxConnection = await DBUtil.getDropboxConnection(userId)
        const { refreshToken: token } = dropboxConnection
        const access = await exchangeRefreshTokenForAccessToken(token)

        const writeDir = 'processing'
        await FSExtra.ensureDir(writeDir)

        const url = 'https://content.dropboxapi.com/2/files/download'
        const options = {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + access,
                'Dropbox-API-Arg': `{"path": "${dropboxFileId}"}`,
            },
        }
        const result = await fetch(url, options)

        switch (result.status) {
            case 200:
                const outPath = FileUtil.getProcessingPath(uuid, fileExtension)
                const fileStream = fs.createWriteStream(outPath)
                await new Promise((resolve, reject) => {
                    result.body.pipe(fileStream)
                    result.body.on('error', reject)
                    fileStream.on('finish', resolve)
                })
                break
            default:
                Logger.error('non-200 code received when downloading dropbox file', { status: result.status })
        }
        return true
    } catch (err) {
        Logger.error(err)
        return false
    }
}
