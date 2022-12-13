import * as React from 'react'
import * as ReactRedux from 'react-redux'
import classNames from 'classnames'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as HelperUtil from 'src/util/helper'

import LightboxInfo from './LightboxInfo'
import VideoJS from './VideoJS'

import * as Enums from '../../../../../shared/enums'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'

const Lightbox: React.FunctionComponent = () => {
	const [isInfoShowing, setIsInfoShowing] = React.useState<boolean>(false)
	const [isCurrentlyPlayingVideo, setIsCurrentlyPlayingVideo] =
		React.useState<boolean>(false)
	const dispatch = ReactRedux.useDispatch()

	const lightboxIndex = ReactRedux.useSelector(Selectors.lightboxIndex)

	React.useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			// escape
			if (event.key === 'Escape') {
				close()
			}
			// left
			if (event.key === 'ArrowLeft') {
				previous()
			}
			// right
			if (event.key === 'ArrowRight') {
				next()
			}
			// i
			if (event.key === 'i') {
				toggleInfo()
			}
		}
		window.addEventListener('keydown', handleKeyPress)

		return () => {
			window.removeEventListener('keydown', handleKeyPress)
		}
	}, [])

	const toggleInfo = () => setIsInfoShowing((prev) => !prev)

	React.useEffect(() => {
		setIsCurrentlyPlayingVideo(false)
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
	// todo: title text on buttons

	const previous = () => dispatch(Actions.lightboxPrevious())
	const next = () => dispatch(Actions.lightboxNext())

	const options = result && {
		controls: false,
		// for now just loading the video works fine (as the first frame is displayed), if later loading times are problematic then I could reinstate this 'poster' image - which is preloaded from neighbors and ultimately quick to load otherwise.
		// poster: HelperUtil.thumbPath(result.userId, result.uuid, 'xl'),
		sources: [
			{
				src: HelperUtil.thumbPath(
					result.userId,
					result.uuid,
					'mp4',
					'mp4',
				),
				type: 'video/mp4',
			},
			{
				src: HelperUtil.thumbPath(
					result.userId,
					result.uuid,
					'webm',
					'webm',
				),
				type: 'video/webm',
			},
		],
	}

	const isMobile = useIsMobile()

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
							'with-info': isInfoShowing && !isMobile,
							'with-video-controls':
								result.fileType === Enums.FileType.VIDEO,
						})}
					>
						{result.fileType === Enums.FileType.IMAGE && (
							<div id="lightbox-image">
								<img
									src={HelperUtil.thumbPath(
										result.userId,
										result.uuid,
										'xl',
									)}
								/>
							</div>
						)}
						{result.fileType === Enums.FileType.VIDEO && options && (
							<div style={{ height: '100%' }}>
								<div id="lightbox-video">
									<div id="video-wrapper">
										<VideoJS
											options={options}
											key={result.uuid}
											isPlaying={isCurrentlyPlayingVideo}
											setVideoPlayingState={
												setIsCurrentlyPlayingVideo
											}
										/>
									</div>
									<div
										id="video-control-space"
										className={classNames({
											open:
												result.fileType ===
												Enums.FileType.VIDEO,
										})}
									>
										<button
											id="lightbox-play"
											onClick={() => {
												// attempt to play video
												setIsCurrentlyPlayingVideo(
													!isCurrentlyPlayingVideo,
												)
											}}
										>
											{isCurrentlyPlayingVideo
												? 'pause'
												: 'play'}
										</button>{' '}
										[fullscreen]
									</div>
								</div>
							</div>
						)}
						<div id="info-underneath">
							{isMobile && (
								<LightboxInfo
									isShowing={isInfoShowing}
									fileId={result.fileId}
								/>
							)}
						</div>
					</div>

					<div
						id="lightbox-file-info"
						className={classNames({
							'with-info': isInfoShowing && !isMobile,
						})}
					>
						{!isMobile && (
							<LightboxInfo
								isShowing={isInfoShowing}
								fileId={result.fileId}
							/>
						)}
					</div>

					<button
						id="lightbox-info"
						className="lightbox-button"
						onClick={toggleInfo}
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
