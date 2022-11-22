/*
import React from 'react'
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js'
// todo: keep this?
import 'video.js/dist/video-js.css'

export const VideoJS = (props: {
	options: VideoJsPlayerOptions
	onReady: () => void
}) => {
	const videoRef = React.useRef<VideoJsPlayer>(null)
	const playerRef = React.useRef<VideoJsPlayer>(null)
	const { options, onReady } = props

	React.useEffect(() => {
		// Make sure Video.js player is only initialized once
		if (!playerRef.current) {
			// The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
			const videoElement = document.createElement('video-js')

			videoElement.className = 'videojs-big-play-centered'
			videoRef.current?.appendChild(videoElement)

			const player = (playerRef.current = videojs(
				videoElement,
				options,
				() => {
					videojs.log('player is ready')
					onReady && onReady(player)
				},
			))

			// You could update an existing player in the `else` block here
			// on prop change, for example:
		} else {
			const player = playerRef.current

			player.autoplay(options.autoplay)
			player.src(options.sources)
		}
	}, [options, videoRef])

	// Dispose the Video.js player when the functional component unmounts
	React.useEffect(() => {
		const player = playerRef.current

		return () => {
			if (player && !player.isDisposed()) {
				player.dispose()
				playerRef.current = null
			}
		}
	}, [playerRef])

	return (
		<div data-vjs-player>
			<div ref={videoRef} />
		</div>
	)
}

export default VideoJS
*/

import React, { useEffect, useRef, useState } from 'react'
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js'
import 'video.js/dist/video-js.css'

const VideoPlayer: React.FunctionComponent<{
	key: string
	options: VideoJsPlayerOptions
	isPlaying: boolean
}> = ({ key, options, isPlaying }) => {
	const container = useRef(null)
	const player = useRef<VideoJsPlayer>()
	const [isCurrentlyPlaying, setIsCurrentlyPlaying] = useState<boolean>(false)

	useEffect(() => {
		player.current = videojs(
			container?.current ?? '[missing video or error loading?]',
			options,
		)

		return () => {
			player.current?.dispose()
		}
	}, [key])

	useEffect(() => {
		if (isPlaying !== isCurrentlyPlaying) {
			setIsCurrentlyPlaying(isPlaying)

			if (player.current?.paused()) {
				player.current?.play()
			} else {
				player.current?.pause()
			}
		}
	}, [isCurrentlyPlaying, isPlaying])

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
