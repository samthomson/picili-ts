import * as React from 'react'
import * as ReactRedux from 'react-redux'
import { NavLink, useLocation } from 'react-router-dom'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

import IndividualQuery from './IndividualQuery'
import TypeAhead from 'src/components/controls/SearchInput/TypeAhead'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'
import QueryBuilder from 'src/components/controls/SearchInput/QueryBuilder'

const SearchInput: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const individualQueries = ReactRedux.useSelector(
		Selectors.searchIndividualQueries,
	)

	const paginationInfo = ReactRedux.useSelector(
		Selectors.searchPaginationInfo,
	)

	const resetQuery = (e: React.SyntheticEvent) => {
		e.stopPropagation()
		dispatch(Actions.searchQueryReset())
		focusInput()
	}
	const isMobile = useIsMobile()
	const location = useLocation()

	const typeaheadInputRef = React.useRef<HTMLInputElement>(null)

	const onCloseModal = (): void => {
		focusInput()
	}

	const focusInput = () => {
		typeaheadInputRef?.current?.focus()
	}

	return (
		<div id="search-tabs-and-search-bar">
			<QueryBuilder closing={onCloseModal} />
			<div id="search-bar">
				<div id="search-input">
					<MantineCore.Paper shadow="lg" radius="md">
						<div
							id="query-input-and-close-button"
							// focus the text input so that we make the whole search query ui seem like a text input
							onClick={focusInput}
						>
							<div id="queries-and-input">
								{individualQueries.map(
									(individualQuery, index) => (
										<IndividualQuery
											key={index}
											individualQuery={individualQuery}
											queryStats={
												paginationInfo?.queryStats?.[
													index
												]
											}
											userId={paginationInfo?.userId}
											focusInput={focusInput}
										/>
									),
								)}
								<TypeAhead textInputRef={typeaheadInputRef} />
							</div>
							<div id="clear-button-space">
								{individualQueries.length > 0 && (
									<MantineCore.UnstyledButton
										onClick={resetQuery}
										title="clear all queries"
									>
										<Icons.IconX size={20} />
									</MantineCore.UnstyledButton>
								)}
							</div>
						</div>
					</MantineCore.Paper>
				</div>
				{!isMobile && (
					<div id="search-mode-toggle">
						<MantineCore.SegmentedControl
							size="md"
							value={location.pathname === '/' ? 'grid' : 'map'}
							radius="md"
							data={[
								{
									value: 'grid',
									label: (
										<NavLink exact={true} to="/">
											<MantineCore.Center>
												<Icons.IconLayout2 size={16} />
												<MantineCore.Box ml={10}>
													Grid
												</MantineCore.Box>
											</MantineCore.Center>
										</NavLink>
									),
								},
								{
									value: 'map',
									label: (
										<NavLink exact={true} to="/map">
											<MantineCore.Center>
												<Icons.IconMap2 size={16} />
												<MantineCore.Box ml={10}>
													Map
												</MantineCore.Box>
											</MantineCore.Center>
										</NavLink>
									),
								},
							]}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export default SearchInput
