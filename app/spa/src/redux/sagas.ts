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

function* search() {
	try {
		const searchFilter: Types.API.SearchQuery = yield select(
			Selectors.searchQuery,
		)
		const response: { data: { search: Types.API.SearchResult } } =
			yield client.mutate({
				mutation: gql`
					query ($searchFilter: SearchFilter!) {
						search(filter: $searchFilter) {
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
				},
			})

		const searchResult = response?.data?.search
		if (searchResult) {
			yield put(Actions.attemptSearchSucceeded(searchResult))
		} else {
			console.log('search query has empty payload')
			put(Actions.attemptSearchFailed())
		}
	} catch (e) {
		console.log('error searching ', e)
		put(Actions.attemptSearchFailed())
	}
}

function* watchSearch() {
	yield takeLatest(Actions.ActionType.SEARCH_ATTEMPT, search)
}

// eslint-disable-next-line
export default function* rootSaga() {
	yield all([watchSearch()])
}
