import * as React from 'react'
// import { useQuery, gql } from '@apollo/client'

import AdminTemplate from 'src/components/pages/AdminTemplate'
import DropboxConnection from 'src/components/controls/Dropboxconnection'

// const dropboxConnectionQuery = gql`
// 	query dropboxConnection {
// 		dropboxConnection {
// 			syncPath
// 			syncEnabled
// 		}
// 	}
// `

const AdminOverview: React.FunctionComponent = () => {
	// const { loading, error, data } = useQuery(dropboxConnectionQuery)

	// if (loading) {
	// 	return <>loading...</>
	// }

	// if (error) {
	// 	return <>{error?.message}</>
	// }

	return (
		<AdminTemplate>
			[admin page]
			<DropboxConnection />
			{/* <div>{data?.overview.unprocessedTasksCount} tasks</div> */}
		</AdminTemplate>
	)
}

export default AdminOverview
