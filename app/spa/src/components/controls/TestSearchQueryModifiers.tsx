import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

const TestSearchQueryModifiers: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const searchQuery = ReactRedux.useSelector(Selectors.searchQuery)

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
	const removeQuery = (
		type: string | undefined = undefined,
		subtype: string | undefined = undefined,
		value: string,
	) => {
		dispatch(
			Actions.searchQueryRemove({
				type,
				subtype,
				value,
			}),
		)
	}
	const resetQuery = () => dispatch(Actions.searchQueryReset())

	const search = () => dispatch(Actions.attemptSearch())

	const [addQueryType, setAddQueryType] = React.useState<string>('')
	const [addQuerySubtype, setAddQuerySubtype] = React.useState<string>('')
	const [addQueryValue, setAddQueryValue] = React.useState<string>('')

	return (
		<React.Fragment>
			{JSON.stringify(searchQuery)}
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

			{searchQuery.individualQueries.map((query, i) => {
				return (
					<p key={i}>
						{JSON.stringify(query)}
						<button
							onClick={() =>
								removeQuery(
									query?.type ?? undefined,
									query?.subtype ?? undefined,
									query.value,
								)
							}
						>
							remove
						</button>
					</p>
				)
			})}

			<h4>reset query</h4>
			<button onClick={resetQuery}>reset query</button>

			<h4>search</h4>
			<button onClick={search}>search</button>
		</React.Fragment>
	)
}

export default TestSearchQueryModifiers
