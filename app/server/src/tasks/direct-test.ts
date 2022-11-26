import * as Types from '@shared/declarations'
import * as TasksUtil from '../util/tasks'
import * as FileUtil from '../util/file'
import * as APIUtil from '../util/apis'
import * as DBUtil from '../util/db'
import * as DropboxUtil from '../util/dropbox'
import * as HelperUtil from '../util/helper'
import * as Models from '../db/models'
import Logger from '../services/logging'
import * as Enums from '../../../shared/enums'

import fs from 'fs'
import path from 'path'
import FSExtra from 'fs-extra'

const file = async () => {
    await TasksUtil.fileImport(661)
    // await TasksUtil.processImage(619, 255)
    // corrupt test
    // await TasksUtil.processImage(32)
    // invalid geo test
    // await TasksUtil.processImage(10)
    // failing for some reason
    // await TasksUtil.processImage(63)
    // await FileUtil.readExif('62a556b0-628c-402a-892c-38a335d03554', 'jpg')
    // const isCorrupt = await FileUtil.isCorrupt('db1264b4-5406-40de-8212-01fc2d11cc27', 'jpg')
    // console.log('should be corrupt', { isCorrupt })
    // const isNotCorrupt = await FileUtil.isCorrupt('7eb3e4c0-9ed3-47e5-91ca-db01794d68bb', 'jpg')
    // console.log({ 'normal image': isNotCorrupt })
    // FileUtil.removeProcessingFile('0cbe5464-6477-4f49-81f7-af99accb8963', 'jpg')
}

const bulkImaggaTest = async () => {
    const files = await Models.FileModel.findAll()
    const ids = files.map(({ id }) => id)

    let successes = 0,
        failures = 0
    for (let i = 0; i < files.length; i++) {
        const { id, userId, uuid } = files[i]

        const largeThumbPath = FileUtil.thumbPath(userId, uuid, 'l')

        const outcome = await APIUtil.imagga(largeThumbPath)

        if (outcome.success) {
            Logger.info('success', { id })
            successes++
        } else {
            Logger.error('failure', { ...outcome, id, largeThumbPath })
            failures++
        }
    }
    Logger.info('end result', { successes, failures })
}

const imaggaTest = async () => {
    // await TasksUtil.subjectDetection(9)
    // await TasksUtil.processTask(607)
    await bulkImaggaTest()
}

const geo = async () => {
    await TasksUtil.addressLookup(2004)
}

const throttleTest = async () => {
    const largeThumbPath = FileUtil.thumbPath(3, '7c6f4ecd-c50e-40e4-88dc-9e4b0144c815', 'xl')
    for (let i = 0; i < 5; i++) {
        const res = await APIUtil.ocrGeneric(largeThumbPath)
        console.log(JSON.stringify(res))
    }
}

const dupTagTest = async () => {
    const dupTasks: Types.Core.Inputs.CreateTaskInput[] = [
        {
            taskType: Enums.TaskType.ADDRESS_LOOKUP,
            relatedPiciliFileId: 1,
            importTask: true,
        },
    ]

    await DBUtil.createTask(dupTasks[0])
}

const apiTest = async () => {
    const largeThumbPath = FileUtil.thumbPath(3, '7c6f4ecd-c50e-40e4-88dc-9e4b0144c815', 'l')
    const apiResult = await APIUtil.ocrGeneric(largeThumbPath)
    console.log(apiResult)
}
const taskTest = async () => {
    // const apiResult = await TasksUtil.plantLookup(14)
    // console.log(apiResult)
    const dropboxResult = await DropboxUtil.checkForDropboxChanges(3)
    Logger.info('dropboxResult', { dropboxResult })
}

const removeThumbnailTest = async () => {
    const result = await FileUtil.removeThumbnails(3, '8b6f6934-22eb-4227-8bf4-7b729b0dd6ea')
    console.log(result)
}

const mixedFileList = async () => {
    const result = await Models.FileModel.findAll({
        where: { userId: 3 },
        include: [{ model: Models.DropboxFileModel }],
    })
    // @ts-ignore
    const dropboxFileIds = result.map((file) => file.dropbox_file.id)

    const removalTasks = dropboxFileIds.map((dropboxFileId) => {
        return {
            taskType: Enums.TaskType.REMOVE_FILE,
            relatedPiciliFileId: dropboxFileId,
            importTask: false,
            priority: TasksUtil.taskTypeToPriority(Enums.TaskType.REMOVE_FILE),
        }
    })

    await Models.TaskModel.bulkCreate(removalTasks)
}

const testDropboxSync = async () => {
    await DropboxUtil.checkForDropboxChanges(3)
}

const testParsingFileParts = async () => {
    const dropboxFiles = await Models.DropboxFileModel.findAll()
    for (let i = 0; i < dropboxFiles.length; i++) {
        const { path } = dropboxFiles[i]
        HelperUtil.individualDirectoriesFromParentDir(path)
    }
}

