import * as React from 'react'
import * as ReactRedux from 'react-redux'
import { useQuery, gql } from '@apollo/client'
import moment from 'moment'
import * as Icons from '@tabler/icons'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
import * as HelperUtil from 'src/util/helper'

const fileInfoQuery = gql`
	query fileInfo($fileId: Int!) {
		fileInfo(fileId: $fileId) {
			address
			datetime
			location {
				latitude
				longitude
			}
			elevation
			pathOnDropbox
			tags {
				type
				subtype
				value
				confidence
			}
			mainColour {
				r
				g
				b
			}
		}
	}
`

interface IProps {
	isShowing: boolean
	fileId: number
}

// todo: memoize
const IconForType = (type: string, subtype: string) => {
	switch (true) {
		case type === 'location':
			return Icons.IconMapPin

		case type === 'exif':
		case type === 'metadata':
			return Icons.IconAperture

		case type === 'folder':
			return Icons.IconFolder

		case type === 'subject':
			return Icons.IconPhotoSearch

		case type === 'ocr' && subtype === 'text':
			return Icons.IconTextRecognition

		case type === 'ocr' && subtype === 'number_plate':
			return Icons.IconCarCrash

		case type === 'fileextension':
		case type === 'filetype':
		case type === 'filename':
			return Icons.IconFileInfo

		// case type === Enums.QueryType.ELEVATION:
		// 	return Icons.IconMountain

		// todo: plant IconPlant
		// todo: directory

		default:
			return Icons.IconQuestionMark
	}
}

// https://stackoverflow.com/a/18650828/686490
const formatBytes = (bytes: number, decimals = 2): string => {
	if (!+bytes) return '0 Bytes'

	const k = 1024
	const dm = decimals < 0 ? 0 : decimals
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const displayContentForTag = (tag: Types.API.Tag) => {
	const { type, subtype, value, confidence } = tag

	switch (true) {
		case type === 'fileextension':
			return `extension: ${value}`
		case type === 'filename':
			return `filename: ${value}`
		case type === 'filetype':
			return `type: ${value}`
		case type === 'folder':
			return `folder: ${value}`
		case type === 'location':
			return `${subtype}: ${value}`

		case type === 'exif' && subtype === 'aperture':
			return `aperture: f/${value}`

		case type === 'exif' && subtype === 'exposuretime':
			const fraction = 1 / +value
			return `exposure: 1/${fraction}`

		case type === 'exif' && subtype === 'orientation':
			return `orientation: ${+value === 1 ? 'landscape' : 'portrait'}`

		case type === 'exif' && subtype === 'focallength':
			return `${value}mm`

		case type === 'metadata' && subtype === 'length':
			return 'length: ' + HelperUtil.formatLengthToDuration(+value)

		case type === 'metadata' && subtype === 'size':
			return formatBytes(+value)

		case type === 'exif':
		case type === 'metadata':
			return `${subtype}: ${value}`

		case type === 'subject' && subtype === 'imagga':
			return `${value} (${confidence}%)`
		default:
			return `${type}.${subtype}=${value}(${confidence}%)`
	}
}

const LightboxInfo: React.FunctionComponent<IProps> = ({
	isShowing,
	fileId,
}) => {
	const dispatch = ReactRedux.useDispatch()

	const {
		error,
		data,
		loading = false,
	} = useQuery(fileInfoQuery, {
		skip: !isShowing,
		variables: { fileId },
	})

	if (!isShowing) {
		return <></>
	}
	if (loading) {
		return <>loading...</>
	}
	if (error) {
		return <>error getting file info...{error?.message || error}</>
	}

	const { fileInfo }: { fileInfo: Types.API.FileInfo } = data

	const searchFromTag = (type: string, subtype: string, tagValue: string) => {
		dispatch(Actions.searchQueryAdd({ type, subtype, value: tagValue }))
		dispatch(Actions.attemptSearch())
		// close the lightbox
		dispatch(Actions.lightboxClose())
	}

	// todo: memoize
	const tagGroups: Record<string, Types.API.Tag[]> = (() => {
		const groups: Record<string, Types.API.Tag[]> = {}
		for (let i = 0; i < fileInfo?.tags.length; i++) {
			const tag = fileInfo.tags[i]

			if (!groups?.[tag.type]) {
				groups[tag.type] = []
			}
			groups[tag.type].push(tag)
		}
		return groups
	})()
	return (
		<>
			{fileInfo?.address && (
				<div className="lightbox-information-piece">
					<Icons.IconMapPin size={14} />
					{fileInfo.address}
				</div>
			)}

			{fileInfo?.datetime && (
				<div className="lightbox-information-piece">
					<Icons.IconCalendar size={14} />
					{moment(fileInfo.datetime).format('h:mma, MMM Do Y')}{' '}
				</div>
			)}

			{fileInfo?.location && (
				<div className="lightbox-information-piece">
					<Icons.IconMap2 size={14} />
					{fileInfo.location.latitude},{fileInfo.location.longitude}
				</div>
			)}

			{fileInfo?.elevation && (
				<div className="lightbox-information-piece">
					<Icons.IconMountain size={14} />
					{HelperUtil.formatNumber(fileInfo.elevation)}m
				</div>
			)}

			{fileInfo?.pathOnDropbox && (
				<div className="lightbox-information-piece">
					<Icons.IconFolders size={14} />
					{fileInfo.pathOnDropbox}
				</div>
			)}

			{fileInfo?.mainColour && (
				<div className="lightbox-information-piece">
					<Icons.IconPalette size={14} />
					<div
						className="colour-swatch"
						style={{
							background: `rgb(${fileInfo.mainColour.r}, ${fileInfo.mainColour.g}, ${fileInfo.mainColour.b})`,
						}}
					/>
					dominant colour (rgb:{' '}
					{`${fileInfo.mainColour.r}, ${fileInfo.mainColour.g}, ${fileInfo.mainColour.b}`}
					)
				</div>
			)}

			{Object.values(tagGroups).map((group, groupIndex) => {
				return (
					<div key={groupIndex} className="lightbox-tag-group">
						{group.map((tag, tagIndex) => {
							const { type, subtype, value } = tag

							const Icon = IconForType(type, subtype)
							return (
								<div
									key={tagIndex}
									className="lightbox-tag"
									onClick={() =>
										searchFromTag(type, subtype, value)
									}
								>
									<Icon size={14} />{' '}
									<span>{displayContentForTag(tag)}</span>
								</div>
							)
						})}
					</div>
				)
			})}
		</>
	)
}

export default LightboxInfo
