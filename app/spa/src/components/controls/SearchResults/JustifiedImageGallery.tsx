import * as React from 'react'
import useMeasure from 'react-use-measure'

import * as Types from '@shared/declarations'
import * as HelperUtil from 'src/util/helper'

interface IProps {
	searchResults: Types.API.SearchResultItem[]
}

interface ScaledSearchResultItem extends Types.API.SearchResultItem {
	scaledWidth: number
	scaledHeight: number
}

type Row = ScaledSearchResultItem[]

const JustifiedImageGallery: React.FunctionComponent<IProps> = ({
	searchResults,
}) => {
	const [rows, setRows] = React.useState<Row[]>([])
	const [ref, bounds] = useMeasure()
	const [width, setWidth] = React.useState<number>(0)

	React.useEffect(() => {
		setWidth(bounds?.width ?? 0)

		if (width > 0 && searchResults) {
			calculateJustifiedImageGallery()
		}
	}, [bounds, searchResults])

	const calculateJustifiedImageGallery = () => {
		const holdingRows: Row[] = []
		let rowInProgress: Row = []
		const rowHeights: number[] = []

		const baseRowHeight = 300
		let currentRowHeight = baseRowHeight
		const marginSize = 8
		const scrollMargin = 0 //24 // seems to work

		let imagesInRow = 0
		let runningWidth = 0

		const availableWidth = width - scrollMargin

		for (
			let resultNo = 0, added = 1;
			resultNo < searchResults.length;
			resultNo++, added++
		) {
			// add image to current row under construction
			const result = searchResults[resultNo]
			rowInProgress.push({
				...result,
				scaledWidth: result.mediumWidth,
				scaledHeight: result.mediumHeight,
			})
			imagesInRow++

			// get shortest in row
			// take the first height as a base
			let shortestImageInRowHeight = rowInProgress[0].mediumHeight
			for (
				let rowHeightCheck = 1;
				rowHeightCheck < rowInProgress.length;
				rowHeightCheck++
			) {
				if (
					rowInProgress[rowHeightCheck].mediumHeight <
					shortestImageInRowHeight
				) {
					shortestImageInRowHeight =
						rowInProgress[rowHeightCheck].mediumHeight
				}
			}

			// scale each to that height
			runningWidth = 0
			for (
				let scaleEachInRow = 0;
				scaleEachInRow < rowInProgress.length;
				scaleEachInRow++
			) {
				const scaleFactor =
					shortestImageInRowHeight /
					rowInProgress[scaleEachInRow].mediumHeight
				const scaledHeight =
					rowInProgress[scaleEachInRow].mediumHeight * scaleFactor
				const scaledWidth =
					rowInProgress[scaleEachInRow].mediumWidth * scaleFactor

				rowInProgress[scaleEachInRow].scaledHeight = scaledHeight
				rowInProgress[scaleEachInRow].scaledWidth = scaledWidth

				runningWidth += scaledWidth
			}

			// when over limit, calculate scaling factor, and add to structure of rows
			const runningMarginWidth = marginSize * (imagesInRow - 1)
			const runningWidthIncludingMargins =
				runningWidth + runningMarginWidth

			if (runningWidth > availableWidth - runningMarginWidth) {
				const iOversizedRatio =
					runningWidth / (availableWidth - runningMarginWidth)
				const rowHeight = shortestImageInRowHeight / iOversizedRatio

				for (
					let iFinalScaleEachInRow = 0;
					iFinalScaleEachInRow < rowInProgress.length;
					iFinalScaleEachInRow++
				) {
					rowInProgress[iFinalScaleEachInRow].scaledHeight =
						rowInProgress[iFinalScaleEachInRow].scaledHeight /
						iOversizedRatio
					rowInProgress[iFinalScaleEachInRow].scaledWidth =
						rowInProgress[iFinalScaleEachInRow].scaledWidth /
						iOversizedRatio
				}
				// add all to row and reset
				holdingRows.push(rowInProgress)

				rowInProgress = []
				runningWidth = 0
				imagesInRow = 0
				currentRowHeight = baseRowHeight

				rowHeights.push(rowHeight)
			} else {
				// put left over images into a row somehow? or squeeze into previous?
				if (resultNo === searchResults.length - 1) {
					// we're at the end
					holdingRows.push(rowInProgress)
					// to do, not 300 but it's actual height
					rowHeights.push(rowInProgress[0].scaledHeight) // default
				}
			}
		}

		setRows(holdingRows)
	}

	return (
		<div ref={ref} id="justified-gallery">
			{width}
			{/* display each row */}
			{rows.map((row, rowIndex) => {
				return (
					<div key={rowIndex} className="justified-row">
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
									width={`${result.scaledWidth}px`}
									height={`${result.scaledHeight}px`}
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
