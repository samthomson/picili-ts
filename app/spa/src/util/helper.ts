export const thumbPath = (
	userId: number,
	uuid: string,
	size: string,
): string => {
	return `${window.location.protocol}//${window.location.hostname}:3501/thumbs/${userId}/${uuid}/${size}.jpg`
}

export const baseAPIURL = () => {
	const host = process.env.REACT_APP_API_HOST
	const port = process.env.REACT_APP_API_PORT
	const protocol = port === '443' ? 'https' : 'http'
	const uri = `${protocol}://${host}:${port}`
	return uri
}

export const APIURL = (): string => {
	return `${baseAPIURL()}/graphql`
}
