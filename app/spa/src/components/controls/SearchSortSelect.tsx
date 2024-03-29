import * as React from 'react'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
import * as HelperUtil from 'src/util/helper'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'

interface IProps {
	searchSorting?: Types.API.SearchResultsSorting
}

const SearchSortSelect: React.FunctionComponent<IProps> = ({
	searchSorting,
}) => {
	const dispatch = ReactRedux.useDispatch()
	const isMobile = useIsMobile()

	const setMode = (mode: Types.SearchSortEnum) => {
		dispatch(Actions.sortModeSet(mode))
		dispatch(
			Actions.attemptSearch(HelperUtil.shouldIRequestGeoAggregations()),
		)
	}

	if (!searchSorting) {
		return <></>
	}
	const { sortModesAvailable, sortUsed } = searchSorting

	const transformText = (text: string) =>
		text.toLowerCase().replaceAll('_', ' ')
	// todo: memoize
	const menuItems = sortModesAvailable.map((mode) => {
		return {
			label: transformText(mode),
			value: mode,
			active: mode === sortUsed,
			// icon: ,
		}
	})
	return (
		<div id="sort-select">
			<MantineCore.Menu shadow="md" width={200}>
				<MantineCore.Menu.Target>
					<MantineCore.Button
						variant="outline"
						color="gray"
						radius="md"
						size="xs"
						rightIcon={<Icons.IconChevronDown size={14} />}
					>
						{isMobile ? (
							<span>Sort</span>
						) : (
							<>
								<span style={{ marginRight: 4 }}>Sort by:</span>
								<span className="sort-capitalised">
									{searchSorting.sortUsed
										.replaceAll('_', ' ')
										.toLowerCase()}
								</span>
							</>
						)}
					</MantineCore.Button>
				</MantineCore.Menu.Target>

				<MantineCore.Menu.Dropdown>
					{menuItems.map((mode, sortModeIndex) => (
						<MantineCore.Menu.Item
							key={sortModeIndex}
							rightSection={
								mode.active && <Icons.IconCheck size={14} />
							}
							disabled={mode.active}
							onClick={() => setMode(mode.value)}
							className="sort-capitalised"
							// icons={mode.icon}
						>
							{mode.label}
						</MantineCore.Menu.Item>
					))}
				</MantineCore.Menu.Dropdown>
			</MantineCore.Menu>
		</div>
	)
}

export default SearchSortSelect
