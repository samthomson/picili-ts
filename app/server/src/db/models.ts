import * as Sequelize from 'sequelize'
import Database from './connection'
import * as Enums from '@shared/enums'
import * as Types from '@shared/declarations'

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

type DropboxConnectionCreationAttributes = Sequelize.Optional<Types.Core.BaseModels.DropboxConnection, 'id'>

export interface DropboxConnectionInstance
    extends Sequelize.Model<Types.Core.BaseModels.DropboxConnection, DropboxConnectionCreationAttributes>,
        Types.Core.BaseModels.DropboxConnection {
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
        invalidPathDetected: Sequelize.BOOLEAN,
    },
    {
        timestamps: true,
        underscored: true,
    },
)

// moved to shared
// interface DropboxFileAttributes {
//     id: number
//     userId: number
//     path: string
//     dropboxId: string
//     hash: string
// }
type DropboxFileCreationAttributes = Sequelize.Optional<Types.Core.BaseModels.DropboxFileAttributes, 'id'>

export interface DropboxFileInstance
    extends Sequelize.Model<Types.Core.BaseModels.DropboxFileAttributes, DropboxFileCreationAttributes>,
        Types.Core.BaseModels.DropboxFileAttributes {
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

// moved to shared
// interface TaskAttributes {
//     id: number
//     taskType: Enums.TaskType
//     relatedPiciliFileId: number
//     from: string // date
//     after: number // other task id (optional, default null)
//     importTask: boolean // default false
//     priority: number
//     timesSeen: number
// }
type TaskCreationAttributes = Sequelize.Optional<
    Types.Core.BaseModels.TaskAttributes,
    'id' | 'timesSeen' | 'from' | 'after' | 'importTask'
>

export interface TaskInstance
    extends Sequelize.Model<Types.Core.BaseModels.TaskAttributes, TaskCreationAttributes>,
        Types.Core.BaseModels.TaskAttributes {
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
            'PROCESS_IMAGE_FILE',
            'PROCESS_VIDEO_FILE',
            'REMOVE_PROCESSING_FILE',
            'ADDRESS_LOOKUP',
            'ELEVATION_LOOKUP',
            'PLANT_LOOKUP',
            'OCR_GENERIC',
            'OCR_NUMBERPLATE',
            'SUBJECT_DETECTION',
            'REMOVE_FILE',
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
    thread: number
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
            'PROCESS_IMAGE_FILE',
            'PROCESS_VIDEO_FILE',
            'REMOVE_PROCESSING_FILE',
            'ADDRESS_LOOKUP',
            'ELEVATION_LOOKUP',
            'PLANT_LOOKUP',
            'OCR_GENERIC',
            'OCR_NUMBERPLATE',
            'SUBJECT_DETECTION',
            'REMOVE_FILE',
        ),
        thread: Sequelize.TINYINT.UNSIGNED,
        processingTime: Sequelize.INTEGER.UNSIGNED,
        success: Sequelize.BOOLEAN,
    },
    {
        timestamps: true,
        updatedAt: false,
        underscored: true,
    },
)

type FileCreationAttributes = Sequelize.Optional<
    Types.Core.BaseModels.FileAttributes,
    'id' | 'isThumbnailed' | 'isCorrupt'
>

export interface FileInstance
    extends Sequelize.Model<Types.Core.BaseModels.FileAttributes, FileCreationAttributes>,
        Types.Core.BaseModels.FileAttributes {}

export const FileModel = Database.define<FileInstance>(
    'file',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: Sequelize.INTEGER.UNSIGNED,
        dropboxFileId: Sequelize.INTEGER.UNSIGNED,
        uuid: Sequelize.UUIDV4,
        isThumbnailed: Sequelize.BOOLEAN,
        isCorrupt: Sequelize.BOOLEAN,
        latitude: Sequelize.DECIMAL(8, 6),
        longitude: Sequelize.DECIMAL(9, 6),
        elevation: Sequelize.DECIMAL(8, 4),
        address: Sequelize.STRING,
        fileDirectory: Sequelize.STRING,
        fileName: Sequelize.STRING,
        fileExtension: Sequelize.STRING,
        fileType: Sequelize.ENUM('IMAGE', 'VIDEO'),
        datetime: Sequelize.DATE,
        mediumHeight: Sequelize.MEDIUMINT.UNSIGNED,
        mediumWidth: Sequelize.MEDIUMINT.UNSIGNED,
    },
    {
        timestamps: false,
        underscored: true,
    },
)

FileModel.belongsTo(DropboxFileModel)

interface TagAttributes {
    id: number
    fileId: number
    type: string
    subtype?: string
    value: string
    confidence: number
}
type TagCreationAttributes = Sequelize.Optional<TagAttributes, 'id' | 'subtype'>

export interface TagInstance extends Sequelize.Model<TagAttributes, TagCreationAttributes>, TagAttributes {}

export const TagModel = Database.define<TagInstance>(
    'tag',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        fileId: Sequelize.INTEGER.UNSIGNED,
        type: Sequelize.STRING,
        subtype: Sequelize.STRING,
        value: Sequelize.STRING,
        confidence: Sequelize.TINYINT.UNSIGNED,
    },
    {
        timestamps: false,
        underscored: true,
    },
)

FileModel.hasMany(TagModel)

type SystemEventCreationAttributes = Sequelize.Optional<Types.Core.BaseModels.SystemEventAttributes, 'id'>
export interface SystemEventInstance
    extends Sequelize.Model<Types.Core.BaseModels.SystemEventAttributes, SystemEventCreationAttributes>,
        Types.Core.BaseModels.SystemEventAttributes {
    createdAt?: string
}

export const SystemEventModel = Database.define<SystemEventInstance>(
    'system_events',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        message: Sequelize.STRING,
        userId: Sequelize.INTEGER.UNSIGNED,
    },
    {
        timestamps: true,
        updatedAt: false,
        underscored: true,
    },
)
