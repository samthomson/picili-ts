import React from 'react'
import * as ReactRedux from 'react-redux'

import * as Selectors from 'src/redux/selectors'
import CheckToken from 'src/components/structure/CheckToken'
import AppRouter from 'src/components/structure/AppRouter'

const App = () => {
	const userAuthStatusIsKnown = ReactRedux.useSelector(
		Selectors.userAuthStatusIsKnown,
	)

	if (!userAuthStatusIsKnown) {
		// if we don't know if the user is logged in already, first check their token
		return <CheckToken />
	} else {
		// only then do we load routes, so that we can link in to pages requiring auth without the user getting bounced to login and then / after the token was checked
		return <AppRouter />
	}
}

export default App
