import * as fs from 'fs'
import * as path from 'path'
import * as Sequelize from 'sequelize'
import DBConnection from './connection'
import * as Database from './connection'

import Logger from '../services/logging'

const { MYSQL_DATABASE, MYSQL_DATABASE_TESTING, NODE_ENV } = process.env

const migrate = async () => {
    // ensure testing db exists
    const sDBToCreate = NODE_ENV === 'testing' ? MYSQL_DATABASE_TESTING : MYSQL_DATABASE
    const sRaw = `CREATE DATABASE IF NOT EXISTS \`${sDBToCreate}\`;`
    // use the blank connection params initially - as there may not be a db yet
    const mysqlServer = await Database.blankConnection()
    await mysqlServer.query(sRaw)
    await mysqlServer.close()

    // create table if not exist - migrations
    // do not change this models schema (it will break things, since the migrations table doesn't have a migration file itself)
    const Migration = await DBConnection.define(
        'migrations',
        {
            filename: {
                type: Sequelize.STRING,
            },
        },
        {
            timestamps: true,
            underscored: true,
        },
    )

    await Migration.sync()

    // fetch all previously run migrations
    const migrationsRows = await Migration.findAll()
    // @ts-ignore
    const pastMigrationFileNames = migrationsRows.map((migration) => migration.filename)
    Logger.info('past migrations', pastMigrationFileNames)

    // read list of migration files that should be run
    // get path of file to import
    const sImportDir: string = path.resolve(path.dirname(__filename), 'migrations')
    let asFiles: string[] = fs.readdirSync(sImportDir)
    // only sql files
    asFiles = asFiles.filter((sPath) => sPath.endsWith('.sql'))
    // run in order
    asFiles.sort()

    if (asFiles.length < 1) {
        Logger.info('no migrations found')
        return
    }

    // compare which have and have not been run
    const newMigrations: string[] = asFiles.filter((x) => !pastMigrationFileNames.includes(x))
    Logger.info(`${newMigrations.length} new migrations`, newMigrations)

    // run those that have not against the db connection
    for (const sPath of newMigrations) {
        const sRawPath = path.resolve(path.dirname(__filename), 'migrations', sPath)
        const sRawQuery = fs.readFileSync(sRawPath).toString()
        await DBConnection.query(sRawQuery)

        await Migration.build({
            filename: sPath,
        }).save()
    }

    await Database.disconnect()
}

migrate()
