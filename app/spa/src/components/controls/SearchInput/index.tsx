import * as React from 'react'
import * as ReactRedux from 'react-redux'
import { NavLink, useLocation } from 'react-router-dom'
import {
	Center,
	Box,
	SegmentedControl,
	Paper,
	UnstyledButton,
} from '@mantine/core'
import { IconLayout2, IconMap2, IconX } from '@tabler/icons'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

import IndividualQuery from './IndividualQuery'
import QueryInput from './QueryInput'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'

const SearchInput: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const individualQueries = ReactRedux.useSelector(
		Selectors.searchIndividualQueries,
	)
	const isSearching = ReactRedux.useSelector(Selectors.searchIsSearching)

	const resetQuery = () => dispatch(Actions.searchQueryReset())
	const isMobile = useIsMobile()
	const location = useLocation()

	return (
		<div id="search-bar">
			<div id="search-input">
				<Paper shadow="md">
					<div id="quey-input-and-close-button">
						<div id="queries-and-input">
							{individualQueries.map((individualQuery, index) => (
								<IndividualQuery
									key={index}
									individualQuery={individualQuery}
									disabled={isSearching}
								/>
							))}
							<QueryInput disabled={isSearching} />
							{isSearching && <>[searching icon/spinner]</>}
						</div>
						<div id="clear-button-space">
							{individualQueries.length > 0 && (
								<UnstyledButton
									onClick={resetQuery}
									title="clear all queries"
								>
									<IconX size={20} />
								</UnstyledButton>
							)}
						</div>
					</div>
				</Paper>
			</div>
			{!isMobile && (
				<div id="search-mode-toggle">
					<SegmentedControl
						size="md"
						value={location.pathname === '/' ? 'grid' : 'map'}
						data={[
							{
								value: 'grid',
								label: (
									<NavLink exact={true} to="/">
										<Center>
											<IconLayout2 size={16} />
											<Box ml={10}>Grid</Box>
										</Center>
									</NavLink>
								),
							},
							{
								value: 'map',
								label: (
									<NavLink exact={true} to="/map">
										<Center>
											<IconMap2 size={16} />
											<Box ml={10}>Map</Box>
										</Center>
									</NavLink>
								),
							},
						]}
					/>
				</div>
			)}
		</div>
	)
}

export default SearchInput
