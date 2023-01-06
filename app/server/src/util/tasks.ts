import * as DBUtil from './db'
import * as DropboxUtil from './dropbox'
import * as FileUtil from './file'
import * as HelperUtil from './helper'
import * as APIUtil from './apis'
import * as Types from '@shared/declarations'
import * as Constants from '../../../shared/constants'
import moment from 'moment'
import Logger from '../services/logging'
import * as Enums from '../../../shared/enums'
import * as Models from '../db/models'
import { TaskManager } from '../services/TaskManager'

export const processTask = async (taskId: number, thread: number) => {
    // start timing
    const startTime = moment()
    let taskOutcome: Types.Core.TaskProcessorResult = undefined
    const task = await DBUtil.getTask(taskId)

    if (!task) {
        Logger.warn('no task found when went to process', taskId)
    }
    try {
        const { taskType } = task
        switch (taskType) {
            case Enums.TaskType.DROPBOX_SYNC:
                taskOutcome = await DropboxUtil.checkForDropboxChanges(task.relatedPiciliFileId)
                break
            case Enums.TaskType.DROPBOX_FILE_IMPORT_IMAGE:
            case Enums.TaskType.DROPBOX_FILE_IMPORT_VIDEO:
                taskOutcome = await fileImport(task.relatedPiciliFileId, taskId)
                if (!taskOutcome.success && taskOutcome.retryInMinutes) {
                    // requeue the task
                    await DBUtil.postponeTask(task, taskOutcome.retryInMinutes)
                }
                break
            case Enums.TaskType.PROCESS_IMAGE_FILE:
                taskOutcome = await processImage(task.relatedPiciliFileId, task.id)
                break
            case Enums.TaskType.REMOVE_PROCESSING_FILE:
                taskOutcome = await removeProcessingImage(task.relatedPiciliFileId)
                break
            case Enums.TaskType.SUBJECT_DETECTION:
                taskOutcome = await subjectDetection(task.relatedPiciliFileId)
                if (!taskOutcome.success && taskOutcome.retryInMinutes) {
                    // requeue the task
                    await DBUtil.postponeTask(task, taskOutcome.retryInMinutes)
                }
                break
            case Enums.TaskType.ADDRESS_LOOKUP:
                taskOutcome = await addressLookup(task.relatedPiciliFileId)
                if (!taskOutcome.success && taskOutcome.retryInMinutes) {
                    // requeue the task
                    await DBUtil.postponeTask(task, taskOutcome.retryInMinutes)
                }
                break
            case Enums.TaskType.ELEVATION_LOOKUP:
                // temporarily postpone all elevation looks indefinitely
                taskOutcome = await elevationLookup(task.relatedPiciliFileId, taskId)
                if (!taskOutcome.success && taskOutcome.retryInMinutes) {
                    // requeue the task
                    await DBUtil.postponeTask(task, taskOutcome.retryInMinutes)
                }

                break
            case Enums.TaskType.OCR_GENERIC:
                taskOutcome = await ocrGeneric(task.relatedPiciliFileId)
                if (!taskOutcome.success && taskOutcome.retryInMinutes) {
                    // requeue the task
                    await DBUtil.postponeTask(task, taskOutcome.retryInMinutes)
                }
                break
            case Enums.TaskType.OCR_NUMBERPLATE:
                taskOutcome = await ocrNumberplate(task.relatedPiciliFileId)
                if (!taskOutcome.success && taskOutcome.retryInMinutes) {
                    // requeue the task
                    await DBUtil.postponeTask(task, taskOutcome.retryInMinutes)
                }
                break
            case Enums.TaskType.PLANT_LOOKUP:
                taskOutcome = await plantLookup(task.relatedPiciliFileId)
                if (!taskOutcome.success && taskOutcome.retryInMinutes) {
                    // requeue the task
                    await DBUtil.postponeTask(task, taskOutcome.retryInMinutes)
                }
                break
            case Enums.TaskType.REMOVE_FILE:
                taskOutcome = await removeAFileFromTheSystem(task.relatedPiciliFileId)
                if (!taskOutcome.success) {
                    // requeue the task
                    await DBUtil.postponeTask(task, 1)
                }
                break

            case Enums.TaskType.PROCESS_VIDEO_FILE:
                taskOutcome = await processVideo(task.relatedPiciliFileId, task.id)
                break

            default:
                taskOutcome = { success: false }
                Logger.warn('unknown task type', { taskType, id: task.id })
                break
        }

        // finish a task (inc reschedule dropbox sync)
        if (taskOutcome?.success) {
            await finishATask(task)
        } else {
            Logger.info('task manager processed a task, but was not successful. id:', { taskId, taskType })
        }

        // optionally requeue all such tasks (if throttled by underlying API)
        if (taskOutcome?.throttled) {
            Logger.info('task processor received a throttled response, requeueing all such tasks accordingly', {
                taskType,
                retryInMinutes: taskOutcome?.retryInMinutes,
            })
            // throttle by provided delay or default to 24 hours
            const throttleByMinutes = taskOutcome?.retryInMinutes ?? 24 * 60
            await DBUtil.postponeAllTasksOfType(taskType, throttleByMinutes)
        }
    } catch (err) {
        Logger.error('error processing task: ', err)
        Logger.error('associated error data: ', { taskId, taskOutcome })
    }
    // end timing
    const endTime = moment()
    const milliseconds = endTime.diff(startTime)

    // log task processing
    await DBUtil.createTaskProcessedLog({
        taskId: task.id,
        taskType: task.taskType,
        thread,
        processingTime: milliseconds,
        success: taskOutcome?.success ?? false,
    })
}

