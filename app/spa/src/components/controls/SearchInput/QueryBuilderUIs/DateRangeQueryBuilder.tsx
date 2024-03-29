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
import useIsMobile from 'src/util/hooks/use-is-mobile.hook'

const dateRangeMinMaxQuery = gql`
	query ($fakeId: Int!) {
		UIState(fakeId: $fakeId) {
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
	const { error, data } = useQuery(dateRangeMinMaxQuery, {
		fetchPolicy: 'cache-and-network',
		variables: { fakeId: 5 },
	})
	const loading = !error && !data

	const isMobile = useIsMobile()

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
			HelperUtil.dateWithoutTimeFromMomentDate(
				moment.utc(
					dateRangeData.queryBuilders?.dateRange?.min as string,
				),
			),
			HelperUtil.dateWithoutTimeFromMomentDate(
				moment.utc(
					dateRangeData.queryBuilders?.dateRange?.max as string,
				),
			),
		]

		// only overwrite if we don't have an existing query from redux
		if (
			parsedAPIMinMax &&
			parsedAPIMinMax !== value &&
			!currentDateRangeQuery
		) {
			// if no query, set to latest date
			setValue([
				moment(parsedAPIMinMax[1]).toDate(),
				moment(parsedAPIMinMax[1]).toDate(),
			])
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
	if (loading) {
		// todo: proper loading ui
		return <>loading...</>
	}

	if (error) {
		return <>{error?.message}</>
	}

	// todo: refactor, these are the same thing
	if (!defaultMinMax || !value) {
		// todo: nicer error
		return <>no date data to search against.</>
	}

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
				icon={<Icons.IconCalendar size={16} />}
				dropdownType="modal"
				amountOfMonths={isMobile ? 1 : 3}
				allowSingleDateInRange={true}
				// todo: hopefully this issue gets sorted https://github.com/mantinedev/mantine/issues/3302
				// allowFreeInput
			/>
			<div className="button-to-add-query-container">
				<MantineCore.Button
					radius="md"
					size="md"
					onClick={addDateRangeQuery}
					leftIcon={<Icons.IconSearch size={16} />}
					variant="light"
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