const walk = (dir, files = []) => {
    const dirFiles = fs.readdirSync(dir)
    for (const f of dirFiles) {
        const stat = fs.lstatSync(dir + path.sep + f)
        if (stat.isDirectory()) {
            walk(dir + path.sep + f, files)
        } else {
            files.push(dir + path.sep + f)
        }
    }
    return files
}

const video = async () => {
    console.log('test video')

    // const path = await FileUtil.getProcessingPath(348, 'mp4')

    // await FileUtil.generateVideoFiles(3, 350, '73c44922-9e45-4907-a94e-bfb9968f37a4', 'mp4')

    // await FileUtil.generateStillframeFromVideo(path, 'processing', '348.jpg')

    // await FileUtil.generateStillframeFromVideo(path, 'processing', '2.jpg')

    // const path = await FileUtil.getProcessingPath(4, 'mp4')
    // await FileUtil.getVideoMetaData(path)

    // const allFiles = walk('/app/server/processing/test')
    // // console.log('all files', allFiles)

    // for (let i = 0; i < allFiles.length; i++) {
    //     const path = allFiles[i]
    //     console.log('\nfile', path)
    //     const data = await FileUtil.getVideoMetaData(path)
    //     await FSExtra.ensureDir('video-metadata')
    //     fs.writeFileSync(`video-metadata/${i}-${path.replaceAll('/', '_')}.json`, JSON.stringify(data))
    // }

    // await FileUtil.generateStillframeFromVideo('processing/mov-short.mov', 'out', 'mov-short.jpg')
    const sixteen_mb = 'processing/mp4-test/16mb-sony-arii.MP4'
    const jen_48_mb = 'processing/mp4-test/48mb-jen-water-video.mp4'
    const insta_hongkong_9mb = 'processing/mp4-test/9mb-instagram.mp4'
    const insta_bangkok_9mb = 'processing/mp4-test/9mb-original.mp4'
    const whatsapp_3mb = 'processing/mp4-test/3mb-whatsapp.mp4'
    const sony_old_12mb = 'processing/mp4-test/12mb-old-sony.mp4'
    const ama_dablam_67mb = 'processing/64mb-ama-dablam.mov'
    const assafora_12mb = 'processing/12mb-assafora.mov'
    const climbing_9mb = 'processing/originals/9mb_climbing.mov'
    const bbq_13mb = 'processing/originals/13mb_bbq.mov'
    const cats_16mb = 'processing/originals/16mb_cats.mov'
    const beach_17mb = 'processing/originals/17mb_beach.mov'
    const cave_17mb = 'processing/originals/17mb_cave.mov'
    const morocco_dinner_96mb = 'processing/originals/gopro/96mb_morocco_dinner.mp4'
    const morocco_cycling_128mb = 'processing/originals/gopro/128mb_morocco_cycling.mp4'

    const small = [insta_hongkong_9mb, insta_bangkok_9mb, whatsapp_3mb]

    const go_pro = [morocco_dinner_96mb, morocco_cycling_128mb]

    const insta = [insta_hongkong_9mb, insta_bangkok_9mb]

    const high_quality = [
        assafora_12mb,
        jen_48_mb,
        ama_dablam_67mb,
        climbing_9mb,
        bbq_13mb,
        cats_16mb,
        beach_17mb,
        cave_17mb,
        ...go_pro,
    ]

    const all = [...small, sixteen_mb, ...insta, sony_old_12mb, ...high_quality]

    // const testIndex = 6
    // const testFile = all[testIndex]
    // const metadata = await FileUtil.getVideoMetaData(testFile)
    // const videoGeneratingResult = await FileUtil.generateAllRequiredVideoAssets(testFile, 'thumbs', 'processing', testIndex, testIndex, metadata.bitrate)
    // console.log('videoGeneratingResult', videoGeneratingResult)

    const videos_to_use = high_quality

    let failureOccured = false
    for (let i = 0; i < videos_to_use.length && !failureOccured; i++) {
        const metadata = await FileUtil.getVideoMetaData(videos_to_use[i])
        // console.log(`\n\n${videos_to_use[i]}\nmetadata`, metadata, `\n${metadata.bitrate/1000}`)

        console.log('\n\ngot metadata, will proceed\n\n')

        const videoGeneratingResult = await FileUtil.generateAllRequiredVideoAssets(
            videos_to_use[i],
            'thumbs',
            'processing',
            i,
            i,
            metadata.bitrate,
            true,
        )
        // stop if we hit any errors
        if (!videoGeneratingResult) {
            failureOccured = true
            console.error('\n\nHIT AN ERROR')
        }
        console.log(`\n\n${videos_to_use[i]}\n`, metadata, videoGeneratingResult)
    }
}

// file()
// imaggaTest()
// geo()
// geoThrottleTest()
// dupTagTest()
// elevationLookup()
// mixedFileList()
// testDropboxSync()
// testParsingFileParts()
// taskTest()
video()
