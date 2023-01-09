import * as Types from '@shared/declarations'

export type Store = {
	userAuthStatusIsKnown: boolean
	userIsAuthenticated: boolean
	userId?: number
	somethingIsLoading: boolean
	searchResult?: Types.API.SearchResult
	searchQuery: Types.API.SearchQuery
	isSearching: boolean
	sortOverload?: Types.SearchSortEnum
	lightboxImageIndex?: number
}
