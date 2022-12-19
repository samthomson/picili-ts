import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

import SearchSortSelect from 'src/components/controls/SearchSortSelect'
import JustifiedImageGallery from './JustifiedImageGallery'
import TiledImageGallery from './TiledImageGallery'

interface IProps {
	displayJustified?: boolean
}

const SearchResults: React.FunctionComponent<IProps> = ({
	displayJustified = false,
}) => {
	const dispatch = ReactRedux.useDispatch()

	const individualQueries = ReactRedux.useSelector(
		Selectors.searchIndividualQueries,
	)
	const searchResults = ReactRedux.useSelector(Selectors.searchResults)
	const paginationInfo = ReactRedux.useSelector(
		Selectors.searchPaginationInfo,
	)
	const searchStats = ReactRedux.useSelector(Selectors.searchStats)
	const searchSorting = ReactRedux.useSelector(Selectors.searchSorting)

	const loadMore = () => dispatch(Actions.searchNext())

	return (
		<React.Fragment>
			{individualQueries.length > 0 && paginationInfo && searchStats && (
				<>
					<p>
						{searchResults.length > 0 && (
							<>in {searchStats.speed}ms</>
						)}
					</p>
					<div>
						<SearchSortSelect searchSorting={searchSorting} />
					</div>
				</>
			)}
			{displayJustified && (
				<JustifiedImageGallery searchResults={searchResults} />
			)}
			{!displayJustified && (
				<TiledImageGallery searchResults={searchResults} />
			)}

			{paginationInfo?.hasMore && (
				<>
					<br />
					<button onClick={loadMore}>load more</button>
				</>
			)}
		</React.Fragment>
	)
}

export default SearchResults
