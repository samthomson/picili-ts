import * as TaskUtil from '../util/tasks'
import * as HelperUtil from '../util/helper'
import * as DBUtil from '../util/db'

export class TaskManager {
    public static getInstance(): TaskManager {
        return TaskManager._instance
    }

    public static _instance: TaskManager = new TaskManager()

    public howManyProcessableTasksAreThere = 0

    constructor() {
        if (TaskManager._instance) {
            throw new Error('singleton TaskManager already initialized')
        }
        TaskManager._instance = this
    }

    public async start(): Promise<void> {
        this.howManyProcessableTasksAreThere = await DBUtil.howManyProcessableTasksAreThere()

        while (this.howManyProcessableTasksAreThere > 0) {
            console.log('# processable tasks: ', this.howManyProcessableTasksAreThere)
            // process a task
            const nextTaskId = await DBUtil.getNextTaskId()
            console.log('nextTaskId: ', nextTaskId)
            await TaskUtil.processTask(nextTaskId)
        }

        // there are no tasks, but there might be soon, so let's keep checking
        if (this.howManyProcessableTasksAreThere === 0) {
            console.log('no tasks, waiting 30s')
            await HelperUtil.delay(30000)
            this.start()
        }
    }
}

export default TaskManager
