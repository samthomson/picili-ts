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
    private _isStopping = false
    private _isImportingEnabled = false
    private isShuttingDown = false
    private hasNowShutDown = false
    private _tasksBeingProcessed: Models.TaskInstance[] = []

    constructor() {
        if (TaskManager._instance) {
            throw new Error('singleton TaskManager already initialized')
        }
        TaskManager._instance = this
    }

    get isStopping(): boolean {
        return this._isStopping
    }
    set isStopping(stopping: boolean) {
        this._isStopping = stopping
    }

    get isImportingEnabled() {
        return this._isImportingEnabled
    }

    get tasksBeingProcessed() {
        return this._tasksBeingProcessed
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
        this._tasksBeingProcessed = this.tasksBeingProcessed.filter(({ id }) => task.id !== id)
    }

    private async updateHowManyProcessableTasksThereAre() {
        this.howManyProcessableTasksAreThere = await DBUtil.howManyProcessableTasksAreThere(this.isStopping)
    }

    public async start(): Promise<void> {
        this._isImportingEnabled = true
        this.updateHowManyProcessableTasksThereAre()

        // todo: experiment with raising this, and later adjusting based on available resources
        const parallelization = 5
        // ffmpeg uses loads of ram, already it is limited to one thread (of CPU) but here we limit to only one ffmpeg/video task at a time. need about 1gb for one thread to run ffmpeg.
        const videoCapableThreads = 1

        Logger.info(`creating ${parallelization} workers..`)
        const workers = [...Array(parallelization).keys()].map((i) => this.work(i, i < videoCapableThreads))
        await Promise.all(workers)

        if (this.isShuttingDown) {
            Logger.info('the task processor is shutting down now and will exit.')
            this.hasNowShutDown = true
        }
    }

    private async work(threadNo: number, isVideoCapable = false): Promise<void> {
        // Logger.info(`thread:${threadNo + 1} started`)
        while (!this.isShuttingDown) {
            // get next task
            const nextTask = await DBUtil.getAndReserveNextTaskId(this._isStopping, isVideoCapable)
            // if task, process task
            if (nextTask) {
                Logger.info(`[thread:${threadNo + 1}] will now start next task: ${nextTask.id}:${nextTask.taskType}...`)
                this.addTaskBeingProcessed(nextTask)
                await TaskUtil.processTask(nextTask.id, threadNo)
                this.removeTaskBeingProcessed(nextTask)
            } else {
                Logger.info(`[thread:${threadNo + 1}] found no task, so delaying...`)
                // else, delay ten seconds
                await HelperUtil.delay(10000)
            }
            this.updateHowManyProcessableTasksThereAre()
        }
    }
}

export default TaskManager
