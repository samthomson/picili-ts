import * as React from 'react'

import SearchPageTemplate from 'src/components/pages/Search/SearchPageTemplate'
import SearchResults from 'src/components/controls/SearchResults/index'

const HomePage: React.FunctionComponent = () => {
	return (
		<SearchPageTemplate>
			<SearchResults displayJustified={true} />
		</SearchPageTemplate>
	)
}

export default HomePage
