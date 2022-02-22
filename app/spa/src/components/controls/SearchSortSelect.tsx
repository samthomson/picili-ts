import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'

interface IProps {
	searchSorting?: Types.API.SearchResultsSorting
}

const SearchSortSelect: React.FunctionComponent<IProps> = ({
	searchSorting,
}) => {
	const dispatch = ReactRedux.useDispatch()

	const setMode = (mode: Types.SearchSortEnum) => {
		dispatch(Actions.sortModeSet(mode))
		dispatch(Actions.attemptSearch())
	}

	if (!searchSorting) {
		return <></>
	}
	const { sortModesAvailable, sortUsed } = searchSorting
	return (
		<div id="sort-select">
			<ul>
				{sortModesAvailable.map((mode, sortModeIndex) => (
					<li key={sortModeIndex}>
						{mode === sortUsed ? (
							<strong>{mode}</strong>
						) : (
							<button onClick={() => setMode(mode)}>
								{mode}
							</button>
						)}
					</li>
				))}
			</ul>
		</div>
	)
}

export default SearchSortSelect
