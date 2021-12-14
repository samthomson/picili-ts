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
                        requeueDelay: 24 * 60,
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
                    requeueDelay: 1 * 60,
                }
            }
        }
    }
}

export const locationIQ = async (latitude: number, longitude: number): Promise<Types.Core.LocationIQTaggingResult> => {
    const apiKey = process.env.API_LOCATION_IQ_KEY

    const url = 'https://eu1.locationiq.com/v1/reverse.php?'
    const params = new URLSearchParams()
    params.append('format', 'json')
    params.append('lat', String(latitude))
    params.append('lon', String(longitude))
    params.append('key', apiKey)

    const options = {
        method: 'GET',
    }

    const retryLimit = 3
    const retryDelay = 15000
    let requestAttempts = 0

    while (requestAttempts < retryLimit) {
        requestAttempts++
        try {
            const result = await fetch(url + params, options)
            switch (result.status) {
                case 200:
                    const data: Types.ExternalAPI.LocationIQ.ReverseGeocodeResponse = await result.json()
                    return { success: true, data }
                    break
                case 429:
                    const error = await result.json()
                    const errorText = error?.error
                    switch (errorText) {
                        case 'Rate Limited Second':
                        case 'Rate Limited Minute':
                            return { success: false, requeueDelayMinutes: 1 }
                            break
                        case 'Rate Limited Day':
                            return { success: false, requeueDelayMinutes: 60 * 24 }
                            break
                    }

                    break
                default:
                    Logger.error('non 200 result from location iq', {
                        status: result.status,
                        location: { latitude, longitude },
                        result,
                    })
                    break
            }
        } catch (err) {
            Logger.warn('unexpected exception when calling location iq API', { err })
            if (requestAttempts < retryLimit) {
                await HelperUtil.delay(retryDelay)
            } else {
                Logger.warn(`hit exception calling location iq api #${retryLimit} times in a row.`)
                // try again in an hour
                return {
                    success: false,
                    requeueDelayMinutes: 1 * 60,
                }
            }
        }
    }
}

export const googleElevationLookup = async (
    latitude: number,
    longitude: number,
): Promise<Types.Core.ElevationLookupResult> => {
    const apiKey = process.env.API_GOOGLE_ELEVATION_KEY

    const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${latitude},${longitude}&key=${apiKey}`

    const options = {
        method: 'GET',
    }

    const retryLimit = 3
    const retryDelay = 15000
    let requestAttempts = 0

    while (requestAttempts < retryLimit) {
        requestAttempts++
        try {
            const result = await fetch(url, options)
            switch (result.status) {
                case 200:
                    const data: Types.ExternalAPI.GoogleElevation.GoogleElevationResponse = await result.json()
                    const { elevation } = data.results[0]
                    return { success: true, elevation }
                    break
                case 403:
                    // throttled, wait a day/24hr
                    return { success: false, requeueDelayMinutes: 60 * 24 }
                    break
                default:
                    Logger.error('non 200 result from google elevation', {
                        status: result.status,
                        location: { latitude, longitude },
                        result,
                    })
                    break
            }
        } catch (err) {
            Logger.warn('unexpected exception when calling google elevation API', { err })
            if (requestAttempts < retryLimit) {
                await HelperUtil.delay(retryDelay)
            } else {
                Logger.warn(`hit exception calling google elevation api #${retryLimit} times in a row.`)
                // try again in an hour
                return {
                    success: false,
                    requeueDelayMinutes: 1 * 60,
                }
            }
        }
    }
}

export const ocrGeneric = async (largeThumbnailPath: string): Promise<Types.Core.OCRGenericResult> => {
    const retryLimit = 3
    const retryDelay = 15000
    let requestAttempts = 0

    const url = 'https://api.ocr.space/parse/image'
    const apiKey = process.env.API_OCR_SPACE_KEY

    if (!FSExtra.pathExistsSync(largeThumbnailPath)) {
        Logger.error('thumbnail file did not exist', { largeThumbnailPath })
        return { success: false }
    }
    const image = fs.readFileSync(largeThumbnailPath)
    if (image.length === 0) {
        Logger.error("image buffer is empty, can't send to ocr generic api", { largeThumbnailPath })
        return { success: false }
    }
    const base64EncodedFile = Buffer.from(image).toString('base64')
    const base64Image = `data:image/jpg;base64,${base64EncodedFile}`

    const formData = new FormData()
    formData.append('base64image', base64Image)
    formData.append('apikey', apiKey)
    formData.append('OCREngine', 2)

    const options = {
        method: 'POST',
        body: formData,
    }

    while (requestAttempts < retryLimit) {
        requestAttempts++
        try {
            const result = await fetch(url, options)
            switch (result.status) {
                case 200:
                    const data: Types.ExternalAPI.OCRSpace.OCRSpaceResponse = await result.json()
                    const parsedText = data?.ParsedResults?.[0]?.ParsedText ?? ''

                    return {
                        success: true,
                        parsedText,
                    }

                default:
                    Logger.error('non 200 result from ocr generic', {
                        status: result.status,
                        largeThumbnailPath,
                        error: `${result?.ErrorMessage ?? '[no error message]'}: ${result?.ErrorDetails ?? '[no error details]'
                            }`,
                    })
                    // an error that should be handled programmatically, requeue for one day so that the daily email picks it up as a task seen multiple times
                    return {
                        success: false,
                        requeueDelayMinutes: 24 * 60,
                    }
            }
        } catch (err) {
            Logger.warn('unexpected exception when calling ocr generic API', { err })
            if (requestAttempts < retryLimit) {
                await HelperUtil.delay(retryDelay)
            } else {
                Logger.warn(`hit exception calling ocr generic api #${retryLimit} times in a row.`)
                return {
                    success: false,
                    requeueDelayMinutes: 1 * 60,
                }
            }
        }
    }
}

// todo: type this response
export const ocrNumberplate = async () => { }

// todo: type this response
export const plantLookup = async () => { }
