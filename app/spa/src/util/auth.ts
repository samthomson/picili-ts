import Cookies from 'universal-cookie'

const cookieName = 'picili-spa'

export const getToken = (): string | undefined => {
	const cookies = new Cookies()
	const authCookieValue = cookies.get(cookieName)
	return authCookieValue
}

export const saveToken = (token: string): void => {
	removeToken()

	// set cookie
	const cookies = new Cookies()
	cookies.set(cookieName, token, {
		path: '/',
		sameSite: 'none',
		secure: true,
		// domain: 'api.picili.dev',
	})
}

export const removeToken = (): void => {
	const cookies = new Cookies()
	console.log('remove cookie', cookieName)
	cookies.remove(cookieName)
}

export const getLocalAuthToken = (): string => {
	// looks for an auth token cookie locally
	const cookies = new Cookies()
	const authCookieValue = cookies.get(cookieName)
	return authCookieValue
}
