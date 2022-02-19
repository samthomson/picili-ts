import Logger from '../services/logging'


const logTest = () => {
	try {
		Logger.warn('writing log')
	} catch (err) {
		console.error('error writing log', err)
	}
}

logTest()