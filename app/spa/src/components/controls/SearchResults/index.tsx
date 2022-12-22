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
	const refreshQuery = () => dispatch(Actions.attemptSearch())

	return (
		<React.Fragment>
			{individualQueries.length > 0 && paginationInfo && searchStats && (
				<>
					<p>
						found {paginationInfo.totalItems} result(s){' '}
						{paginationInfo.totalItems > 0 && (
							<>in {searchStats.speed}ms</>
						)}
						<button
							id="refresh-query-button"
							onClick={refreshQuery}
						>
							[refresh]
						</button>
					</p>
					<div>
						<SearchSortSelect searchSorting={searchSorting} />
					</div>
					{displayJustified && (
						<JustifiedImageGallery searchResults={searchResults} />
					)}
					{!displayJustified && (
						<TiledImageGallery searchResults={searchResults} />
					)}

					{paginationInfo?.hasNextPage && (
						<>
							<br />
							<button onClick={loadMore}>load more</button>
						</>
					)}
				</>
			)}
		</React.Fragment>
	)
}

export default SearchResults
