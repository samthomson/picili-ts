import * as React from 'react'

import * as Types from '@shared/declarations'

interface IProps {
	currentIndividualQuery: Types.API.IndividualSearchQuery
}

const TypeAhead: React.FunctionComponent<IProps> = ({
	currentIndividualQuery,
}) => {
	// todo: effect watching for `currentTextInputValue` changing, if something call typeahead service
	// todo: effect watching `currentTextInputValue` changing from something to nothing, cancel any request
	// todo: likewise cancel on unmount

	if (!currentIndividualQuery.value) {
		return <></>
	}
	return (
		<div id="type-ahead">
			[type-ahead ui for{' '}
			{currentIndividualQuery?.type && (
				<>[type: {currentIndividualQuery.type}] </>
			)}
			{currentIndividualQuery?.subtype && (
				<>[subtype: {currentIndividualQuery.subtype}] </>
			)}
			[value={currentIndividualQuery.value}]
		</div>
	)
}

export default TypeAhead
