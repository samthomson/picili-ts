import * as React from 'react'

import Register from 'src/components/controls/Register'
import PageTemplate from 'src/components/pages/PageTemplate'

const RegisterPage: React.FunctionComponent = () => {
	return (
		<PageTemplate>
			<div>
				<Register />
			</div>
		</PageTemplate>
	)
}

export default RegisterPage
