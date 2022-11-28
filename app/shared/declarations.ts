// import * as Models from '../server/src/db/models'
import * as Enums from './enums'

export namespace API {
	export namespace Response {
		export type Auth = {
			token?: string
			error?: string
		}
	}

	export type DropboxConnectionEditableAttributes = Pick<Core.BaseModels.DropboxConnection, "syncPath" | "syncEnabled" | "invalidPathDetected">

	export type TaskQueue = {
		type: string
		count: number
	}

	type TasksProcessable = {
		total: number
		processable: number
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

	export interface AdminOverview {
        corruptFiles: string[]
        dropboxFileCount: number
        fileCount: number
        searchableFilesCount: number
	}

	export interface TaskProcessor {
		stopping: boolean
		isImportingEnabled: boolean
		currentTasksBeingProcessed: Core.BaseModels.TaskAttributes[]
	}

	export interface SearchResultItem {
		fileId: number
		userId: number
		uuid: string
		address: string
		latitude: number
		longitude: number
		mediumWidth: number
		mediumHeight: number
		fileType: Enums.FileType
	}

	export interface PaginationInfo {
        totalPages: number
        totalItems: number
        page: number
        perPage: number
        hasNextPage: boolean
        hasPreviousPage: boolean
	}

	export interface SearchStats {
		speed: number
	}

	export type SearchResultsSorting = {
		sortModesAvailable: Enums.SearchSort[]
		sortUsed: Enums.SearchSort
	}

	export type SearchResult = {
		items: SearchResultItem[]
		pageInfo: PaginationInfo
		stats: SearchStats
		sorting?: SearchResultsSorting
	}

	export type IndividualSearchQuery = {
		type?: string
		subtype?: string
		value: string
		isNotQuery?: boolean
	}

	export type SearchQuery = {
		individualQueries: IndividualSearchQuery[]
	}

	export type TagSuggestion = {
		type: string
		subtype?: string
		value: string
		uuid: string
	}

	export type AutoCompleteResponse = {
		userId: number
		tagSuggestions: TagSuggestion[]
	}

	export interface Tag {
		type: string
		subtype: string
		value: string
		confidence: number
	}

	type Location = {
		latitude: number
		longitude: number
	}

	export interface FileInfo {
		address?: string
		datetime: string
		location?: Location
		elevation?: number
		pathOnDropbox?: string
		tags: Tag[]
	}
}
export namespace ExternalAPI {
	export namespace Dropbox {
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
			error?: any
		}
	}

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
			address: Record<string, string>,
			// address example props:
			/*
			country: string,
			country_code: string,
			road: string,
			state: string,
			village: string
			*/
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

	export namespace PlateRecognizer {
		export type PlateRecognizerResult = {
			region: {
				code: string
				score: number
			}
			candidates: {
				plate: string
				score: number
			}
			vehicle: {
				type: string
				score: number
			}
		}

		export type PlateRecognizerResponse = {
			results: PlateRecognizerResult[]
		}
	}

	export namespace PlantNet {
		export type PlantNetResult = {
			score: number,
			species: {
				scientificNameWithoutAuthor: string,
				scientificNameAuthorship: string,
				scientificName: string,
				genus: {
					scientificNameWithoutAuthor: string,
					scientificNameAuthorship: string,
					scientificName: string
				},
				family: {
					scientificNameWithoutAuthor: string,
					scientificNameAuthorship: string,
					scientificName: string
				},
				commonNames: string[]
			},
			gbif: {
				id: string
			}
		}

		export type PlantNetResponse = {
			results: PlantNetResult[]
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
	deleted: Core.BaseModels.DropboxFileAttributes[]
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
			thread: number
			processingTime: number
			success: boolean
		}

		export type CreateFileInput = Pick<Core.BaseModels.FileAttributes, "userId" | "dropboxFileId" | "fileDirectory" | "fileName" | "fileExtension" | "fileType" | "uuid">
		
		export type DropboxConnectionEditableAttributes = Pick<Core.BaseModels.DropboxConnection, "syncPath" | "syncEnabled" | "invalidPathDetected">


		export interface CreateTagInput {
			fileId: number
			type: string
			subtype: string
			value: string
			confidence: number
		}
	}

	export type DropboxListFilesResponse = {
		success: boolean
		error?: string
		files: ShadowDropboxAPIFile[]
	}

	export type DropboxListFolderResponse = {
		success: boolean
		error?: string
		listFolderResponse: ExternalAPI.Dropbox.ListFolderResponse
	}

