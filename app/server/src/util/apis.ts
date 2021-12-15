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

                case 429:
                    // throttled (as from their docs - never actually seen this response)
                    return {
                        success: false,
                        throttled: true,
                        // docs say just to wait a minute
                        requeueDelayMinutes: 5,
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
                        requeueDelayMinutes: 24 * 60,
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
                    requeueDelayMinutes: 1 * 60,
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
                            return { success: false, throttled: true, requeueDelayMinutes: 1 }
                            break
                        case 'Rate Limited Day':
                            return { success: false, throttled: true, requeueDelayMinutes: 60 * 24 }
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
                    return { success: false, throttled: true, requeueDelayMinutes: 60 * 24 }
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

                // todo: handle throttled response from api
                // return { success: false, throttled: true, requeueDelayMinutes: 60 * 24 }

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

export const ocrNumberplate = async (largeThumbnailPath: string): Promise<Types.Core.OCRNumberPlateResult> => {
    const retryLimit = 3
    const retryDelay = 15000
    let requestAttempts = 0

    const url = 'https://api.platerecognizer.com/v1/plate-reader'
    const apiKey = process.env.API_PLATE_RECOGNIZER

    if (!FSExtra.pathExistsSync(largeThumbnailPath)) {
        Logger.error('thumbnail file did not exist', { largeThumbnailPath })
        return { success: false }
    }
    const image = fs.readFileSync(largeThumbnailPath)
    if (image.length === 0) {
        Logger.error("image buffer is empty, can't send to ocr numberplate api", { largeThumbnailPath })
        return { success: false }
    }
    const base64EncodedFile = Buffer.from(image).toString('base64')

    const formData = new FormData()
    formData.append('upload', base64EncodedFile)

    const options = {
        method: 'POST',
        body: formData,
        headers: {
            Authorization: `Token ${apiKey}`,
        },
    }

    while (requestAttempts < retryLimit) {
        requestAttempts++
        try {
            const result = await fetch(url, options)
            switch (result.status) {
                case 201:
                    const data: Types.ExternalAPI.PlateRecognizer.PlateRecognizerResponse = await result.json()
                    const bestResult = data?.results?.[0] ?? undefined

                    const numberPlateData =
                        bestResult?.region?.code &&
                            bestResult?.region?.score &&
                            bestResult?.candidates?.[0]?.plate &&
                            bestResult?.candidates?.[0]?.score &&
                            bestResult?.vehicle?.type &&
                            bestResult?.vehicle?.score
                            ? {
                                region: {
                                    code: bestResult.region.code,
                                    score: bestResult.region.score,
                                },
                                candidates: {
                                    plate: bestResult.candidates[0].plate,
                                    score: bestResult.candidates[0].score,
                                },
                                vehicle: {
                                    type: bestResult.vehicle.type,
                                    score: bestResult.vehicle.score,
                                },
                            }
                            : undefined

                    return {
                        success: true,
                        numberPlateData,
                    }

                case 429:
                    // throttled
                    return {
                        success: false,
                        throttled: true,
                        requeueDelayMinutes: 24 * 60,
                    }

                default:
                    Logger.error('non 200 result from ocr numberplate', {
                        status: result.status,
                        largeThumbnailPath,
                        result,
                        error: result?.status ?? '[no error parsed]',
                    })
                    // an error that should be handled programmatically, requeue for one day so that the daily email picks it up as a task seen multiple times
                    return {
                        success: false,
                        requeueDelayMinutes: 24 * 60,
                    }
            }
        } catch (err) {
            Logger.warn('unexpected exception when calling ocr numberplate API', { err })
            if (requestAttempts < retryLimit) {
                await HelperUtil.delay(retryDelay)
            } else {
                Logger.warn(`hit exception calling ocr numberplate api #${retryLimit} times in a row.`)
                return {
                    success: false,
                    requeueDelayMinutes: 1 * 60,
                }
            }
        }
    }
}

export const plantLookup = async (thumbnail: string): Promise<Types.Core.PlantNetLookupResult> => {
    const retryLimit = 3
    const retryDelay = 15000
    let requestAttempts = 0

    const apiKey = process.env.API_PLANT_NET_KEY
    const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`

    if (!FSExtra.pathExistsSync(thumbnail)) {
        Logger.error('thumbnail file did not exist', { thumbnail })
        return { success: false }
    }
    const image = fs.createReadStream(thumbnail)

    const formData = new FormData()
    formData.append('organs', 'flower')
    formData.append('images', image)

    const options = {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
    }

    while (requestAttempts < retryLimit) {
        requestAttempts++
        try {
            const result = await fetch(url, options)
            switch (result.status) {
                case 200:
                    const data: Types.ExternalAPI.PlantNet.PlantNetResponse = await result.json()
                    let plantData = undefined

                    if (data.results?.[0]) {
                        const bestResult = data.results[0]

                        const {
                            score,
                            gbif: { id: gbifId },
                        } = bestResult

                        const scientificName = bestResult.species.scientificNameWithoutAuthor
                        const genus = bestResult.species.genus.scientificNameWithoutAuthor
                        const family = bestResult.species.family.scientificNameWithoutAuthor
                        const commonNames = bestResult.species.commonNames

                        plantData = {
                            score,
                            scientificName,
                            genus,
                            family,
                            commonNames,
                            gbif: gbifId,
                        }
                    }

                    return {
                        success: true,
                        plantData,
                    }

                case 404:
                    // api call was successful but api found no plants
                    return {
                        success: true,
                        plantData: undefined,
                    }
                    break
                case 429:
                    // throttled
                    return {
                        success: false,
                        throttled: true,
                        requeueDelayMinutes: 24 * 60,
                    }

                default:
                    Logger.error('non 200 result from plant net', {
                        status: result.status,
                        thumbnail,
                        result,
                        error: result?.statusText ?? '[no error parsed]',
                    })
                    // an error that should be handled programmatically, requeue for one day so that the daily email picks it up as a task seen multiple times
                    return {
                        success: false,
                        requeueDelayMinutes: 24 * 60,
                    }
            }
        } catch (err) {
            Logger.warn('unexpected exception when calling plant net API', { err })
            if (requestAttempts < retryLimit) {
                await HelperUtil.delay(retryDelay)
            } else {
                Logger.warn(`hit exception calling plant net api #${retryLimit} times in a row.`)
                return {
                    success: false,
                    requeueDelayMinutes: 1 * 60,
                }
            }
        }
    }
}
