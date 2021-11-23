import * as Types from '@shared/declarations'
import * as DBUtil from './db'
import fetch from 'node-fetch'
import Logger from '../services/logging'

export const listAllDropboxfiles = async (userId: number): Promise<Types.DropboxFile[]> => {
    // get dropbox connection details for user
    const dropboxConnection = await DBUtil.getDropboxConnection(userId)
    const { token, syncPath } = dropboxConnection
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

    const dropboxFiles = allDropboxFiles.map(({ path_lower: path, id, content_hash: hash }) => ({ path, id, hash }))

    return dropboxFiles
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
        Logger.error(err)
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
        Logger.error(err)
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
        Logger.error(err)
        return null
    }
}
