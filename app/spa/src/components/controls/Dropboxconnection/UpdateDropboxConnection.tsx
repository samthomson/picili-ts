import React from 'react'
import { useMutation, gql } from '@apollo/client'
import * as Types from '@shared/declarations'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

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
	dropboxConnection: Types.API.DropboxConnectionEditableAttributes
	disabled: boolean
}

const UpdateDropboxConnection: React.FunctionComponent<IProps> = ({
	dropboxConnection,
	disabled,
}) => {
	const [lastSavedConnection, setLastSavedConnection] =
		React.useState<Types.API.DropboxConnectionEditableAttributes>(
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
			<p>
				Enter the path (with leading slash) within your dropbox folder
				of the directory you&apos;d like picili to sync with.
			</p>
			<p>Optionally toggle syncing on/off with the checkbox.</p>
			<p>Save any changes by clicking &apos;Update&apos;.</p>
			<form id="dropbox-connection-form">
				<div id="input-wrapper">
					<MantineCore.Input
						type="text"
						placeholder="eg `/my-picture-folder`"
						value={syncPath ?? ''}
						onChange={(e: React.FormEvent<HTMLInputElement>) =>
							setSyncPath(e.currentTarget.value)
						}
						disabled={disabled}
						icon={<Icons.IconFolder size={16} />}
					/>
				</div>
				<div id="checkbox-button-wrapper">
					<MantineCore.Checkbox
						checked={syncEnabled}
						onChange={(e: React.FormEvent<HTMLInputElement>) =>
							setSyncEnabled(e.currentTarget.checked)
						}
						disabled={disabled}
						id="dropbox-connection-checkbox"
						// size="md"
						label="Syncing Enabled"
					/>
					<MantineCore.Button
						onClick={disconnectHandler}
						disabled={isUpdateButtonDisabled}
					>
						Update
					</MantineCore.Button>
				</div>
			</form>
			{dropboxConnection.invalidPathDetected && (
				<>
					<div>
						[invalid dropbox path - syncing is disabled and will
						auto resume once fixed]
					</div>
				</>
			)}
		</div>
	)
}

export default UpdateDropboxConnection
