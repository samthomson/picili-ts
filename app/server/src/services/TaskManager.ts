import * as TaskUtil from '../util/tasks'
import * as HelperUtil from '../util/helper'
import * as DBUtil from '../util/db'
import Logger from '../services/logging'

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
            // process a task
            const nextTaskId = await DBUtil.getNextTaskId()

            if (!nextTaskId) {
                Logger.warn('no task id received for next task')
            }
            if (nextTaskId) {
                Logger.info('nextTaskId: ', nextTaskId)
                await TaskUtil.processTask(nextTaskId)
            }

            // refresh available task count
            this.howManyProcessableTasksAreThere = await DBUtil.howManyProcessableTasksAreThere()
        }

        // there are no tasks, but there might be soon, so let's keep checking
        if (this.howManyProcessableTasksAreThere === 0) {
            Logger.info('no tasks, waiting 10s')
            await HelperUtil.delay(10000)
            await this.start()
        }
    }
}

export default TaskManager
