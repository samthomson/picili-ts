import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
interface IProps {
	individualQuery: Types.API.IndividualSearchQuery
	disabled: boolean
}

const IndividualQuery: React.FunctionComponent<IProps> = ({
	individualQuery,
	disabled,
}) => {
	const dispatch = ReactRedux.useDispatch()

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
		dispatch(Actions.attemptSearch())
	}

	const { type, subtype, value } = individualQuery

	return (
		<div className="individual-query">
			{type && <>{type}</>}
			{subtype && <>.{subtype}</>}
			{type && <>=</>}
			{value && <>{value}</>}
			<button
				disabled={disabled}
				onClick={() =>
					removeQuery(type || undefined, subtype || undefined, value)
				}
			>
				remove
			</button>
		</div>
	)
}

export default IndividualQuery
