import React from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, gql } from '@apollo/client'

const createDropboxConnectionGQL = gql`
	mutation createDropboxConnection(
		$dropboxConnectInput: DropboxConnectInput!
	) {
		dropbox {
			connect(dropboxConnectInput: $dropboxConnectInput) {
				success
				error
			}
		}
	}
`

const CreateDropboxConnection = () => {
	const search = useLocation().search
	const token = new URLSearchParams(search).get('code')
	const [connectingDropboxAccount, setConnectingDropboxAccount] =
		React.useState<boolean>(false)

	const [
		createDropboxConnectionMutation,
		{ error: httpError, data, loading = false },
	] = useMutation(createDropboxConnectionGQL)

	React.useEffect(() => {
		if (token) {
			// there was a token in the url, so we'll call the mutation to set it to the account
			createDropboxConnectionMutation({
				variables: {
					dropboxConnectInput: {
						token,
					},
				},
			})
		}
	}, [token])

	React.useEffect(() => {
		setConnectingDropboxAccount(loading)
	}, [loading])

	const dropboxConnectFailed =
		httpError?.message || data?.dropbox.connect.error

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
			{dropboxConnectFailed && (
				<div className="ui red segment">
					Error:&nbsp;
					<strong>{dropboxConnectFailed}</strong>
				</div>
			)}
			<button onClick={dropboxOAuth}>
				link dropbox account to picili
			</button>
		</div>
	)
}

export default CreateDropboxConnection
