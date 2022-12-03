import { useLayoutEffect, useState } from 'react'
import debounce from 'lodash.debounce'

/*
from here: https://codesandbox.io/s/b78in?file=/src/use-is-mobile.hook.ts:368-378
*/
const useIsMobile = (): boolean => {
	const [isMobile, setIsMobile] = useState(false)

	useLayoutEffect(() => {
		const updateSize = (): void => {
			setIsMobile(window.innerWidth < 768)
		}
		window.addEventListener('resize', debounce(updateSize, 250))
		updateSize()
		return (): void => window.removeEventListener('resize', updateSize)
	}, [])

	return isMobile
}

export default useIsMobile
