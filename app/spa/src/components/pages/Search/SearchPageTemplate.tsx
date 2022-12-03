import * as React from 'react'
import * as ReactRedux from 'react-redux'

import PageTemplate from 'src/components/pages/PageTemplate'
import SearchInput from 'src/components/controls/SearchInput'
import Lightbox from 'src/components/controls/Lightbox/index'
import * as Selectors from 'src/redux/selectors'

interface Props {
	children: React.ReactNode
}

const SearchPageTemplate: React.FunctionComponent<Props> = ({
	children,
}: Props) => {
	const lightboxIndex = ReactRedux.useSelector(Selectors.lightboxIndex)

	return (
		<PageTemplate>
			<Lightbox />
			{/* disable scrolling on results when the lightbox is showing to remove scrollbars there. */}
			<div
				id="results-space"
				style={{
					overflow: typeof lightboxIndex === 'number' ? 'hidden' : '',
				}}
			>
				<SearchInput />
				{children}
			</div>
		</PageTemplate>
	)
}

export default SearchPageTemplate
