import sharp from 'sharp'
import FSExtra from 'fs-extra'
import Logger from '../services/logging'
import * as Types from '@shared/declarations'

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
    try {
        // ensure uuid dir exists
        // todo: use this lib/method when creating processing dir
        await FSExtra.ensureDir(outPathDirectory)

        let mediumWidth = undefined
        THUMB_SIZES.forEach(async (thumbSize) => {
            const { name: size, width, height } = thumbSize
            const outPathFull = `thumbs/${userId}/${uuid}/${size}.jpg`
            // todo: lower quality to reduce filesizes
            const data = await sharp(inPath).resize(width, height).toFormat('jpeg').toFile(outPathFull)

            if (size === 'm') {
                mediumWidth = data.width
            }
        })
        const base64MediumThumbBuffer = await sharp(inPath)
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
        return {
            success: true,
            mediumPreview,
            mediumWidth,
            mediumHeight: 300,
        }
    } catch (err) {
        Logger.error(err)
        return { success: false }
    }
}
