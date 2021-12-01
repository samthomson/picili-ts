import * as Types from '@shared/declarations'

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