export const finishATask = async (task: Models.TaskInstance): Promise<void> => {
    const { id, taskType, relatedPiciliFileId } = task
    // update other tasks dependent on this one
    await DBUtil.updateDependentTasks(id)
    // delete/remove task
    // await DBUtil.removeTask(id)
    await DBUtil.completeATask(id)
    // if dropbox sync, requeue
    if (taskType === Enums.TaskType.DROPBOX_SYNC) {
        await DBUtil.createTask({
            taskType,
            relatedPiciliFileId,
            from: moment().add(15, 'minutes').toISOString(),
            importTask: true,
        })
    }
}

export const fileImport = async (fileId: number, taskId: number): Promise<Types.Core.TaskProcessorResult> => {
    try {
        // get this file first, so that we can lift off the `userId` if we
        // get local picili file with dropbox file
        const file = await Models.FileModel.findByPk(fileId, { include: Models.DropboxFileModel })
        const { fileExtension, fileName, userId, fileType } = file

        // check the processing dir isn't full up
        const isThereSpaceToImportAFile = await FileUtil.isThereSpaceToImportAFile(fileType)

        if (!isThereSpaceToImportAFile) {
            Logger.warn('not enough space in procesing dir to import files from dropbox.', {
                taskId,
                fileId,
                fileType,
            })
            // create a system event
            await DBUtil.createSystemEvent({
                userId,
                message: `the processing directory (for files of type ${fileType}) is bigger on disk than is allowed by the current relevant env var, so no new files will be imported. this will resolve itself once the current - waiting, already imported - files are processed.`,
            })
            // wait a bit and let the processing dir clear ut a little before importing more files
            return {
                success: false,
                retryInMinutes: 15,
                // we aren't really being throttled, but this will cause all similar tasks to be postponed too - which is desirable to save this check being run for all of them.
                throttled: true,
            }
        }
        // still here? then we must not have a full processing dir and so it's safe to download a file locally.
        // @ts-ignore
        const dropboxFile = file.dropbox_file
        const { dropboxId, path } = dropboxFile

        const downloadOutcome = await DropboxUtil.downloadDropboxFile(dropboxId, userId, fileId, fileExtension, taskId)

        if (downloadOutcome.success) {
            // create file dir tags
            const fileType = HelperUtil.fileTypeFromExtension(fileExtension)
            const { fileDirectory } = HelperUtil.splitPathIntoParts(path)
            const directories = HelperUtil.individualDirectoriesFromParentDir(fileDirectory)
            const newDirectoryTags = directories.map((dir) => ({
                fileId,
                type: 'folder',
                subtype: '',
                value: dir,
                confidence: 100,
            }))
            newDirectoryTags.push({
                fileId,
                type: 'filename',
                subtype: '',
                value: fileName,
                confidence: 100,
            })
            newDirectoryTags.push({
                fileId,
                type: 'filetype',
                subtype: '',
                value: fileType,
                confidence: 100,
            })
            newDirectoryTags.push({
                fileId,
                type: 'fileextension',
                subtype: '',
                value: fileExtension,
                confidence: 100,
            })
            await DBUtil.createMultipleTags(newDirectoryTags)
        }

        return downloadOutcome
    } catch (err) {
        Logger.error('error importing file', err)
        return { success: false }
    }
}

