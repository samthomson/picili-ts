import * as React from 'react'

// import SearchPageTemplate from 'src/components/pages//SearchPages/SearchPageTemplate'
import PageTemplate from 'src/components/pages/PageTemplate'

const HomePage: React.FunctionComponent = () => {
	return (
		<PageTemplate>
			<div id="side-menu">
				<ul>
					<li>a</li>
					<li>b</li>
					<li>c</li>
					<li>d</li>
				</ul>
			</div>
			<div id="results-space">[home page]</div>
		</PageTemplate>
	)
}

export default HomePage
