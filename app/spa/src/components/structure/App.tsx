import React from 'react'
import * as ReactRedux from 'react-redux'
import { ErrorBoundary } from 'react-error-boundary'

import * as Selectors from 'src/redux/selectors'
import CheckToken from 'src/components/structure/CheckToken'
import AppRouter from 'src/components/structure/AppRouter'
import ErrorBoundaryFallback from 'src/components/partials/ErrorBoundaryFallback'

const App: React.FunctionComponent = () => {
	const userAuthStatusIsKnown = ReactRedux.useSelector(
		Selectors.userAuthStatusIsKnown,
	)

	return (
		<ErrorBoundary
			FallbackComponent={ErrorBoundaryFallback}
			onReset={() => {
				window.location.reload()
			}}
		>
			{/*
			// if we don't know if the user is logged in already, first check their token

			// only then do we load routes, so that we can link in to pages requiring auth without the user getting bounced to login and then / after the token was checked
			*/}
			{userAuthStatusIsKnown ? <AppRouter /> : <CheckToken />}
		</ErrorBoundary>
	)
}

export default App