export const taskTypeToPriority = (taskType: Enums.TaskType): number => {
    switch (taskType) {
        case Enums.TaskType.REMOVE_FILE:
            return 9
        case Enums.TaskType.DROPBOX_SYNC:
            return 8
        case Enums.TaskType.DROPBOX_FILE_IMPORT_IMAGE:
        case Enums.TaskType.DROPBOX_FILE_IMPORT_VIDEO:
            return 1
        case Enums.TaskType.PROCESS_IMAGE_FILE:
            return 7
        case Enums.TaskType.PROCESS_VIDEO_FILE:
            return 7
        case Enums.TaskType.REMOVE_PROCESSING_FILE:
            return 10 // removing processed files is the highest priority, so that once processed we free up disk space
        case Enums.TaskType.ADDRESS_LOOKUP:
            return 6
        case Enums.TaskType.ELEVATION_LOOKUP:
            return 3
        case Enums.TaskType.PLANT_LOOKUP:
            return 3
        case Enums.TaskType.OCR_GENERIC:
            return 3
        case Enums.TaskType.OCR_NUMBERPLATE:
            return 3
        case Enums.TaskType.SUBJECT_DETECTION:
            return 4
    }
}

export const processVideo = async (
    fileId: number,
    videoProcessingTaskId: number,
): Promise<Types.Core.TaskProcessorResult> => {
    // look up file
    const file = await Models.FileModel.findByPk(fileId)
    const { userId, uuid, fileExtension } = file

    const videoProcessingResult = await FileUtil.generateVideoFiles(
        userId,
        fileId,
        uuid,
        fileExtension,
        videoProcessingTaskId,
    )
    const { success, metaData } = videoProcessingResult

    // extract metadata and tag accordingly
    if (success && metaData) {
        const newMetaDataTags: Types.Core.Inputs.CreateTagInput[] = []

        // create tags for all relevant metadata things
        // length
        if (metaData?.length) {
            newMetaDataTags.push({
                fileId,
                type: 'metadata',
                subtype: 'length',
                value: metaData.length.toString(),
                confidence: 100,
            })
        }
        // width
        if (metaData?.width) {
            newMetaDataTags.push({
                fileId,
                type: 'metadata',
                subtype: 'width',
                value: metaData.width.toString(),
                confidence: 100,
            })
        }
        // height
        if (metaData?.height) {
            newMetaDataTags.push({
                fileId,
                type: 'metadata',
                subtype: 'height',
                value: metaData.height.toString(),
                confidence: 100,
            })
        }
        // aspect ratio
        if (metaData?.aspectRatio) {
            newMetaDataTags.push({
                fileId,
                type: 'metadata',
                subtype: 'aspectratio',
                value: metaData.aspectRatio.toString(),
                confidence: 100,
            })
        }
        // size
        if (metaData?.size) {
            newMetaDataTags.push({
                fileId,
                type: 'metadata',
                subtype: 'size',
                value: metaData.size.toString(),
                confidence: 100,
            })
        }
        // make
        if (metaData?.make) {
            newMetaDataTags.push({
                fileId,
                type: 'metadata',
                subtype: 'make',
                value: metaData.make,
                confidence: 100,
            })
        }
        // model
        if (metaData?.model) {
            newMetaDataTags.push({
                fileId,
                type: 'metadata',
                subtype: 'model',
                value: metaData.model,
                confidence: 100,
            })
        }

        if (newMetaDataTags.length > 0) {
            await DBUtil.createMultipleTags(newMetaDataTags)
        }

        // set on file - datetime, latitude, longitude, elevation
        let updatedAgain = false
        let hasLatitude = false
        let hasLongitude = false
        if (metaData?.location?.latitude && metaData?.location.latitude >= -90 && metaData?.location?.latitude <= 90) {
            file.latitude = metaData.location.latitude
            updatedAgain = true
            hasLatitude = true
        }
        if (
            metaData?.location?.longitude &&
            metaData?.location.longitude >= -180 &&
            metaData?.location?.longitude <= 180
        ) {
            file.longitude = metaData.location.longitude
            updatedAgain = true
            hasLongitude = true
        }
        if (metaData?.location?.altitude) {
            file.elevation = metaData.location.altitude
            updatedAgain = true
        }
        if (metaData?.datetime) {
            file.datetime = metaData.datetime
            updatedAgain = true
        }
        if (updatedAgain) {
            await file.save()
        }

        // conditional queueing
        // if lat & lon - queue for reverse geocoding
        if (hasLatitude && hasLongitude) {
            await DBUtil.createTask({
                taskType: Enums.TaskType.ADDRESS_LOOKUP,
                relatedPiciliFileId: fileId,
                importTask: true,
            })
            // if also missing elevation, queue for elevation lookup
            if (!file.elevation) {
                await DBUtil.createTask({
                    taskType: Enums.TaskType.ELEVATION_LOOKUP,
                    relatedPiciliFileId: fileId,
                    importTask: true,
                })
            }
        }
    }

    // subject detection task will get queued during the image (of the stillframe) thumbnailing

    // likewise and create a task dependent on the above to remove the processing file(s)

    return { success }
}

