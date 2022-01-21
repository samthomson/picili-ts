import * as React from 'react'

import PageTemplate from 'src/components/pages/PageTemplate'
import SideMenu from 'src/components/partials/SideMenu'
import SearchInput from 'src/components/controls/SearchInput'

interface Props {
	children: React.ReactNode
}

const SearchPageTemplate: React.FunctionComponent<Props> = ({
	children,
}: Props) => {
	return (
		<PageTemplate>
			<div id="side-menu">
				<SideMenu />
			</div>
			<div id="results-space">
				<SearchInput />
				{children}
			</div>
		</PageTemplate>
	)
}

export default SearchPageTemplate
