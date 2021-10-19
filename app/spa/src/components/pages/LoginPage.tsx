import * as React from 'react'

import Login from 'src/components/controls/Login'
import PageTemplate from 'src/components/pages/PageTemplate'

const LoginPage: React.FunctionComponent = () => {
	return (
		<PageTemplate>
			<div>
				<Login />
			</div>
		</PageTemplate>
	)
}

export default LoginPage