export const processImage = async (
    fileId: number,
    imageProcessingTaskId: number,
): Promise<Types.Core.TaskProcessorResult> => {
    try {
        const file = await Models.FileModel.findByPk(fileId)
        const { userId, uuid, fileExtension } = file

        // create thumbnails, while testing if corrupt and getting other image data
        const thumbnailingResult = await FileUtil.generateThumbnails(userId, fileId, uuid, fileExtension)
        // get medium width/height dimensions
        const {
            success: isThumbnailed,
            mediumWidth,
            mediumHeight,
            isCorrupt,
            exifData,
            dominantColour,
        } = thumbnailingResult

        // update file model with gleamed data

        if (!isThumbnailed) {
            // was it unsuccessful?
            // don't continue
            return { success: false }
        }
        file.isCorrupt = isCorrupt
        if (!isCorrupt) {
            file.isThumbnailed = isThumbnailed
            file.mediumWidth = mediumWidth
            file.mediumHeight = mediumHeight
            file.r = dominantColour.r
            file.g = dominantColour.g
            file.b = dominantColour.b
            // safe to queue for subject detection
            await DBUtil.createTask({
                taskType: Enums.TaskType.SUBJECT_DETECTION,
                relatedPiciliFileId: fileId,
                after: imageProcessingTaskId,
                importTask: true,
            })
        }
        await file.save()

        // create tags from exif data
        const newExifTags: Types.Core.Inputs.CreateTagInput[] = []

        // exif
        if (exifData?.cameraMake) {
            newExifTags.push({
                fileId,
                type: 'exif',
                subtype: 'cameramake',
                value: exifData.cameraMake,
                confidence: 100,
            })
        }
        if (exifData?.cameraModel) {
            newExifTags.push({
                fileId,
                type: 'exif',
                subtype: 'cameramodel',
                value: exifData.cameraModel,
                confidence: 100,
            })
        }
        if (exifData?.lensModel) {
            newExifTags.push({
                fileId,
                type: 'exif',
                subtype: 'lensmodel',
                value: exifData.lensModel,
                confidence: 100,
            })
        }
        if (exifData?.orientation) {
            newExifTags.push({
                fileId,
                type: 'exif',
                subtype: 'orientation',
                value: exifData.orientation.toString(),
                confidence: 100,
            })
        }
        if (exifData?.exposureTime) {
            newExifTags.push({
                fileId,
                type: 'exif',
                subtype: 'exposuretime',
                value: exifData.exposureTime.toString(),
                confidence: 100,
            })
        }
        if (exifData?.aperture) {
            newExifTags.push({
                fileId,
                type: 'exif',
                subtype: 'aperture',
                value: exifData.aperture.toString(),
                confidence: 100,
            })
        }
        if (exifData?.ISO) {
            newExifTags.push({
                fileId,
                type: 'exif',
                subtype: 'iso',
                value: exifData.ISO.toString(),
                confidence: 100,
            })
        }
        if (exifData?.focalLength) {
            newExifTags.push({
                fileId,
                type: 'exif',
                subtype: 'focallength',
                value: exifData.focalLength.toString(),
                confidence: 100,
            })
        }
        if (newExifTags.length > 0) {
            await DBUtil.createMultipleTags(newExifTags)
        }

        let updatedAgain = false
        let hasLatitude = false
        let hasLongitude = false
        if (exifData?.latitude && exifData.latitude >= -90 && exifData?.latitude <= 90) {
            file.latitude = exifData.latitude
            updatedAgain = true
            hasLatitude = true
        }
        if (exifData?.longitude && exifData.longitude >= -180 && exifData?.longitude <= 180) {
            file.longitude = exifData.longitude
            updatedAgain = true
            hasLongitude = true
        }
        if (hasLatitude && hasLongitude) {
            file.location = { type: 'Point', coordinates: [exifData.latitude, exifData.longitude] }
            updatedAgain = true
        }
        if (exifData?.altitude) {
            file.elevation = exifData.altitude
            updatedAgain = true
        }
        if (exifData?.datetime) {
            file.datetime = exifData.datetime
            updatedAgain = true
        }
        if (updatedAgain) {
            await file.save()
        }

        // conditional queueing
        // if lat & lon - queue for reverse geocoding
        if (hasLatitude && hasLongitude) {
            await DBUtil.createTask({
                taskType: Enums.TaskType.ADDRESS_LOOKUP,
                relatedPiciliFileId: fileId,
                importTask: true,
            })
            // if also missing elevation, queue for elevation lookup
            if (!file.elevation) {
                await DBUtil.createTask({
                    taskType: Enums.TaskType.ELEVATION_LOOKUP,
                    relatedPiciliFileId: fileId,
                    importTask: true,
                })
            }
        }

        return { success: true }
    } catch (err) {
        Logger.error('err processing image', { err })
        return { success: false }
    }
}

