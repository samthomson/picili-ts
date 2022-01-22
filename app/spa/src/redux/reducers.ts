import * as AuthUtil from 'src/util/auth'
import { Action, ActionType } from 'src/redux/actions'
import { Store } from 'src/redux/store'
import { searchQuery } from './selectors'

const initialState: Store = {
	userAuthStatusIsKnown: false,
	userIsAuthenticated: false,
	somethingIsLoading: false,
	searchResult: undefined,
	searchQuery: {
		individualQueries: [],
	},
	isSearching: false,
	sortOverload: undefined,
	lightboxImageIndex: undefined,
}

export function appReducers(
	state: Store = initialState,
	action: Action,
): Store {
	switch (action.type) {
		case ActionType.LOGOUT:
			AuthUtil.removeToken()
			return {
				...state,
				userIsAuthenticated: false,
			}
		case ActionType.LOGIN_SUCCEEDED:
			AuthUtil.saveToken(action.token)
			return {
				...state,
				userIsAuthenticated: true,
			}
		case ActionType.AUTH_STATUS_VERIFIED:
			const userIsAuthenticated = action.isVerified
			return {
				...state,
				userIsAuthenticated,
				userAuthStatusIsKnown: true,
			}
		case ActionType.SET_GLOBAL_LOADING_STATE:
			const { somethingIsLoading } = action
			return {
				...state,
				somethingIsLoading,
			}
		case ActionType.SEARCH_SUCCEEDED:
			return {
				...state,
				searchResult: action.searchResult,
			}
		case ActionType.SEARCH_NEXT_SUCCEEDED:
			// append search results to existing
			const { items: nextItems } = action.searchResult
			return {
				...state,
				searchResult: {
					...action.searchResult,
					// append new results to existing results
					items: [...(state.searchResult?.items ?? []), ...nextItems],
				},
			}
		case ActionType.SEARCH_FAILED:
			return {
				...state,
				searchResult: undefined,
			}

		case ActionType.SEARCH_QUERY_ADD:
			// add to existing queries, unless it's of a certain type, then replace any similar query first
			const { addSearchQuery } = action
			const onlyAllowOneOfThisType = ['map', 'date']
			const oldIndividualQueries = state.searchQuery.individualQueries
			const filteredQueries = oldIndividualQueries.filter(
				({ type }) => !type || !onlyAllowOneOfThisType.includes(type),
			)
			const newQuery = {
				...state.searchQuery,
				individualQueries: [...filteredQueries, addSearchQuery],
			}

			return {
				...state,
				searchQuery: newQuery,
				// reset sort overload so that default is used on subsequent queries unless explicitly set again
				sortOverload: undefined,
			}
		case ActionType.SEARCH_QUERY_REMOVE:
			const { removeSearchQuery } = action
			const queriesAfterRemoval =
				state.searchQuery.individualQueries.filter(
					(individualQueryToCheck) => {
						if (
							individualQueryToCheck.type ===
								removeSearchQuery.type &&
							individualQueryToCheck.subtype ===
								removeSearchQuery.subtype &&
							individualQueryToCheck.value ===
								removeSearchQuery.value
						) {
							return false
						} else {
							return true
						}
					},
				)
			return {
				...state,
				searchQuery: {
					...state.searchQuery,
					individualQueries: queriesAfterRemoval,
				},
				// reset sort overload so that default is used on subsequent queries unless explicitly set again
				sortOverload: undefined,
			}
		case ActionType.SEARCH_QUERY_RESET:
			return {
				...state,
				searchQuery: {
					...searchQuery,
					individualQueries: [],
				},
				searchResult: undefined,
				isSearching: false,
				// reset sort overload so that default is used on subsequent queries unless explicitly set again
				sortOverload: undefined,
			}
		case ActionType.SEARCHING_SET:
			const { isSearching } = action
			return {
				...state,
				isSearching,
			}
		case ActionType.SEARCH_SORT_SET:
			const { sortOverload } = action
			return {
				...state,
				sortOverload,
			}

		case ActionType.LIGHTBOX_OPEN:
			const { index } = action
			return {
				...state,
				lightboxImageIndex: index,
			}
		case ActionType.LIGHTBOX_CLOSE:
			return {
				...state,
				lightboxImageIndex: undefined,
			}
		case ActionType.LIGHTBOX_NEXT:
			const { lightboxImageIndex, searchResult } = state
			let nextIndex = undefined
			if (typeof lightboxImageIndex === 'number' && searchResult) {
				nextIndex =
					(searchResult.items.length + lightboxImageIndex + 1) %
					searchResult.items.length
			}

			return {
				...state,
				lightboxImageIndex: nextIndex,
			}
		case ActionType.LIGHTBOX_PREVIOUS:
			const { lightboxImageIndex: currentIndex, searchResult: result } =
				state
			let previousIndex = undefined
			if (typeof currentIndex === 'number' && result) {
				previousIndex =
					(result.items.length + currentIndex - 1) %
					result?.items.length
			}

			return {
				...state,
				lightboxImageIndex: previousIndex,
			}

		default:
			return state
	}
}
