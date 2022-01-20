import * as React from 'react'
import { useQuery, gql } from '@apollo/client'

import AdminTemplate from 'src/components/pages/Admin/AdminTemplate'
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
		fetchPolicy: 'no-cache',
	})

	if (loading) {
		return <>loading...</>
	}

	if (error) {
		return <>{error?.message}</>
	}

	const adminOverview: Types.API.AdminOverview = data.adminOverview
	const { corruptFiles, dropboxFileCount, fileCount, searchableFilesCount } =
		adminOverview
	return (
		<AdminTemplate>
			<h2>summary</h2>
			<table>
				{/* <thead>
					<tr>
						<th></th>
					</tr>
				</thead> */}
				<tbody>
					<tr>
						<td>corrupt files</td>
						<td>
							{corruptFiles.map((file) => (
								<>
									{file}
									<br />
								</>
							))}
						</td>
					</tr>
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
				</tbody>
			</table>
		</AdminTemplate>
	)
}

export default AdminOverview
