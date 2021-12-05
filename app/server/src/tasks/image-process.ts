import * as TasksUtil from '../util/tasks'
import * as FileUtil from '../util/file'

const main = async () => {
    // await TasksUtil.processImage(6)
    // corrupt test
    await TasksUtil.processImage(32)
    // await FileUtil.readExif('62a556b0-628c-402a-892c-38a335d03554', 'jpg')
}

main()
