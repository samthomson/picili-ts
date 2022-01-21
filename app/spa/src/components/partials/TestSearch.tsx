import * as React from 'react'
import SearchResults from 'src/components/controls/SearchResults'

import SearchInput from 'src/components/controls/SearchInput'

const TestSearch: React.FunctionComponent = () => {
	return (
		<React.Fragment>
			<h2>search query</h2>
			<SearchInput />

			<h2>search results</h2>
			<SearchResults />
		</React.Fragment>
	)
}

export default TestSearch
