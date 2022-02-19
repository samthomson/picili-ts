export const APIURL = (): string => {
	const host = process.env.REACT_APP_API_HOST
	const port = process.env.REACT_APP_API_PORT
	const uri = `${window.location.protocol}//${host}:${port}/graphql`
	return uri
}
