import * as Types from '@shared/declarations'

export enum ActionType {
	LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
	LOGIN_SUCCEEDED = 'LOGIN_SUCCEEDED',
	LOGIN_FAILED = 'LOGIN_FAILED',
	LOGOUT = 'LOGOUT',
	AUTH_STATUS_VERIFIED = 'AUTH_STATUS_VERIFIED',
	AUTH_STATUS_VERIFY = 'AUTH_STATUS_VERIFY',
	SET_GLOBAL_LOADING_STATE = 'SET_GLOBAL_LOADING_STATE',
	SEARCH_ATTEMPT = 'SEARCH_ATTEMPT',
	SEARCH_SUCCEEDED = 'SEARCH_SUCCEEDED',
	SEARCH_NEXT = 'SEARCH_NEXT',
	SEARCH_NEXT_SUCCEEDED = 'SEARCH_NEXT_SUCCEEDED',
	SEARCH_FAILED = 'SEARCH_FAILED',
	SEARCH_QUERY_RESET = 'SEARCH_QUERY_RESET',
	SEARCH_QUERY_ADD = 'SEARCH_QUERY_ADD',
	SEARCH_QUERY_REMOVE = 'SEARCH_QUERY_REMOVE',
	SEARCHING_SET = 'SEARCHING_SET',
	SEARCH_SORT_SET = 'SEARCH_SORT_SET',
	LIGHTBOX_OPEN = 'LIGHTBOX_OPEN',
	LIGHTBOX_CLOSE = 'LIGHTBOX_CLOSE',
	LIGHTBOX_NEXT = 'LIGHTBOX_NEXT',
	LIGHTBOX_PREVIOUS = 'LIGHTBOX_PREVIOUS',
}

export type Action =
	| {
			type: ActionType.LOGOUT
	  }
	| {
			type: ActionType.LOGIN_SUCCEEDED
			token: string
			userId: number
	  }
	| {
			type: ActionType.LOGIN_FAILED
			token: string
	  }
	| {
			type: ActionType.AUTH_STATUS_VERIFY
	  }
	| {
			type: ActionType.AUTH_STATUS_VERIFIED
			isVerified: boolean
			userId?: number
	  }
	| {
			type: ActionType.SET_GLOBAL_LOADING_STATE
			somethingIsLoading: boolean
	  }
	| {
			type: ActionType.SEARCH_ATTEMPT
			withGeoAggregations: boolean
	  }
	| {
			type: ActionType.SEARCH_SUCCEEDED
			searchResult: Types.API.SearchResult
	  }
	| {
			type: ActionType.SEARCH_NEXT
	  }
	| {
			type: ActionType.SEARCH_NEXT_SUCCEEDED
			searchResult: Types.API.SearchResult
	  }
	| {
			type: ActionType.SEARCH_FAILED
			searchResult?: Types.API.SearchResult
	  }
	| {
			type: ActionType.SEARCH_QUERY_ADD
			addSearchQuery: Types.API.IndividualSearchQuery
	  }
	| {
			type: ActionType.SEARCH_QUERY_REMOVE
			removeSearchQuery: Types.API.IndividualSearchQuery
	  }
	| {
			type: ActionType.SEARCH_QUERY_RESET
	  }
	| {
			type: ActionType.SEARCHING_SET
			isSearching: boolean
	  }
	| {
			type: ActionType.SEARCH_SORT_SET
			sortOverload: Types.SearchSortEnum
	  }
	| {
			type: ActionType.LIGHTBOX_OPEN
			index: number
	  }
	| {
			type: ActionType.LIGHTBOX_CLOSE
	  }
	| {
			type: ActionType.LIGHTBOX_NEXT
	  }
	| {
			type: ActionType.LIGHTBOX_PREVIOUS
	  }

export type LoginAction = {
	type: ActionType.LOGIN_ATTEMPT
	email: string
}

export type AttemptSearchAction = {
	type: ActionType.SEARCH_ATTEMPT
	withGeoAggregations: boolean
}

export const attemptLogin = (email: string): LoginAction => {
	return {
		type: ActionType.LOGIN_ATTEMPT,
		email,
	}
}

export const attemptLoginSucceeded = (
	token: string,
	userId: number,
): Action => {
	return {
		type: ActionType.LOGIN_SUCCEEDED,
		token,
		userId,
	}
}

export const attemptLoginFailed = (): Action => {
	return {
		type: ActionType.LOGIN_FAILED,
		token: '',
	}
}

export const logout = (): Action => {
	return {
		type: ActionType.LOGOUT,
	}
}

export const verifyAuthStatus = (): Action => {
	return {
		type: ActionType.AUTH_STATUS_VERIFY,
	}
}

export const verifiedAuthStatus = (
	isVerified: boolean,
	userId?: number,
): Action => {
	return {
		type: ActionType.AUTH_STATUS_VERIFIED,
		isVerified,
		userId,
	}
}

export const setGlobalLoadingState = (somethingIsLoading: boolean): Action => {
	return {
		type: ActionType.SET_GLOBAL_LOADING_STATE,
		somethingIsLoading,
	}
}

export const attemptSearch = (withGeoAggregations = false): Action => {
	return {
		type: ActionType.SEARCH_ATTEMPT,
		withGeoAggregations,
	}
}

export const searchNext = (): Action => {
	return {
		type: ActionType.SEARCH_NEXT,
	}
}

export const attemptSearchSucceeded = (
	searchResult: Types.API.SearchResult,
): Action => {
	return {
		type: ActionType.SEARCH_SUCCEEDED,
		searchResult,
	}
}

export const nextSearchSucceeded = (
	searchResult: Types.API.SearchResult,
): Action => {
	return {
		type: ActionType.SEARCH_NEXT_SUCCEEDED,
		searchResult,
	}
}

export const attemptSearchFailed = (): Action => {
	return {
		type: ActionType.SEARCH_FAILED,
	}
}

export const searchQueryAdd = (
	addSearchQuery: Types.API.IndividualSearchQuery,
): Action => {
	return {
		type: ActionType.SEARCH_QUERY_ADD,
		addSearchQuery,
	}
}

export const searchQueryRemove = (
	removeSearchQuery: Types.API.IndividualSearchQuery,
): Action => {
	return {
		type: ActionType.SEARCH_QUERY_REMOVE,
		removeSearchQuery,
	}
}

export const searchQueryReset = (): Action => {
	return {
		type: ActionType.SEARCH_QUERY_RESET,
	}
}

export const searchingSet = (isSearching: boolean): Action => {
	return {
		type: ActionType.SEARCHING_SET,
		isSearching,
	}
}

export const sortModeSet = (sortOverload: Types.SearchSortEnum): Action => {
	return {
		type: ActionType.SEARCH_SORT_SET,
		sortOverload,
	}
}

export const lightboxOpen = (index: number): Action => {
	return {
		type: ActionType.LIGHTBOX_OPEN,
		index,
	}
}

export const lightboxClose = (): Action => {
	return {
		type: ActionType.LIGHTBOX_CLOSE,
	}
}

export const lightboxPrevious = (): Action => {
	return {
		type: ActionType.LIGHTBOX_PREVIOUS,
	}
}

export const lightboxNext = (): Action => {
	return {
		type: ActionType.LIGHTBOX_NEXT,
	}
}
