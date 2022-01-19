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
			}
		case ActionType.SEARCHING_SET:
			const { isSearching } = action
			return {
				...state,
				isSearching,
			}

		default:
			return state
	}
}
