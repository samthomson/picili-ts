import * as React from 'react'
import useMeasure from 'react-use-measure'

import * as Types from '@shared/declarations'
import * as HelperUtil from 'src/util/helper'

interface IProps {
	searchResults: Types.API.SearchResultItem[]
}

type Row = Types.API.SearchResultItem[]

const JustifiedImageGallery = ({ searchResults }: IProps) => {
	const [rows, setRows] = React.useState<Row[]>([])
	const [ref, bounds] = useMeasure()
	const [width, setWidth] = React.useState<number>(0)

	React.useEffect(() => {
		setWidth(bounds?.width ?? 0)
	}, [bounds])

	React.useEffect(() => {
		calculateJustifiedImageGallery()
	}, [searchResults])

	const calculateJustifiedImageGallery = () => {
		const holdingRows: Row[] = []
		let rowInProgress: Row = []

		for (
			let resultNo = 0, added = 1;
			resultNo < searchResults.length;
			resultNo++, added++
		) {
			const result = searchResults[resultNo]
			rowInProgress.push(result)
			if (added % 3 === 0) {
				holdingRows.push(rowInProgress)
				rowInProgress = []
			}
		}
		if (rowInProgress.length > 0) {
			holdingRows.push(rowInProgress)
			rowInProgress = []
		}
		setRows(holdingRows)
	}

	return (
		<div ref={ref}>
			{width}
			{/* display each row */}
			{rows.map((row, rowIndex) => {
				return (
					<div key={rowIndex}>
						{/* and every image in each row*/}
						{row.map((result, id) => {
							return (
								<img
									title={result.uuid}
									key={id}
									src={HelperUtil.thumbPath(
										result.userId,
										result.uuid,
										'm',
									)}
								/>
							)
						})}
					</div>
				)
			})}
		</div>
	)
}

export default JustifiedImageGallery
