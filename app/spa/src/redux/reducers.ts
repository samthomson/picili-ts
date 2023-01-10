import * as AuthUtil from 'src/util/auth'
import { Action, ActionType } from 'src/redux/actions'
import { Store } from 'src/redux/store'
import { searchQuery } from './selectors'
import * as Enums from '../../../shared/enums'

const initialState: Store = {
	userAuthStatusIsKnown: false,
	userIsAuthenticated: false,
	userId: undefined,
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
				userId: action.userId,
			}
		case ActionType.AUTH_STATUS_VERIFIED:
			const { isVerified: userIsAuthenticated, userId } = action
			return {
				...state,
				userIsAuthenticated,
				userAuthStatusIsKnown: true,
				userId,
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
			// if I add multiple of the same type (eg multiple video queries) then I'll need to separate on subtype also
			const onlyAllowOneOfTheseTypes = [
				Enums.QueryType.MAP,
				'date',
				Enums.QueryType.VIDEO,
				Enums.QueryType.ELEVATION,
				Enums.QueryType.DATE_RANGE,
				Enums.QueryType.COLOUR,
			]
			const oldIndividualQueries = state.searchQuery.individualQueries

			// const filteredQueries = oldIndividualQueries.filter(({ type }) => !type || !onlyAllowOneOfThisType.includes(type),
			// remove a query if it is the same type as the new one and that is one which only one should be allowed of
			const filteredQueries = oldIndividualQueries.filter(({ type }) => {
				const onlyAllowOneOfThisType =
					(type && onlyAllowOneOfTheseTypes.includes(type)) ?? false
				const newTypeMatchesCurrentType =
					addSearchQuery?.type && addSearchQuery?.type === type // only relevant when type is set

				return !(onlyAllowOneOfThisType && newTypeMatchesCurrentType)
			})

			const newQuery = {
				...state.searchQuery,
				individualQueries: [...filteredQueries, addSearchQuery],
			}

			return {
				...state,
				searchQuery: newQuery,
				// reset sort overload so that default is used on subsequent queries unless explicitly set again
				// don't do this - it's annoying. I set elevation as search mode and then it gets removed on each map pan. leaving this comment in case I later realise there was a good reason to reset it and want to know what I'll unsettle.
				// perhaps I could check if the user is adding or overriding (map/date) a query and reset conditionally.
				// sortOverload: undefined,
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
				searchResult: undefined,
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
