import * as React from 'react'
import mapboxgl, { Map, Marker, LngLatBounds } from 'mapbox-gl'

import * as Types from '@shared/declarations'

mapboxgl.accessToken =
	'pk.eyJ1IjoiZzRmZDVnNGY1ZDRnNmQiLCJhIjoiY2t5b3E1N2FjMDJuYjJ1bzFmN2s0OGR6ZyJ9.MTbWLnLDn8G_5GIXUononA'

interface IProps {
	results: Types.API.SearchResultItem[]
	boundsChanged: (bounds: Types.Core.MapBounds) => void
}

const MapControl: React.FunctionComponent<IProps> = ({
	results,
	boundsChanged,
}) => {
	const mapContainerRef = React.useRef(null)
	const [map, setMap] = React.useState<Map | undefined>(undefined)
	const [markers, setMarkers] = React.useState<Marker[]>([])

	const mapBoundsChanged = (bounds: LngLatBounds) => {
		boundsChanged(JSON.parse(JSON.stringify(bounds)))
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
			mapBoundsChanged(newMap.getBounds())
		})
		newMap.on('load', () => {
			// map loaded, raise bounds event to seed first results
			mapBoundsChanged(newMap.getBounds())
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
			results.forEach((result) => {
				if (map && result?.latitude && result?.longitude) {
					const marker = new mapboxgl.Marker()
						.setLngLat([result.longitude, result.latitude])
						.addTo(map)
					newMarkersBeingAdded.push(marker)
				}
			})
			setMarkers(newMarkersBeingAdded)
		}
	}, [results])

	return <div id="map-container" ref={mapContainerRef} />
}

export default MapControl
