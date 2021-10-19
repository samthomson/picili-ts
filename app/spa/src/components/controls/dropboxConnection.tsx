import React from 'react'
import { Redirect, useLocation } from 'react-router-dom'

const DropboxConnection = () => {
	const search = useLocation().search
	const token = new URLSearchParams(search).get('code')

	const dropboxOAuth = () => {
		window.location.replace(`http://localhost:3501/oauth/dropbox`)
	}

	// if (!token) {
	//   return <>
	//     <p>redirecting to Dropbox OAuth</p>
	//     <Redirect to="http://localhost:3501/oauth/dropbox" />
	//   </>
	// }

	return (
		<div>
			app
			{token || 'no token'}
			<button onClick={dropboxOAuth}>dropbox oauth</button>
		</div>
	)
}

export default DropboxConnection
