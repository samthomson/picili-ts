import fs from 'fs'
import fetch from 'node-fetch'
import FormData from 'form-data'

import * as Types from '@shared/declarations'
import Logger from '../services/logging'
import * as HelperUtil from './helper'

export const imagga = async (largeThumbnailPath: string): Promise<Types.Core.ImaggaTaggingResult> => {
    // try to call the API, retry a couple of times if request fails
    // return tags, or a throttle code
    const retryLimit = 3
    const retryDelay = 5000
    let requestAttempts = 0

    const url = 'https://api.imagga.com/v2/tags'
    const apiKey = process.env.IMAGGA_KEY
    const apiSecret = process.env.IMAGGA_SECRET
    const image = fs.createReadStream(largeThumbnailPath)

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
                default:
                    Logger.error('non 200 result from imagga', { status: result.status, largeThumbnailPath })
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
