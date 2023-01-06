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

const dateRangeMinMaxQuery = gql`
	query {
		UIState {
			queryBuilders {
				dateRange {
					min
					max
				}
			}
		}
	}
`

const DateRangeQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	const { loading, error, data } = useQuery(dateRangeMinMaxQuery, {
		fetchPolicy: 'no-cache',
	})

	const dateRangeData: Types.API.UIState = data?.UIState

	const defaultMinMax = dateRangeData?.queryBuilders?.dateRange
		? [
				dateRangeData.queryBuilders.dateRange.min,
				dateRangeData.queryBuilders.dateRange.max,
		  ]
		: undefined

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

	React.useEffect(() => {
		const parsedAPIMinMax = dateRangeData?.queryBuilders?.dateRange && [
			moment(
				dateRangeData.queryBuilders.dateRange.min as string,
			).toDate(),
			moment(
				dateRangeData.queryBuilders.dateRange.max as string,
			).toDate(),
		]

		// only overwrite if we don't have an existing query from redux
		if (
			parsedAPIMinMax &&
			parsedAPIMinMax !== value &&
			!currentDateRangeQuery
		) {
			// todo: ?
			// setValue([
			// 	moment(parsedAPIMinMax[0]).toDate(),
			// 	moment(parsedAPIMinMax[1]).toDate(),
			// ])
		}
	}, [dateRangeData?.queryBuilders.dateRange])

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
				placeholder="Select an inclusive date range"
				minDate={moment(defaultMinMax?.[0]).toDate()}
				maxDate={moment(defaultMinMax?.[1]).toDate()}
				size="md"
				radius="md"
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
