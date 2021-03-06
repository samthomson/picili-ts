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

export const searchPaginationInfo = (
	state: Store,
): Types.API.PaginationInfo | undefined => {
	return state?.searchResult?.pageInfo
}

export const searchSorting = (
	state: Store,
): Types.API.SearchResultsSorting | undefined => {
	return state?.searchResult?.sorting
}

export const searchStats = (
	state: Store,
): Types.API.SearchStats | undefined => {
	return state?.searchResult?.stats
}

export const searchQuery = (state: Store): Types.API.SearchQuery => {
	return state.searchQuery
}

export const sortOverload = (
	state: Store,
): Types.SearchSortEnum | undefined => {
	return state?.sortOverload
}

export const searchIndividualQueries = (
	state: Store,
): Types.API.IndividualSearchQuery[] => {
	return state.searchQuery.individualQueries
}

export const searchIsSearching = (state: Store): boolean => {
	return state.isSearching
}

export const lightboxIndex = (state: Store): number | undefined => {
	return state.lightboxImageIndex
}
