import Cookies from 'universal-cookie'

const cookieName = 'picili-token'

export const getToken = (): string | undefined => {
	const cookies = new Cookies()
	const authCookieValue = cookies.get(cookieName)
	return authCookieValue
}

export const saveToken = (token: string): void => {
	removeToken()

	// set cookie
	const cookies = new Cookies()
	cookies.set(cookieName, token, { path: '/' })
}

export const removeToken = (): void => {
	const cookies = new Cookies()
	cookies.remove(cookieName)
}
