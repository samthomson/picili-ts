import * as React from 'react'
import { NavLink } from 'react-router-dom'

import PageTemplate from 'src/components/pages/PageTemplate'

interface Props {
	children: React.ReactNode
}

const AdminTemplate: React.FunctionComponent<Props> = ({ children }: Props) => {
	return (
		<PageTemplate>
			<div id="admin-page">
				<div id="admin-side-menu">
					<ul>
						<li>
							<NavLink exact={true} className="item" to="/admin">
								Overview
							</NavLink>
						</li>
						<li>
							<NavLink
								exact={true}
								className="item"
								to="/admin/dropbox"
							>
								Dropbox
							</NavLink>
						</li>
						<li>
							<NavLink
								exact={true}
								className="item"
								to="/admin/tasks"
							>
								tasks
							</NavLink>
						</li>
						<li>
							<NavLink
								exact={true}
								className="item"
								to="/admin/systemevents"
							>
								events
							</NavLink>
						</li>

						{/*
							<NavLink
								exact={true}
								className="item"
								to="/admin/keys"
							>
								Keys
							</NavLink> */}
					</ul>
				</div>
				<div id="admin-tab-content">{children}</div>
			</div>
		</PageTemplate>
	)
}

export default AdminTemplate
