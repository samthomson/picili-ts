import * as React from 'react'
import * as ReactRedux from 'react-redux'
import classNames from 'classnames'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as HelperUtil from 'src/util/helper'

import LightboxInfo from './LightboxInfo'

const Lightbox: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()

	const lightboxIndex = ReactRedux.useSelector(Selectors.lightboxIndex)

	const [isInfoShowing, setIsInfoShowing] = React.useState<boolean>(false)

	const close = () => {
		setIsInfoShowing(false)
		dispatch(Actions.lightboxClose())
	}

	const previous = () => dispatch(Actions.lightboxPrevious())
	const next = () => dispatch(Actions.lightboxNext())

	const results = ReactRedux.useSelector(Selectors.searchResults)

	const result =
		typeof lightboxIndex === 'number' ? results[lightboxIndex] : undefined

	return (
		<div
			id="lightbox"
			className={classNames({
				open: typeof lightboxIndex === 'number',
			})}
		>
			{result && (
				<>
					{/* <div> */}
					<div
						id="lightbox-file-content"
						className={classNames({
							'with-info': isInfoShowing,
						})}
					>
						<img
							src={HelperUtil.thumbPath(
								result.userId,
								result.uuid,
								'xl',
							)}
						/>
					</div>
					<div
						id="lightbox-file-info"
						className={classNames({
							'with-info': isInfoShowing,
						})}
					>
						{lightboxIndex}
						<LightboxInfo isShowing={isInfoShowing} />
					</div>

					<button
						id="lightbox-info"
						className="lightbox-button"
						onClick={() => setIsInfoShowing(!isInfoShowing)}
					>
						i
					</button>
					<button
						id="lightbox-left"
						className="lightbox-button"
						onClick={previous}
					>
						l
					</button>
					<button
						id="lightbox-right"
						className="lightbox-button"
						onClick={next}
					>
						r
					</button>
					{/* </div> */}
				</>
			)}
			<button
				id="lightbox-close"
				className="lightbox-button"
				onClick={close}
			>
				x
			</button>
		</div>
	)
}

export default Lightbox
