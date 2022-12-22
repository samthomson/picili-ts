import * as React from 'react'
import * as ReactRedux from 'react-redux'
import { NavLink } from 'react-router-dom'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

import IndividualQuery from './IndividualQuery'
import QueryInput from './QueryInput'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'

const SearchInput: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const individualQueries = ReactRedux.useSelector(
		Selectors.searchIndividualQueries,
	)
	const isSearching = ReactRedux.useSelector(Selectors.searchIsSearching)

	const resetQuery = () => dispatch(Actions.searchQueryReset())
	const refreshQuery = () => dispatch(Actions.attemptSearch())
	const isMobile = useIsMobile()

	return (
		<div id="search-bar">
			<div id="search-input">
				{individualQueries.map((individualQuery, index) => (
					<IndividualQuery
						key={index}
						individualQuery={individualQuery}
						disabled={isSearching}
					/>
				))}
				<QueryInput disabled={isSearching} />
				{isSearching && <>[searching icon/spinner]</>}
				{individualQueries.length > 0 && (
					<>
						<button id="reset-query-button" onClick={resetQuery}>
							[clear]
						</button>
						<button
							id="refresh-query-button"
							onClick={refreshQuery}
						>
							[refresh]
						</button>
					</>
				)}
			</div>
			{!isMobile && (
				<div id="search-mode-toggle">
					<NavLink
						exact={true}
						className="search-mode-toggle-option"
						to="/"
						activeClassName="activeLink"
					>
						[grid]
					</NavLink>

					<NavLink
						exact={true}
						className="search-mode-toggle-option"
						to="/map"
						activeClassName="activeLink"
					>
						[map]
					</NavLink>
				</div>
			)}
		</div>
	)
}

export default SearchInput
