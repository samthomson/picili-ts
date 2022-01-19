import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

import IndividualQuery from './IndividualQuery'
import QueryInput from './QueryInput'

const SearchInput: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const individualQueries = ReactRedux.useSelector(
		Selectors.searchIndividualQueries,
	)
	const isSearching = ReactRedux.useSelector(Selectors.searchIsSearching)

	const resetQuery = () => dispatch(Actions.searchQueryReset())

	return (
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
				<button id="reset-query-button" onClick={resetQuery}>
					[clear]
				</button>
			)}
		</div>
	)
}

export default SearchInput
