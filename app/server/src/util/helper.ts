import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'
import Logger from '../services/logging'

export const delay = async (ms: number): Promise<void> => {
    // return await for better async stack trace support in case of errors.
    return await new Promise((resolve) => setTimeout(resolve, ms))
}

export const splitPathIntoParts = (path: string): Types.Core.FileParts => {
    const parts = path.toLowerCase().split('/')

    const file = parts.pop()
    const fileDirectory = parts.length > 0 ? parts.pop() : '/'

    const [fileName, fileExtension] = file.split('.')

    return {
        fileDirectory,
        fileName,
        fileExtension,
    }
}

export const fileTypeFromExtension = (extension: string): Types.FileTypeEnum => {
    switch (extension.toLowerCase()) {
        case 'png':
        case 'jpg':
        case 'jpeg':
            return Enums.FileType.IMAGE
        case 'mov':
        case 'mp4':
        case 'avi':
        case 'mts':
            return Enums.FileType.VIDEO
        default:
            Logger.error('unsupported extension', { extension })
            return null
    }
}
