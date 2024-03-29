import * as React from 'react'
import mapboxgl, { Map, Marker, LngLatBounds } from 'mapbox-gl'

import * as Types from '@shared/declarations'
import * as HelperUtil from 'src/util/helper'

// todo: is it okay for this to be hard coded?
mapboxgl.accessToken =
	'pk.eyJ1IjoiZzRmZDVnNGY1ZDRnNmQiLCJhIjoiY2t5b3E1N2FjMDJuYjJ1bzFmN2s0OGR6ZyJ9.MTbWLnLDn8G_5GIXUononA'

interface IProps {
	searchResultClusters: Types.API.GeoCluster[]
	boundsChanged: (bounds: Types.Core.MapBounds, zoom: number) => void
}

const MapControl: React.FunctionComponent<IProps> = ({
	searchResultClusters,
	boundsChanged,
}) => {
	const mapContainerRef = React.useRef(null)
	const [map, setMap] = React.useState<Map | undefined>(undefined)
	const [markers, setMarkers] = React.useState<Marker[]>([])

	const mapBoundsChanged = (bounds: LngLatBounds, zoom: number) => {
		// const validBounds = {
		// 	_sw: {
		// 		lng: bounds._sw?.lng % 180,
		// 		lat: bounds._sw?.lat % 85,
		// 	},
		// 	_ne: {
		// 		lng: bounds._ne?.lng % 180,
		// 		lat: bounds._ne?.lat % 85,
		// 	},
		// }
		// const swLessThanNW = bounds._sw?.lng < bounds._ne?.lng
		// const swLessThanNW =
		// 	HelperUtil.mod(bounds._sw?.lng, 180) <
		// 	HelperUtil.mod(bounds._ne?.lng, 180)

		// const validBounds = {
		// 	_sw: {
		// 		lng: !swLessThanNW ? bounds._ne?.lng : bounds._sw?.lng,
		// 		lat: bounds._sw?.lat,
		// 	},
		// 	_ne: {
		// 		lng: swLessThanNW ? bounds._ne?.lng : bounds._sw?.lng,
		// 		lat: bounds._ne?.lat,
		// 	},
		// // }
		// const validBounds = {
		// 	_sw: {
		// 		// lng: HelperUtil.mod(bounds._sw?.lng, 180),
		// 		lng: bounds._sw?.lng,
		// 		// lng: swLessThanNW
		// 		// 	? HelperUtil.mod(bounds._sw?.lng, 180)
		// 		// 	: HelperUtil.mod(bounds._ne?.lng, 180),
		// 		lat: bounds._sw?.lat,
		// 	},
		// 	_ne: {
		// 		// lng: HelperUtil.mod(bounds._ne?.lng, 180),
		// 		lng: bounds._ne?.lng,
		// 		// lng: swLessThanNW
		// 		// 	? HelperUtil.mod(bounds._ne?.lng, 180)
		// 		// 	: HelperUtil.mod(bounds._sw?.lng, 180),
		// 		lat: bounds._ne?.lat,
		// 	},
		// }
		const validBounds = {
			_sw: bounds.getSouthWest().wrap(),
			_ne: bounds.getNorthEast().wrap(),
			// _ne: {
			// 	// lng: HelperUtil.mod(bounds._ne?.lng, 180),
			// 	lng: bounds._ne?.lng,
			// 	// lng: swLessThanNW
			// 	// 	? HelperUtil.mod(bounds._ne?.lng, 180)
			// 	// 	: HelperUtil.mod(bounds._sw?.lng, 180),
			// 	lat: bounds._ne?.lat,
			// },
		}

		// .getSouthWest()
		// .wrap()
		// console.log('bounds', bounds)
		// console.log('validBounds', validBounds)
		// console.log('data', {
		// 	// swLessThanNW,
		// 	// swLon: bounds._sw?.lng,
		// 	// swLonMod: HelperUtil.mod(bounds._sw?.lng, 180),
		// 	// neLon: bounds._ne?.lng,
		// 	// neLonMod: HelperUtil.mod(bounds._ne?.lng, 180),
		// 	bounds,
		// 	validBounds,
		// })
		boundsChanged(JSON.parse(JSON.stringify(validBounds)), zoom)
	}

	// initialize map when component mounts
	React.useEffect(() => {
		// if (!map) {
		const newMap = new mapboxgl.Map({
			container: mapContainerRef?.current ?? 'loading',
			// See style options here: https://docs.mapbox.com/api/maps/#styles
			style: 'mapbox://styles/mapbox/outdoors-v11',
			center: [0, 0],
			zoom: 1,
		})

		// add navigation control (the +/- zoom buttons)
		newMap.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

		newMap.on('moveend', (e) => {
			if (e.breakonfitbounds) {
				return
			}
			// pan or zoom occured - raise bounds event
			mapBoundsChanged(newMap.getBounds(), newMap.getZoom())
		})
		newMap.on('load', () => {
			// immediately 'resize' so that the maps internal bounds are correct for later raising such events
			newMap.resize()
			// map loaded, raise bounds event to seed first results
			mapBoundsChanged(newMap.getBounds(), newMap.getZoom())
		})
		setMap(newMap)

		markers.forEach((marker) => marker.remove())
		setMarkers([])

		// clean up on unmount
		return () => {
			// component unmount
			newMap.remove()
			// also remove markers
			markers.forEach((marker) => marker.remove())
			setMap(undefined)
		}
	}, [])

	// as treks change, clear current/previous markers and add new ones accordingly
	React.useEffect(() => {
		if (map) {
			// remove any existing markers
			markers.forEach((marker) => marker.remove())
			setMarkers([])

			// add all treks with locations to map
			const newMarkersBeingAdded: Marker[] = []

			searchResultClusters.forEach((cluster) => {
				if (map && cluster?.latitude && cluster?.longitude) {
					const { latitude, longitude, fileId, fileCount, userId } =
						cluster

					const el = document.createElement('div')
					el.className = 'marker'
					el.title =
						fileCount > 1
							? `${fileCount} results here`
							: fileId + ''
					// todo: tempish solution to not getting expensive uuid
					el.style.backgroundImage = `url(${HelperUtil.thumbPath(
						userId,
						fileId,
						'i',
					)})`
					el.style.width = `32px`
					el.style.height = `32px`
					el.style.backgroundSize = '100%'

					// doesn't make sense to open the lightbox as map results are from aggregations and the lightbox is designed to work with results.

					// Add markers to the map.
					const newMarker = new mapboxgl.Marker(el)

					newMarker.setLngLat([longitude, latitude]).addTo(map)
					newMarkersBeingAdded.push(newMarker)
				}
			})

			setMarkers(newMarkersBeingAdded)
		}
	}, [searchResultClusters])

	return <div id="map-container" ref={mapContainerRef} />
}

export default MapControl
