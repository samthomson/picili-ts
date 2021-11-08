import React from 'react'
import { useMutation, gql } from '@apollo/client'

const disconnectDropboxConnectionGQL = gql`
	mutation disconnectDropboxConnection {
		dropbox {
			disconnect {
				success
				error
			}
		}
	}
`
interface IProps {
	refetch: () => void
}

const RemoveDropboxConnection: React.FunctionComponent<IProps> = ({
	refetch,
}) => {
	const [
		disconnectDropboxConnectionMutation,
		{ error: httpError, data, loading = false },
	] = useMutation(disconnectDropboxConnectionGQL)

	const dropboxDisconnectFailed =
		httpError?.message || data?.dropbox.disconnect.error

	const disconnectHandler = async (e: React.FormEvent) => {
		e.preventDefault()
		await disconnectDropboxConnectionMutation()
		// run refetch, so parent component gets current dropbox connection status and knows what ui to show (create or update/disconnect)
		refetch()
	}

	return (
		<div>
			{loading && <>loading...</>}
			{dropboxDisconnectFailed && { dropboxDisconnectFailed }}
			<button onClick={disconnectHandler} disabled={loading}>
				disconnect
			</button>
		</div>
	)
}

export default RemoveDropboxConnection
