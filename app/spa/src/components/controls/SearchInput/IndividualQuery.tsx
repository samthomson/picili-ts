import * as React from 'react'
import * as ReactRedux from 'react-redux'
import classNames from 'classnames'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as Enums from '../../../../../shared/enums'
import * as HelperUtil from 'src/util/helper'

interface IProps {
	individualQuery: Types.API.IndividualSearchQuery
	disabled: boolean
	queryStats?: Types.API.QueryStats
	userId?: number
}

const IndividualQuery: React.FunctionComponent<IProps> = ({
	individualQuery,
	disabled,
	queryStats,
	userId,
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
		switch (true) {
			case type === Enums.QueryType.MAP:
				return Icons.IconMapSearch

			case type === Enums.QueryType.EXIF:
				return Icons.IconAperture

			case type === Enums.QueryType.SUBJECT:
				return Icons.IconPhotoSearch

			case type === Enums.QueryType.OCR &&
				subtype === Enums.QuerySubtype.TEXT:
				return Icons.IconTextRecognition

			case type === Enums.QueryType.OCR &&
				subtype === Enums.QuerySubtype.NUMBER_PLATE:
				return Icons.IconCarCrash

			case type === Enums.QueryType.LOCATION:
				return Icons.IconMapPin

			case type === Enums.QueryType.FILETYPE:
				return Icons.IconFileCheck

			// todo: plant IconPlant
			// todo: directory

			default:
				return Icons.IconLanguageHiragana
		}
	})()

	const resultCount = queryStats?.resultCount
	const firstResultURL =
		queryStats?.firstResultUUID && !!userId
			? HelperUtil.thumbPath(userId, queryStats.firstResultUUID, 'm')
			: ''

	return (
		<MantineCore.Indicator
			disabled={!resultCount}
			label={`${resultCount}`}
			inline
			processing={isSearching}
			size={22}
			withBorder
			// todo: get/share primary color from/via saas
			color={!!resultCount && resultCount > 0 ? 'maroon' : 'gray'}
			onClick={(e) => e.stopPropagation()}
		>
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
						<img src={firstResultURL} />
					) : (
						<Icons.IconPhotoCancel size={20} />
					)}
				</div>

				<Icon size={16} />
				<div className="query-display-text">
					{type === Enums.QueryType.MAP && <>map</>}
					{type !== Enums.QueryType.MAP && (
						<>
							{/* {type && <>{type}</>}
							{subtype && <>.{subtype}</>}
							{type && <>=</>} */}
							{subtype && <>{subtype}=</>}
							{value && <>{value}</>}
						</>
					)}
				</div>
				<MantineCore.UnstyledButton
					disabled={disabled}
					onClick={(e: React.SyntheticEvent) => {
						e.stopPropagation()
						removeQuery(
							type || undefined,
							subtype || undefined,
							value,
						)
					}}
					title="remove this query"
					className="remove-query"
				>
					<Icons.IconX size={20} />
				</MantineCore.UnstyledButton>
			</div>
		</MantineCore.Indicator>
	)
}
const MemoizedIndividualQuery = React.memo(IndividualQuery)
export default MemoizedIndividualQuery
