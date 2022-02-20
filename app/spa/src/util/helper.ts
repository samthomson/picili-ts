export const APIURL = (): string => {
	const host = process.env.REACT_APP_API_HOST
	const port = process.env.REACT_APP_API_PORT
	const protocol = port === '443' ? 'https' : 'http'
	const uri = `${protocol}://${host}:${port}/graphql`
	return uri
}
