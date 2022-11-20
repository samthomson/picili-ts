import * as React from 'react'
import * as ReactRedux from 'react-redux'
import classNames from 'classnames'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as HelperUtil from 'src/util/helper'

import LightboxInfo from './LightboxInfo'

const Lightbox: React.FunctionComponent = () => {
	const [isInfoShowing, setIsInfoShowing] = React.useState<boolean>(false)
	const dispatch = ReactRedux.useDispatch()

	const lightboxIndex = ReactRedux.useSelector(Selectors.lightboxIndex)

	React.useEffect(() => {
		if (typeof lightboxIndex === 'number') {
			// preload neighbors
			const neighbours = [
				lightboxIndex - 2,
				lightboxIndex - 1,
				lightboxIndex + 1,
				lightboxIndex + 2,
				lightboxIndex + 3,
				lightboxIndex + 4,
			]
			const realNeighbours = neighbours.filter((index) => results[index])
			realNeighbours.forEach((preloadIndex) => {
				const { userId, uuid } = results[preloadIndex]
				let image = new Image()
				image.src = HelperUtil.thumbPath(userId, uuid, 'xl')
				// cleanup
				// @ts-expect-error it is intentionally we set it to a non htmlelement value, we do that to force clean the memory as otherwise iterating through many lightbox images could lead to high memory usage
				image = null
			})
		}
	}, [lightboxIndex])

	const results = ReactRedux.useSelector(Selectors.searchResults)

	const result =
		typeof lightboxIndex === 'number' ? results[lightboxIndex] : undefined

	const close = () => {
		setIsInfoShowing(false)
		dispatch(Actions.lightboxClose())
	}

	const previous = () => dispatch(Actions.lightboxPrevious())
	const next = () => dispatch(Actions.lightboxNext())

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
						<LightboxInfo
							isShowing={isInfoShowing}
							fileId={result.fileId}
						/>
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
