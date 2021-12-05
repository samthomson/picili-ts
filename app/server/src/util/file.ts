import sharp from 'sharp'
import FSExtra from 'fs-extra'
import Logger from '../services/logging'
import * as Types from '@shared/declarations'
import exifReader from 'exif-reader'
import dms2dec from 'dms2dec'

export const getProcessingPath = (uuid: string, extension: string) => {
    return `processing/${uuid}.${extension}`
}

//todo: this method
export const thumbPath = () => {
    // thumbs/[userId]/[uuid]/[size].jpg
}

// todo: is large size obsolete now, use xl only?
export const THUMB_SIZES = [
    { name: 'xl', width: 1620 },
    { name: 'l', width: 1120 },
    { name: 'm', height: 300 },
    { name: 's', height: 125, width: 125, fit: 'fill' },
    { name: 'i', height: 32, width: 32, fit: 'fill' },
]
export const isCorrupt = async (uuid: string, extension: string): Promise<boolean> => {
    const inPath = getProcessingPath(uuid, extension)
    try {
        await sharp(inPath)
        return true
    } catch (err) {
        Logger.info('corrupt image', { uuid })
        return false
    }
}

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
    uuid: string,
    extension: string,
): Promise<Types.Core.ThumbnailCreationResponse> => {
    // icon			i
    // small		s
    // medium		m
    // large		l
    // extra large	xl
    const inPath = getProcessingPath(uuid, extension)
    const outPathDirectory = `thumbs/${userId}/${uuid}`

    let sharpImage = undefined
    Logger.info('will try to read image next...')
    try {
        sharpImage = await sharp(inPath)
    } catch {
        // do nothing, image was corrupt
        Logger.info('failed reading image, assuming corrupt.', { uuid, extension })
        return { success: true, isCorrupt: true }
    }
    Logger.info('got past corrupt test...', { isCorrupt })

    try {
        // ensure uuid dir exists
        // todo: use this lib/method when creating processing dir
        await FSExtra.ensureDir(outPathDirectory)

        let mediumWidth = undefined
        THUMB_SIZES.forEach(async (thumbSize) => {
            const { name: size, width, height } = thumbSize
            const outPathFull = `thumbs/${userId}/${uuid}/${size}.jpg`
            // todo: lower quality to reduce filesizes
            const data = sharpImage.resize(width, height).toFormat('jpeg').toFile(outPathFull)

            if (size === 'm') {
                mediumWidth = data.width
            }
        })
        const base64MediumThumbBuffer = await sharpImage
            .jpeg({
                quality: 55,
            })
            .blur(25)
            .resize(undefined, 300)
            .toFormat('jpeg')
            .toBuffer()

        // gamma >2.2 && <= 3: makes images pop a little, with a more saturated contrast
        // await sharp(inPath).resize(1620, undefined).gamma(3).toFormat('jpeg').toFile(outPathFull)

        const mediumPreview = base64MediumThumbBuffer.toString('base64')

        const exifData = await readExif(sharpImage)

        return {
            success: true,
            isCorrupt: false,
            mediumPreview,
            mediumWidth,
            mediumHeight: 300,
            exifData,
        }
    } catch (err) {
        Logger.error('hit error whle thumbnailing: ', { err })
        return { success: false }
    }
}
