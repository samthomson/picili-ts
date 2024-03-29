import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'
import * as Models from '../db/models'
import * as DBUtil from './db'
import * as CoreUtil from './core'
import * as FileUtil from './file'
import * as HelperUtil from './helper'
import fetch from 'node-fetch'
import Logger from '../services/logging'
import * as fs from 'fs'
import FSExtra from 'fs-extra'
import moment from 'moment'
import { Dropbox } from 'dropbox'
import got from 'got'
import { promisify } from 'node:util'
import stream from 'node:stream'

export const listAllDropboxfiles = async (userId: number): Promise<Types.Core.DropboxListFilesResponse> => {
    // get dropbox connection details for user
    const dropboxConnection = await DBUtil.getDropboxConnection(userId)
    const { refreshToken: token, syncPath, invalidPathDetected } = dropboxConnection

    if (!token) {
        Logger.warn('no dropbox token stored for connection.')
        return { success: false, error: 'NO_TOKEN', files: [] }
    }

    const access = await exchangeRefreshTokenForAccessToken(token)

    // query dropbox and get all files for that directory (recursively)
    const allDropboxFiles: Types.ExternalAPI.Dropbox.DropboxFile[] = []
    let stillReadingDropboxFileList = true
    let requestsMadeToDropbox = 0
    let cursor = undefined

    while (stillReadingDropboxFileList) {
        const { listFolderResponse, error, success } = await dropboxListFolder(access, syncPath, cursor)

        if (listFolderResponse?.error) {
            /**
             * if there was an error, we'll exit from this function.
             * if we catch the invalid path error, return a standard error to subsequently handle.
             */

            // path not found error?
            if (listFolderResponse?.error?.path?.['.tag'] === 'not_found') {
                return {
                    success: false,
                    error: 'INVALID_PATH',
                    files: [],
                }
            } else {
                Logger.warn('unknown error from dropbox', listFolderResponse?.error)
                return {
                    success: false,
                    files: [],
                }
            }
        } else {
            if (success) {
                stillReadingDropboxFileList = listFolderResponse.has_more

                allDropboxFiles.push(...listFolderResponse.entries)

                requestsMadeToDropbox++
                cursor = listFolderResponse.cursor

                // if invalidPathDetected was true, then now it is okay, so update/revert that
                if (invalidPathDetected) {
                    await DBUtil.updateDropboxConnection(userId, { syncEnabled: true, invalidPathDetected: false })
                }
            }
            if (error) {
                return { success: false, files: [], error }
            }
        }
    }

    const dropboxFiles = allDropboxFiles
        // files not directories on dropbox
        .filter((file) => file['.tag'] === 'file')
        // filter also to just images/videos
        .filter(({ name }) => {
            const { fileExtension } = HelperUtil.splitPathIntoParts(name)
            const fileType = HelperUtil.fileTypeFromExtension(fileExtension)

            return fileType === Enums.FileType.IMAGE || fileType === Enums.FileType.VIDEO
        })
        .map(({ path_lower: path, id, content_hash: hash }) => ({ path, id, hash }))

    return { success: true, files: dropboxFiles }
}

export const listAllDropboxFilesFromJSONFile = () => {
    const data = fs.readFileSync('test-data/dropboxFiles.json', 'utf-8')
    const files: Types.ShadowDropboxAPIFile[] = JSON.parse(data)
    return files
}

export const getConnectionURL = async () => {
    const dbx = new Dropbox({
        clientId: process.env.DROPBOX_APP_KEY,
        clientSecret: process.env.DROPBOX_APP_SECRET,
    })

    const redirectURL = HelperUtil.spaURL()

    // @ts-ignore
    const authUrl = await dbx.auth.getAuthenticationUrl(redirectURL, null, 'code', 'offline', null, 'none', false)

    return authUrl
}

export const exchangeCodeForRefreshToken = async (code: string): Promise<string | null> => {
    try {
        const SPAExternalPort = process.env.SPA_EXTERNAL_PORT
        const SPAHost = process.env.SPA_HOST
        const url = 'https://api.dropbox.com/oauth2/token'

        // create a param object so that node-fetch auto sets the correct form encoding
        const params = new URLSearchParams()
        params.append('code', code)
        params.append('grant_type', 'authorization_code')
        // todo: later/ssl make this protocol agnostic for prod when https works there
        params.append('redirect_uri', HelperUtil.spaURL())
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
): Promise<Types.Core.DropboxListFolderResponse> => {
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
        let data = undefined
        try {
            data = await result.json()
        } catch (err) {
            Logger.error('encountered an error parsing json from dropbox api: list folder', {
                err,
                params: { path, cursor },
                status: result?.status,
                result,
            })
            return {
                success: false,
                listFolderResponse: null,
                error: (err?.code || err?.message) ?? 'UNKNOWN_ERROR',
            }
        }

        return { success: true, listFolderResponse: data }
    } catch (err) {
        if (err.code === 'EAI_AGAIN') {
            Logger.info('unable to reach dropbox API - no connectivity?')
        } else {
            Logger.error('encountered an error calling dropbox api to list folder', { err, params: { path, cursor } })
        }
        return {
            success: false,
            listFolderResponse: null,
            error: err?.code ?? 'UNKNOWN_ERROR',
        }
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
        const { files: apiFiles, success, error } = await listAllDropboxfiles(userId)

        // if invalid path error, raise event in core.
        if (error === 'INVALID_PATH') {
            await CoreUtil.raiseEventInvalidDropboxPathDetected(userId)
        }

        if (error === 'EAI_AGAIN') {
            // connectivity issue, try again in five mins
            return { success: false, retryInMinutes: 5 }
        }

        if (error === 'NO_TOKEN') {
            return { success: false, retryInMinutes: 15 }
        }

        // allow error being INVALID_PATH as then we will remove all files
        if (success || error === 'INVALID_PATH') {
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
        } else {
            Logger.warn('encountered an error checking for dropbox changes', { error })
            return { success: false }
        }
    } catch (err) {
        Logger.error('encountered an error checking for dropbox changes', err)
        return { success: false }
    }
}

