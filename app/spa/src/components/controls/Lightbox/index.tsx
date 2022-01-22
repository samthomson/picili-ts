import * as React from 'react'
import * as ReactRedux from 'react-redux'
import classNames from 'classnames'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

import LightboxInfo from './LightboxInfo'

const Lightbox: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const lightboxIndex = ReactRedux.useSelector(Selectors.lightboxIndex)

	const [isInfoShowing, setIsInfoShowing] = React.useState<boolean>(false)

	const close = () => dispatch(Actions.lightboxClose())
	const previous = () => dispatch(Actions.lightboxPrevious())
	const next = () => dispatch(Actions.lightboxNext())

	return (
		<div
			id="lightbox"
			className={classNames({
				open: !!lightboxIndex,
			})}
		>
			[{lightboxIndex}]
			<LightboxInfo isShowing={isInfoShowing} />
			<button onClick={() => setIsInfoShowing(!isInfoShowing)}>
				show/hide info
			</button>
			<button onClick={close}>close</button>
			<button onClick={previous}>left</button>
			<button onClick={next}>right</button>
		</div>
	)
}

export default Lightbox
