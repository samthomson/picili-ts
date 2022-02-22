import * as React from 'react'
import { useQuery, gql } from '@apollo/client'

import * as Types from '@shared/declarations'

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

	return (
		<>
			<p>{fileInfo?.address && <>address: {fileInfo.address} </>}</p>
			<p>{fileInfo?.datetime && <>datetime: {fileInfo.datetime} </>}</p>
			<p>
				{fileInfo?.location && (
					<>
						location: {fileInfo.location.latitude},
						{fileInfo.location.longitude}{' '}
					</>
				)}
			</p>
			<p>
				{fileInfo?.elevation && <>elevation: {fileInfo.elevation}m </>}
			</p>
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
								<td>{tag.value}</td>
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
