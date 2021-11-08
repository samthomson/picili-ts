import React from 'react'
import { useQuery, gql } from '@apollo/client'
import CreateDropboxConnection from './CreateDropboxConnection'
import UpdateDropboxConnection from './UpdateDropboxConnection'
import RemoveDropboxConnection from './RemoveDropboxConnection'

const dropboxConnectionQuery = gql`
	query dropboxConnection {
		dropboxConnection {
			syncPath
			syncEnabled
		}
	}
`

const DropboxConnection = () => {
	const { loading, error, data, refetch } = useQuery(dropboxConnectionQuery)

	if (loading) {
		return <>loading...</>
	}

	if (error) {
		return <>{error?.message}</>
	}

	console.log('connected', data.dropboxConnection)

	const hasDropboxConnection = data.dropboxConnection

	return (
		<div>
			<hr />
			<button type="button" onClick={() => refetch()}>
				refetch
			</button>
			<hr />
			{hasDropboxConnection && (
				<>
					<h4>dropbox is connected</h4>
					<div>
						<UpdateDropboxConnection
							dropboxConnection={data.dropboxConnection}
						/>
					</div>
					<div>
						<RemoveDropboxConnection refetch={refetch} />
					</div>
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
