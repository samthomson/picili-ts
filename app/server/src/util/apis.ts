import fs from 'fs'
import fetch from 'node-fetch'
import FormData from 'form-data'
import FSExtra from 'fs-extra'

import * as Types from '@shared/declarations'
import Logger from '../services/logging'
import * as HelperUtil from './helper'

export const imagga = async (largeThumbnailPath: string): Promise<Types.Core.ImaggaTaggingResult> => {
    // try to call the API, retry a couple of times if request fails
    // return tags, or a throttle code
    const retryLimit = 3
    const retryDelay = 15000
    let requestAttempts = 0

    const url = 'https://api.imagga.com/v2/tags'
    const apiKey = process.env.IMAGGA_KEY
    const apiSecret = process.env.IMAGGA_SECRET

    if (!FSExtra.pathExistsSync(largeThumbnailPath)) {
        Logger.error('thumbnail file did not exist', { largeThumbnailPath })
        return { success: false }
    }
    // const image = fs.createReadStream(largeThumbnailPath)
    const image = fs.readFileSync(largeThumbnailPath)
    if (image.length === 0) {
        Logger.error("image buffer is empty, can't send to imagga api", { largeThumbnailPath })
        return { success: false }
    }

    const formData = new FormData()
    formData.append('image', image)

    const options = {
        method: 'POST',
        body: formData,
        headers: {
            Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
        },
    }

    while (requestAttempts < retryLimit) {
        requestAttempts++
        try {
            const result = await fetch(url, options)
            switch (result.status) {
                case 200:
                    const data: Types.ExternalAPI.Imagga.TaggingResponse = await result.json()
                    return {
                        success: true,
                        tags: data?.result?.tags ?? [],
                    }

                // todo: remove once I solve the mystery empty image buffer problem
                case 400:
                    const failedCall = await result.json()
                    const ImaggaError = failedCall?.status?.text ?? '[no error text found]'

                    Logger.error('400 result from imagga', {
                        error: ImaggaError,
                    })
                    return {
                        success: false,
                        // requeueDelay: 24,
                    }

                default:
                    Logger.error('non 200 result from imagga', {
                        status: result.status,
                        largeThumbnailPath,
                        error: result?.status?.text ?? '[no error text found]',
                    })
                    // an error that should be handled programmatically, requeue for one day so that the daily email picks it up as a task seen multiple times
                    return {
                        success: false,
                        requeueDelay: 24,
                    }
            }
        } catch (err) {
            Logger.warn('unexpected exception when calling imagga API', { err })
            if (requestAttempts < retryLimit) {
                await HelperUtil.delay(retryDelay)
            } else {
                Logger.warn(`hit exception calling imagga api #${retryLimit} times in a row.`)
                return {
                    success: false,
                    requeueDelay: 1,
                }
            }
        }
    }
}

// todo: type response
export const openCage = async (latitude: number, longitude: number) => {
    const apiKey = process.env.API_OPEN_CAGE_KEY

    const url = 'http://api.opencagedata.com/geocode/v1/json'
    const params = new URLSearchParams()
    params.append('no_annotations', '1')
    params.append('q', `${latitude}+${longitude}`)
    params.append('key', apiKey)

    const options = {
        method: 'GET',
        body: params,
    }
    // todo: wrap in retry mechanism
    const result = await fetch(url, options)
    switch (result.status) {
        case 200:
            // todo: type this response
            const data = await result.json()
            Logger.info('data', { data })
            break
        default:
            Logger.error('non 200 result from open cage', {
                status: result.status,
                location: { latitude, longitude },
            })
            break
    }
}
