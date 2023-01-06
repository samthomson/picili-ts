import * as React from 'react'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as Enums from '../../../../../../shared/enums'
import * as HelperUtil from 'src/util/helper'

const VideoQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	// todo: get min/max range from api
	const defaultMinMax = [0, 3600]

	const currentVideoQuery = ReactRedux.useSelector(
		Selectors.searchIndividualQueryOfType('video', 'length'),
	)

	const [rangeValue, setRangeValue] = React.useState<[number, number]>(
		// todo: refactor this hackyness
		currentVideoQuery
			? [
					currentVideoQuery.value.split(':').map((val) => +val)[0],
					currentVideoQuery.value.split(':').map((val) => +val)[1],
			  ]
			: [defaultMinMax[0], defaultMinMax[1]],
	)

	const dispatch = ReactRedux.useDispatch()

	const addVideoQuery = () => {
		const newVideoQuery = {
			type: Enums.QueryType.VIDEO,
			subtype: Enums.QuerySubtype.LENGTH,
			value: `${rangeValue[0]}:${rangeValue[1]}`,
		}
		dispatch(Actions.searchQueryAdd(newVideoQuery))
		dispatch(Actions.attemptSearch())

		// close modal
		closeModal()
	}

	// todo: update formatter/parser
	// const parseValueFromMeters = (value?: string): string => {
	// 	return value?.replace(/\m\s?|(,*)/g, '') ?? ''
	// }

	// const formatValueToMeters = (value?: string): string => {
	// 	if (!value) return ''

	// 	return !Number.isNaN(parseFloat(value))
	// 		? HelperUtil.formatNumber(value) + 'm'
	// 		: ' '
	// }

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
				// todo: format
				// label={formatValueToMeters}
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
					// todo: use updated
					// parser={parseValueFromMeters}
					// formatter={formatValueToMeters}
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
					// todo: use updated
					// parser={parseValueFromMeters}
					// formatter={formatValueToMeters}
					className="elevation-bound-input"
				/>
			</div>
			<div className="button-to-add-query-container">
				<MantineCore.Button
					radius="md"
					size="md"
					onClick={addVideoQuery}
					leftIcon={<Icons.IconSearch />}
					variant="outline"
					color="gray"
				>
					Find videos from {/* // use update */}
					{/* {formatValueToMeters(rangeValue[0].toString())} and{' '}
					{formatValueToMeters(rangeValue[1].toString())} */}
					{rangeValue[0].toString()} to {rangeValue[1].toString()}{' '}
					seconds in length
				</MantineCore.Button>
			</div>
		</div>
	)
}

export default VideoQueryBuilder
