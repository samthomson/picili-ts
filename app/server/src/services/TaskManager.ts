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
    private isStopping = false
    private isImportingEnabled = false
    private isShuttingDown = false
    private hasNowShutDown = false
    private tasksBeingProcessed: number[] = []

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

    public getTasksBeingProcessed(): number[] {
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

    public addTaskBeingProcessed(taskId: number) {
        this.tasksBeingProcessed.push(taskId)
    }
    public removeTaskBeingProcessed(taskId: number) {
        this.tasksBeingProcessed = this.tasksBeingProcessed.filter((task) => task !== taskId)
    }

    public async start(): Promise<void> {
        this.isImportingEnabled = true
        this.howManyProcessableTasksAreThere = await DBUtil.howManyProcessableTasksAreThere(this.isStopping)

        while (this.howManyProcessableTasksAreThere > 0 && !this.isShuttingDown) {
            // process a task
            const nextTaskId = await DBUtil.getNextTaskId(this.isStopping)

            if (!nextTaskId) {
                Logger.warn('no task id received for next task')
            }
            if (nextTaskId) {
                // todo: put whole task in there and expose in API
                this.addTaskBeingProcessed(nextTaskId)
                await TaskUtil.processTask(nextTaskId)
                this.removeTaskBeingProcessed(nextTaskId)
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
