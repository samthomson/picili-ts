import * as React from 'react'
import * as MantineCore from '@mantine/core'

const QueryBuilder: React.FunctionComponent = () => {
	// todo: populate search tabs from an array, use for modal too

	const [searchMode, setSearchMode] = React.useState<undefined | string>(
		undefined,
	)

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
						<MantineCore.Tabs.Tab
							value="text"
							onClick={() => setSearchMode(undefined)}
							// icon={<IconPhoto size={14} />}
						>
							Text search
						</MantineCore.Tabs.Tab>
						<MantineCore.Tabs.Tab
							value="elevation"
							onClick={() => setSearchMode('elevation')}
							// icon={<IconMessageCircle size={14} />}
						>
							Elevation
						</MantineCore.Tabs.Tab>
						<MantineCore.Tabs.Tab
							value="colour"
							onClick={() => setSearchMode('colour')}
							// icon={<IconSettings size={14} />}
						>
							Colour
						</MantineCore.Tabs.Tab>
					</MantineCore.Tabs.List>

					<MantineCore.Tabs.Panel value="elevation" pt="xs">
						Messages tab content
					</MantineCore.Tabs.Panel>

					<MantineCore.Tabs.Panel value="colour" pt="xs">
						Settings tab content
					</MantineCore.Tabs.Panel>
				</MantineCore.Tabs>
			</MantineCore.Modal>
			<MantineCore.Tabs variant="outline" radius="md" value="text">
				<MantineCore.Tabs.List>
					<MantineCore.Tabs.Tab
						value="text"
						// icon={<IconPhoto size={14} />}
					>
						Text search
					</MantineCore.Tabs.Tab>
					<MantineCore.Tabs.Tab
						value="elevation"
						// icon={<IconMessageCircle size={14} />}
						onClick={() => setSearchMode('elevation')}
					>
						Elevation
					</MantineCore.Tabs.Tab>
					<MantineCore.Tabs.Tab
						value="colour"
						// icon={<IconSettings size={14} />}
						onClick={() => setSearchMode('colour')}
					>
						Colour
					</MantineCore.Tabs.Tab>
				</MantineCore.Tabs.List>
			</MantineCore.Tabs>
		</>
	)
}

export default QueryBuilder
