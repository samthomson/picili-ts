import sharp from 'sharp'
import FSExtra from 'fs-extra'
import fs from 'fs'
import PathLib from 'path'
import checkDiskSpace from 'check-disk-space'
import fastFolderSizeSync from 'fast-folder-size/sync'
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

const getBaseThumbpathDirectory = (userId: number, fileId: number) => {
    return `thumbs/${userId}/${fileId}`
}
//todo: use thumbsizes enum
export const thumbPath = (userId: number, fileId: number, size: string) => {
    // thumbs/[userId]/[fileId]/[size].jpg
    return `thumbs/${userId}/${fileId}/${size}.jpg`
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
    // uuid: string,
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
    const outPathDirectory = `thumbs/${userId}/${piciliFileId}`

    let base64MediumThumbBuffer = undefined
    try {
        // todo: rotate image here as I do with thumbnails below
        base64MediumThumbBuffer = await sharp(inPath)
            .jpeg({
                // this was 55 which seemed decent, but now on mac those pics look a bit off. changed to 65.
                // noticed it was just with pics from alberto's camera and still they - alone - looked off at 65 too. back to 55.
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

        // parse dominant colour
        const {
            dominant: { r, g, b },
        } = await sharpImage.stats()

        for (let i = 0; i < THUMB_SIZES.length; i++) {
            const thumbSize = THUMB_SIZES[i]
            const { name: size, width, height } = thumbSize
            const outPathFull = `thumbs/${userId}/${piciliFileId}/${size}.jpg`
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
            dominantColour: { r, g, b },
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
        return !FSExtra.pathExistsSync(processingPath)
    })
    return removalStatuses.every((val) => val)
}

export const removeThumbnails = (userId: number, fileId: number): boolean => {
    const directory = getBaseThumbpathDirectory(userId, fileId)
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
    // uuid: string,
    extension: string,
    videoProcessingTaskId: number,
): Promise<Types.Core.VideoCreationResponse> => {
    const processingPath = getProcessingPath(piciliFileId, extension)
    const outPathDirectory = `thumbs/${userId}/${piciliFileId}`

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
                userId,
            )
            return { success, metaData: videoMetaData }
        } else {
            Logger.error('video file encoder not programmed.', { userId, piciliFileId, extension })
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
    userId: number,
    mp4Only = false,
) => {
    // webm, mp4, jpg
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
                .on('error', async (err, stdout, stderr) => {
                    clearTimeout(videoEncodingTimeout)

                    if (err.message === 'ffmpeg was killed with signal SIGKILL') {
                        Logger.warn(
                            `[task ${taskId}] failed: ffmpeg was shut down after receiving SIGKILL. likely due to memory issues.`,
                        )

                        await DBUtil.createSystemEvent({
                            userId,
                            message: `ffmpeg didn't have enough memory so was shut down. video tasks have been temporarily postponed. if this persists then the memory limit of picili should be raised - this may require increasing the memory of the server/vps itself.`,
                        })

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
                    return {
                        inputRateBand: 'LOW',
                        minRate: '800k',
                        maxRate: '800k',
                        bufSize: '367k',
                    }

                case bitrate / 1000 >= 1000 && bitrate / 1000 < 6500:
                    return {
                        inputRateBand: 'MEDIUM',
                        minRate: '1500k',
                        maxRate: '1500k',
                        bufSize: '551k',
                    }
                case bitrate / 1000 >= 6500:
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

export const dirSize = async (dir, divideBy = 1): Promise<Record<Types.FileTypeEnum, number>> => {
    /*
    borrowed from / inspired by https://stackoverflow.com/a/69418940/686490
    */
    const files = fs.readdirSync(dir, { withFileTypes: true })

    const size = async (path: string, fileType: Types.FileTypeEnum): Promise<number> => {
        const paths = files
            // filter to whatever filetype
            .filter(
                (file) =>
                    file.isDirectory() ||
                    HelperUtil.fileTypeFromExtension(
                        HelperUtil.splitPathIntoParts(PathLib.join(dir, file.name)).fileExtension,
                    ) === fileType,
            )
            .map(async (file) => {
                const path = PathLib.join(dir, file.name)

                if (file.isDirectory()) return await size(path, fileType)

                if (file.isFile()) {
                    const { size } = fs.statSync(path)
                    return size
                }

                return 0
            })
        return (await Promise.all(paths)).flat(Infinity).reduce((i, fileSize) => i + fileSize, 0) / divideBy
    }

    const images = await size(dir, Enums.FileType.IMAGE)
    const videos = await size(dir, Enums.FileType.VIDEO)

    return {
        [Enums.FileType.IMAGE]: images,
        [Enums.FileType.VIDEO]: videos,
    }
}

/*
export const isThereSpaceToImportAFile = async (fileType: Types.FileTypeEnum): Promise<boolean> => {
    // how big is the processing dir on disk (ins gb)?
    // const processingDirSize = await dirSize('processing', 1024 * 1024 * 1024)
    // what is our processing dir size limit (also in gb)

    // const {
    //     PROCESSING_DIR_IMAGE_SIZE_LIMIT_GB: processingDirImageSizeLimit,
    //     PROCESSING_DIR_VIDEO_SIZE_LIMIT_GB: processingDirVideoSizeLimit,
    // } = process.env
    const {
        processingDirImageSizeLimitBytes,
        processingDirVideoSizeLimitBytes,
        processingDirSize,
        isOutOfSpace,
        isImageProcessingDirOutOfSpace,
        isVideoProcessingDirOutOfSpace,
    } = await diskSpaceStats()
    // how do they compare? (eg size <= limit)

    // check space for picili in general
    if (isOutOfSpace) {
        return false
    }

    // check space in processing dirs
    if (fileType === Enums.FileType.IMAGE) {
        return isImageProcessingDirOutOfSpace
    }
    if (fileType === Enums.FileType.VIDEO) {
        return isVideoProcessingDirOutOfSpace
    }

    // shouldn't ever get here
    Logger.warn('how did I get here?')
    return false
}
*/

export const diskSpaceStats = async (): Promise<Types.Core.DiskSpaceStats> => {
    const { free, size } = await checkDiskSpace('/')

    const {
        PROCESSING_DIR_IMAGE_SIZE_LIMIT_GB: processingDirImageSizeLimitGB,
        PROCESSING_DIR_VIDEO_SIZE_LIMIT_GB: processingDirVideoSizeLimitGB,
    } = process.env

    const processingDirImageSizeLimitBytes = +processingDirImageSizeLimitGB * 1024 * 1024 * 1024
    const processingDirVideoSizeLimitBytes = +processingDirVideoSizeLimitGB * 1024 * 1024 * 1024

    // around 5gb is expected; 4gb allocated to videos, and 1gb for images
    const reservedForPiciliProcessingDirsBytes = processingDirImageSizeLimitBytes + processingDirVideoSizeLimitBytes

    // eg remaining space minus above [5]gb
    const availableForPiciliToUse = free - reservedForPiciliProcessingDirsBytes

    const processingDirSize = await dirSize('processing')
    const thumbsDirSizeBytes = await fastFolderSizeSync(PathLib.resolve('thumbs'))
    const isOutOfSpace = availableForPiciliToUse <= 0
    const isImageProcessingDirOutOfSpace = processingDirSize[Enums.FileType.IMAGE] >= processingDirImageSizeLimitBytes
    const isVideoProcessingDirOutOfSpace = processingDirSize[Enums.FileType.VIDEO] >= processingDirVideoSizeLimitBytes

    return {
        totalSpaceBytes: size,
        freeSpaceBytes: free,
        usedSpaceBytes: size - free,
        reservedForPiciliProcessingDirsBytes,
        availableForPiciliToUse,
        processingDirImageSizeLimitBytes,
        processingDirVideoSizeLimitBytes,
        processingDirSize,
        thumbsDirSizeBytes,
        isOutOfSpace,
        isImageProcessingDirOutOfSpace,
        isVideoProcessingDirOutOfSpace,
    }
}

export const evaluateStorageStateChanges = async (
    isOutOfSpace: boolean,
    isImageProcessingDirOutOfSpace: boolean,
    isVideoProcessingDirOutOfSpace: boolean,
    userId: number,
) => {
    // store new state values if necessary and raise events
    const binomialStateData = await DBUtil.getBinomialStateData()

    const bsdIsOutOfSpace = binomialStateData.find(
        (val) => val.variable === Enums.BinomialVariableType.STORAGE_SPACE_FULL,
    )
    const bsdIsImageProcessingDirOutOfSpace = binomialStateData.find(
        (val) => val.variable === Enums.BinomialVariableType.IMAGE_PROCESSING_DIR_FULL,
    )
    const bsdIsVideoProcessingDirOutOfSpace = binomialStateData.find(
        (val) => val.variable === Enums.BinomialVariableType.VIDEO_PROCESSING_DIR_FULL,
    )

    if (bsdIsOutOfSpace.value !== isOutOfSpace) {
        await DBUtil.createSystemEvent({
            userId,
            message: `STORAGE_SPACE_FULL is now ${isOutOfSpace}`,
        })
        // update it
        bsdIsOutOfSpace.value = isOutOfSpace
        await bsdIsOutOfSpace.save()
    }

    if (bsdIsImageProcessingDirOutOfSpace.value !== isImageProcessingDirOutOfSpace) {
        await DBUtil.createSystemEvent({
            userId,
            message: `IMAGE_PROCESSING_DIR_FULL is now ${isImageProcessingDirOutOfSpace}`,
        })
        // update it
        bsdIsImageProcessingDirOutOfSpace.value = isImageProcessingDirOutOfSpace

        await bsdIsImageProcessingDirOutOfSpace.save()
    }

    if (bsdIsVideoProcessingDirOutOfSpace.value !== isVideoProcessingDirOutOfSpace) {
        await DBUtil.createSystemEvent({
            userId,
            message: `VIDEO_PROCESSING_DIR_FULL is now ${isVideoProcessingDirOutOfSpace}`,
        })
        // update it
        bsdIsVideoProcessingDirOutOfSpace.value = isVideoProcessingDirOutOfSpace
        await bsdIsVideoProcessingDirOutOfSpace.save()
    }
}
