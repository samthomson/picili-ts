import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Types from '@shared/declarations'
import { Store } from 'src/redux/store'

interface IProps {
	searchResults?: Types.API.SearchResultItem[]
}

const TestSearchResults: React.FunctionComponent<IProps> = ({
	searchResults = [],
}) => {
	return (
		<React.Fragment>
			{searchResults.map((result, id) => {
				return (
					<img
						title={result.uuid}
						key={id}
						src={`${window.location.protocol}//${window.location.hostname}:3501/thumbs/3/${result.uuid}/s.jpg`}
					/>
				)
			})}
		</React.Fragment>
	)
}

const mapStateToProps = (state: Store) => {
	const searchResults = state?.searchResult?.items ?? []

	return {
		searchResults,
	}
}

export default ReactRedux.connect(mapStateToProps, null)(TestSearchResults)
