import * as React from 'react'
import { useQuery, gql } from '@apollo/client'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'
import * as MantineDates from '@mantine/dates'

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

	// todo:
	// const currentElevationQuery = ReactRedux.useSelector(
	// 	Selectors.searchIndividualQueryOfType('elevation'),
	// )

	const [value, setValue] = React.useState<MantineDates.DateRangePickerValue>(
		[new Date(2021, 11, 1), new Date(2021, 11, 5)],
	)
	// todo:
	// const [rangeValue, setRangeValue] = React.useState<
	// 	[number, number] | undefined
	// >(
	// 	currentElevationQuery &&
	// 		HelperUtil.parseRangeValueToArray(currentElevationQuery.value),
	// )

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
	// 		!currentElevationQuery
	// 	) {
	// 		setRangeValue([parsedAPIMinMax[0], parsedAPIMinMax[1]])
	// 	}
	// }, [elevationRangeData?.queryBuilders.elevation])

	const dispatch = ReactRedux.useDispatch()

	// todo:
	// const addElevationQuery = () => {
	// 	const newElevationQuery = {
	// 		type: Enums.QueryType.ELEVATION,
	// 		value: `${rangeValue?.[0]}:${rangeValue?.[1]}`,
	// 	}
	// 	dispatch(Actions.searchQueryAdd(newElevationQuery))
	// 	dispatch(Actions.attemptSearch())

	// 	// close modal
	// 	closeModal()
	// }

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
			<MantineDates.DateRangePicker value={value} onChange={setValue} />
			<div className="button-to-add-query-container">
				{/* // todo:  */}
				{/* <MantineCore.Button
					radius="md"
					size="md"
					onClick={addElevationQuery}
					leftIcon={<Icons.IconSearch />}
					variant="outline"
					color="gray"
				>
					Search for files between{' '}
					{formatValueToMeters(rangeValue[0].toString())} and{' '}
					{formatValueToMeters(rangeValue[1].toString())}
				</MantineCore.Button> */}
			</div>
		</div>
	)
}

export default DateRangeQueryBuilder
