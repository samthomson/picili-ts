import * as React from 'react'
import * as ReactRedux from 'react-redux'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
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
					/>
				)
			})}
		</div>
	)
}

export default TiledImageGallery
