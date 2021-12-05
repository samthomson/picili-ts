import * as TasksUtil from '../util/tasks'
import * as FileUtil from '../util/file'

const main = async () => {
    await TasksUtil.processImage(6)
    // corrupt test
    // await TasksUtil.processImage(32)
    // await FileUtil.readExif('62a556b0-628c-402a-892c-38a335d03554', 'jpg')

    // const isCorrupt = await FileUtil.isCorrupt('db1264b4-5406-40de-8212-01fc2d11cc27', 'jpg')
    // console.log('should be corrupt', { isCorrupt })

    // const isNotCorrupt = await FileUtil.isCorrupt('7eb3e4c0-9ed3-47e5-91ca-db01794d68bb', 'jpg')
    // console.log({ 'normal image': isNotCorrupt })
}

main()
