import React from 'react'
import { useQuery, gql } from '@apollo/client'
import * as MantineCore from '@mantine/core'

import * as Types from '@shared/declarations'
import CreateDropboxConnection from './CreateDropboxConnection'
import UpdateDropboxConnection from './UpdateDropboxConnection'
import RemoveDropboxConnection from './RemoveDropboxConnection'
import ImportState from './ImportState'

const dropboxConnectionQuery = gql`
	query dropboxConnection {
		dropboxConnection {
			syncPath
			syncEnabled
			invalidPathDetected
		}
		taskProcessor {
			stopping
			isImportingEnabled
			workers {
				currentTaskBeingProcessed {
					id
					taskType
				}
			}
		}
	}
`

const DropboxConnection: React.FunctionComponent = () => {
	const { loading, error, data, refetch } = useQuery(dropboxConnectionQuery, {
		fetchPolicy: 'no-cache',
	})

	if (loading) {
		return (
			<MantineCore.LoadingOverlay
				visible={true}
				overlayBlur={2}
				loaderProps={{ color: 'maroon' }}
			/>
		)
	}

	if (error) {
		return <>{error?.message}</>
	}

	const hasDropboxConnection = data.dropboxConnection
	const taskProcessor: Types.API.TaskProcessor = data.taskProcessor

	const isBusyImporting =
		(taskProcessor.workers?.filter(
			(worker) => !!worker?.currentTaskBeingProcessed,
		).length ?? 0) > 0

	return (
		<div>
			{hasDropboxConnection && (
				<>
					<h3 className="admin-page-title">Dropbox is connected</h3>
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
					<h3 className="admin-page-title">Dropbox not connected</h3>
					<div>
						<CreateDropboxConnection refetch={refetch} />
					</div>
				</>
			)}
		</div>
	)
}

export default DropboxConnection
