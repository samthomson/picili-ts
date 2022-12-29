export const thumbPath = (
	userId: number,
	uuid: string,
	size: string,
	extension = 'jpg',
): string => {
	return `${baseAPIURL()}/thumbs/${userId}/${uuid}/${size}.${extension}`
}

export const baseAPIURL = (): string => {
	const host = process.env.REACT_APP_API_HOST
	const port = process.env.REACT_APP_API_PORT
	const protocol = port === '443' ? 'https' : 'http'
	const portFormatted = port === '443' ? '' : `:${port}`
	const uri = `${protocol}://${host}${portFormatted}`
	return uri
}

export const APIURL = (): string => {
	return `${baseAPIURL()}/graphql`
}

export const formatNumber = (value: string): string =>
	`${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
