import * as React from 'react'

import AdminTemplate from 'src/components/pages/Admin/AdminTemplate'
import AdminOverview from 'src/components/partials/AdminOverview'

const AdminOverviewPage: React.FunctionComponent = () => {
	return (
		<AdminTemplate>
			<AdminOverview />
		</AdminTemplate>
	)
}

export default AdminOverviewPage
