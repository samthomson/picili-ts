import * as TaskUtil from '../util/tasks'
import * as HelperUtil from '../util/helper'
import * as DBUtil from '../util/db'
import * as Models from '../db/models'
import Logger from '../services/logging'

export class TaskManager {
    public static getInstance(): TaskManager {
        return TaskManager._instance
    }

    public static _instance: TaskManager = new TaskManager()

    public howManyProcessableTasksAreThere = 0
    private isStopping = false
    private isImportingEnabled = false
    private isShuttingDown = false
    private hasNowShutDown = false
    private tasksBeingProcessed: Models.TaskInstance[] = []

    constructor() {
        if (TaskManager._instance) {
            throw new Error('singleton TaskManager already initialized')
        }
        TaskManager._instance = this
    }

    public getStopping() {
        return this.isStopping
    }
    public setStopping(stopping: boolean) {
        this.isStopping = stopping
    }

    public getImportingEnabled() {
        return this.isImportingEnabled
    }

    public getTasksBeingProcessed(): Models.TaskInstance[] {
        return this.tasksBeingProcessed
    }

    public async safelyShutDown(): Promise<boolean> {
        // starts shutting down and keeps checking if that has completed until it has
        this.isShuttingDown = true
        while (!this.hasNowShutDown) {
            await HelperUtil.delay(100)
        }
        return true
    }

    public addTaskBeingProcessed(task: Models.TaskInstance) {
        this.tasksBeingProcessed.push(task)
    }
    public removeTaskBeingProcessed(task: Models.TaskInstance) {
        this.tasksBeingProcessed = this.tasksBeingProcessed.filter(({ id }) => task.id !== id)
    }

    public async start(): Promise<void> {
        this.isImportingEnabled = true
        this.howManyProcessableTasksAreThere = await DBUtil.howManyProcessableTasksAreThere(this.isStopping)

        while (this.howManyProcessableTasksAreThere > 0 && !this.isShuttingDown) {
            // process a task
            const nextTask = await DBUtil.getNextTaskId(this.isStopping)

            if (!nextTask) {
                Logger.warn('no task received for next task')
            }
            if (nextTask) {
                this.addTaskBeingProcessed(nextTask)
                await TaskUtil.processTask(nextTask.id)
                this.removeTaskBeingProcessed(nextTask)
            }

            // refresh available task count
            this.howManyProcessableTasksAreThere = await DBUtil.howManyProcessableTasksAreThere(this.isStopping)
        }

        // there are no tasks, but there might be soon, so let's keep checking
        if (this.howManyProcessableTasksAreThere === 0 && !this.isShuttingDown) {
            Logger.info('no tasks to process, delaying...')
            await HelperUtil.delay(10000)
        }

        // set above in `safelyShutDown` method
        if (this.isShuttingDown) {
            Logger.info('the task processor is shutting down now and will exit.')
            this.hasNowShutDown = true
        } else {
            // go again
            await this.start()
        }
    }
}

export default TaskManager
