import * as React from 'react'

import AdminTemplate from 'src/components/pages/Admin/AdminTemplate'
import TasksOverview from 'src/components/partials/TasksOverview'

const AdminTasks: React.FunctionComponent = () => {
	return (
		<AdminTemplate>
			<TasksOverview />
		</AdminTemplate>
	)
}

export default AdminTasks
