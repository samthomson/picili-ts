import React from 'react'
import { useLocation, useHistory } from 'react-router-dom'
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
interface IProps {
	refetch: () => void
}

const CreateDropboxConnection: React.FunctionComponent<IProps> = ({
	refetch,
}) => {
	const search = useLocation().search
	const history = useHistory()
	const token = new URLSearchParams(search).get('code')
	const [connectingDropboxAccount, setConnectingDropboxAccount] =
		React.useState<boolean>(false)

	const [
		createDropboxConnectionMutation,
		{ error: httpError, data, loading = false },
	] = useMutation(createDropboxConnectionGQL)

	React.useEffect(() => {
		;(async () => {
			if (token) {
				// there was a token in the url, so we'll call the mutation to set it to the account
				await createDropboxConnectionMutation({
					variables: {
						dropboxConnectInput: {
							token,
						},
					},
				})
				// remove the token/code from the URL so that a reconnection is not triggered accidentally
				history.push(window.location.pathname)
				await refetch()
			}
		})()
	}, [token])

	React.useEffect(() => {
		setConnectingDropboxAccount(loading)
	}, [loading])

	const dropboxConnectFailed =
		httpError?.message || data?.dropbox.connect.error

	const dropboxOAuth = () => {
		// todo: make this protocol/domain/port agnostic
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
