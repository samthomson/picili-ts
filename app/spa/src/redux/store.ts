import * as Types from '@shared/declarations'

export type Store = {
	userAuthStatusIsKnown: boolean
	userIsAuthenticated: boolean
	somethingIsLoading: boolean
	searchResult?: Types.API.SearchResult
}
