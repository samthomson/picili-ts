import * as React from 'react'
import IndividualQuery from './IndividualQuery'
import QueryInput from './QueryInput'

const SearchInput: React.FunctionComponent = () => {
	return (
		<div id="search-input">
			[individual queries...]
			<IndividualQuery />
			<QueryInput />
		</div>
	)
}

export default SearchInput
