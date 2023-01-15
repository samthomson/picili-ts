import * as React from 'react'
import * as ReactRedux from 'react-redux'
import { NavLink } from 'react-router-dom'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

// import ProcessorSummaryHeader from 'src/components/controls/ProcessorSummaryHeader'

const Header: React.FunctionComponent = () => {
	const isAuthenticated = ReactRedux.useSelector(
		Selectors.userIsAuthenticated,
	)
	const isSomethingLoading = ReactRedux.useSelector(
		Selectors.somethingIsLoading,
	)

	const dispatch = ReactRedux.useDispatch()
	const logOut = () => dispatch(Actions.logout())

	return (
		<React.Fragment>
			{isSomethingLoading && (
				<div className="indeterminate-loading-bar progress">
					<div className="indeterminate"></div>
				</div>
			)}

			<div id="header">
				<span id="brand" className="header-font">
					<NavLink exact={true} className="header-font" to="/">
						picili
					</NavLink>
				</span>
				{isSomethingLoading && 'loading'}

				<div id="top-right-links">
					{isAuthenticated && (
						<div>
							{/* <ProcessorSummaryHeader /> */}

							<MantineCore.Menu shadow="md" width={200}>
								<MantineCore.Menu.Target>
									<MantineCore.Button
										variant="subtle"
										color="gray"
										radius="md"
										rightIcon={
											<Icons.IconChevronDown size={14} />
										}
									>
										Stuff
									</MantineCore.Button>
								</MantineCore.Menu.Target>

								<MantineCore.Menu.Dropdown>
									<NavLink
										exact={true}
										className="ui tiny button"
										to="/admin"
									>
										<MantineCore.Menu.Item
											icon={
												<Icons.IconSettings size={16} />
											}
										>
											Settings
										</MantineCore.Menu.Item>
									</NavLink>
									<MantineCore.Menu.Item
										icon={<Icons.IconLogout size={16} />}
										onClick={logOut}
									>
										Log out
									</MantineCore.Menu.Item>
								</MantineCore.Menu.Dropdown>
							</MantineCore.Menu>
						</div>
					)}
					{!isAuthenticated && (
						<div>
							<NavLink
								exact={true}
								className="ui tiny button"
								to="/login"
							>
								login
							</NavLink>

							<NavLink
								exact={true}
								className="ui tiny button"
								to="/register"
							>
								register
							</NavLink>
						</div>
					)}
				</div>
			</div>
		</React.Fragment>
	)
}

export default Header
