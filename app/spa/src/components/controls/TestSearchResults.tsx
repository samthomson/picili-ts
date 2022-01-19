import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Selectors from 'src/redux/selectors'

const TestSearchResults: React.FunctionComponent = () => {
	const searchResults = ReactRedux.useSelector(Selectors.searchResults)
	const paginationInfo = ReactRedux.useSelector(
		Selectors.searchPaginationInfo,
	)
	const searchStats = ReactRedux.useSelector(Selectors.searchStats)

	return (
		<React.Fragment>
			{paginationInfo && searchStats && (
				<p>
					found {paginationInfo.totalItems} result(s){' '}
					{paginationInfo.totalItems > 0 && (
						<>in {searchStats.speed}ms</>
					)}
				</p>
			)}
			{searchResults.map((result, id) => {
				return (
					<img
						title={result.uuid}
						key={id}
						src={`${window.location.protocol}//${window.location.hostname}:3501/thumbs/${result.userId}/${result.uuid}/s.jpg`}
					/>
				)
			})}
		</React.Fragment>
	)
}

export default TestSearchResults
