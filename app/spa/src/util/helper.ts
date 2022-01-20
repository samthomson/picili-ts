export const thumbPath = (userId: number, uuid: string, size: string) => {
	return `${window.location.protocol}//${window.location.hostname}:3501/thumbs/${userId}/${uuid}/${size}.jpg`
}
