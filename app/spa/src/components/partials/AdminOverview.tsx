import React from 'react'
import { useQuery, gql } from '@apollo/client'
import * as MantineCore from '@mantine/core'

import * as Types from '@shared/declarations'

const adminOverviewQuery = gql`
	query adminOverview {
		adminOverview {
			corruptFiles
			dropboxFileCount
			fileCount
			searchableFilesCount
		}

		taskProcessor {
			storageStates {
				storageSpaceFull {
					value
					updatedAt
				}
				imageProcessingDirFull {
					value
					updatedAt
				}
				videoProcessingDirFull {
					value
					updatedAt
				}
			}
		}
	}
`

const AdminOverview: React.FunctionComponent = () => {
	const { loading, error, data } = useQuery(adminOverviewQuery, {
		fetchPolicy: 'cache-and-network',
	})

	if (loading) {
		return (
			<MantineCore.LoadingOverlay
				visible={true}
				overlayBlur={2}
				loaderProps={{ color: 'maroon' }}
			/>
		)
	}

	if (error) {
		return <>{error?.message}</>
	}

	const {
		corruptFiles,
		dropboxFileCount,
		fileCount,
		searchableFilesCount,
	}: Types.API.AdminOverview = data?.adminOverview

	const { storageStates }: Types.API.TaskProcessor = data?.taskProcessor

	const storageValuesToShow = storageStates
		? [
				{
					label: 'Disk full',
					value: storageStates.storageSpaceFull.value,
					updatedAt: storageStates.storageSpaceFull.updatedAt,
				},
				{
					label: 'Image processing dir full',
					value: storageStates.imageProcessingDirFull.value,
					updatedAt: storageStates.imageProcessingDirFull.updatedAt,
				},
				{
					label: 'Video processing dir full',
					value: storageStates.videoProcessingDirFull.value,
					updatedAt: storageStates.videoProcessingDirFull.updatedAt,
				},
		  ]
		: []

	return (
		<React.Fragment>
			<h3 className="admin-page-title">summary</h3>
			<MantineCore.Table>
				<tbody>
					<tr>
						<td># dropbox files</td>
						<td>{dropboxFileCount}</td>
					</tr>
					<tr>
						<td># files</td>
						<td>{fileCount}</td>
					</tr>
					<tr>
						<td># searchable files</td>
						<td>{searchableFilesCount}</td>
					</tr>

					<tr>
						<td>corrupt files</td>
						<td>
							{corruptFiles.map((file, corruptFileIndex) => (
								<li key={corruptFileIndex}>
									{file}
									<br />
								</li>
							))}
						</td>
					</tr>
				</tbody>
			</MantineCore.Table>

			{storageStates && (
				<>
					<h4>Storage</h4>
					<MantineCore.Table>
						<thead>
							<tr>
								<th></th>
								<th></th>
								<th>since</th>
							</tr>
						</thead>
						<tbody>
							{storageValuesToShow.map(
								({ label, value, updatedAt }, key) => {
									return (
										<tr key={key}>
											<td>{label}</td>
											<td>{String(value)}</td>
											<td>{updatedAt}</td>
										</tr>
									)
								},
							)}
						</tbody>
					</MantineCore.Table>
				</>
			)}
			{storageStates.storageSpaceFull.value && (
				<p>
					<strong>syncing indefinitely blocked</strong>. Picili is
					currently out of space to generate more thumbnails, so
					won&apos;t be able to import new files (sync).
				</p>
			)}

			{storageStates.imageProcessingDirFull.value ||
				(storageStates.videoProcessingDirFull.value && (
					<p>
						<strong>syncing temporarily blocked</strong>. One or
						both (image / video) processing dir(s) are currently
						full, picili won&apost be able to import (sync){' '}
						<strong>temporarily</strong> until the currently
						processing files in that directory have been processed.
					</p>
				))}
		</React.Fragment>
	)
}

export default AdminOverview
