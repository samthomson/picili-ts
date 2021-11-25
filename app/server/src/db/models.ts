import * as Sequelize from 'sequelize'
import Database from './connection'

interface UserAttributes {
    id: string
    email: string
    password: string
}
type UserCreationAttributes = Sequelize.Optional<UserAttributes, 'id'>

export interface UserInstance extends Sequelize.Model<UserAttributes, UserCreationAttributes>, UserAttributes {
    createdAt?: Date
    updatedAt?: Date
}

export const UserModel = Database.define<UserInstance>(
    'users',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        email: Sequelize.STRING,
        password: Sequelize.STRING,
    },
    {
        timestamps: true,
        underscored: true,
    },
)

interface DropboxConnectionAttributes {
    id: string
    userId: number
    refreshToken: string
    syncPath?: string
    syncEnabled?: boolean
}
type DropboxConnectionCreationAttributes = Sequelize.Optional<DropboxConnectionAttributes, 'id'>

export interface DropboxConnectionInstance
    extends Sequelize.Model<DropboxConnectionAttributes, DropboxConnectionCreationAttributes>,
        DropboxConnectionAttributes {
    createdAt?: Date
    updatedAt?: Date
}

export const DropboxConnectionModel = Database.define<DropboxConnectionInstance>(
    'dropbox_connection',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: Sequelize.INTEGER.UNSIGNED,
        refreshToken: Sequelize.STRING,
        syncPath: Sequelize.STRING,
        syncEnabled: Sequelize.BOOLEAN,
    },
    {
        timestamps: true,
        underscored: true,
    },
)

interface DropboxFileAttributes {
    id: number
    userId: number
    path: string
    dropboxId: string
    hash: string
}
type DropboxFileCreationAttributes = Sequelize.Optional<DropboxFileAttributes, 'id'>

export interface DropboxFileInstance
    extends Sequelize.Model<DropboxFileAttributes, DropboxFileCreationAttributes>,
        DropboxFileAttributes {
    createdAt?: Date
    updatedAt?: Date
}

export const DropboxFileModel = Database.define<DropboxFileInstance>(
    'dropbox_file',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: Sequelize.INTEGER.UNSIGNED,
        path: Sequelize.STRING,
        dropboxId: Sequelize.STRING,
        hash: Sequelize.STRING,
    },
    {
        timestamps: true,
        underscored: true,
    },
)

interface SyncLogAttributes {
    id: number
    userId: number
    newCount?: number
    changedCount?: number
    deletedCount?: number
    runTime?: number
}
type SyncLogCreationAttributes = Sequelize.Optional<SyncLogAttributes, 'id'>

export interface SyncLogInstance
    extends Sequelize.Model<SyncLogAttributes, SyncLogCreationAttributes>,
        SyncLogAttributes {
    createdAt?: Date
}

export const SyncLogModel = Database.define<SyncLogInstance>(
    'sync_log',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: Sequelize.INTEGER.UNSIGNED,
        newCount: Sequelize.INTEGER.UNSIGNED,
        changedCount: Sequelize.INTEGER.UNSIGNED,
        deletedCount: Sequelize.INTEGER.UNSIGNED,
        runTime: Sequelize.INTEGER.UNSIGNED,
    },
    {
        timestamps: true,
        updatedAt: false,
        underscored: true,
    },
)
