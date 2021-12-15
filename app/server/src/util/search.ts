import * as Models from '../db/models'

export const prototypeSearch = async () => {
	const files = await Models.FileModel.findAll({
		where: {
			isThumbnailed: true,
		},
	})
	return files
}
