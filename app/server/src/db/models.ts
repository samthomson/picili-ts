import * as Sequelize from 'sequelize'
import Database from './connection'
import * as Enums from '@shared/enums'

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

// export enum TaskType {
//     DROPBOX_SYNC,
//     DROPBOX_FILE_IMPORT,
//     PHYSICAL_FILE,
//     REMOVE_FILE,
//     ADDRESS_LOOKUP,
//     ELEVATION_LOOKUP,
//     PLANT_LOOKUP,
//     OCR_GENERIC,
//     OCR_NUMBERPLATE,
//     SUBJECT_DETECTION,
// }

interface TaskAttributes {
    id: number
    taskType: Enums.TaskType
    relatedPiciliFileId: number
    from: string // date
    after: number // other task id (optional, default null)
    importTask: boolean // default false
    priority: number
    timesSeen: number
}
type TaskCreationAttributes = Sequelize.Optional<TaskAttributes, 'id' | 'timesSeen' | 'from' | 'after' | 'importTask'>

export interface TaskInstance extends Sequelize.Model<TaskAttributes, TaskCreationAttributes>, TaskAttributes {
    createdAt?: Date
}

export const TaskModel = Database.define<TaskInstance>(
    'task',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        taskType: Sequelize.ENUM(
            'DROPBOX_SYNC',
            'DROPBOX_FILE_IMPORT',
            'PHYSICAL_FILE',
            'REMOVE_FILE',
            'ADDRESS_LOOKUP',
            'ELEVATION_LOOKUP',
            'PLANT_LOOKUP',
            'OCR_GENERIC',
            'OCR_NUMBERPLATE',
            'SUBJECT_DETECTION',
        ),
        relatedPiciliFileId: Sequelize.INTEGER.UNSIGNED,
        from: Sequelize.DATE,
        after: Sequelize.INTEGER.UNSIGNED,
        importTask: Sequelize.BOOLEAN,
        priority: Sequelize.TINYINT.UNSIGNED,
        timesSeen: Sequelize.SMALLINT.UNSIGNED,
    },
    {
        timestamps: true,
        updatedAt: false,
        underscored: true,
    },
)

interface TaskProcessingLogAttributes {
    id: number
    taskType: Enums.TaskType
    processingTime: number
    success: boolean
}
type TaskProcessingLogCreationAttributes = Sequelize.Optional<TaskProcessingLogAttributes, 'id'>

export interface TaskProcessingLogInstance
    extends Sequelize.Model<TaskProcessingLogAttributes, TaskProcessingLogCreationAttributes>,
        TaskProcessingLogAttributes {
    createdAt?: Date
}

export const TaskProcessingLogModel = Database.define<TaskProcessingLogInstance>(
    'task_processed_log',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        taskType: Sequelize.ENUM(
            'DROPBOX_SYNC',
            'DROPBOX_FILE_IMPORT',
            'PHYSICAL_FILE',
            'REMOVE_FILE',
            'ADDRESS_LOOKUP',
            'ELEVATION_LOOKUP',
            'PLANT_LOOKUP',
            'OCR_GENERIC',
            'OCR_NUMBERPLATE',
            'SUBJECT_DETECTION',
        ),
        processingTime: Sequelize.INTEGER.UNSIGNED,
        success: Sequelize.BOOLEAN,
    },
    {
        timestamps: true,
        updatedAt: false,
        underscored: true,
    },
)

interface FileAttributes {
    id: number
    userId: number
    dropboxFileId: number
    uuid: string
    is_thumbnailed: boolean
    is_corrupt: boolean
    latitude?: number
    longitude?: number
    elevation?: number
    address?: string
    file_directory: string
    file_name: string
    file_extension: string
    datetime?: string
    medium_height?: number
    medium_width?: number
}
type FileCreationAttributes = Sequelize.Optional<FileAttributes, 'id' | 'is_thumbnailed' | 'is_corrupt'>

export interface FileInstance extends Sequelize.Model<FileAttributes, FileCreationAttributes>, FileAttributes {}

export const FileModel = Database.define<FileInstance>(
    'task_processed_log',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: Sequelize.INTEGER.UNSIGNED,
        dropboxFileId: Sequelize.INTEGER.UNSIGNED,
        uuid: Sequelize.UUIDV4,
        is_thumbnailed: Sequelize.BOOLEAN,
        is_corrupt: Sequelize.BOOLEAN,
        latitude: Sequelize.DECIMAL(8, 6),
        longitude: Sequelize.DECIMAL(9, 6),
        elevation: Sequelize.DECIMAL(8, 4),
        address: Sequelize.STRING,
        file_directory: Sequelize.STRING,
        file_name: Sequelize.STRING,
        file_extension: Sequelize.STRING,
        datetime: Sequelize.DATE,
        medium_height: Sequelize.MEDIUMINT.UNSIGNED,
        medium_width: Sequelize.MEDIUMINT.UNSIGNED,
    },
    {
        timestamps: false,
        underscored: true,
    },
)
