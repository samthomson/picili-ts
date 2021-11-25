import * as Models from '../db/models'
import * as Types from '@shared/declarations'
import bcrypt from 'bcrypt'

export const getUser = async (email: string, password: string): Promise<Models.UserInstance> => {
    const user = await Models.UserModel.findOne({
        where: {
            email,
        },
    })

    if (!user) {
        return undefined
    }

    const { password: hashedPassword } = user
    const passwordsMatch = await bcrypt.compare(password, hashedPassword)

    return passwordsMatch ? user : undefined
}

export const userWithEmailExists = async (email: string): Promise<boolean> => {
    const user = await Models.UserModel.findOne({
        where: {
            email,
        },
    })

    return !!user
}

export const createUser = async (email: string, password: string): Promise<Models.UserInstance> => {
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await Models.UserModel.create({
        email,
        password: hashedPassword,
    })

    return user
}

export const getDropboxConnection = async (userId: number): Promise<Models.DropboxConnectionInstance> => {
    // check not already created
    const existingDropboxConnection = await Models.DropboxConnectionModel.findOne({ where: { userId } })

    return existingDropboxConnection
}

export const createDropboxConnection = async (
    userId: number,
    refreshToken: string,
): Promise<Models.DropboxConnectionInstance> => {
    const dropboxConnection = await Models.DropboxConnectionModel.create({
        userId,
        refreshToken,
    })

    return dropboxConnection
}

export const updateDropboxConnection = async (
    userId: number,
    updateObject: Types.API.DropboxConnection,
): Promise<void> => {
    await Models.DropboxConnectionModel.update(updateObject, { where: { userId } })
}

export const removeDropboxConnection = async (userId: number): Promise<void> => {
    await Models.DropboxConnectionModel.destroy({
        where: { userId },
    })
}

export const bulkInsertNewDropboxFiles = async (newFiles: Types.DropboxFile[], userId: number) => {
    const newDropboxFiles = newFiles.map(({ path, id: dropboxId, hash }) => ({ path, dropboxId, userId, hash }))

    await Models.DropboxFileModel.bulkCreate(newDropboxFiles)
}

export const insertNewDropboxFile = async (newDropboxFile: Types.DropboxFile, userId: number) => {
    await Models.DropboxFileModel.create({
        path: newDropboxFile.path,
        dropboxId: newDropboxFile.id,
        hash: newDropboxFile.hash,
        userId,
    })
}

export const removeDropboxFile = async (dropboxFileId: number) => {
    await Models.DropboxFileModel.destroy({
        where: {
            id: dropboxFileId,
        },
    })
}

export const updateDropboxFile = async (changedDropboxFile: Types.ChangedDropboxFile) => {
    await Models.DropboxFileModel.update(
        {
            hash: changedDropboxFile.hash,
        },
        {
            where: {
                id: changedDropboxFile.dropboxFileId,
            },
        },
    )
}

export const getAllDropboxFilesFromDB = async (userId: number) => {
    return await Models.DropboxFileModel.findAll({
        where: { userId },
    })
}
