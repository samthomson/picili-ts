import * as React from 'react'
import * as ReactRedux from 'react-redux'
import classNames from 'classnames'

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

	const { type, subtype, value, isNotQuery = false } = individualQuery

	return (
		<div
			className={classNames({
				'individual-query': true,
				'not-query': isNotQuery,
			})}
		>
			{type === 'map' && <>[map bounds]</>}
			{type !== 'map' && (
				<>
					{type && <>{type}</>}
					{subtype && <>.{subtype}</>}
					{type && <>=</>}
					{value && <>{value}</>}
				</>
			)}
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
const MemoizedIndividualQuery = React.memo(IndividualQuery)
export default MemoizedIndividualQuery
