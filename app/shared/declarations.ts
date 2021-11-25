import * as Models from '../server/src/db/models'
export namespace API {
	export interface DropboxConnection {
		syncPath: string
		syncEnabled: boolean
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

export interface DropboxFile {
	path: string
	id: string
	hash: string
}

export interface ChangedDropboxFile {
	dropboxFileId: number
	hash: string
}
export interface DropboxFileListChanges {
	new: DropboxFile[]
	changed: ChangedDropboxFile[]
	deleted: Models.DropboxFileInstance[]
}
