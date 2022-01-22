import * as React from 'react'

interface IProps {
	isShowing: boolean
}

const LightboxInfo: React.FunctionComponent<IProps> = ({ isShowing }) => {
	if (!isShowing) {
		return <></>
	}

	return <>[file info]</>
}

export default LightboxInfo
