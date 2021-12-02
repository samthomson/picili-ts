import * as Models from '../server/src/db/models'
import * as Enums from './enums'

export namespace API {
	export namespace Response {
        export type Auth = {
            token?: string
            error?: string
        }
    }
	export interface DropboxConnection {
		syncPath: string
		syncEnabled: boolean
	}

	export type TaskQueue = {
        type: string
        count: number
	}
	type TasksProcessable = {
        total: number
        actionable: number
        queues: TaskQueue[]
	}

	export type TasksProcessedSummary = {
        date: string // date
        count: number
	}
	type TasksProcessed = {
        recent: TasksProcessedSummary[]
	}
	
	export interface TaskSummary {
		oldest: string // date
        processable: TasksProcessable
        processed: TasksProcessed
	}
}

export namespace DropboxAPI {
	export interface DropboxFile {
		'.tag': string
		name: string
		path_lower: string
		path_display: string
		id: string
		client_modified: string
		server_modified: string
		rev: string
		size: number
		is_downloadable: boolean
		content_hash: string
	}

	export interface ListFolderResponse {
		cursor: string
		entries: DropboxFile[]
		has_more: boolean
	}
}

export interface ShadowDropboxAPIFile {
	id: string // external dropbox id
	path: string
	hash: string
}

export interface ChangedDropboxFile {
	dropboxFileId: number
	hash: string
}
export interface DropboxFileListChanges {
	new: ShadowDropboxAPIFile[]
	changed: ChangedDropboxFile[]
	deleted: Models.DropboxFileInstance[]
}

export namespace Core {
	export namespace Inputs {
		export interface CreateTaskInput {
			taskType: Enums.TaskType
			relatedPiciliFileId: number
			from?: string // date
			after?: number // other task id
			importTask?: boolean // default true
			priority: number
		}

		export interface CreateTaskProcessedLog {
			taskType: Enums.TaskType
			processingTime: number
			success: boolean
		}

		export interface CreateFileInput {
			userId: number
			dropboxFileId: number
			fileDirectory: string
			fileName: string
			fileExtension: string
			fileType: Enums.FileType
			uuid: string
		}
	}
	export type FileParts = {
		fileDirectory: string
		fileName: string
		fileExtension: string
	}
}

export type TaskTypeEnum = Enums.TaskType

export type FileTypeEnum = Enums.FileType
