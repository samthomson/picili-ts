import * as React from 'react'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import debounce from 'lodash.debounce'

import * as Types from '@shared/declarations'
import SearchSortSelect from 'src/components/controls/SearchSortSelect'
import * as HelperUtil from 'src/util/helper'
import JustifiedImageGallery from './JustifiedImageGallery'
import TiledImageGallery from './TiledImageGallery'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'

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

	// use !displayJustified as shorthand for map mode
	const loadMore = () => dispatch(Actions.searchNext(!displayJustified))
	const refreshQuery = () =>
		dispatch(
			Actions.attemptSearch(HelperUtil.shouldIRequestGeoAggregations()),
		)

	const scrollableRef = React.useRef<HTMLHeadingElement>(null)

	const debouncedLoadMore = debounce(() => {
		if (!isLoadingSearchResults && paginationInfo?.hasNextPage) {
			loadMore()
		}
	}, 100)

	const [showScrollToTop, setShowScrollToTop] = React.useState<boolean>(false)

	const onScroll = () => {
		if (scrollableRef?.current) {
			const { scrollTop, scrollHeight } = scrollableRef?.current

			// we want to automatically load more when the user is half way down
			// but half way down the 'current'/last 'page' of results, as otherwise
			// the user would always exponentially less scrolling per additional load
			// and have an equally growing number of results off page which they
			// might not even look at.
			const position = scrollTop //+ clientHeight
			const percentageScrolled = (position / scrollHeight) * 100

			const page = paginationInfo?.page ?? 1
			const perPage = scrollHeight / page
			const ignorableHeight = (page - 1) * perPage
			const positionInLastPage = position - ignorableHeight
			const percentageScrolledLastPage =
				(positionInLastPage / perPage) * 100

			setShowScrollToTop(percentageScrolled > 5)

			if (percentageScrolledLastPage >= 50) {
				// raise load more event
				debouncedLoadMore()
			}
		}
	}

	const [lastQueries, setLastQueries] = React.useState<
		Types.API.IndividualSearchQuery[]
	>([])

	React.useEffect(() => {
		if (lastQueries !== individualQueries) {
			setLastQueries(individualQueries)
			// a new search has occured
			onScrollToTopNewSearch()
		}
	}, [individualQueries])

	const onScrollToTopClick = () =>
		scrollableRef?.current?.scrollTo({ top: 0, behavior: 'smooth' })

	const onScrollToTopNewSearch = () =>
		scrollableRef?.current?.scrollTo({ top: 0, behavior: 'auto' })

	const isMobile = useIsMobile()

	const { showingMinimum, showingCount } = React.useMemo(() => {
		if (!paginationInfo) {
			return { showingMinimum: 0, showingCount: 0 }
		}
		const showingMinimum = paginationInfo.totalItems > 0 ? 1 : 0
		const showingCount = !(
			paginationInfo.perPage * paginationInfo?.page >
			paginationInfo.totalItems
		)
			? paginationInfo.perPage * paginationInfo.page
			: paginationInfo.totalItems

		return { showingMinimum, showingCount }
	}, [paginationInfo])

	return (
		<React.Fragment>
			{isLoadingSearchResults && searchResults.length === 0 && (
				<MantineCore.Loader
					color={'maroon'}
					style={{ width: '100%', margin: '80px auto' }}
				/>
			)}
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
								{!isLoadingSearchResults && (
									<>
										<span id="overview-text">
											{isMobile ? (
												<>
													{showingMinimum} -{' '}
													{showingCount}
													&nbsp;of{' '}
													{paginationInfo.totalItems}
													{paginationInfo.totalItems >
														0 && (
														<>
															&nbsp;(
															{searchStats.speed}
															ms)
														</>
													)}
												</>
											) : (
												<>
													showing {showingMinimum} -{' '}
													{showingCount}
													&nbsp;of{' '}
													{
														paginationInfo.totalItems
													}{' '}
													result
													{paginationInfo.totalItems >
														1 && 's'}
													.
													{paginationInfo.totalItems >
														0 && (
														<>
															&nbsp;speed:{' '}
															{searchStats.speed}
															ms
														</>
													)}
												</>
											)}
										</span>
										<MantineCore.Button
											id="refresh-query-button"
											onClick={refreshQuery}
											variant="light"
											color="gray"
											radius="md"
											size="sm"
											compact
											leftIcon={
												<Icons.IconReload size={14} />
											}
										>
											refresh
										</MantineCore.Button>
									</>
								)}
							</div>
							<div className="results-overview-column">
								<SearchSortSelect
									searchSorting={searchSorting}
								/>
							</div>
						</div>
						{showScrollToTop && (
							<div id="scroll-to-top-button">
								<MantineCore.Button
									variant="outline"
									color="red"
									radius="md"
									leftIcon={
										<Icons.IconArrowBarToUp size={16} />
									}
									onClick={onScrollToTopClick}
								>
									Scroll to top
								</MantineCore.Button>
							</div>
						)}
						{displayJustified && (
							<JustifiedImageGallery
								searchResults={searchResults}
							/>
						)}
						{!displayJustified && (
							<TiledImageGallery searchResults={searchResults} />
						)}
						{/* // todo: make this full width and not look crappy like
						it does now */}
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
