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
    const fileDirectory = parts.length > 0 ? path.substring(0, path.lastIndexOf('/')) : '/'

    const fileNameParts = file.split('.')
    const fileExtension = fileNameParts.pop()
    const fileName = fileNameParts.join('')

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
            Logger.info('unsupported extension', { extension })
            return null
    }
}

export const individualDirectoriesFromParentDir = (path: string): string[] => {
    const parts = path.split('/')
    const nonEmptyParts = parts.filter((part) => part !== '')
    return nonEmptyParts
}

export const spaURL = (): string => {
    // generate to give to dropbox for redirects
    const SPAExternalPort = process.env.SPA_EXTERNAL_PORT

    const protocol = SPAExternalPort === '443' ? 'https' : 'http'

    const SPAHost = process.env.SPA_HOST
    const SPAPortFormatted = SPAExternalPort === '443' ? '' : `:${SPAExternalPort}`

    const redirectURL = `${protocol}://${SPAHost}${SPAPortFormatted}/admin/dropbox`

    return redirectURL
}

export const isNumber = (value: string | number): boolean => value != null && value !== '' && !isNaN(Number(+value))
