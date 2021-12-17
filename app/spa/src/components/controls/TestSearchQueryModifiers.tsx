import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Actions from 'src/redux/actions'

const TestSearchQueryModifiers: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const addQuery = () => {
		dispatch(
			Actions.searchQueryAdd({
				type: addQueryType,
				subtype: addQuerySubtype,
				value: addQueryValue,
			}),
		)
		setAddQueryType('')
		setAddQuerySubtype('')
		setAddQueryValue('')
	}
	const removeQuery = () => {
		dispatch(
			Actions.searchQueryRemove({
				type: removeQueryType,
				subtype: removeQuerySubtype,
				value: removeQueryValue,
			}),
		)
		setRemoveQueryType('')
		setRemoveQuerySubtype('')
		setRemoveQueryValue('')
	}
	const resetQuery = () => dispatch(Actions.searchQueryReset())

	const [addQueryType, setAddQueryType] = React.useState<string>('')
	const [addQuerySubtype, setAddQuerySubtype] = React.useState<string>('')
	const [addQueryValue, setAddQueryValue] = React.useState<string>('')

	const [removeQueryType, setRemoveQueryType] = React.useState<string>('')
	const [removeQuerySubtype, setRemoveQuerySubtype] =
		React.useState<string>('')
	const [removeQueryValue, setRemoveQueryValue] = React.useState<string>('')

	return (
		<React.Fragment>
			<h4>add query</h4>

			<input
				type="text"
				value={addQueryType}
				onChange={(e) => setAddQueryType(e.currentTarget.value)}
			/>
			<input
				type="text"
				value={addQuerySubtype}
				onChange={(e) => setAddQuerySubtype(e.currentTarget.value)}
			/>
			<input
				type="text"
				value={addQueryValue}
				onChange={(e) => setAddQueryValue(e.currentTarget.value)}
			/>
			<button onClick={addQuery}>add</button>

			<h4>remove query</h4>

			<input
				type="text"
				value={removeQueryType}
				onChange={(e) => setRemoveQueryType(e.currentTarget.value)}
			/>
			<input
				type="text"
				value={removeQuerySubtype}
				onChange={(e) => setRemoveQuerySubtype(e.currentTarget.value)}
			/>
			<input
				type="text"
				value={removeQueryValue}
				onChange={(e) => setRemoveQueryValue(e.currentTarget.value)}
			/>
			<button onClick={removeQuery}>remove</button>

			<h4>reset query</h4>
			<button onClick={resetQuery}>reset query</button>
		</React.Fragment>
	)
}

export default TestSearchQueryModifiers
