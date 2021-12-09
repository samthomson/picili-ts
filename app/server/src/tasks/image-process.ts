import * as TasksUtil from '../util/tasks'
import * as FileUtil from '../util/file'
import Logger from '../services/logging'

const file = async () => {
    // await TasksUtil.processImage(6)
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

const imaggaTest = async () => {
    // await TasksUtil.subjectDetection(25)
    await TasksUtil.processTask(606)
}

// file()
imaggaTest()
