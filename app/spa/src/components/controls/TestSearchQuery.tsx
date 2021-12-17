import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Selectors from 'src/redux/selectors'

const TestSearchQuery: React.FunctionComponent = () => {
	const searchQuery = ReactRedux.useSelector(Selectors.searchQuery)

	return <React.Fragment>{JSON.stringify(searchQuery)}</React.Fragment>
}

export default TestSearchQuery
