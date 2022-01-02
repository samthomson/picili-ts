import { TaskManager } from '../services/TaskManager'

const taskManager = TaskManager.getInstance()

const main = async () => {
    // register a process to gracefully shutdown
    process.on('SIGINT', async () => {
        console.info('\nSIGINT received, stopping task manager script...')
        const safelyShutDown = await taskManager.safelyShutDown()

        console.info('...finished shutting down', String(safelyShutDown))
        process.exit(0)
    })

    console.info('start task manager')
    taskManager.start()
}
main()
