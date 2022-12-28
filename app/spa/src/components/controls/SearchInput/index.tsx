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
import TypeAhead from 'src/components/controls/SearchInput/TypeAhead'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'

const SearchInput: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const individualQueries = ReactRedux.useSelector(
		Selectors.searchIndividualQueries,
	)
	const isSearching = ReactRedux.useSelector(Selectors.searchIsSearching)

	const resetQuery = (e: React.SyntheticEvent) => {
		e.stopPropagation()
		dispatch(Actions.searchQueryReset())
	}
	const isMobile = useIsMobile()
	const location = useLocation()

	const typeaheadInputRef = React.useRef<HTMLInputElement>(null)

	return (
		<div id="search-bar">
			<div id="search-input">
				<Paper shadow="lg" radius="md">
					<div
						id="query-input-and-close-button"
						onClick={() => {
							// focus the text input so that we make the whole search query ui seem like a text input
							typeaheadInputRef?.current?.focus()
						}}
					>
						<div id="queries-and-input">
							{individualQueries.map((individualQuery, index) => (
								<IndividualQuery
									key={index}
									individualQuery={individualQuery}
									disabled={isSearching}
								/>
							))}
							<TypeAhead textInputRef={typeaheadInputRef} />
							{/* // todo: this is redundant now */}
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
						radius="md"
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
