import * as React from 'react'

// import SearchPageTemplate from 'src/components/pages//SearchPages/SearchPageTemplate'
import PageTemplate from 'src/components/pages/PageTemplate'
import SideMenu from 'src/components/partials/SideMenu'

const HomePage: React.FunctionComponent = () => {
	return (
		<PageTemplate>
			<div id="side-menu">
				<SideMenu />
			</div>
			<div id="results-space">[home page]</div>
		</PageTemplate>
	)
}

export default HomePage
