import * as React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import classNames from 'classnames'
import * as MantineCore from '@mantine/core'

import PageTemplate from 'src/components/pages/PageTemplate'

import useIsMobile from 'src/util/hooks/use-is-mobile.hook'
interface Props {
	children: React.ReactNode
}

const menuItems = [
	{
		href: '/admin',
		displayText: 'Overview',
	},
	{
		href: '/admin/dropbox',
		displayText: 'Dropbox',
	},
	{
		href: '/admin/tasks',
		displayText: 'tasks',
	},
	{
		href: '/admin/systemevents',
		displayText: 'events',
	},
]

const displayTextForRoute = (route: string): string => {
	return menuItems.find((item) => item.href === route)?.displayText ?? 'Admin'
}

const MenuItems = () => {
	const location = useLocation()

	return (
		<>
			<MantineCore.Tabs
				color="red"
				variant="outline"
				radius="md"
				orientation="vertical"
				defaultValue={location.pathname}
			>
				<MantineCore.Tabs.List>
					{menuItems.map((menuItem, key) => (
						<NavLink
							exact={true}
							className="item"
							to={menuItem.href}
							key={key}
						>
							<MantineCore.Tabs.Tab value={menuItem.href}>
								{menuItem.displayText}
							</MantineCore.Tabs.Tab>
						</NavLink>
					))}
				</MantineCore.Tabs.List>
			</MantineCore.Tabs>
		</>
	)
}

const DropdownMenu: React.FunctionComponent = () => {
	const [isMenuOpen, setIsMenuOpen] = React.useState<boolean>(false)
	const location = useLocation()
	const isMobile = useIsMobile()

	return (
		<div
			id="admin-dropdown-menu"
			className={classNames({
				'is-mobile': isMobile,
			})}
		>
			<a onClick={() => setIsMenuOpen(!isMenuOpen)}>
				<h2 className="admin-page-title">
					{displayTextForRoute(location.pathname)}
				</h2>
			</a>
			{isMenuOpen && (
				<div>
					<MenuItems />
				</div>
			)}
		</div>
	)
}

const AdminTemplate: React.FunctionComponent<Props> = ({ children }: Props) => {
	const isMobile = useIsMobile()

	return (
		<PageTemplate>
			<div id="admin-page">
				{!isMobile && (
					<div id="admin-side-menu">
						<MenuItems />
					</div>
				)}
				<div id="admin-tab-content">
					<DropdownMenu />
					{children}
				</div>
			</div>
		</PageTemplate>
	)
}

export default AdminTemplate
