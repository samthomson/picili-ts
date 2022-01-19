import * as React from 'react'

interface IProps {
	currentTextInputValue: string
}

const TypeAhead: React.FunctionComponent<IProps> = ({
	currentTextInputValue,
}) => {
	// todo: effect watching for `currentTextInputValue` changing, if something call typeahead service
	// todo: effect watching `currentTextInputValue` changing from something to nothing, cancel any request
	// todo: likewise cancel on unmount

	if (!currentTextInputValue) {
		return <></>
	}
	return (
		<div id="type-ahead">[type-ahead ui for {currentTextInputValue}]</div>
	)
}

export default TypeAhead
