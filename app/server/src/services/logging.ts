import * as appRoot from 'app-root-path'
import * as winston from 'winston'
import 'winston-daily-rotate-file'

const myFormat = winston.format.printf(({ timestamp, level, message, ...other }) => {
    return `${timestamp} ${level} ${String(message)} ${other ? JSON.stringify(other) : ''}`
})

// define the custom settings for each transport (file, console)
const commonLoggingOptions = {
    handleExceptions: true,
    handleRejections: true, // doesn't work
    format: winston.format.combine(winston.format.timestamp(), winston.format.splat(), myFormat),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: true,
}

const options = {
    fileAll: {
        level: process.env.LOG_LEVEL || 'info',
        // write logs locally
        filename: `${appRoot}/logs/server-log.json`,
        ...commonLoggingOptions,
    },
    console: {
        level: process.env.LOG_LEVEL || 'silly',
        handleExceptions: true,
        handleRejections: true,
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    },
}

// instantiate a new Winston Logger with the settings defined above
const logger = winston.createLogger({
    transports: [
        // output logs to disk
        new winston.transports.DailyRotateFile(options.fileAll),
    ],
    exitOnError: false, // do not exit on handled exceptions
})

if (process.env.NODE_ENV === 'development') {
    // output to the console too
    logger.add(new winston.transports.Console(options.console))
}

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    write: (message: string) => {
        // use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message)
    },
}

// have this since handling rejections isn't working with winston
process.on('unhandledRejection', (reason) => {
    throw reason
})

export default logger
