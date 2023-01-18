import React from 'react'
import { useQuery, gql } from '@apollo/client'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Types from '@shared/declarations'
import * as HelperUtil from 'src/util/helper'

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
		serverData {
			diskSpaceData {
				totalSpaceBytes
				freeSpaceBytes
				usedSpaceBytes
				reservedForPiciliProcessingDirsBytes
				availableForPiciliToUse
				thumbsDirSizeBytes
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
	const serverData: Types.API.ServerData = data?.serverData

	const storageValuesToShow = storageStates
		? [
				{
					label: 'Disk full?',
					value: storageStates.storageSpaceFull.value ? (
						<MantineCore.Badge
							color="red"
							radius="md"
							variant="filled"
						>
							Full
						</MantineCore.Badge>
					) : (
						<span>no</span>
					),
					updatedAt: storageStates.storageSpaceFull.updatedAt,
				},
				{
					label: 'Image processing dir full?',
					value: storageStates.imageProcessingDirFull.value ? (
						<MantineCore.Badge
							color="orange"
							radius="md"
							variant="filled"
						>
							Full
						</MantineCore.Badge>
					) : (
						<span>no</span>
					),
					updatedAt: storageStates.imageProcessingDirFull.updatedAt,
				},
				{
					label: 'Video processing dir full?',
					value: storageStates.videoProcessingDirFull.value ? (
						<MantineCore.Badge
							color="orange"
							radius="md"
							variant="filled"
						>
							Full
						</MantineCore.Badge>
					) : (
						<span>no</span>
					),
					updatedAt: storageStates.videoProcessingDirFull.updatedAt,
				},
		  ]
		: []

	const diskDataValuesToShow = serverData?.diskSpaceData
		? [
				{
					label: 'Total space',
					value: HelperUtil.formatBytes(
						serverData.diskSpaceData.totalSpaceBytes,
					),
				},
				{
					label: 'Used space (including thumbnails)',
					value: HelperUtil.formatBytes(
						serverData.diskSpaceData.usedSpaceBytes,
					),
				},
				{
					label: 'Free space',
					value: HelperUtil.formatBytes(
						serverData.diskSpaceData.freeSpaceBytes,
					),
				},
				{
					label: 'Reserved space for processing files',
					value: HelperUtil.formatBytes(
						serverData.diskSpaceData
							.reservedForPiciliProcessingDirsBytes,
					),
				},
				{
					label: 'Thumb dir size',
					value: HelperUtil.formatBytes(
						serverData.diskSpaceData.thumbsDirSizeBytes,
					),
				},
				{
					label: 'Space picili can use (free space - reserved)',
					value: HelperUtil.formatBytes(
						serverData.diskSpaceData.availableForPiciliToUse,
					),
				},
		  ]
		: []

	return (
		<React.Fragment>
			<h3 className="admin-page-title">Summary</h3>
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
							{corruptFiles?.length > 0 ? (
								<ol>
									{corruptFiles.map(
										(file, corruptFileIndex) => (
											<li key={corruptFileIndex}>
												{file}
												<br />
											</li>
										),
									)}
								</ol>
							) : (
								<>0</>
							)}
						</td>
					</tr>
				</tbody>
			</MantineCore.Table>

			{storageStates && (
				<>
					<h4>Full / Blocked?</h4>
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
											<td>{value}</td>
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
				<MantineCore.Alert
					icon={<Icons.IconAlertCircle size={16} />}
					title="Syncing indefinitely blocked"
					color="red"
					variant="outline"
				>
					Picili is currently out of space to generate more
					thumbnails, so won&apos;t be able to import new files
					(sync).
				</MantineCore.Alert>
			)}

			{storageStates.imageProcessingDirFull.value ||
				(storageStates.videoProcessingDirFull.value && (
					<MantineCore.Alert
						icon={<Icons.IconAlertCircle size={16} />}
						title="Syncing temporarily blocked"
						color="orange"
						variant="outline"
					>
						One or both (image / video) processing dir(s) are
						currently full, picili won&apos;t be able to import
						(sync) <strong>temporarily</strong> until the currently
						processing files in that directory have been processed.
					</MantineCore.Alert>
				))}

			{serverData && (
				<>
					<h4>Server data</h4>

					<MantineCore.Table>
						<tbody>
							{diskDataValuesToShow.map(
								({ label, value }, key) => {
									return (
										<tr key={key}>
											<td>{label}</td>
											<td>{String(value)}</td>
										</tr>
									)
								},
							)}
						</tbody>
					</MantineCore.Table>

					<br />
					<MantineCore.Progress
						radius="xl"
						size={24}
						sections={[
							{
								value:
									((serverData.diskSpaceData.usedSpaceBytes -
										serverData.diskSpaceData
											.thumbsDirSizeBytes) /
										serverData.diskSpaceData
											.totalSpaceBytes) *
									100,
								color: 'red',
								label: 'Used Space',
								tooltip: `Used Space – ${HelperUtil.formatBytes(
									serverData.diskSpaceData.usedSpaceBytes -
										serverData.diskSpaceData
											.thumbsDirSizeBytes,
								)}`,
							},
							{
								value:
									(serverData.diskSpaceData
										.thumbsDirSizeBytes /
										serverData.diskSpaceData
											.totalSpaceBytes) *
									100,
								color: 'orange',
								label: 'Thumbnails',
								tooltip: `Thumbnails – ${HelperUtil.formatBytes(
									serverData.diskSpaceData.thumbsDirSizeBytes,
								)}`,
							},
							{
								value:
									(serverData.diskSpaceData
										.reservedForPiciliProcessingDirsBytes /
										serverData.diskSpaceData
											.totalSpaceBytes) *
									100,
								color: 'yellow',
								label: 'Reserved',
								tooltip: `Reserved – ${HelperUtil.formatBytes(
									serverData.diskSpaceData
										.reservedForPiciliProcessingDirsBytes,
								)}`,
							},
						]}
					/>
					<br />
				</>
			)}
		</React.Fragment>
	)
}

export default AdminOverview
