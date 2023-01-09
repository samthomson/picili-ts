import { Store } from 'src/redux/store'

import * as Types from '@shared/declarations'

export const userAuthStatusIsKnown = (state: Store): boolean => {
	return state.userAuthStatusIsKnown
}
export const userIsAuthenticated = (state: Store): boolean => {
	return state.userIsAuthenticated
}
export const userId = (state: Store): number | undefined => {
	return state?.userId
}
export const somethingIsLoading = (state: Store): boolean => {
	return state.somethingIsLoading
}

export const searchResults = (state: Store): Types.API.SearchResultItem[] => {
	return state?.searchResult?.items ?? []
}

export const searchResultGeoAggregations = (
	state: Store,
): Types.API.GeoAggregations | undefined => {
	return state?.searchResult?.geoAggregations ?? undefined
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

// todo: update this to use enum type?s
export const searchIndividualQueryOfType =
	(type: string, subtype?: string) =>
	(state: Store): Types.API.IndividualSearchQuery | undefined => {
		return state.searchQuery.individualQueries.find(
			(query) =>
				query.type === type &&
				(!!subtype ? query.subtype === subtype : true),
		)
	}

export const searchIsSearching = (state: Store): boolean => {
	return state.isSearching
}

export const lightboxIndex = (state: Store): number | undefined => {
	return state.lightboxImageIndex
}
