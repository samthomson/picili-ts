import * as Sequelize from 'sequelize'
import Database from '../db/connection'

const clean = async () => {
    console.log('cleaning')

    const queries = [
        'TRUNCATE `dropbox_files`;',
        'TRUNCATE `files`;',
        'TRUNCATE `sync_logs`;',
        'TRUNCATE `tags`;',
        'TRUNCATE `task_processed_logs`;',
        "DELETE FROM `tasks` WHERE task_type != 'DROPBOX_SYNC';",
    ]

    for (let i = 0; i < queries.length; i++) {
        const result = await Database.query(queries[i], {
            // type: Sequelize.QueryTypes.SELECT,
        })
    }
}

clean()
