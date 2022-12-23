import * as React from 'react'
import * as ReactRedux from 'react-redux'
import classNames from 'classnames'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as Enums from '../../../../../shared/enums'

interface IProps {
	individualQuery: Types.API.IndividualSearchQuery
	disabled: boolean
}

const IndividualQuery: React.FunctionComponent<IProps> = ({
	individualQuery,
	disabled,
}) => {
	const dispatch = ReactRedux.useDispatch()

	const isSearching = ReactRedux.useSelector(Selectors.searchIsSearching)

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

	const Icon = (() => {
		switch (type) {
			case Enums.QueryType.MAP:
				return Icons.IconMapSearch
			default:
				return Icons.IconLanguageHiragana
		}
	})()

	// todo: get first result of query to use photo from
	return (
		<div
			className={classNames({
				'individual-query': true,
				'not-query': isNotQuery,
			})}
		>
			<div className="img-loader-space">
				{isSearching ? (
					<MantineCore.Loader size="xs" color="grey" />
				) : true ? (
					<img src="http://localhost:3501/thumbs/6/246e2bd7-8c86-4427-bb75-9c75f60f614c/i.jpg" />
				) : (
					<Icons.IconPhotoCancel size={20} />
				)}
			</div>

			<Icon size={16} />
			<div className="query-display-text">
				{type === Enums.QueryType.MAP && <>map</>}
				{type !== Enums.QueryType.MAP && (
					<>
						{type && <>{type}</>}
						{subtype && <>.{subtype}</>}
						{type && <>=</>}
						{value && <>{value}</>}
					</>
				)}
			</div>
			<MantineCore.UnstyledButton
				disabled={disabled}
				onClick={() =>
					removeQuery(type || undefined, subtype || undefined, value)
				}
				title="remove this query"
				className="remove-query"
			>
				<Icons.IconX size={20} />
			</MantineCore.UnstyledButton>
		</div>
	)
}
const MemoizedIndividualQuery = React.memo(IndividualQuery)
export default MemoizedIndividualQuery
