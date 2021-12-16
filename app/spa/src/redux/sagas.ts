import { all, put, select, takeLatest } from 'redux-saga/effects'

import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import gql from 'graphql-tag'

import * as Actions from 'src/redux/actions'

export const URI = `${window.location.protocol}//${window.location.hostname}:3501/graphql`

const httpLink = createHttpLink({
	uri: URI,
	credentials: 'include',
})

const client = new ApolloClient({
	// link: authLink.concat(httpLink),
	link: httpLink,
	cache: new InMemoryCache(),
})

function* search() {
	try {
		const response = yield client.mutate({
			mutation: gql`
				query {
					search {
						items {
							uuid
							mediumWidth
							mediumHeight
							address
							latitude
						}
					}
				}
			`,
		})

		const searchResultItems = response?.data?.search?.items
		if (searchResultItems) {
			const firstResultUUID = searchResultItems?.[0].uuid ?? [
				'no first item',
			]
			yield put(Actions.attemptSearchSucceeded(firstResultUUID))
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

export default function* rootSaga() {
	yield all([watchSearch()])
}