	export type DropboxDownloadFileResponse = {
		success: boolean
		retryInMinutes?: number
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
	export type VideoCreationResponse = {
		success: 
		// todo: doesn't appear to be used anywhere. might be redundant unless I later detect video corruption? at present I just fail on ffmpeg mem leaks?
		isCorrupt?: boolean
		metaData?: VideoMetaData
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

	export type ParsedLocation = {
		latitude: number
		longitude: number
		altitude: number
	}

	export type VideoMetaData = {
		length: number // seconds
		width: number
		height: number
		datetime?: string
		aspectRatio: Enums.AspectRatio
		size: number
		make?: string
		model?: string
		location?: ParsedLocation
		bitrate: number
	}

	export type ImaggaTaggingResult = {
		success: boolean
		throttled?: boolean
		tags?: ExternalAPI.Imagga.Tag[]
		requeueDelayMinutes?: number
	}

	export type LocationIQTaggingResult = {
		success: boolean
		throttled?: boolean
		data?: ExternalAPI.LocationIQ.ReverseGeocodeResponse
		requeueDelayMinutes?: number
	}

	export type ElevationLookupResult = {
		success: boolean
		throttled?: boolean
		elevation?: number
		requeueDelayMinutes?: number
	}

	export type OCRGenericResult = {
		success: boolean
		throttled?: boolean
		parsedText?: string
		requeueDelayMinutes?: number
	}

	export type OCRNumberPlateResult = {
		success: boolean
		throttled?: boolean
		numberPlateData?: ExternalAPI.PlateRecognizer.PlateRecognizerResult
		requeueDelayMinutes?: number
	}

	export type PlantNetResult = {
		score: number
		scientificName: string
		genus: string
		family: string
		commonNames: string[]
		gbif: string
	}

	export type PlantNetLookupResult = {
		success: boolean
		throttled?: boolean
		plantData?: PlantNetResult
		requeueDelayMinutes?: number
	}

	export type TaskProcessorResult = {
		success: boolean
		retryInMinutes?: number
		throttled?: boolean
	}
	
	export type DBSearchResult = {
		id: number
		uuid: string
		address: string
		latitude: number
		longitude: number
		mediumWidth: number
		mediumHeight: number
		fileType: Enums.FileType
	}
	
	export type DBAutoCompleteResult = {
		fileId: number
		type: string
		subtype: string
		value: string
		confidence: number
		uuid: string
	}

	export type SortsForSearchQuery = {
		availableSortModes: Enums.SearchSort[]
		recommendedSortMode: Enums.SearchSort
	}

	type LatLon = {
		lat: number
		lng: number
	}

	export type MapBounds = {
		_ne: LatLon
		_sw: LatLon
	}

	export namespace BaseModels {
		export interface DropboxConnection {
			id: string
			userId: number
			refreshToken: string
			syncPath?: string
			syncEnabled?: boolean
			invalidPathDetected?: boolean
		}

		export interface DropboxFileAttributes {
			id: number
			userId: number
			path: string
			dropboxId: string
			hash: string
		}

		export interface FileAttributes {
			id: number
			userId: number
			dropboxFileId: number
			uuid: string
			isThumbnailed: boolean
			isCorrupt: boolean
			latitude?: number
			longitude?: number
			elevation?: number
			address?: string
			fileDirectory: string
			fileName: string
			fileExtension: string
			fileType: Enums.FileType
			datetime?: string
			mediumHeight?: number
			mediumWidth?: number
		}
		
		export interface TaskAttributes {
			id: number
			taskType: Enums.TaskType
			relatedPiciliFileId: number
			from: string // date
			after: number // other task id (optional, default null)
			importTask: boolean // default false
			priority: number
			timesSeen: number
		}
	}

	export type SearchQueryResultSet = {
		query: API.IndividualSearchQuery
		results: API.SearchResultItem[]
	}

	export type FFMPEGProcessingResult = {
		success: boolean
		errorMessage?: string
	}

	export type BitrateOptions = {
		inputRateBand: 'LOW' | 'MEDIUM' | 'HIGH'
		minRate: string
		maxRate: string
		bufSize: string
	}
}

// todo: refactor these into an enum namespace, loosing appended `Enum`
export type TaskTypeEnum = Enums.TaskType

export type FileTypeEnum = Enums.FileType

export type SearchSortEnum = Enums.SearchSort
