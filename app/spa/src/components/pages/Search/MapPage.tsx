import * as React from 'react'
import * as ReactRedux from 'react-redux'
import useMeasure from 'react-use-measure'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

import SearchPageTemplate from 'src/components/pages/Search/SearchPageTemplate'
import SearchResults from 'src/components/controls/SearchResults/index'
import Map from 'src/components/controls/Map'
import * as Enums from '../../../../../shared/enums'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'
import { Redirect } from 'react-router-dom'

const MapPage: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const searchResultGeoAggregations = ReactRedux.useSelector(
		Selectors.searchResultGeoAggregations,
	)
	const isMobile = useIsMobile()

	const [ref, { width }] = useMeasure()
	const [resultsGridWidth, setResultsGridWidth] = React.useState<number>(
		width / 2,
	)

	const boundsChanged = (
		bounds: Types.Core.MapBounds,
		zoom: number,
	): void => {
		const mapQuery = {
			type: Enums.QueryType.MAP,
			value: `${bounds._sw.lat},${bounds._ne.lat},${bounds._sw.lng},${bounds._ne.lng},${zoom}`,
		}

		dispatch(Actions.searchQueryAdd(mapQuery))
		dispatch(Actions.attemptSearch(true))
	}

	React.useEffect(() => {
		// calculate optimal width for results grid
		const MARGIN = 16
		const SCROLLBAR_SPACE = 16
		const halfWidth = width * 0.55 - MARGIN
		// todo: get margin from jss?
		const bestFitOfThumbs = Math.floor(halfWidth / (125 + 8))
		const enclosingWidth = bestFitOfThumbs * (125 + 8) + SCROLLBAR_SPACE

		setResultsGridWidth(enclosingWidth)
	}, [width])

	if (isMobile) {
		return <Redirect to="/" />
	}

	// const ref = React.useRef<HTMLHeadingElement>(null)

	return (
		<SearchPageTemplate>
			<div id="map-results-container" ref={ref}>
				<div id="map-container">
					<Map
						searchResultClusters={
							searchResultGeoAggregations?.clusters ?? []
						}
						boundsChanged={boundsChanged}
					/>
				</div>
				<div
					id="results-container"
					style={{
						width: `${resultsGridWidth}px`,
					}}
				>
					<SearchResults />
				</div>
			</div>
		</SearchPageTemplate>
	)
}

export default MapPage
