import React from 'react'
import { useMutation, gql } from '@apollo/client'
import * as Types from '@shared/declarations'

const updateDropboxConnectionGQL = gql`
	mutation updateDropboxConnection($dropboxUpdateInput: DropboxUpdateInput!) {
		dropbox {
			update(dropboxUpdateInput: $dropboxUpdateInput) {
				success
				error
				dropboxConnection {
					syncPath
					syncEnabled
					invalidPathDetected
				}
			}
		}
	}
`

interface IProps {
	dropboxConnection: Types.API.DropboxConnection
	disabled: boolean
}

const UpdateDropboxConnection: React.FunctionComponent<IProps> = ({
	dropboxConnection,
	disabled,
}) => {
	const [lastSavedConnection, setLastSavedConnection] =
		React.useState<Types.API.DropboxConnection>(
			dropboxConnection ?? undefined,
		)
	const [syncPath, setSyncPath] = React.useState<string>(
		dropboxConnection?.syncPath ?? '',
	)
	const [syncEnabled, setSyncEnabled] = React.useState<boolean>(
		dropboxConnection?.syncEnabled ?? true,
	)

	const [
		updateDropboxConnectionMutation,
		{ error: httpError, data, loading = false },
	] = useMutation(updateDropboxConnectionGQL)

	React.useEffect(() => {
		if (data?.dropbox.update.dropboxConnection) {
			setLastSavedConnection(data.dropbox.update.dropboxConnection)
		}
	}, [data])

	const dropboxUpdateFailed = httpError?.message || data?.dropbox.update.error

	const isUpdateButtonDisabled =
		(lastSavedConnection.syncPath === syncPath &&
			lastSavedConnection.syncEnabled === syncEnabled) ||
		loading ||
		disabled

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
					value={syncPath ?? ''}
					onChange={(e) => setSyncPath(e.target.value)}
					disabled={disabled}
				/>

				<input
					type="checkbox"
					checked={syncEnabled}
					onChange={(e) => setSyncEnabled(e.target.checked)}
					disabled={disabled}
				/>
			</form>
			{dropboxConnection.invalidPathDetected && (
				<>
					<div>
						[invalid dropbox path - syncing is disabled and will
						auto resume once fixed]
					</div>
				</>
			)}
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
