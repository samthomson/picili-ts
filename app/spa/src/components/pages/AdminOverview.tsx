import * as React from 'react'
// import { useQuery, gql } from '@apollo/client'

import AdminTemplate from 'src/components/pages/AdminTemplate'

// const overviewQuery = gql`
// 	query overview {
// 		overview {
// 			unprocessedTasksCount
// 		}
// 	}
// `

const AdminOverview: React.FunctionComponent = () => {
	// const { loading, error, data } = useQuery(overviewQuery)

	// if (loading) {
	// 	return <>loading...</>
	// }

	// if (error) {
	// 	return <>{error?.message}</>
	// }

	return (
		<AdminTemplate>
			[admin page]
			{/* <div>{data?.overview.unprocessedTasksCount} tasks</div> */}
		</AdminTemplate>
	)
}

export default AdminOverview
