import moment from 'moment'

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

export const formatNumber = (value: string | number): string =>
	`${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export const formatLengthToDuration = (length: number): string =>
	moment
		.utc(moment.duration({ seconds: +length }).as('milliseconds'))
		.format('HH:mm:ss')

export const parseDurationToLengthInSeconds = (duration: string): number => {
	return moment.duration(duration).as('seconds')
}

export const isNumber = (value?: string | number): boolean =>
	typeof value !== 'undefined' &&
	value != null &&
	value !== '' &&
	!isNaN(Number(+value))
