import * as React from 'react'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as Enums from '../../../../../../shared/enums'

const ElevationQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	const defaultMinMax = [-500, 10000]

	const currentElevationQuery = ReactRedux.useSelector(
		Selectors.searchIndividualQueryOfType('elevation'),
	)

	const [rangeValue, setRangeValue] = React.useState<[number, number]>(
		// todo: refactor this hackyness
		currentElevationQuery
			? [
					currentElevationQuery.value
						.split(':')
						.map((val) => +val)[0],
					currentElevationQuery.value
						.split(':')
						.map((val) => +val)[1],
			  ]
			: [defaultMinMax[0], defaultMinMax[1]],
	)

	const dispatch = ReactRedux.useDispatch()

	const addElevationQuery = () => {
		const newElevationQuery = {
			type: Enums.QueryType.ELEVATION,
			value: `${rangeValue[0]}:${rangeValue[1]}`,
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
			? `${value}m`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
			: ' '
	}

	return (
		<div id="elevation-query-builder">
			<MantineCore.RangeSlider
				// color="pink"
				size="xl"
				radius="xl"
				labelAlwaysOn
				// marks={[
				// 	{ value: 20, label: '20%' },
				// 	{ value: 50, label: '50%' },
				// 	{ value: 80, label: '80%' },
				// ]}
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
			<div>
				<MantineCore.Button
					radius="md"
					size="md"
					onClick={addElevationQuery}
					leftIcon={<Icons.IconSearch />}
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
