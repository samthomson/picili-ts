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
        return HelperUtil.fileTypeFromExtension(extension) === Enums.FileType.VIDEO ? 'jpg' : extension
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
    const processingPaths = [
        getProcessingPath(piciliFileId, extension),
        // if video, also add jpg - stillframe - processing path
        ...(HelperUtil.fileTypeFromExtension(extension) === Enums.FileType.VIDEO
            ? [getProcessingPath(piciliFileId, 'jpg')]
            : []),
    ]

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
        // user had no thumbnails
        return true
    }

    // check and return if we were successful
    return !FSExtra.pathExistsSync(directory)
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
        if (['mov', 'mp4', 'mts', 'avi'].includes(HelperUtil.splitPathIntoParts(processingPath).fileExtension)) {
            const success = await generateAllRequiredVideoAssets(
                processingPath,
                outPathDirectory,
                piciliFileId,
                videoProcessingTaskId,
                videoMetaData.bitrate,
            )
            return { success, metaData: videoMetaData }
        } else {
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
    piciliFileId: number,
    taskId: number,
    bitrate: number,
    mp4Only = false,
) => {
    // webm, mp4, jpg
    // console.log('will try to process ', processingPath)
    const processingPathDirectory = 'processing'

    const videoEncodingPromise = async (
        taskId: number,
        bitrateOptions: Types.Core.BitrateOptions,
        inputPath: string,
        outputPath: string,
    ) => {
        return new Promise<Types.Core.FFMPEGProcessingResult>((resolve, reject) => {
            const { inputRateBand, minRate, maxRate, bufSize } = bitrateOptions

            const videoEncodingTimeout = setInterval(async () => {
                // re-block task
                await DBUtil.reReserveTask(taskId)
            }, 15000)
            fluent(inputPath)
                .output(outputPath)
                // if we have these params use them, otherwise skip
                .outputOptions([
                    `-b ${minRate}`,
                    `-minrate ${minRate}`,
                    `-maxrate ${maxRate}`,
                    `-bufsize ${bufSize}`,
                    '-threads 1',
                ])
                .withOutputFPS(25)
                // limit dimensions, or keep original if low bitrate
                .size(inputRateBand !== 'LOW' ? '?x1080' : '100%')
                .on('end', () => {
                    clearTimeout(videoEncodingTimeout)
                    return resolve({ success: FSExtra.pathExistsSync(outputPath) })
                })
                .on('error', (err, stdout, stderr) => {
                    clearTimeout(videoEncodingTimeout)

                    if (err.message === 'ffmpeg was killed with signal SIGKILL') {
                        Logger.warn(
                            `[task ${taskId}] failed: ffmpeg was shut down after receiving SIGKILL. likely due to memory issues.`,
                        )

                        // todo: create some kind of system event model then store ffmpeg failing due to memory issues
                        // todo: and notification - see below

                        return resolve({
                            success: false,
                            errorMessage:
                                'SIGKILL: ffmpeg was killed with a SIGKILL signal. likely due to using too much memory.',
                        })
                    }

                    Logger.error('ffmpeg error', {
                        err,
                        errM: err?.message,
                        processingPath,
                        outputPath,
                        stdout,
                        stderr,
                    })

                    return resolve({
                        success: false,
                        errorMessage: err?.message ?? 'unexpected ffmpeg error and exception structure.',
                    })
                })
                .run()
        })
    }

    try {
        const bitrateOptions = ((): Types.Core.BitrateOptions => {
            switch (true) {
                case bitrate / 1000 < 1000:
                    // console.log('\n\nLOW BITRATE\n\n', bitrate)
                    return {
                        inputRateBand: 'LOW',
                        minRate: '800k',
                        maxRate: '800k',
                        bufSize: '367k',
                    }

                case bitrate / 1000 >= 1000 && bitrate / 1000 < 6500:
                    // console.log('\n\nMEDIUM BITRATE\n\n', bitrate)
                    return {
                        inputRateBand: 'MEDIUM',
                        minRate: '1500k',
                        maxRate: '1500k',
                        bufSize: '551k',
                    }
                case bitrate / 1000 >= 6500:
                    // console.log('\n\nHIGH BITRATE\n\n', bitrate)
                    return {
                        inputRateBand: 'HIGH',
                        minRate: '2000k',
                        maxRate: '2000k',
                        bufSize: '734k',
                    }
            }
        })()

        // todo: I could also lower the audio bitrate to save some file space, but these would likely be really marginal gains

        const outPaths = [`${outPathDirectory}/mp4.mp4`, ...(!mp4Only ? [`${outPathDirectory}/webm.webm`] : [])]
        const processingResults = []

        // process all the video formats we want (unless just in test mode doing mp4s only)
        for (let i = 0; i < outPaths.length || (mp4Only && i < 1); i++) {
            const videoEncodingResult = await videoEncodingPromise(taskId, bitrateOptions, processingPath, outPaths[i])
            processingResults.push(videoEncodingResult)
        }

        // if all videos we made were successfully
        if (processingResults.map(({ success }) => success).every((val) => val)) {
            // todo: might be better to run this first, even as a separate task, so that then subsequent image processing can proceed in parallel to the video processing.
            const stillFrameGenerateSuccessfully = await generateStillframeFromVideo(
                processingPath,
                processingPathDirectory,
                `${piciliFileId}.jpg`,
            )

            return stillFrameGenerateSuccessfully
        } else {
            return false
        }
    } catch (err) {
        console.log(err)
        Logger.error('encountered an error generating all required video assets.', {
            processingPath,
            outPathDirectory,
            processingPathDirectory,
            piciliFileId,
            // todo: this is not logged (is just logged if console.logged above)
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
                resolve()
            })
            .on('error', (err) => {
                Logger.error(`encountered an error when generating the thumbnail`, err)
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
            bit_rate: number
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
        bitrate: metaData?.format?.bit_rate,
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
