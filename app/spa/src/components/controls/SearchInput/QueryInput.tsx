import * as React from 'react'

import TypeAhead from './TypeAhead'

const QueryInput: React.FunctionComponent = () => {
	return (
		<div id="query-input">
			<input type="text" placeholder="add query..." />
			<TypeAhead />
		</div>
	)
}

export default QueryInput
