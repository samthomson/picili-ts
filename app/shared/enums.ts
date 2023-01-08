
export enum TaskType {
    DROPBOX_SYNC = 'DROPBOX_SYNC',
    DROPBOX_FILE_IMPORT_IMAGE = 'DROPBOX_FILE_IMPORT_IMAGE',
    DROPBOX_FILE_IMPORT_VIDEO = 'DROPBOX_FILE_IMPORT_VIDEO',
    PROCESS_IMAGE_FILE = 'PROCESS_IMAGE_FILE',
    PROCESS_VIDEO_FILE = 'PROCESS_VIDEO_FILE',
    REMOVE_PROCESSING_FILE = 'REMOVE_PROCESSING_FILE',
    ADDRESS_LOOKUP = 'ADDRESS_LOOKUP',
    ELEVATION_LOOKUP = 'ELEVATION_LOOKUP',
    PLANT_LOOKUP = 'PLANT_LOOKUP',
    OCR_GENERIC = 'OCR_GENERIC',
    OCR_NUMBERPLATE = 'OCR_NUMBERPLATE',
    SUBJECT_DETECTION = 'SUBJECT_DETECTION',
    REMOVE_FILE = 'REMOVE_FILE',
}

export enum FileType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO'
}

export enum SearchSort {
    LATEST = 'LATEST',
    OLDEST = 'OLDEST',
    RELEVANCE = 'RELEVANCE',
    ELEVATION_HIGHEST = 'ELEVATION_HIGHEST',
    ELEVATION_LOWEST = 'ELEVATION_LOWEST',
}

export enum AspectRatio {
    PORTRAIT = 'PORTRAIT',
    LANDSCAPE = 'LANDSCAPE',
}

export enum QueryType {
    MAP = 'map',
    // DATE = 'date',
    DATE_RANGE = 'date_range',
    ELEVATION = 'elevation',
    EXIF = 'exif',
    SUBJECT = 'subject',
    OCR = 'ocr',
    LOCATION = 'location',
    FILETYPE = 'filetype',
    VIDEO = 'video',
    COLOUR = 'colour',
    DIRECTORY = 'DIRECTORY',
    // todo: plant 
}

export enum QuerySubtype {
    TEXT = 'text',
    NUMBER_PLATE = 'number_plate',
    LENGTH = 'length',
}
