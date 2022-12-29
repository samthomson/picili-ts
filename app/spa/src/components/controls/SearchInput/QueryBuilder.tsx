import * as React from 'react'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'

const QueryBuilder: React.FunctionComponent = () => {
	// todo: populate search tabs from an array, use for modal too

	const [searchMode, setSearchMode] = React.useState<undefined | string>(
		undefined,
	)

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
			content: <>Elevation content</>,
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

	return (
		<>
			<MantineCore.Modal
				opened={typeof searchMode !== 'undefined'}
				onClose={() => setSearchMode(undefined)}
				title="Construct a search query"
				size="lg"
				overlayColor={theme.colors.gray[2]}
				overlayOpacity={0.55}
				overlayBlur={3}
				overflow="inside"
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
								onClick={() => setSearchMode(tab.clickValue)}
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
