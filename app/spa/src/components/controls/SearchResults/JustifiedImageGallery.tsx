import * as React from 'react'
import * as ReactRedux from 'react-redux'
import useMeasure from 'react-use-measure'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as HelperUtil from 'src/util/helper'

interface IProps {
	searchResults: Types.API.SearchResultItem[]
}

interface ScaledSearchResultItem extends Types.API.SearchResultItem {
	scaledWidth: number
	scaledHeight: number
	ref: React.RefObject<HTMLImageElement>
	index: number
}

type Row = ScaledSearchResultItem[]

const JustifiedImageGallery: React.FunctionComponent<IProps> = ({
	searchResults,
}) => {
	const dispatch = ReactRedux.useDispatch()

	const [rows, setRows] = React.useState<Row[]>([])
	const [rowHeights, setRowHeights] = React.useState<number[]>([])
	const [ref, bounds] = useMeasure()
	// commenting out unused 'lastWidth' 18.11.2022
	// const [lastWidth, setLastWidth] = React.useState<number>(0)
	// const [lastResultsCount, setLastResultsCount] = React.useState<number>(0)

	const lightboxIndex = ReactRedux.useSelector(Selectors.lightboxIndex)

	const refs: React.RefObject<HTMLImageElement>[] = searchResults.map(() =>
		React.createRef(),
	)

	const openLightbox = (index: number) =>
		dispatch(Actions.lightboxOpen(index))

	React.useEffect(() => {
		// if we have a width (div has rendered) and results, and importantly the width is different (don't recalculate unnecessarily)
		if (
			(bounds?.width ?? 0) > 0 &&
			// bounds.width !== lastWidth && // didn't render after a new search since width hadn't changed.
			searchResults
		) {
			// commenting out unused 'lastWidth' 18.11.2022
			// setLastWidth(bounds.width)
			calculateJustifiedImageGallery()
		}
	}, [bounds, searchResults])

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

	// todo: memoize this monstrosity
	const calculateJustifiedImageGallery = () => {
		const holdingRows: Row[] = []
		let rowInProgress: Row = []
		const rowHeights: number[] = []

		// unused?
		// const baseRowHeight = 300
		// unused?
		// const currentRowHeight = baseRowHeight
		const marginSize = 8
		const scrollMargin = 0 //10 //24 // seems to work

		let imagesInRow = 0
		let runningWidth = 0

		const availableWidth = (bounds?.width ?? 0) - scrollMargin

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
				ref: React.createRef(),
				index: resultNo,
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
			// unused?
			// const runningWidthIncludingMargins = runningWidth + runningMarginWidth

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
				// unused?
				// currentRowHeight = baseRowHeight

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

		setRowHeights(rowHeights)
		setRows(holdingRows)
	}

	return (
		<div ref={ref} id="justified-gallery">
			{/* display each row */}
			{searchResults.length > 0 &&
				rows.map((row, rowIndex) => {
					return (
						<div
							key={rowIndex}
							className="justified-row"
							style={{
								height: `${rowHeights[rowIndex]}px`,
							}}
						>
							{/* and every image in each row*/}
							{row.map((result, rowResultIndex) => {
								return (
									<img
										title={result.uuid}
										key={rowResultIndex}
										src={HelperUtil.thumbPath(
											result.userId,
											result.uuid,
											'm',
										)}
										width={`${result.scaledWidth}px`}
										height={`100%`}
										onClick={() =>
											openLightbox(result.index)
										}
										ref={refs[result.index]}
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
