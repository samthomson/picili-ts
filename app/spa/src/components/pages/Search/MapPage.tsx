import * as React from 'react'

import SearchPageTemplate from 'src/components/pages/Search/SearchPageTemplate'
import SearchResults from 'src/components/controls/SearchResults'

const MapPage: React.FunctionComponent = () => {
	return (
		<SearchPageTemplate>
			<div id="map-results-container">
				{/* <div id="map-results">
					[map]<div id="map-container">[map container]</div>
				</div> */}
				<div id="map-container">[map container]</div>
				<div id="results-container">
					<SearchResults />
				</div>
			</div>
		</SearchPageTemplate>
	)
}

export default MapPage
