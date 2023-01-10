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

	return (
		<React.Fragment>
			<h3>summary</h3>
			<table>
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
			</table>
		</React.Fragment>
	)
}

export default AdminOverview
