import * as React from 'react'

import SearchPageTemplate from 'src/components/pages/Search/SearchPageTemplate'
import TestSearch from 'src/components/partials/TestSearch'

const HomePage: React.FunctionComponent = () => {
	return (
		<SearchPageTemplate>
			[home page]
			<TestSearch />
		</SearchPageTemplate>
	)
}

export default HomePage
