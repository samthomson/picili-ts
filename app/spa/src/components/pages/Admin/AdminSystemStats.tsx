import * as React from 'react'

import AdminTemplate from 'src/components/pages/Admin/AdminTemplate'
import SystemStatsOverview from 'src/components/partials/SystemStatsOverview'

const AdminSystemStats: React.FunctionComponent = () => {
	return (
		<AdminTemplate>
			<SystemStatsOverview />
		</AdminTemplate>
	)
}

export default AdminSystemStats
