import * as React from 'react'

import * as Types from '@shared/declarations'
import * as HelperUtil from 'src/util/helper'

interface IProps {
	searchResults: Types.API.SearchResultItem[]
}

const TiledImageGallery = ({ searchResults }: IProps) => {
	return (
		<>
			{searchResults.map((result, id) => {
				return (
					<img
						title={result.uuid}
						key={id}
						src={HelperUtil.thumbPath(
							result.userId,
							result.uuid,
							's',
						)}
					/>
				)
			})}
		</>
	)
}

export default TiledImageGallery
