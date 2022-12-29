import * as React from 'react'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'
import * as Actions from 'src/redux/actions'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'

import * as Enums from '../../../../../shared/enums'

const QueryBuilder: React.FunctionComponent<{
	closing: () => void
}> = ({ closing }) => {
	const dispatch = ReactRedux.useDispatch()
	// todo: populate search tabs from an array, use for modal too

	const [searchMode, setSearchMode] = React.useState<undefined | string>(
		undefined,
	)

	// elevation

	const [rangeValue, setRangeValue] = React.useState<[number, number]>([
		-500, 10000,
	])
	const addElevationQuery = () => {
		const newElevationQuery = {
			type: Enums.QueryType.ELEVATION,
			value: `${rangeValue[0]}-${rangeValue[1]}`,
		}
		dispatch(Actions.searchQueryAdd(newElevationQuery))
		dispatch(Actions.attemptSearch())

		// close modal
		setSearchMode(undefined)
		// trigger refocusing of search input
		closing()
	}

	const tabs: {
		value: string
		clickValue: undefined | string
		label: string
		icon: React.ReactNode
		content: React.ReactNode
	}[] = [
		{
			value: 'all',
			clickValue: undefined,
			label: 'All search modes',
			icon: <Icons.IconSearch size={14} />,
			content: <>search content</>,
		},
		{
			value: 'elevation',
			clickValue: 'elevation',
			label: 'Elevation',
			icon: <Icons.IconMountain size={14} />,
			content: (
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
									setRangeValue([
										val ? val : -500,
										rangeValue[1],
									])
								}
								min={-500}
								max={10000}
								parser={(value) =>
									value?.replace(/\m\s?|(,*)/g, '')
								}
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
									setRangeValue([
										rangeValue[0],
										val ? val : 10000,
									])
								}
								min={-500}
								max={10000}
								parser={(value) =>
									value?.replace(/\m\s?|(,*)/g, '')
								}
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
			),
		},
		{
			value: 'colour',
			clickValue: 'colour',
			label: 'Colour',
			icon: <Icons.IconColorFilter size={14} />,
			content: <>Colour content</>,
		},
	]
	const isMobile = useIsMobile()
	const theme = MantineCore.useMantineTheme()

	const onClose = () => {
		setSearchMode(undefined)
		closing()
	}

	return (
		<>
			<MantineCore.Modal
				opened={typeof searchMode !== 'undefined'}
				onClose={onClose}
				title="Construct a search query"
				size="lg"
				overlayColor={theme.colors.gray[2]}
				overlayOpacity={0.55}
				overlayBlur={3}
				overflow="inside"
				trapFocus={false}
			>
				<MantineCore.Tabs
					variant="outline"
					radius="md"
					value={searchMode}
				>
					<MantineCore.Tabs.List>
						{tabs.map((tab, index) => (
							<MantineCore.Tabs.Tab
								key={index}
								value={tab.value}
								onClick={() =>
									tab?.clickValue
										? setSearchMode(tab.clickValue)
										: onClose()
								}
								icon={tab.icon}
							>
								{!isMobile ? tab.label : ''}
							</MantineCore.Tabs.Tab>
						))}
					</MantineCore.Tabs.List>

					{tabs.map((tab, index) => (
						<MantineCore.Tabs.Panel
							key={index}
							value={tab.value}
							pt="xs"
						>
							{tab.content}
						</MantineCore.Tabs.Panel>
					))}
				</MantineCore.Tabs>
			</MantineCore.Modal>
			<MantineCore.Tabs variant="outline" radius="md" value={'all'}>
				<MantineCore.Tabs.List>
					{tabs.map((tab, index) => (
						<MantineCore.Tabs.Tab
							key={index}
							value={tab.value}
							onClick={() => setSearchMode(tab.clickValue)}
							icon={tab.icon}
						>
							{!isMobile ? tab.label : ''}
						</MantineCore.Tabs.Tab>
					))}
				</MantineCore.Tabs.List>
			</MantineCore.Tabs>
		</>
	)
}

export default QueryBuilder
