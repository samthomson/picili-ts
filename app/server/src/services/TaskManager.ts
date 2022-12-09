import moment from 'moment'

import * as TaskUtil from '../util/tasks'
import * as HelperUtil from '../util/helper'
import * as DBUtil from '../util/db'
import * as Models from '../db/models'
import Logger from '../services/logging'

export class TaskProcessor {
    threadNo: number
    isVideoCapable: boolean
    currentTaskBeingProcessed: Models.TaskInstance | undefined
    callBackToUpdateHowManyProcessableTasksThereAre: () => void

    private _isStopping = false
    private _isShuttingDown = false

    public timeLastStartedATask: string | undefined
    public timeLastFinishedATask: string | undefined

    constructor(threadNo: number, callBackToUpdateHowManyProcessableTasksThereAre, isVideoCapable = false) {
        this.threadNo = threadNo
        this.isVideoCapable = isVideoCapable
        this.callBackToUpdateHowManyProcessableTasksThereAre = callBackToUpdateHowManyProcessableTasksThereAre
    }

    get isStopping(): boolean {
        return this._isStopping
    }
    set isStopping(stopping: boolean) {
        this._isStopping = stopping
    }

    get isShuttingDown(): boolean {
        return this._isShuttingDown
    }
    set isShuttingDown(shuttingDown: boolean) {
        this._isShuttingDown = shuttingDown
    }

    public async work(): Promise<void> {
        // Logger.info(`thread:${threadNo + 1} started`)
        while (!this.isShuttingDown) {
            // get next task
            const nextTask = await DBUtil.getAndReserveNextTaskId(this._isStopping, this.isVideoCapable)
            // if task, process task
            if (nextTask) {
                Logger.info(
                    `[thread:${this.threadNo + 1}] will now start next task: ${nextTask.id}:${nextTask.taskType}...`,
                )
                this.currentTaskBeingProcessed = nextTask
                this.timeLastStartedATask = moment().toISOString()
                await TaskUtil.processTask(nextTask.id, this.threadNo)
                this.currentTaskBeingProcessed = undefined
                this.timeLastFinishedATask = moment().toISOString()
            } else {
                Logger.info(`[thread:${this.threadNo + 1}] found no task, so delaying...`)
                // else, delay ten seconds
                await HelperUtil.delay(10000)
            }
            this.callBackToUpdateHowManyProcessableTasksThereAre()
        }
    }
}

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
    private workers: TaskProcessor[] = []

    constructor() {
        if (TaskManager._instance) {
            throw new Error('singleton TaskManager already initialized')
        }
        TaskManager._instance = this
    }

    get isStopping(): boolean {
        return this._isStopping
    }
    setIsStopping(stopping: boolean) {
        this._isStopping = stopping
        // tell each task to stop (or - to not continue after their current task)
        this.workers.map((worker) => (worker.isStopping = stopping))
    }

    get isImportingEnabled() {
        return this._isImportingEnabled
    }

    getWorkers() {
        return this.workers
    }

    public async safelyShutDown(): Promise<boolean> {
        // starts shutting down and keeps checking if that has completed until it has
        this.isShuttingDown = true
        this.workers.map((worker) => (worker.isShuttingDown = true))
        while (!this.hasNowShutDown) {
            await HelperUtil.delay(100)
        }
        return true
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
        for (let i = 0; i < parallelization; i++) {
            this.workers.push(
                new TaskProcessor(i + 1, this.updateHowManyProcessableTasksThereAre, i < videoCapableThreads),
            )
        }
        const workersWork = this.workers.map((worker) => worker.work())
        await Promise.all(workersWork)

        if (this.isShuttingDown) {
            Logger.info('the task processor is shutting down now and will exit.')
            this.hasNowShutDown = true
        }
    }
}

export default TaskManager
