import * as HelperUtil from './helper'
import * as DBUtil from './db'
import * as DropboxUtil from './dropbox'
import * as Types from '@shared/declarations'
import moment from 'moment'
import Logger from '../services/logging'
import * as Enums from '../../../shared/enums'

export const processTask = async (taskId: number) => {
    console.log('processTask: ', taskId)
    // start timing
    const startTime = moment()
    let success = undefined
    const task = await DBUtil.getTask(taskId)

    try {
        // 'start' task (inc update its from time)
        await DBUtil.startProcessingATask(task)

        switch (task.taskType) {
            case Enums.TaskType.DROPBOX_SYNC:
                // todo: run sync code
                success = await DropboxUtil.checkForDropboxChanges(task.relatedPiciliFileId)
                console.log('processTask : ', success)

                break
            default:
                Logger.warning('unknown task type', task.taskType)
        }

        // finish a task (inc reschedule dropbox sync)
        await finishATask()
    } catch (err) {
        Logger.error('error processing task: ', err)
        success = false
    }
    // end timing
    const endTime = moment()
    const milliseconds = endTime.diff(startTime)

    // todo: log task processing
    await DBUtil.createTaskProcessedLog({
        taskType: task.taskType,
        processingTime: milliseconds,
        success: success,
    })
}

// export const createTask = async (createTaskInput: Types.Core.Inputs.CreateTaskInput): Promise<void> => {

// }

export const finishATask = async (): Promise<void> => {
    // todo: update other tasks dependent on this one
    // todo: delete/remove task
    // todo: if dropbox sync, requeue
}
