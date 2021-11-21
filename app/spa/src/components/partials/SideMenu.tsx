import * as React from 'react'
import { NavLink } from 'react-router-dom'

const SideMenu: React.FunctionComponent = () => {
	return (
		<React.Fragment>
			<ul>
				<li>
					<NavLink exact={true} className="item" to="/">
						[home]
					</NavLink>
				</li>
				<li>
					<NavLink exact={true} className="item" to="/map">
						[map]
					</NavLink>
				</li>
				<li>
					<NavLink exact={true} className="item" to="/calendar">
						[cal]
					</NavLink>
				</li>
			</ul>
		</React.Fragment>
	)
}

export default SideMenu
