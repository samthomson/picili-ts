import moment from 'moment'

export const thumbPath = (
	userId: number,
	fileId: number,
	size: string,
	extension = 'jpg',
): string => {
	return `${baseAPIURL()}/thumbs/${userId}/${fileId}/${size}.${extension}`
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

export const formatNumberStripDecimal = (value: string | number): string =>
	formatNumber(Math.round(+value))

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

export const parseRangeValueToArray = (value: string): [string, string] => {
	return [value.split(':')[0], value.split(':')[1]]
}

export const parseRangeValueToArrayNumeric = (
	value: string,
): [number, number] => {
	return [
		value.split(':').map((val) => +val)[0],
		value.split(':').map((val) => +val)[1],
	]
}

export const parseRangeValueToArrayDates = (value: string): [Date, Date] => {
	const parts = parseRangeValueToArray(value)
	return [
		parts.map((val) => moment(val).toDate())[0],
		parts.map((val) => moment(val).toDate())[1],
	]
}

export const formatDateForUI = (date: string): string =>
	moment(date).format('MMM Do Y')

// https://stackoverflow.com/a/18650828/686490
export const formatBytes = (bytes: number, decimals = 2): string => {
	if (!+bytes) return '0 Bytes'

	const k = 1024
	const dm = decimals < 0 ? 0 : decimals
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export const mod = (n: number, m: number): number => {
	return ((n % m) + m) % m
}

export const shouldIRequestGeoAggregations = (): boolean => {
	const location = window.location.pathname
	return location === '/map'
}

export const dateWithoutTimeFromMomentDate = (date: moment.Moment): Date => {
	return new Date(date.format('YYYY/MM/DD'))
}
