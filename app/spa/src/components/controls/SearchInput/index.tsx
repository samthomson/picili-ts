import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Selectors from 'src/redux/selectors'

import IndividualQuery from './IndividualQuery'
import QueryInput from './QueryInput'

const SearchInput: React.FunctionComponent = () => {
	const individualQueries = ReactRedux.useSelector(
		Selectors.searchIndividualQueries,
	)

	return (
		<div id="search-input">
			{individualQueries.map((individualQuery, index) => (
				<IndividualQuery
					key={index}
					individualQuery={individualQuery}
				/>
			))}
			<QueryInput />
		</div>
	)
}

export default SearchInput
