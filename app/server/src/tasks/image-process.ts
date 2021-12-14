import * as Types from '@shared/declarations'
import * as TasksUtil from '../util/tasks'
import * as FileUtil from '../util/file'
import * as APIUtil from '../util/apis'
import * as DBUtil from '../util/db'
import * as Models from '../db/models'
import Logger from '../services/logging'
import * as Enums from '../../../shared/enums'

const file = async () => {
    // await TasksUtil.fileImport(1)
    await TasksUtil.processImage(1)
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
    await TasksUtil.addressLookup(1)
}

const geoThrottleTest = async () => {
    for (let i = 0; i < 10; i++) {
        APIUtil.locationIQ(42.3744547256523, -84.33708411917792)
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
    const largeThumbPath = FileUtil.thumbPath(3, 'ed601c90-7e5e-4bac-88b7-19ca478aad12', 'xl')
    const apiResult = await APIUtil.plantLookup(largeThumbPath)
    console.log(apiResult)
}
const taskTest = async () => {
    const apiResult = await TasksUtil.plantLookup(14)
    // console.log(apiResult)
}

// file()
// imaggaTest()
// geo()
// geoThrottleTest()
// dupTagTest()
// elevationLookup()
taskTest()