export const removeProcessingImage = async (fileId: number): Promise<Types.Core.TaskProcessorResult> => {
    const file = await Models.FileModel.findByPk(fileId)

    if (file) {
        const { fileExtension } = file
        const success = FileUtil.removeProcessingFile(fileId, fileExtension)
        return { success }
    } else {
        Logger.warn(`couldn't find the file model in order to check it's extension and then remove it`, { fileId })
        return { success: false }
    }
}

export const subjectDetection = async (fileId: number): Promise<Types.Core.TaskProcessorResult> => {
    const file = await Models.FileModel.findByPk(fileId)
    const { userId, uuid } = file
    const largeThumbPath = FileUtil.thumbPath(userId, uuid, 'xl')

    // get imagga tags
    const imaggaTaggingResult = await APIUtil.imagga(largeThumbPath)

    if (imaggaTaggingResult.success) {
        const { tags } = imaggaTaggingResult
        const newSubjectTags: Types.Core.Inputs.CreateTagInput[] = tags
            .filter(({ confidence }) => confidence > Constants.MIN_IMAGGA_TAG_CONFIDENCE)
            .map(({ tag: { en: value }, confidence }) => ({
                fileId,
                type: 'subject',
                subtype: 'imagga',
                value,
                confidence,
            }))
        if (newSubjectTags.length > 0) {
            await DBUtil.createMultipleTags(newSubjectTags)

            // check for certain tags, in order to queue for other processors
            await createConditionalTasks(
                fileId,
                newSubjectTags.map(({ value }) => value),
            )
        }
        return { success: true }
    } else {
        // either the api returned a non-200 response, or we encountered successive exceptions while attempting to reach it. requeue the task accordingly.
        return {
            success: false,
            throttled: imaggaTaggingResult?.throttled ?? false,
            retryInMinutes: imaggaTaggingResult.requeueDelayMinutes,
        }
    }
}

