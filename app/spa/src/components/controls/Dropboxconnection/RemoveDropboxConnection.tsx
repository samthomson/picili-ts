import React from 'react'
import { useMutation, gql } from '@apollo/client'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

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
	disabled: boolean
}

const RemoveDropboxConnection: React.FunctionComponent<IProps> = ({
	refetch,
	disabled,
}) => {
	const [
		disconnectDropboxConnectionMutation,
		{ error: httpError, data, loading = false },
	] = useMutation(disconnectDropboxConnectionGQL)

	const dropboxDisconnectFailed =
		httpError?.message || data?.dropbox.disconnect.error

	const disconnectHandler = async (e: React.FormEvent) => {
		e.preventDefault()
		if (
			confirm(
				'are you sure you want to disconnect dropbox and stop syncing with files there?',
			)
		) {
			await disconnectDropboxConnectionMutation()
			// run refetch, so parent component gets current dropbox connection status and knows what ui to show (create or update/disconnect)
			refetch()
		}
	}

	return (
		<div>
			{loading && <>loading...</>}
			{dropboxDisconnectFailed && { dropboxDisconnectFailed }}
			<MantineCore.Button
				onClick={disconnectHandler}
				disabled={loading || disabled}
				id="dropbox-connection-remove-button"
				leftIcon={<Icons.IconPlugConnectedX size="14" />}
				variant="subtle"
				color="red"
				radius="md"
			>
				Disconnect dropbox
			</MantineCore.Button>
		</div>
	)
}

export default RemoveDropboxConnection
