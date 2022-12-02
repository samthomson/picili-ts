import * as React from 'react'

import AdminTemplate from 'src/components/pages/Admin/AdminTemplate'
import SystemEventsOverview from 'src/components/partials/SystemEventsOverview'

const AdminSystemEvents: React.FunctionComponent = () => {
	return (
		<AdminTemplate>
			<SystemEventsOverview />
		</AdminTemplate>
	)
}

export default AdminSystemEvents
