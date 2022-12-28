import { all, put, select, takeLatest } from 'redux-saga/effects'

import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import gql from 'graphql-tag'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

import * as HelperUtil from '../util/helper'

// todo: later/ssl make this protocol agnostic
export const URI = HelperUtil.APIURL()

const httpLink = createHttpLink({
	uri: URI,
	credentials: 'include',
})

const client = new ApolloClient({
	link: httpLink,
	cache: new InMemoryCache(),
})

// const callSearchQuery = async (): Promise<Types.API.SearchResult> => {
function* callSearchQuery(page = 1, withGeoAggregations = false) {
	const searchFilter: Types.API.SearchQuery = yield select(
		Selectors.searchQuery,
	)
	const sortOverload: Types.SearchSortEnum = yield select(
		Selectors.sortOverload,
	)

	const response: { data: { search: Types.API.SearchResult } } =
		yield client.mutate({
			mutation: gql`
				query (
					$searchFilter: SearchFilter!
					$page: Int
					$perPage: Int
					$sortOverload: SearchSort
					$withGeoAggregations: Boolean! = false
				) {
					search(
						filter: $searchFilter
						page: $page
						perPage: $perPage
						sortOverload: $sortOverload
						withGeoAggregations: $withGeoAggregations
					) {
						pageInfo {
							totalPages
							totalItems
							page
							perPage
							hasNextPage
							hasPreviousPage
							queryStats {
								query {
									type
									subtype
									value
								}
								resultCount
							}
						}
						items {
							fileId
							uuid
							userId
							mediumWidth
							mediumHeight
							address
							latitude
							longitude
							fileType
						}
						stats {
							speed
						}
						sorting {
							sortModesAvailable
							sortUsed
						}
						geoAggregations @include(if: $withGeoAggregations) {
							clusters {
								latitude
								longitude
								fileCount
								fileId
								uuid
								userId
							}
						}
					}
				}
			`,
			variables: {
				searchFilter,
				page,
				sortOverload,
				withGeoAggregations,
			},
		})

	const { items, pageInfo, stats, sorting, geoAggregations } =
		response.data.search
	return { items, pageInfo, stats, sorting, geoAggregations }
}

function* search(action: Actions.AttemptSearchAction) {
	// don't do this if we have no query.
	const searchFilter: Types.API.SearchQuery = yield select(
		Selectors.searchQuery,
	)
	if (searchFilter.individualQueries.length === 0) {
		return
	}
	yield put(Actions.searchingSet(true))
	try {
		const { withGeoAggregations } = action

		const searchResult: Types.API.SearchResult = yield callSearchQuery(
			1,
			withGeoAggregations,
		)
		if (searchResult) {
			yield put(Actions.attemptSearchSucceeded(searchResult))
		} else {
			console.log('search query has empty payload')
			put(Actions.attemptSearchFailed())
		}
	} catch (e) {
		console.log('error searching ', e)
		put(Actions.attemptSearchFailed())
	} finally {
		yield put(Actions.searchingSet(false))
	}
}

function* searchNext() {
	yield put(Actions.searchingSet(true))
	try {
		const paginationInfo: Types.API.PaginationInfo = yield select(
			Selectors.searchPaginationInfo,
		)
		const nextPage = paginationInfo.page + 1
		const searchResult: Types.API.SearchResult = yield callSearchQuery(
			nextPage,
		)
		if (searchResult) {
			yield put(Actions.nextSearchSucceeded(searchResult))
		} else {
			console.log('search query has empty payload')
			put(Actions.attemptSearchFailed())
		}
	} catch (e) {
		console.log('error searching ', e)
		put(Actions.attemptSearchFailed())
	} finally {
		yield put(Actions.searchingSet(false))
	}
}

function* watchSearch() {
	yield takeLatest(Actions.ActionType.SEARCH_ATTEMPT, search)
}

function* watchSearchNext() {
	yield takeLatest(Actions.ActionType.SEARCH_NEXT, searchNext)
}

// eslint-disable-next-line
export default function* rootSaga() {
	yield all([watchSearch(), watchSearchNext()])
}
