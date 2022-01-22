import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as HelperUtil from 'src/util/helper'

interface IProps {
	searchResults: Types.API.SearchResultItem[]
}

const TiledImageGallery: React.FunctionComponent<IProps> = ({
	searchResults,
}) => {
	const dispatch = ReactRedux.useDispatch()

	const openLightbox = (index: number) =>
		dispatch(Actions.lightboxOpen(index))

	const refs: React.RefObject<HTMLImageElement>[] = searchResults.map(() =>
		React.createRef(),
	)

	const lightboxIndex = ReactRedux.useSelector(Selectors.lightboxIndex)

	// scroll to currently opened image
	React.useEffect(() => {
		if (typeof lightboxIndex === 'number') {
			// scroll to said image
			if (!!refs[lightboxIndex]) {
				refs[lightboxIndex]?.current?.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				})
			}
		}
	}, [lightboxIndex])

	return (
		<div id="tiled-gallery">
			{searchResults.map((result, resultIndex) => {
				return (
					<img
						title={result.uuid}
						key={resultIndex}
						src={HelperUtil.thumbPath(
							result.userId,
							result.uuid,
							's',
						)}
						onClick={() => openLightbox(resultIndex)}
						ref={refs[resultIndex]}
					/>
				)
			})}
		</div>
	)
}

export default TiledImageGallery
