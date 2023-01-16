
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

export enum BinomialVariableType {
    STORAGE_SPACE_FULL = 'STORAGE_SPACE_FULL',
    IMAGE_PROCESSING_DIR_FULL = 'IMAGE_PROCESSING_DIR_FULL',
    VIDEO_PROCESSING_DIR_FULL = 'VIDEO_PROCESSING_DIR_FULL',
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
    RANDOM = 'RANDOM',
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
    OCR_TEXT = 'ocr.text',
    OCR_NUMBERPLATE = 'ocr.numberplate',
    LOCATION = 'location',
    FILETYPE = 'filetype',
    VIDEO = 'video',
    COLOUR = 'colour',
    PATH = 'PATH',
    PLANT = 'plant',
}

export enum QuerySubtype {
    // TEXT = 'text',
    LENGTH = 'length',
    DIRECTORY = 'DIRECTORY',
    SCIENTIFICNAME = 'scientificname',
}
