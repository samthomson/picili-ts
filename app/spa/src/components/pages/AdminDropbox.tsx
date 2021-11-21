import * as React from 'react'

import AdminTemplate from 'src/components/pages/AdminTemplate'
import DropboxConnection from 'src/components/controls/Dropboxconnection'

const AdminDropbox: React.FunctionComponent = () => {
	return (
		<AdminTemplate>
			<DropboxConnection />
		</AdminTemplate>
	)
}

export default AdminDropbox
