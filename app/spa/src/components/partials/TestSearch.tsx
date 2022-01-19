import * as React from 'react'
import TestSearchQueryModifiers from 'src/components/controls/TestSearchQueryModifiers'
import TestSearchResults from 'src/components/controls/TestSearchResults'

import SearchInput from 'src/components/controls/SearchInput'

const TestSearch: React.FunctionComponent = () => {
	return (
		<React.Fragment>
			<h2>search query</h2>
			<SearchInput />
			<TestSearchQueryModifiers />

			<h2>search results</h2>
			<TestSearchResults />
		</React.Fragment>
	)
}

export default TestSearch
