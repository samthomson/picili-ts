import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'

import TypeAhead from './TypeAhead'

interface IProps {
	disabled: boolean
}

const QueryInput: React.FunctionComponent<IProps> = ({ disabled }) => {
	const dispatch = ReactRedux.useDispatch()

	const [textInputValue, setTextInputValue] = React.useState<string>('')

	const parseTextToQuery = (
		text: string,
	): Types.API.IndividualSearchQuery => {
		// split on equals sign
		let type = undefined
		let subtype = undefined
		let value = ''
		const typeValueParts = text.split('=')
		if (typeValueParts.length === 1) {
			// take the only part as the value
			value = typeValueParts[0]
		} else {
			// at least two parts
			const [typePart, ...valueParts] = typeValueParts
			// split first part into type/subtype
			const typeSubtypeParts = typePart.split('.')
			// set the value via a join (incase there were multiple chunks)
			value = valueParts.join('=')

			if (typeSubtypeParts.length === 1) {
				// no subtype, just a type
				type = typeSubtypeParts[0]
			} else {
				const [parsedType, ...subtypes] = typeSubtypeParts
				type = parsedType
				subtype = subtypes.join('.')
			}
		}

		return {
			type,
			subtype,
			value,
		}
	}

	// return pressed: parse/add as query to redux and clear textInputValue
	const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			// parse/add to query
			const add = parseTextToQuery(textInputValue)
			dispatch(Actions.searchQueryAdd(add))
			// clear input
			setTextInputValue('')
			// do search
			dispatch(Actions.attemptSearch())
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
				disabled={disabled}
			/>
			<TypeAhead
				currentIndividualQuery={parseTextToQuery(textInputValue)}
			/>
		</div>
	)
}

export default QueryInput