const createConditionalTasks = async (fileId: number, subjectTags: string[]): Promise<void> => {
    // look for plant key words
    const matchingPlantTags = subjectTags.filter((keyword) => Constants.PLANT_NET_TRIGGERS.includes(keyword))
    if (matchingPlantTags.length > 0) {
        await DBUtil.createTask({
            taskType: Enums.TaskType.PLANT_LOOKUP,
            relatedPiciliFileId: fileId,
            importTask: true,
        })
    }

    // look for ocr key words
    const matchingOCRTags = subjectTags.filter((keyword) => Constants.OCR_TEXT_TRIGGERS.includes(keyword))
    if (matchingOCRTags.length > 0) {
        await DBUtil.createTask({
            taskType: Enums.TaskType.OCR_GENERIC,
            relatedPiciliFileId: fileId,
            importTask: true,
        })
    }

    // look for numberplate ocr key words
    const matchingNumberPlateTags = subjectTags.filter((keyword) => Constants.NUMBER_PLATE_TRIGGERS.includes(keyword))
    if (matchingNumberPlateTags.length > 0) {
        await DBUtil.createTask({
            taskType: Enums.TaskType.OCR_NUMBERPLATE,
            relatedPiciliFileId: fileId,
            importTask: true,
        })
    }
}

export const addressLookup = async (fileId: number): Promise<Types.Core.TaskProcessorResult> => {
    const file = await Models.FileModel.findByPk(fileId)
    const { userId, latitude, longitude } = file

    if (latitude && longitude) {
        // get address data and save wherever
        const lookup = await APIUtil.locationIQ(latitude, longitude)

        if (lookup.success) {
            const formattedAddress = lookup.data.display_name
            // truncate stupidly big addresses to 255 - not worth the outsized db impact of a larger field for a tiny minority of 255+ addresses which are surely full of junk if that big.
            file.address = formattedAddress?.substring(0, 255)
            await file.save()

            const newLocationTags: Types.Core.Inputs.CreateTagInput[] = []
            const addressParts = lookup.data.address
            Object.keys(addressParts).forEach((key) => {
                const value = addressParts[key]
                newLocationTags.push({
                    fileId,
                    type: 'location',
                    subtype: key,
                    value,
                    confidence: 75,
                })
            })
            if (newLocationTags.length > 0) {
                await DBUtil.createMultipleTags(newLocationTags)
            }
            return { success: true }
        } else {
            // requeue ?
            return { success: false, retryInMinutes: lookup.requeueDelayMinutes, throttled: lookup?.throttled ?? false }
        }
    } else {
        Logger.warn('no latitude/longitude on file queued for `ADDRESS_LOOKUP`', {
            userId,
            latitude,
            longitude,
        })
        // not really a success, but the correct outcome as geocoding can't happen without a lat/lon
        return { success: true }
    }
}

