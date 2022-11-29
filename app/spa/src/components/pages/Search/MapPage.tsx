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

	const searchResultGeoAggregations = ReactRedux.useSelector(
		Selectors.searchResultGeoAggregations,
	)

	const boundsChanged = (
		bounds: Types.Core.MapBounds,
		zoom: number,
	): void => {
		const mapQuery = {
			type: 'map',
			value: `${bounds._sw.lat},${bounds._ne.lat},${bounds._sw.lng},${bounds._ne.lng},${zoom}`,
		}

		dispatch(Actions.searchQueryAdd(mapQuery))
		dispatch(Actions.attemptSearch(true))
	}

	return (
		<SearchPageTemplate>
			<div id="map-results-container">
				<div id="map-container">
					<Map
						searchResultClusters={
							searchResultGeoAggregations?.clusters ?? []
						}
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
