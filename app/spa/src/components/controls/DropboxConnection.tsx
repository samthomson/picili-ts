import React from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, gql } from '@apollo/client'

const dropboxUpdateQuery = gql`
	mutation dropboxUpdate($dropboxUpdateInput: DropboxUpdateInput!) {
		dropbox {
			update(dropboxUpdateInput: $dropboxUpdateInput) {
				success
				error
			}
		}
	}
`

const DropboxConnection = () => {
	const search = useLocation().search
	const token = new URLSearchParams(search).get('code')
	const [connectingDropboxAccount, setConnectingDropboxAccount] =
		React.useState<boolean>(false)

	const [
		dropboxConnectionMutation,
		{ error: httpError, data, loading = false },
	] = useMutation(dropboxUpdateQuery)

	React.useEffect(() => {
		if (token) {
			// there was a token in the url, so we'll call the mutation to set it to the account
			dropboxConnectionMutation({
				variables: {
					dropboxUpdateInput: {
						token,
					},
				},
			})
		}
	}, [token])

	React.useEffect(() => {
		setConnectingDropboxAccount(loading)
	}, [loading])

	const dropboxUpdateFailed = httpError?.message || data?.dropbox.update.error

	const dropboxOAuth = () => {
		window.location.replace(`http://localhost:3501/oauth/dropbox`)
	}

	return (
		<div>
			{token && (
				<>
					{connectingDropboxAccount && (
						<p>connecting your dropbox account to picili...</p>
					)}
				</>
			)}
			{dropboxUpdateFailed && (
				<div className="ui red segment">
					Error:&nbsp;
					<strong>{dropboxUpdateFailed}</strong>
				</div>
			)}
			<button onClick={dropboxOAuth}>
				link dropbox account to picili
			</button>
		</div>
	)
}

export default DropboxConnection
