import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

import SearchSortSelect from 'src/components/controls/SearchSortSelect'
import JustifiedImageGallery from 'src/components/controls/JustifiedImageGallery'

const SearchResults: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const individualQueries = ReactRedux.useSelector(
		Selectors.searchIndividualQueries,
	)
	const searchResults = ReactRedux.useSelector(Selectors.searchResults)
	const paginationInfo = ReactRedux.useSelector(
		Selectors.searchPaginationInfo,
	)
	const searchStats = ReactRedux.useSelector(Selectors.searchStats)

	const loadMore = () => dispatch(Actions.searchNext())

	return (
		<React.Fragment>
			{individualQueries.length > 0 && paginationInfo && searchStats && (
				<>
					<p>
						found {paginationInfo.totalItems} result(s){' '}
						{paginationInfo.totalItems > 0 && (
							<>in {searchStats.speed}ms</>
						)}
					</p>
					<div>
						<SearchSortSelect />
					</div>
				</>
			)}
			<JustifiedImageGallery searchResults={searchResults} />

			{paginationInfo?.hasNextPage && (
				<>
					<br />
					<button onClick={loadMore}>load more</button>
				</>
			)}
		</React.Fragment>
	)
}

export default SearchResults
