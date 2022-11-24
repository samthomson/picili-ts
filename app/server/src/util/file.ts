import sharp from 'sharp'
import FSExtra from 'fs-extra'
import fs from 'fs'
import Logger from '../services/logging'
import * as HelperUtil from '../util/helper'
import * as DBUtil from '../util/db'
import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'
import exifReader from 'exif-reader'
import dms2dec from 'dms2dec'
import fluent from 'fluent-ffmpeg'
import * as ISO6709 from './iso6709-to-dms'
import moment from 'moment'

export const getProcessingPath = (piciliFileId: number, extension: string) => {
    return `processing/${piciliFileId}.${extension}`
}

const getBaseThumbpathDirectory = (userId: number, uuid: string) => {
    return `thumbs/${userId}/${uuid}`
}
//todo: use thumbsizes enum
export const thumbPath = (userId: number, uuid: string, size: string) => {
    // thumbs/[userId]/[uuid]/[size].jpg
    return `thumbs/${userId}/${uuid}/${size}.jpg`
}

export const THUMB_SIZES = [
    { name: 'xl', width: 1620 },
    { name: 'm', height: 300 },
    { name: 's', height: 125, width: 125, fit: 'fill' },
    { name: 'i', height: 32, width: 32, fit: 'fill' },
]

export const readExif = async (sharpInstance: sharp.Sharp): Promise<Types.Core.ExifData> => {
    const exif = (await sharpInstance.metadata()).exif
    const exifData = exifReader(exif)

    const parsedExifData: Types.Core.ExifData = {}

    if (exifData?.image?.Make) {
        parsedExifData.cameraMake = exifData.image.Make
    }
    if (exifData?.image?.Model) {
        parsedExifData.cameraModel = exifData.image.Model
    }
    if (exifData?.image?.Orientation) {
        parsedExifData.orientation = exifData.image.Orientation
    }

    if (exifData?.exif?.ExposureTime) {
        parsedExifData.exposureTime = exifData.exif.ExposureTime
    }
    if (exifData?.exif?.FNumber) {
        parsedExifData.aperture = exifData.exif.FNumber
    }
    if (exifData?.exif?.ISO) {
        parsedExifData.ISO = exifData.exif.ISO
    }
    if (exifData?.exif?.DateTimeOriginal) {
        parsedExifData.datetime = exifData.exif.DateTimeOriginal
    }
    if (exifData?.exif?.FocalLength) {
        parsedExifData.focalLength = exifData.exif.FocalLength
    }
    if (exifData?.exif?.LensModel) {
        parsedExifData.lensModel = exifData.exif.LensModel
    }

    if (exifData?.gps?.GPSAltitude) {
        parsedExifData.altitude = exifData.gps.GPSAltitude
    }
    if (
        exifData?.gps?.GPSLatitude &&
        exifData?.gps?.GPSLatitudeRef &&
        exifData?.gps?.GPSLongitude &&
        exifData?.gps?.GPSLongitudeRef
    ) {
        const latLon = dms2dec(
            exifData.gps.GPSLatitude,
            exifData.gps.GPSLatitudeRef,
            exifData.gps.GPSLongitude,
            exifData.gps.GPSLongitudeRef,
        )
        if (latLon.length === 2) {
            parsedExifData.latitude = latLon[0]
            parsedExifData.longitude = latLon[1]
        }
    }
    return parsedExifData
}

export const generateThumbnails = async (
    userId: number,
    piciliFileId: number,
    uuid: string,
    extension: string,
): Promise<Types.Core.ThumbnailCreationResponse> => {
    // icon			i
    // small		s
    // medium		m
    //// large		l
    // extra large	xl

    // specifically get image processing file (for the case of videos) - since we generate thumbnails for videos from the still frame (already extracted) not from the video
    const requestExtension = ((): string => {
        if (HelperUtil.fileTypeFromExtension(extension) === Enums.FileType.VIDEO) {
            return 'jpg'
        } else {
            return extension
        }
    })()

    const inPath = getProcessingPath(piciliFileId, requestExtension)
    const outPathDirectory = `thumbs/${userId}/${uuid}`

    let base64MediumThumbBuffer = undefined
    try {
        // todo: rotate image here as I do with thumbnails below
        base64MediumThumbBuffer = await sharp(inPath)
            .jpeg({
                quality: 55,
            })
            .blur(25)
            .resize(undefined, 300)
            .toFormat('jpeg')
            .toBuffer()
    } catch (error) {
        // do nothing, image was corrupt
        return { success: true, isCorrupt: true }
    }
    const mediumPreview = base64MediumThumbBuffer.toString('base64')
    base64MediumThumbBuffer = undefined

    try {
        // ensure uuid dir exists
        await FSExtra.ensureDir(outPathDirectory)

        const sharpImage = sharp(inPath)
        let mediumWidth = undefined
        for (let i = 0; i < THUMB_SIZES.length; i++) {
            const thumbSize = THUMB_SIZES[i]
            const { name: size, width, height } = thumbSize
            const outPathFull = `thumbs/${userId}/${uuid}/${size}.jpg`
            // todo: lower quality to reduce filesizes
            const data = await sharpImage.rotate().resize(width, height).toFormat('jpeg').toFile(outPathFull)

            if (!FSExtra.pathExistsSync(outPathFull)) {
                Logger.warn("thumbnailing completed but the file doesn't exist", { ...thumbSize, outPathFull })
                return { success: false }
            }

            if (size === 'm') {
                mediumWidth = data.width
            }
        }
        // gamma >2.2 && <= 3: makes images pop a little, with a more saturated contrast
        // await sharp(inPath).resize(1620, undefined).gamma(3).toFormat('jpeg').toFile(outPathFull)

        let exifData = undefined

        try {
            exifData = await readExif(sharpImage)
        } catch (err) {
            // no exif data
        }
        return {
            success: true,
            isCorrupt: false,
            mediumPreview,
            mediumWidth,
            mediumHeight: 300,
            exifData,
        }
    } catch (err) {
        Logger.error('hit error while thumbnailing: ', { err })
        return { success: false }
    }
}

