import * as React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
		displayText: 'Tasks',
	},
	{
		href: '/admin/systemevents',
		displayText: 'System events',
	},
	{
		href: '/admin/systemstats',
		displayText: 'System stats',
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

	return (
		<div id="admin-mobile-menu-container">
			<MantineCore.Menu shadow="md" width={200}>
				<MantineCore.Menu.Target>
					<MantineCore.Button
						variant="outline"
						color="gray"
						radius="md"
					>
						{displayTextForRoute(location.pathname)}
						<MantineCore.Burger
							opened={isMenuOpen}
							onClick={() => setIsMenuOpen((o) => !o)}
							title={'title'}
							size="xs"
							color="grey"
						/>
					</MantineCore.Button>
				</MantineCore.Menu.Target>

				<MantineCore.Menu.Dropdown>
					{menuItems.map((menuItem, key) => (
						<NavLink
							exact={true}
							className="item"
							to={menuItem.href}
							key={key}
						>
							<MantineCore.Menu.Item>
								{menuItem.displayText}
							</MantineCore.Menu.Item>
						</NavLink>
					))}
				</MantineCore.Menu.Dropdown>
			</MantineCore.Menu>
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
					{isMobile && <DropdownMenu />}
					{children}
				</div>
			</div>
		</PageTemplate>
	)
}

export default AdminTemplate