export const elevationLookup = async (fileId: number, taskId: number): Promise<Types.Core.TaskProcessorResult> => {
    const file = await Models.FileModel.findByPk(fileId)
    const { userId, latitude, longitude } = file

    if (latitude && longitude) {
        // get elevation data and save on file model
        const lookupElevation = await APIUtil.openTopoDataElevationLookup(latitude, longitude, taskId)

        if (lookupElevation.success) {
            const { elevation } = lookupElevation
            file.elevation = elevation
            await file.save()

            return { success: true }
        } else {
            // requeue ?
            return {
                success: false,
                retryInMinutes: lookupElevation.requeueDelayMinutes,
                throttled: lookupElevation?.throttled ?? false,
            }
        }
    } else {
        Logger.warn('no latitude/longitude on file queued for `ELEVATION_LOOKUP`', {
            userId,
            latitude,
            longitude,
        })
        // not really a success, but the correct outcome as address lookup can't happen without a lat/lon
        return { success: true }
    }
}

export const ocrGeneric = async (fileId: number): Promise<Types.Core.TaskProcessorResult> => {
    const file = await Models.FileModel.findByPk(fileId)
    const { userId, uuid } = file
    const thumbPath = FileUtil.thumbPath(userId, uuid, 'xl')

    const ocrResult = await APIUtil.ocrGeneric(thumbPath)

    if (ocrResult.success) {
        const { parsedText } = ocrResult

        const newTags: Types.Core.Inputs.CreateTagInput[] = []

        const words = parsedText
            .replaceAll('\n', ' ')
            .replaceAll('\r', ' ')
            .replaceAll(',', ' ')
            .replaceAll('.', ' ')
            .split(' ')
            .filter((word) => word !== '')

        words.map((value) => {
            newTags.push({
                fileId,
                type: 'ocr.text',
                subtype: '',
                value,
                confidence: 75,
            })
        })

        if (newTags.length > 0) {
            await DBUtil.createMultipleTags(newTags)
        }
        return { success: true }
    } else {
        // requeue ?
        return { success: false, retryInMinutes: ocrResult.requeueDelayMinutes, throttled: ocrResult?.throttled }
    }
}

export const ocrNumberplate = async (fileId: number): Promise<Types.Core.TaskProcessorResult> => {
    const file = await Models.FileModel.findByPk(fileId)
    const { userId, uuid } = file
    const thumbPath = FileUtil.thumbPath(userId, uuid, 'xl')

    const ocrNumberplateResult = await APIUtil.ocrNumberplate(thumbPath)

    if (ocrNumberplateResult.success) {
        const { numberPlateData } = ocrNumberplateResult

        const newTags: Types.Core.Inputs.CreateTagInput[] = []

        // the api method may be a success and still return no data
        if (numberPlateData) {
            newTags.push({
                fileId,
                type: 'ocr.numberplate',
                subtype: 'region',
                value: numberPlateData.region.code,
                confidence: numberPlateData.region.score * 100,
            })
            newTags.push({
                fileId,
                type: 'ocr.numberplate',
                subtype: 'plate',
                value: numberPlateData.candidates.plate,
                confidence: numberPlateData.candidates.score * 100,
            })
            newTags.push({
                fileId,
                type: 'ocr.numberplate',
                subtype: 'vehicle',
                value: numberPlateData.vehicle.type,
                confidence: numberPlateData.vehicle.score * 100,
            })
        }

        if (newTags.length > 0) {
            await DBUtil.createMultipleTags(newTags)
        }
        return { success: true }
    } else {
        // requeue ?
        return {
            success: false,
            throttled: ocrNumberplateResult?.throttled ?? false,
            retryInMinutes: ocrNumberplateResult.requeueDelayMinutes,
        }
    }
}

