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

	// todo: refactor this in to external API thing
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

export namespace ExternalAPI {
	export namespace Imagga {
		export type Tag = {
			confidence: number
			tag: {
				en: string
			}
		}
		export type TaggingResponse = {
			result: {
				tags: Tag[]
			}
		}
	}
	export namespace LocationIQ {
		export type ReverseGeocodeResponse = {
			address: {
				// country: string,
				// country_code: string,
				// road: string,
				// state: string,
				// village: string
				[key: string]: string
			},
			display_name: string
		}
	}

	export namespace GoogleElevation {
		type GoogleElevationResult = {
			elevation: number
		}

		export type GoogleElevationResponse = {
			results: GoogleElevationResult[]
			status: string
		}
	}

	export namespace OCRSpace {
		type OCRSpaceResult = {
			ParsedText: string
		}

		export type OCRSpaceResponse = {
			ParsedResults: OCRSpaceResult[]
			OCRExitCode: number, // 1 is success
			IsErroredOnProcessing: boolean,
			ErrorMessage: string,
			ErrorDetails: string
		}
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
			priority?: number
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

		export interface CreateTagInput {
			fileId: number
			// todo: enum?
			type: string
			subtype: string
			value: string
			confidence: number
		}
	}

	export type FileParts = {
		fileDirectory: string
		fileName: string
		fileExtension: string
	}
	export type ThumbnailCreationResponse = {
		success: boolean
		isCorrupt?: boolean
		mediumPreview?: string
		mediumWidth?: number
		mediumHeight?: number
		exifData?: ExifData
	}
	export type ExifData = {
		cameraMake?: string
		cameraModel?: string
		lensModel?: string
		orientation?: number
		exposureTime?: number
		aperture?: number
		ISO?: number
		focalLength?: number

		datetime?: string
		latitude?: number
		longitude?: number
		altitude?: number
	}
	export type ImaggaTaggingResult = {
		success: boolean
		tags?: ExternalAPI.Imagga.Tag[]
		// todo: rename this to append hours?
		requeueDelay?: number // number of hours to requeue the task for
	}

	export type LocationIQTaggingResult = {
		success: boolean
		data?: ExternalAPI.LocationIQ.ReverseGeocodeResponse
		requeueDelayMinutes?: number
	}

	export type ElevationLookupResult = {
		success: boolean
		elevation?: number
		requeueDelayMinutes?: number
	}

	export type OCRGenericResult = {
		success: boolean
		parsedText?: string
		requeueDelayMinutes?: number
	}

	export type TaskProcessorResult = {
		success: boolean
		retryInMinutes?: number
	}
}

export type TaskTypeEnum = Enums.TaskType

export type FileTypeEnum = Enums.FileType
