import React from 'react'
import { useMutation, gql } from '@apollo/client'
import * as Types from '@shared/declarations'

const updateDropboxConnectionGQL = gql`
	mutation updateDropboxConnection($dropboxUpdateInput: DropboxUpdateInput!) {
		dropbox {
			update(dropboxUpdateInput: $dropboxUpdateInput) {
				success
				error
			}
		}
	}
`

interface IProps {
	dropboxConnection: Types.API.DropboxConnection
}

const UpdateDropboxConnection: React.FunctionComponent<IProps> = ({
	dropboxConnection,
}) => {
	const [syncPath, setSyncPath] = React.useState<string>(
		dropboxConnection?.syncPath ?? undefined,
	)
	const [syncEnabled, setSyncEnabled] = React.useState<boolean>(
		dropboxConnection?.syncEnabled ?? false,
	)

	const [
		updateDropboxConnectionMutation,
		{ error: httpError, data, loading = false },
	] = useMutation(updateDropboxConnectionGQL)

	const dropboxUpdateFailed = httpError?.message || data?.dropbox.update.error

	const isUpdateButtonDisabled =
		(dropboxConnection.syncPath === syncPath &&
			dropboxConnection.syncEnabled === syncEnabled) ||
		loading

	const disconnectHandler = async (e: React.FormEvent) => {
		e.preventDefault()
		await updateDropboxConnectionMutation({
			variables: { dropboxUpdateInput: { syncPath, syncEnabled } },
		})
	}

	return (
		<div>
			{dropboxUpdateFailed && { dropboxUpdateFailed }}
			<form>
				<input
					type="text"
					placeholder="path on dropbox to sync with"
					value={syncPath}
					onChange={(e) => setSyncPath(e.target.value)}
				/>

				<input
					type="checkbox"
					checked={syncEnabled}
					onChange={(e) => setSyncEnabled(e.target.checked)}
				/>
			</form>
			<button
				onClick={disconnectHandler}
				disabled={isUpdateButtonDisabled}
			>
				update
			</button>
		</div>
	)
}

export default UpdateDropboxConnection
