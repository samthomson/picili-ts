import React, { useEffect, useRef } from 'react'
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js'
import 'video.js/dist/video-js.css'

const VideoPlayer: React.FunctionComponent<{
	key: string
	options: VideoJsPlayerOptions
	isPlaying: boolean
	setVideoPlayingState: (isPlaying: boolean) => void
}> = ({ key, options, isPlaying, setVideoPlayingState }) => {
	const container = useRef(null)
	const player = useRef<VideoJsPlayer>()

	useEffect(() => {
		player.current = videojs(
			container?.current ?? '[missing video or error loading?]',
			options,
		)

		player.current.on('ended', () => setVideoPlayingState(false))

		return () => {
			player.current?.dispose()
		}
	}, [key])

	useEffect(() => {
		if (isPlaying) {
			player.current?.play()
		} else {
			player.current?.pause()
		}
	}, [isPlaying])

	return (
		<div data-vjs-player key={key}>
			<video
				ref={container}
				style={{
					maxWidth: '100%',
					height: 'auto',
					maxHeight: '100%',
					margin: '0 auto',
					position: 'absolute',
					left: 0,
					right: 0,
				}}
			/>
		</div>
	)
}

export default VideoPlayer
