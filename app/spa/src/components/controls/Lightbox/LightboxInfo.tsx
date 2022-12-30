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
		}
	}
`

interface IProps {
	isShowing: boolean
	fileId: number
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

	const searchFromTag = (tagValue: string) => {
		dispatch(Actions.searchQueryAdd({ value: tagValue }))
		dispatch(Actions.attemptSearch())
		// close the lightbox
		dispatch(Actions.lightboxClose())
	}
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

			<p>
				{fileInfo?.pathOnDropbox && (
					<>on dropbox: {fileInfo.pathOnDropbox} </>
				)}
			</p>
			{fileInfo?.tags && (
				<table>
					<tbody>
						{fileInfo.tags.map((tag, tagIndex) => (
							<tr key={tagIndex}>
								<td>
									{tag.type}
									{tag?.subtype ? `: ${tag.subtype}` : ''}
								</td>
								<td>
									{/* todo: later ensure this has a cursor:
									pointer */}
									<a onClick={() => searchFromTag(tag.value)}>
										{tag.value}
									</a>
								</td>
								<td>{tag.confidence}%</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</>
	)
}

export default LightboxInfo