export const downloadDropboxFile = async (
    dropboxFileId: string,
    userId: number,
    piciliFileId: number,
    fileExtension: string,
    taskId: number,
): Promise<Types.Core.DropboxDownloadFileResponse> => {
    try {
        const dropboxConnection = await DBUtil.getDropboxConnection(userId)
        const { refreshToken: token } = dropboxConnection
        const access = await exchangeRefreshTokenForAccessToken(token)

        const writeDir = 'processing'
        await FSExtra.ensureDir(writeDir)

        const url = 'https://content.dropboxapi.com/2/files/download'

        const outPath = FileUtil.getProcessingPath(piciliFileId, fileExtension)

        /*
            non-200:

            default:
                Logger.error('non-200 code received when downloading dropbox file', {
                    taskId,
                    status: result.status,
                    result,
                    piciliFileId,
                    dropboxFileId,
                })
                return { success: false, retryInMinutes: 15 }
            */

        const fileDownloadSuccess = await new Promise<{ success: boolean; retryInMinutes?: number }>(
            async (resolve, reject) => {
                const pipeline = promisify(stream.pipeline)

                try {
                    await pipeline(
                        got.stream
                            .post(url, {
                                body: '',
                                headers: {
                                    Authorization: 'Bearer ' + access,
                                    'Dropbox-API-Arg': `{"path": "${dropboxFileId}"}`,
                                },
                                throwHttpErrors: false,
                            })
                            // todo: check for non-200 response here?
                            .on('response', async (resp) => {
                                if (resp?.statusCode !== 200) {
                                    Logger.error('non-200 code received when downloading dropbox file', {
                                        taskId,
                                        status: resp?.statusCode,
                                        resp,
                                        piciliFileId,
                                        dropboxFileId,
                                    })
                                    // todo: resolve this in a way that can be handled
                                    return { success: false, retryInMinutes: 15 }
                                }
                                // Logger.info('stream response', resp)
                            })
                            .on('error', (error) => {
                                Logger.warn(`1. Download failed: ${error.message}`)
                                resolve({ success: false })
                            }),
                        fs
                            .createWriteStream(outPath)
                            .on('error', (error) => {
                                Logger.error(`4. Could not write file to system: ${error.message}`)
                                resolve({ success: false })
                            })
                            .on('finish', () => {
                                Logger.info(`File downloaded to ${outPath}`)
                                resolve({ success: true })
                            }),
                    )
                } catch (err) {
                    Logger.error('2. caught error thrown in pipelines', err)
                    Logger.error('associated data', {
                        dropboxFileId,
                        userId,
                        piciliFileId,
                        fileExtension,
                        taskId,
                        outPath,
                    })
                }
            },
        )

        // were we throttled?

        if (fileDownloadSuccess?.retryInMinutes) {
            return fileDownloadSuccess
        }

        if (fileDownloadSuccess.success) {
            const fileCreatedOnDisk = FSExtra.pathExistsSync(outPath)
            if (!fileCreatedOnDisk) {
                Logger.warn('dropbox file not found on disk after download/import', {
                    taskId,
                    dropboxFileId,
                    piciliFileId,
                })
                return { success: false, retryInMinutes: 15 }
            } else {
                return { success: fileDownloadSuccess.success }
            }
        } else {
            return { success: false }
        }

        // })()
        // return r
    } catch (err) {
        // todo: probably don't need this dropbox check anymore
        if (err?.code === 'ETIMEDOUT') {
            Logger.warn('dropbox api connectivity issue, will try again in 3 minutes', err)
            Logger.info('associated with warning', { taskId, piciliFileId, dropboxFileId })
            // connectivity issue, try again in a few minutes
            return { success: false, retryInMinutes: 3 }
        }

        Logger.error('Dropbox.downloadDropboxFile caught - UNEXPECTED - exception', err)

        return { success: false, retryInMinutes: 60 * 24 }
    }
}