export const plantLookup = async (fileId: number): Promise<Types.Core.TaskProcessorResult> => {
    const file = await Models.FileModel.findByPk(fileId)
    const { userId, uuid } = file
    const thumbPath = FileUtil.thumbPath(userId, uuid, 'xl')

    const plantnetResult = await APIUtil.plantLookup(thumbPath)

    if (plantnetResult.success) {
        const { plantData } = plantnetResult

        const newTags: Types.Core.Inputs.CreateTagInput[] = []

        // the api method may be a success and still return no data
        if (plantData) {
            const confidence = plantData.score * 100

            // scientific name
            newTags.push({
                fileId,
                type: 'plant',
                subtype: 'scientificname',
                value: plantData.scientificName,
                confidence,
            })

            // genus
            newTags.push({
                fileId,
                type: 'plant',
                subtype: 'genus',
                value: plantData.genus,
                confidence,
            })

            // family
            newTags.push({
                fileId,
                type: 'plant',
                subtype: 'family',
                value: plantData.family,
                confidence,
            })

            // gbif
            newTags.push({
                fileId,
                type: 'plant',
                subtype: 'gbif',
                value: plantData.gbif,
                confidence,
            })

            // common names
            plantData.commonNames.map((value) => {
                newTags.push({
                    fileId,
                    type: 'plant',
                    subtype: 'commonname',
                    value,
                    confidence,
                })
            })
        }

        if (newTags.length > 0) {
            await DBUtil.createMultipleTags(newTags)
        }
        return { success: true }
    } else {
        // requeue ?
        return {
            success: false,
            throttled: plantnetResult?.throttled ?? false,
            retryInMinutes: plantnetResult.requeueDelayMinutes,
        }
    }
}

export const ensureTaskProcessorIsRunning = () => {
    const taskManager = TaskManager.getInstance()
    taskManager.setIsStopping(false)
}

export const removeAFileFromTheSystem = async (fileId: number): Promise<Types.Core.TaskProcessorResult> => {
    const file = await Models.FileModel.findByPk(fileId)
    let thumbnailRemovalSuccess = false
    // remove tags
    await DBUtil.removeTagsForFile(fileId)
    // remove picili file
    if (file) {
        const { userId, uuid } = file
        // set no thumbnails, so file won't be returned in results
        await DBUtil.setNoThumbnailsOnFile(fileId)
        // remove thumbnails
        thumbnailRemovalSuccess = await FileUtil.removeThumbnails(file.userId, file.uuid)
        await DBUtil.removeFile(fileId)
        return { success: thumbnailRemovalSuccess }
    } else {
        return { success: true }
    }
}

export const bulkCreateRemovalTasks = async (piciliFileIds: number[]): Promise<void> => {
    const removalTasks = piciliFileIds.map((piciliFileId) => {
        return {
            taskType: Enums.TaskType.REMOVE_FILE,
            relatedPiciliFileId: piciliFileId,
            importTask: false,
            priority: taskTypeToPriority(Enums.TaskType.REMOVE_FILE),
        }
    })
    await Models.TaskModel.bulkCreate(removalTasks, {
        ignoreDuplicates: true,
    })
}

export const isTaskProcessorTooBusyToBeInterrupted = (): boolean => {
    const taskManager = TaskManager.getInstance()
    return taskManager.howManyProcessableTasksAreThere > 0
}

export const isTaskProcessorWorkingOnImportTasks = (): boolean => {
    /**
     * returns true if active tasks contains import tasks other than dropbox sync.
     */
    const taskManager = TaskManager.getInstance()
    const tasks = taskManager.getWorkers().map((task) => task.currentTaskBeingProcessed)
    const importTasks = tasks.filter((task) => task.importTask)
    const nonSyncImportTasks = importTasks.filter((task) => task.taskType !== Enums.TaskType.DROPBOX_SYNC)

    return nonSyncImportTasks.length > 0
}
