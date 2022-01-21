import * as React from 'react'

import SearchPageTemplate from 'src/components/pages/Search/SearchPageTemplate'
import SearchResults from 'src/components/controls/SearchResults'

const HomePage: React.FunctionComponent = () => {
	return (
		<SearchPageTemplate>
			<SearchResults />
		</SearchPageTemplate>
	)
}

export default HomePage
