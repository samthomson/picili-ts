import * as React from 'react'

// import SearchPageTemplate from 'src/components/pages//SearchPages/SearchPageTemplate'
import PageTemplate from 'src/components/pages/PageTemplate'
import SideMenu from 'src/components/partials/SideMenu'

const CalendarPage: React.FunctionComponent = () => {
	return (
		<PageTemplate>
			<div id="side-menu">
				<SideMenu />
			</div>
			<div id="results-space">[calendar page]</div>
		</PageTemplate>
	)
}

export default CalendarPage
