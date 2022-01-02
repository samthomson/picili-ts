import React from 'react'
import { useQuery, gql } from '@apollo/client'
import CreateDropboxConnection from './CreateDropboxConnection'
import UpdateDropboxConnection from './UpdateDropboxConnection'
import RemoveDropboxConnection from './RemoveDropboxConnection'
import ImportState from './ImportState'

const dropboxConnectionQuery = gql`
	query dropboxConnection {
		dropboxConnection {
			syncPath
			syncEnabled
		}
		taskProcessor {
			stopping
			isImportingEnabled
			currentTasksBeingProcessed {
				id
				taskType
			}
		}
	}
`

const DropboxConnection: React.FunctionComponent = () => {
	const { loading, error, data, refetch } = useQuery(dropboxConnectionQuery, {
		fetchPolicy: 'no-cache',
	})

	if (loading) {
		return <>loading...</>
	}

	if (error) {
		return <>{error?.message}</>
	}

	const hasDropboxConnection = data.dropboxConnection
	const isBusyImporting = data.taskProcessor.currentTasksBeingProcessed > 0

	return (
		<div>
			{hasDropboxConnection && (
				<>
					<h4>dropbox is connected</h4>
					<div>
						<UpdateDropboxConnection
							dropboxConnection={data.dropboxConnection}
							disabled={isBusyImporting}
						/>
					</div>
					<div>
						<RemoveDropboxConnection
							refetch={refetch}
							disabled={isBusyImporting}
						/>
					</div>
					<ImportState
						stopping={data.taskProcessor.stopping}
						isImportingEnabled={isBusyImporting}
						refetch={refetch}
					/>
				</>
			)}
			{!hasDropboxConnection && (
				<>
					<h4>dropbox not connected</h4>
					<div>
						connect? <CreateDropboxConnection refetch={refetch} />
					</div>
				</>
			)}
		</div>
	)
}

export default DropboxConnection
