import * as React from 'react'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'
import ElevationQueryBuilder from './QueryBuilderUIs/ElevationQueryBuilder'
import VideoQueryBuilder from './QueryBuilderUIs/VideoQueryBuilder'
import DateRangeQueryBuilder from './QueryBuilderUIs/DateRangeQueryBuilder'
// import ColourQueryBuilder from './QueryBuilderUIs/ColourQueryBuilder'
import FolderQueryBuilder from './QueryBuilderUIs/FolderQueryBuilder'
import PlantQueryBuilder from './QueryBuilderUIs/PlantQueryBuilder'
import NumberplateQueryBuilder from './QueryBuilderUIs/NumberplateQueryBuilder'

const QueryBuilder: React.FunctionComponent<{
	closing: () => void
}> = ({ closing }) => {
	// todo: populate search tabs from an array, use for modal too

	const [searchMode, setSearchMode] = React.useState<undefined | string>(
		undefined,
	)

	const closeModal = () => {
		// close the modal
		setSearchMode(undefined)
		// refocus search input
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
			value: 'date_range',
			clickValue: 'date_range',
			label: 'Date range',
			icon: <Icons.IconCalendar size={14} />,
			content: <DateRangeQueryBuilder closeModal={closeModal} />,
		},
		{
			value: 'folders',
			clickValue: 'folders',
			label: 'Folders',
			icon: <Icons.IconFolder size={14} />,
			content: <FolderQueryBuilder closeModal={closeModal} />,
		},
		{
			value: 'elevation',
			clickValue: 'elevation',
			label: 'Elevation',
			icon: <Icons.IconMountain size={14} />,
			content: <ElevationQueryBuilder closeModal={closeModal} />,
		},
		// {
		// 	value: 'colour',
		// 	clickValue: 'colour',
		// 	label: 'Colour',
		// 	icon: <Icons.IconColorFilter size={14} />,
		// 	content: <ColourQueryBuilder closeModal={closeModal} />,
		// },
		{
			value: 'video',
			clickValue: 'video',
			label: 'Video',
			icon: <Icons.IconVideo size={14} />,
			content: <VideoQueryBuilder closeModal={closeModal} />,
		},
		{
			value: 'plants',
			clickValue: 'plants',
			label: 'Plants',
			icon: <Icons.IconPlant size={14} />,
			content: <PlantQueryBuilder closeModal={closeModal} />,
		},
		{
			value: 'numberplates',
			clickValue: 'numberplates',
			label: 'Number plates',
			icon: <Icons.IconCarCrash size={14} />,
			content: <NumberplateQueryBuilder closeModal={closeModal} />,
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
				trapFocus={true}
			>
				<MantineCore.Tabs
					variant="outline"
					radius="md"
					value={searchMode}
					id="query-builder-tabs"
					keepMounted={false}
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
							/>
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
