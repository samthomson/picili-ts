import React from 'react'
import { useQuery, gql } from '@apollo/client'
import CreateDropboxConnection from './CreateDropboxConnection'

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

	console.log(data)
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
					<p>update</p>
					<p>disconnect?</p>
				</>
			)}
			{!hasDropboxConnection && (
				<>
					<h4>dropbox not connected</h4>
					<p>
						connect? <CreateDropboxConnection />
					</p>
				</>
			)}
		</div>
	)
}

export default DropboxConnection
