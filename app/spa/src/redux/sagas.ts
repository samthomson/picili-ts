import { all, put, select, takeLatest } from 'redux-saga/effects'

import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import gql from 'graphql-tag'

import * as Types from '@shared/declarations'
import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

// todo: later/ssl make this protocol agnostic
export const URI = `http://${window.location.hostname}:3501/graphql`

const httpLink = createHttpLink({
	uri: URI,
	credentials: 'include',
})

const client = new ApolloClient({
	link: httpLink,
	cache: new InMemoryCache(),
})

// const callSearchQuery = async (): Promise<Types.API.SearchResult> => {
function* callSearchQuery(page = 1) {
	const searchFilter: Types.API.SearchQuery = yield select(
		Selectors.searchQuery,
	)
	const response: { data: { search: Types.API.SearchResult } } =
		yield client.mutate({
			mutation: gql`
				query (
					$searchFilter: SearchFilter!
					$page: Int
					$perPage: Int
				) {
					search(
						filter: $searchFilter
						page: $page
						perPage: $perPage
					) {
						pageInfo {
							totalPages
							totalItems
							page
							perPage
							hasNextPage
							hasPreviousPage
						}
						items {
							uuid
							userId
							mediumWidth
							mediumHeight
							address
							latitude
						}
						stats {
							speed
						}
					}
				}
			`,
			variables: {
				searchFilter,
				page,
				// todo: remove (default 100 is fine)
				perPage: 10,
			},
		})

	const { items, pageInfo, stats } = response.data.search
	return { items, pageInfo, stats }
}

function* search() {
	yield put(Actions.searchingSet(true))
	try {
		// const searchResult = response?.data?.search
		const searchResult: Types.API.SearchResult = yield callSearchQuery()
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
