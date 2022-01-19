import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Actions from 'src/redux/actions'

import TypeAhead from './TypeAhead'

const QueryInput: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const [textInputValue, setTextInputValue] = React.useState<string>('')

	// return pressed: parse/add as query to redux and clear textInputValue
	const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			// parse/add to query
			const add = {
				type: '',
				subtype: '',
				value: textInputValue,
			}
			dispatch(Actions.searchQueryAdd(add))
			// clear input
			setTextInputValue('')
			// do search
		}
	}

	return (
		<div id="query-input">
			<input
				type="text"
				placeholder="add query..."
				value={textInputValue}
				onChange={(e) => setTextInputValue(e.target.value)}
				onKeyDown={onKeyDown}
			/>
			<TypeAhead currentTextInputValue={textInputValue} />
		</div>
	)
}

export default QueryInput
