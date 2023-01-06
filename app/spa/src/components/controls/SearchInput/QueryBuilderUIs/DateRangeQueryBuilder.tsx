import * as React from 'react'
import { useQuery, gql } from '@apollo/client'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'
import * as MantineDates from '@mantine/dates'
import moment from 'moment'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as Enums from '../../../../../../shared/enums'
import * as HelperUtil from 'src/util/helper'
import * as Types from '@shared/declarations'

// todo:
// const elevationMinMaxQuery = gql`
// 	query {
// 		UIState {
// 			queryBuilders {
// 				elevation {
// 					min
// 					max
// 				}
// 			}
// 		}
// 	}
// `

const DateRangeQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	// todo:
	// const { loading, error, data } = useQuery(elevationMinMaxQuery, {
	// 	fetchPolicy: 'no-cache',
	// })

	// const elevationRangeData: Types.API.UIState = data?.UIState

	// const defaultMinMax = elevationRangeData?.queryBuilders?.elevation
	// 	? [
	// 			elevationRangeData.queryBuilders.elevation.min,
	// 			elevationRangeData.queryBuilders.elevation.max,
	// 	  ]
	// 	: undefined

	const currentDateRangeQuery = ReactRedux.useSelector(
		Selectors.searchIndividualQueryOfType(Enums.QueryType.DATE_RANGE),
	)

	const [value, setValue] = React.useState<
		MantineDates.DateRangePickerValue | undefined
	>(
		currentDateRangeQuery
			? HelperUtil.parseRangeValueToArrayDates(
					currentDateRangeQuery.value,
			  )
			: [moment().toDate(), moment().toDate()],
	)
	// todo:
	// React.useEffect(() => {
	// 	const parsedAPIMinMax = elevationRangeData?.queryBuilders
	// 		?.elevation && [
	// 		elevationRangeData.queryBuilders.elevation.min,
	// 		elevationRangeData.queryBuilders.elevation.max,
	// 	]

	// 	// only overwrite if we don't have an existing query from redux
	// 	if (
	// 		parsedAPIMinMax &&
	// 		parsedAPIMinMax !== rangeValue &&
	// 		!currentDateRangeQuery
	// 	) {
	// 		setRangeValue([parsedAPIMinMax[0], parsedAPIMinMax[1]])
	// 	}
	// }, [elevationRangeData?.queryBuilders.elevation])

	const dispatch = ReactRedux.useDispatch()

	const addDateRangeQuery = () => {
		const newDateRangeQuery = {
			type: Enums.QueryType.DATE_RANGE,
			value: `${moment(value?.[0]).format('YYYY-MM-DD')}:${moment(
				value?.[1],
			).format('YYYY-MM-DD')}`,
		}
		dispatch(Actions.searchQueryAdd(newDateRangeQuery))
		dispatch(Actions.attemptSearch())

		// close modal
		closeModal()
	}

	// todo:
	// if (loading) {
	// 	// todo: proper loading ui
	// 	return <>loading...</>
	// }

	// if (error) {
	// 	return <>{error?.message}</>
	// }

	// // todo: refactor, these are the same thing
	// if (!defaultMinMax || !rangeValue) {
	// 	// todo: nicer error
	// 	return <>no elevation data to search against.</>
	// }

	return (
		<div id="date-range-query-builder">
			<MantineDates.DateRangePicker
				value={value}
				onChange={setValue}
				// allowFreeInput={true}
			/>
			<div className="button-to-add-query-container">
				<MantineCore.Button
					radius="md"
					size="md"
					onClick={addDateRangeQuery}
					leftIcon={<Icons.IconSearch />}
					variant="outline"
					color="gray"
				>
					Search for files
					{/* {formatValueToMeters(rangeValue[0].toString())} and{' '}
					{formatValueToMeters(rangeValue[1].toString())} */}
				</MantineCore.Button>
			</div>
		</div>
	)
}

export default DateRangeQueryBuilder
