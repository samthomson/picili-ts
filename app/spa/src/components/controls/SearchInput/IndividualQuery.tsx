import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
interface IProps {
	individualQuery: Types.API.IndividualSearchQuery
}

const IndividualQuery: React.FunctionComponent<IProps> = ({
	individualQuery,
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

	return (
		<div className="individual-query">
			{individualQuery.value}
			<button
				onClick={() =>
					removeQuery(
						individualQuery?.type ?? undefined,
						individualQuery?.subtype ?? undefined,
						individualQuery.value,
					)
				}
			>
				remove
			</button>
		</div>
	)
}

export default IndividualQuery
