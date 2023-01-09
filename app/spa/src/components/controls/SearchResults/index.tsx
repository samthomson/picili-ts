import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import debounce from 'lodash.debounce'

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
	const isLoadingSearchResults = ReactRedux.useSelector(
		Selectors.searchIsSearching,
	)
	const paginationInfo = ReactRedux.useSelector(
		Selectors.searchPaginationInfo,
	)
	const searchStats = ReactRedux.useSelector(Selectors.searchStats)
	const searchSorting = ReactRedux.useSelector(Selectors.searchSorting)

	const loadMore = () => dispatch(Actions.searchNext())
	const refreshQuery = () => dispatch(Actions.attemptSearch())

	const scrollableRef = React.useRef<HTMLHeadingElement>(null)

	const debouncedLoadMore = debounce(() => {
		if (!isLoadingSearchResults && paginationInfo?.hasNextPage) {
			loadMore()
		}
	}, 100)

	const onScroll = () => {
		if (scrollableRef?.current) {
			const { scrollTop, clientHeight, scrollHeight } =
				scrollableRef?.current

			const position = scrollTop + clientHeight
			const percentageScrolled = (position / scrollHeight) * 100

			if (percentageScrolled > 50) {
				// raise load more event
				debouncedLoadMore()
			}
		}
	}

	return (
		<React.Fragment>
			{individualQueries.length > 0 && paginationInfo && searchStats && (
				<div
					ref={scrollableRef}
					id="scroll-wrapper"
					onScroll={onScroll}
					style={{
						overflowY: 'auto',
						maxHeight: '100%',
					}}
				>
					<>
						<div className="results-overview">
							<div className="results-overview-column">
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
							</div>
							<div className="results-overview-column">
								<SearchSortSelect
									searchSorting={searchSorting}
								/>
							</div>
						</div>

						<div></div>
						{displayJustified && (
							<JustifiedImageGallery
								searchResults={searchResults}
							/>
						)}
						{!displayJustified && (
							<TiledImageGallery searchResults={searchResults} />
						)}

						{paginationInfo?.hasNextPage && (
							<>
								<br />
								<button
									onClick={loadMore}
									disabled={isLoadingSearchResults}
								>
									{!isLoadingSearchResults
										? 'load more'
										: 'loading...'}
								</button>
							</>
						)}
					</>
				</div>
			)}
		</React.Fragment>
	)
}

export default SearchResults
