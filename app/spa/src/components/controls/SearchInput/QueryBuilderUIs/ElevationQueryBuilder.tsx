import * as React from 'react'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'

import * as Actions from 'src/redux/actions'
import * as Enums from '../../../../../../shared/enums'

const ElevationQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	const [rangeValue, setRangeValue] = React.useState<[number, number]>([
		-500, 10000,
	])

	const dispatch = ReactRedux.useDispatch()

	const addElevationQuery = () => {
		const newElevationQuery = {
			type: Enums.QueryType.ELEVATION,
			value: `${rangeValue[0]}-${rangeValue[1]}`,
		}
		dispatch(Actions.searchQueryAdd(newElevationQuery))
		dispatch(Actions.attemptSearch())

		// close modal
		closeModal()
	}

	return (
		<div style={{ height: 300 }}>
			<div
				style={{
					width: '80%',
					margin: '0 auto',
					paddingTop: '40px',
				}}
			>
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
					min={-500}
					max={10000}
					value={rangeValue}
					onChange={setRangeValue}
				/>
				<div>
					<MantineCore.NumberInput
						label="Minimum elevation"
						defaultValue={rangeValue[0]}
						value={rangeValue[0]}
						onChange={(val) =>
							setRangeValue([val ? val : -500, rangeValue[1]])
						}
						min={-500}
						max={10000}
						parser={(value) => value?.replace(/\m\s?|(,*)/g, '')}
						formatter={(value) => {
							if (!value) return ''

							return !Number.isNaN(parseFloat(value))
								? `${value}m`.replace(
										/\B(?=(\d{3})+(?!\d))/g,
										',',
								  )
								: ' '
						}}
					/>
				</div>
				<div>
					<MantineCore.NumberInput
						label="Maximum elevation"
						defaultValue={rangeValue[1]}
						value={rangeValue[1]}
						onChange={(val) =>
							setRangeValue([rangeValue[0], val ? val : 10000])
						}
						min={-500}
						max={10000}
						parser={(value) => value?.replace(/\m\s?|(,*)/g, '')}
						formatter={(value) => {
							if (!value) return ''

							return !Number.isNaN(parseFloat(value))
								? `${value}m`.replace(
										/\B(?=(\d{3})+(?!\d))/g,
										',',
								  )
								: ' '
						}}
					/>
				</div>
				<div>
					lower: {rangeValue[0]}m, upper: {rangeValue[1]}m
				</div>
				<div>
					<MantineCore.Button
						radius="md"
						size="md"
						onClick={addElevationQuery}
					>
						Search for files between {rangeValue[0]}m and{' '}
						{rangeValue[1]}m
					</MantineCore.Button>
				</div>
			</div>
		</div>
	)
}

export default ElevationQueryBuilder