export const removeProcessingFile = (piciliFileId: number, extension: string): boolean => {
    // there may be multiple processing files (video and image) - and both should be removed
    const processingPaths = [getProcessingPath(piciliFileId, extension)]

    // if video, also add jpg - stillframe - processing path
    if (HelperUtil.fileTypeFromExtension(extension) === Enums.FileType.VIDEO) {
        processingPaths.push(getProcessingPath(piciliFileId, 'jpg'))
    }

    const removalStatuses = processingPaths.map((processingPath) => {
        // `unlinkSync` will throw an error if the file didn't exist
        if (FSExtra.pathExistsSync(processingPath)) {
            fs.unlinkSync(processingPath)
        }

        // check and return if we were successful
        if (!FSExtra.pathExistsSync(processingPath)) {
            return true
        } else {
            return false
        }
    })
    return removalStatuses.every((val) => val)
}

export const removeThumbnails = (userId: number, uuid: string): boolean => {
    const directory = getBaseThumbpathDirectory(userId, uuid)
    // `unlinkSync` will throw an error if the file didn't exist
    if (FSExtra.pathExistsSync(directory)) {
        fs.rmSync(directory, { recursive: true, force: true })
    } else {
        return true
    }

    // check and return if we were successful
    if (!FSExtra.pathExistsSync(directory)) {
        return true
    } else {
        return false
    }
}

export const generateVideoFiles = async (
    userId: number,
    piciliFileId: number,
    uuid: string,
    extension: string,
    videoProcessingTaskId: number,
): Promise<Types.Core.VideoCreationResponse> => {
    const processingPath = getProcessingPath(piciliFileId, extension)
    const outPathDirectory = `thumbs/${userId}/${uuid}`

    // ensure uuid dir exists
    await FSExtra.ensureDir(outPathDirectory)
    const videoMetaData = await getVideoMetaData(processingPath)

    try {
        switch (HelperUtil.splitPathIntoParts(processingPath).fileExtension) {
            // todo: can I just combine these different video types?
            // todo: add for other supported types (webm/avi)
            case 'mov':
            case 'mp4':
            case 'mts':
            case 'avi':
                const success = await generateAllRequiredVideoAssets(
                    processingPath,
                    outPathDirectory,
                    'processing',
                    piciliFileId,
                    videoProcessingTaskId,
                )
                return { success, metaData: videoMetaData }
                break
            default:
                Logger.error('video file encoder not programmed.', { userId, piciliFileId, uuid, extension })
                return { success: false }
        }
    } catch (err) {
        Logger.error('encountered an error processing a video', { processingPath, err })
        return { success: false }
    }
}

