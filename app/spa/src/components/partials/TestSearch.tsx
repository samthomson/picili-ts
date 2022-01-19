import * as React from 'react'
import TestSearchResults from 'src/components/controls/TestSearchResults'

import SearchInput from 'src/components/controls/SearchInput'

const TestSearch: React.FunctionComponent = () => {
	return (
		<React.Fragment>
			<h2>search query</h2>
			<SearchInput />

			<h2>search results</h2>
			<TestSearchResults />
		</React.Fragment>
	)
}

export default TestSearch
