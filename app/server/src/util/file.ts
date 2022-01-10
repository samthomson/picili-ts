import sharp from 'sharp'
import FSExtra from 'fs-extra'
import fs from 'fs'
import Logger from '../services/logging'
import * as Types from '@shared/declarations'
import exifReader from 'exif-reader'
import dms2dec from 'dms2dec'

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
    const inPath = getProcessingPath(piciliFileId, extension)
    const outPathDirectory = `thumbs/${userId}/${uuid}`

    let base64MediumThumbBuffer = undefined
    try {
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
    const processingPath = getProcessingPath(piciliFileId, extension)
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
