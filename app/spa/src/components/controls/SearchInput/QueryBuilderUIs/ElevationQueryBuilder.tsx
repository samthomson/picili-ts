import * as React from 'react'
import { useQuery, gql } from '@apollo/client'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as Enums from '../../../../../../shared/enums'
import * as HelperUtil from 'src/util/helper'
import * as Types from '@shared/declarations'

const elevationMinMaxQuery = gql`
	query {
		UIState {
			queryBuilders {
				elevation {
					min
					max
				}
			}
		}
	}
`

const ElevationQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	const { loading, error, data } = useQuery(elevationMinMaxQuery, {
		fetchPolicy: 'cache-and-network',
	})

	const elevationRangeData: Types.API.MinMax =
		data?.UIState?.queryBuilders?.elevation

	const defaultMinMax = elevationRangeData
		? [elevationRangeData.min, elevationRangeData.max]
		: undefined

	const currentElevationQuery = ReactRedux.useSelector(
		Selectors.searchIndividualQueryOfType('elevation'),
	)

	const [rangeValue, setRangeValue] = React.useState<
		[number, number] | undefined
	>(
		currentElevationQuery &&
			HelperUtil.parseRangeValueToArrayNumeric(
				currentElevationQuery.value,
			),
	)

	React.useEffect(() => {
		const parsedAPIMinMax = elevationRangeData && [
			elevationRangeData.min,
			elevationRangeData.max,
		]

		// only overwrite if we don't have an existing query from redux
		if (
			parsedAPIMinMax &&
			parsedAPIMinMax !== rangeValue &&
			!currentElevationQuery
		) {
			setRangeValue([parsedAPIMinMax[0], parsedAPIMinMax[1]])
		}
	}, [elevationRangeData])

	const dispatch = ReactRedux.useDispatch()

	const addElevationQuery = () => {
		const newElevationQuery = {
			type: Enums.QueryType.ELEVATION,
			value: `${rangeValue?.[0]}:${rangeValue?.[1]}`,
		}
		dispatch(Actions.searchQueryAdd(newElevationQuery))
		dispatch(Actions.attemptSearch())

		// close modal
		closeModal()
	}

	const parseValueFromMeters = (value?: string): string => {
		return value?.replace(/\m\s?|(,*)/g, '') ?? ''
	}

	const formatValueToMeters = (value?: string): string => {
		if (!value) return ''

		return !Number.isNaN(parseFloat(value))
			? HelperUtil.formatNumber(value) + 'm'
			: ' '
	}

	if (loading) {
		// todo: proper loading ui
		return <>loading...</>
	}

	if (error) {
		return <>{error?.message}</>
	}

	// todo: refactor, these are the same thing
	if (!defaultMinMax || !rangeValue) {
		// todo: nicer error
		return <>no elevation data to search against.</>
	}

	return (
		<div
			id="elevation-query-builder"
			className="centered-range-query-builder-container"
		>
			<MantineCore.RangeSlider
				size="xl"
				radius="xl"
				labelAlwaysOn
				min={defaultMinMax[0]}
				max={defaultMinMax[1]}
				value={rangeValue}
				onChange={setRangeValue}
				label={formatValueToMeters}
			/>
			<div id="elevation-range-inputs">
				<MantineCore.NumberInput
					label="Minimum"
					defaultValue={rangeValue[0]}
					value={rangeValue[0]}
					onChange={(val) =>
						setRangeValue([
							val ? val : defaultMinMax[0],
							rangeValue[1],
						])
					}
					min={defaultMinMax[0]}
					max={defaultMinMax[1]}
					parser={parseValueFromMeters}
					formatter={formatValueToMeters}
					className="elevation-bound-input"
				/>

				<MantineCore.NumberInput
					label="Maximum"
					defaultValue={rangeValue[1]}
					value={rangeValue[1]}
					onChange={(val) =>
						setRangeValue([
							rangeValue[0],
							val ? val : defaultMinMax[1],
						])
					}
					min={defaultMinMax[0]}
					max={defaultMinMax[1]}
					parser={parseValueFromMeters}
					formatter={formatValueToMeters}
					className="elevation-bound-input"
				/>
			</div>
			<div className="button-to-add-query-container">
				<MantineCore.Button
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
				</MantineCore.Button>
			</div>
		</div>
	)
}

export default ElevationQueryBuilder
