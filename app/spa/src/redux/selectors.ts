import { Store } from 'src/redux/store'

import * as Types from '@shared/declarations'

export const userAuthStatusIsKnown = (state: Store): boolean => {
	return state.userAuthStatusIsKnown
}
export const userIsAuthenticated = (state: Store): boolean => {
	return state.userIsAuthenticated
}
export const somethingIsLoading = (state: Store): boolean => {
	return state.somethingIsLoading
}

export const searchResults = (state: Store): Types.API.SearchResultItem[] => {
	return state?.searchResult?.items ?? []
}

export const searchQuery = (state: Store): Types.API.SearchQuery => {
	return state.searchQuery
}