export const generateAllRequiredVideoAssets = async (
    processingPath: string,
    outPathDirectory: string,
    // todo: this parameter is redundant since what is passed in is hard coded
    processingPathDirectory: string,
    piciliFileId: number,
    taskId: number,
) => {
    // webm, avi, mp4, jpg/gif
    console.log('will try to process ', processingPath)
    try {
        // todo: still needed?
        // const aviOutPath = `${outPathDirectory}/avi.avi`
        const mp4OutPath = `${outPathDirectory}/mp4.mp4`
        const webmOutPath = `${outPathDirectory}/webm.webm`

        // await fluent(processingPath).output(aviOutPath).run()

        await new Promise<void>((resolve, reject) => {
            const mp4Timeout = setInterval(async () => {
                // re-block task
                await DBUtil.reReserveTask(taskId)
            }, 15000)
            fluent(processingPath)
                .output(mp4OutPath)
                .on('end', function () {
                    clearTimeout(mp4Timeout)
                    return resolve()
                })
                .on('err', (err) => {
                    clearTimeout(mp4Timeout)
                    return reject(err)
                })
                .on('progress', (progress) => {
                    // todo: remove later
                    console.log('Processing MP4: ' + progress.percent + '% done')
                })
                .run()
        })
        console.log('now the mp4 has been generated')
        await new Promise<void>((resolve, reject) => {
            const webmTimeout = setInterval(async () => {
                // re-block
                await DBUtil.reReserveTask(taskId)
            }, 15000)
            fluent(processingPath)
                .output(webmOutPath)
                .on('end', function () {
                    console.log('processing webm finished..')
                    clearTimeout(webmTimeout)
                    return resolve()
                })
                .on('err', (err) => {
                    clearTimeout(webmTimeout)
                    return reject(err)
                })
                .on('progress', (progress) => {
                    // todo: remove these console.logs later
                    console.log('Processing WEBM: ' + progress.percent + '% done')
                })
                .run()
        })
        console.log('now the webm has been generated')

        // todo: might be better to run this first, even as a separate task, so that then subsequent image processing can proceed in parallel to the video processing.
        const stillFrameGenerateSuccessfully = await generateStillframeFromVideo(
            processingPath,
            processingPathDirectory,
            `${piciliFileId}.jpg`,
        )
        console.log('was the still frame generated successfully?', stillFrameGenerateSuccessfully)

        console.log('now we will return a success status from `generateAllRequiredVideoAssets`')
        return stillFrameGenerateSuccessfully
    } catch (err) {
        Logger.error('encountered an error generating all required video assets.', {
            processingPath,
            outPathDirectory,
            processingPathDirectory,
            piciliFileId,
            err,
        })
        return false
    }
}

export const generateStillframeFromVideo = async (
    processingPath: string,
    outPathDirectory: string,
    outPathFileName: string,
): Promise<boolean> => {
    console.log('will generate a thumbanil from', processingPath)
    const processingFileExists = FSExtra.pathExistsSync(processingPath)
    if (!processingFileExists) {
        throw Error(`processing file didn't exist so can't generate a still frame`)
    }
    // take a still frame from half way through the video
    await new Promise<void>((resolve, reject) => {
        fluent(processingPath)
            .screenshots({
                timestamps: ['50%'],
                filename: outPathFileName,
                folder: outPathDirectory,
            })
            .on('end', () => {
                console.log(`think we've now generated the thumbnail, and can return`)
                resolve()
            })
            .on('error', (err) => {
                console.log(`encountered an error when generating the thumbnail`, err)
                reject()
            })
    })
    // validate file was created
    return FSExtra.pathExistsSync(`${outPathDirectory}/${outPathFileName}`)
}

export const getVideoMetaData = async (processingPath: string): Promise<Types.Core.VideoMetaData> => {
    const metaData = await new Promise<{
        streams: {
            width: number
            height: number
        }[]
        format: {
            duration: number
            tags: Record<string, string>
            size: number
            width: number
            height: number
        }
    }>((resolve, reject) => {
        fluent.ffprobe(processingPath, (err, metadata) => {
            if (err) {
                Logger.error('error reading video metadata', { processingPath, err, metadata })
                reject(err)
            }
            resolve(metadata)
        })
    })

    const aspectRatio = (() => {
        if (metaData.streams?.[0]?.width && metaData.streams?.[0]?.height) {
            const { width, height } = metaData.streams[0]

            return width < height ? Enums.AspectRatio.PORTRAIT : Enums.AspectRatio.LANDSCAPE
        }
        return undefined
    })()

    const dateParsed = metaData?.format?.tags?.['com.apple.quicktime.creationdate']
        ? moment(metaData.format.tags['com.apple.quicktime.creationdate']).utcOffset(
              metaData?.format?.tags?.['com.apple.quicktime.creationdate'],
          )
        : metaData?.format?.tags?.creation_time
        ? moment(metaData.format.tags.creation_time)
        : undefined
    const dateFormatted = dateParsed?.format('YYYY-MM-DD HH:mm:ss')

    const data: Types.Core.VideoMetaData = {
        length: metaData?.format?.duration,
        datetime: dateFormatted,
        aspectRatio,
        size: metaData?.format?.size,
        width: metaData?.format?.width,
        height: metaData?.format?.height,
        make: metaData?.format?.tags?.['com.apple.quicktime.make'],
        model: metaData?.format?.tags?.['com.apple.quicktime.model'],
        location: metaData?.format?.tags?.['com.apple.quicktime.location.ISO6709']
            ? parseAppleLocation(metaData.format.tags['com.apple.quicktime.location.ISO6709'])
            : undefined,
    }

    return data
}

const parseAppleLocation = (locationString: string): Types.Core.ParsedLocation | undefined => {
    // eg. '+27.8612+086.8616+6832.754/'
    const result = ISO6709.iso2dec(locationString)

    return result
        ? {
              latitude: result.latitude,
              longitude: result.longitude,
              altitude: +result.altitude,
          }
        : undefined
}
