import { TaskManager } from '../services/TaskManager'

const taskManager = TaskManager.getInstance()

const main = async () => {
    console.log('start task manager')
    taskManager.start()
}
main()
