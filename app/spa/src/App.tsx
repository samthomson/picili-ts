import React from 'react'
import { useLocation } from 'react-router-dom'

const App = () => {
	const search = useLocation().search
	const token = new URLSearchParams(search).get('code')

	const dropboxOAuth = () => {
		window.location.replace(`http://localhost:3501/oauth/dropbox`)
	}

	return (
		<div>
			app
			{token || 'no token'}
			<button onClick={dropboxOAuth}>dropbox oauth</button>
		</div>
	)
}

export default App
