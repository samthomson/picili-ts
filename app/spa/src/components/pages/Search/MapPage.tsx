import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

import SearchPageTemplate from 'src/components/pages/Search/SearchPageTemplate'
import SearchResults from 'src/components/controls/SearchResults/index'
import Map from 'src/components/controls/Map'

const MapPage: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const searchResults = ReactRedux.useSelector(Selectors.searchResults)

	const boundsChanged = (bounds: Types.API.MapBounds): void => {
		const mapQuery = {
			type: 'map',
			value: `${bounds._sw.lat},${bounds._ne.lat},${bounds._sw.lng},${bounds._ne.lng}`,
		}

		dispatch(Actions.searchQueryAdd(mapQuery))
		dispatch(Actions.attemptSearch())
	}

	return (
		<SearchPageTemplate>
			<div id="map-results-container">
				<div id="map-container">
					<Map
						results={searchResults}
						boundsChanged={boundsChanged}
					/>
				</div>
				<div id="results-container">
					<SearchResults />
				</div>
			</div>
		</SearchPageTemplate>
	)
}

export default MapPage
