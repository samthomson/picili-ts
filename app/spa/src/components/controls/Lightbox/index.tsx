import * as React from 'react'

import LightboxInfo from './LightboxInfo'

const Lightbox: React.FunctionComponent = () => {
	// get lightboxIndex from redux

	const [isInfoShowing, setIsInfoShowing] = React.useState<boolean>(false)

	return (
		<div id="lightbox">
			<LightboxInfo isShowing={isInfoShowing} />
			<button onClick={() => setIsInfoShowing(!isInfoShowing)}>
				show/hide info
			</button>
		</div>
	)
}

export default Lightbox
