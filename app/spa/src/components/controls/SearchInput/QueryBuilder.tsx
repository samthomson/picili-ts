import * as React from 'react'
import * as MantineCore from '@mantine/core'

const QueryBuilder: React.FunctionComponent = () => {
	// todo: populate search tabs from an array, use for modal too

	const [searchMode, setSearchMode] = React.useState<undefined | string>(
		undefined,
	)

	const tabs: {
		value: string
		clickValue: undefined | string
		label: string
		// icon:
		content: React.ReactNode
	}[] = [
		{
			value: 'text',
			clickValue: undefined,
			label: 'Text search',
			// icon:
			content: <>search content</>,
		},
		{
			value: 'elevation',
			clickValue: 'elevation',
			label: 'Elevation',
			// icon:
			content: <>Elevation content</>,
		},
		{
			value: 'colour',
			clickValue: 'colour',
			label: 'Colour',
			// icon:
			content: <>Colour content</>,
		},
	]

	return (
		<>
			<MantineCore.Modal
				opened={typeof searchMode !== 'undefined'}
				onClose={() => setSearchMode(undefined)}
				title="Construct a search query"
			>
				searchMode: {searchMode}
				<MantineCore.Tabs variant="outline" value={searchMode}>
					<MantineCore.Tabs.List>
						{tabs.map((tab, index) => (
							<MantineCore.Tabs.Tab
								key={index}
								value={tab.value}
								onClick={() => setSearchMode(tab.clickValue)}
								// icon={<IconPhoto size={14} />}
							>
								{tab.label}
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
			<MantineCore.Tabs variant="outline" radius="md" value="text">
				<MantineCore.Tabs.List>
					{tabs.map((tab, index) => (
						<MantineCore.Tabs.Tab
							key={index}
							value={tab.value}
							onClick={() => setSearchMode(tab.clickValue)}
							// icon={<IconPhoto size={14} />}
						>
							{tab.label}
						</MantineCore.Tabs.Tab>
					))}
				</MantineCore.Tabs.List>
			</MantineCore.Tabs>
		</>
	)
}

export default QueryBuilder
