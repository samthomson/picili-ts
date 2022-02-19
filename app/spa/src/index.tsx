import React from 'react'
import * as Redux from 'redux'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import createSagaMiddleware from 'redux-saga'
import { composeWithDevTools } from 'redux-devtools-extension'
import {
	ApolloClient,
	InMemoryCache,
	ApolloProvider,
	createHttpLink,
	DefaultOptions,
} from '@apollo/client'

import App from 'src/components/structure/App'
import { appReducers } from 'src/redux/reducers'
import { Store } from 'src/redux/store'
import rootSaga from 'src/redux/sagas'
import * as HelperUtil from './util/helper'

import reportWebVitals from './reportWebVitals'

import 'src/style.scss'

const uri = HelperUtil.APIURL()

console.log(uri)

const link = createHttpLink({
	uri,
	credentials: 'include',
})
const defaultOptions: DefaultOptions = {
	watchQuery: {
		fetchPolicy: 'no-cache',
		errorPolicy: 'ignore',
	},
	query: {
		fetchPolicy: 'no-cache',
		errorPolicy: 'all',
	},
}

const client = new ApolloClient({
	cache: new InMemoryCache(),
	link,
	defaultOptions,
})

const sagaMiddleware = createSagaMiddleware()
const store: Redux.Store<Store> = Redux.createStore(
	appReducers,
	composeWithDevTools(Redux.applyMiddleware(sagaMiddleware)),
)
sagaMiddleware.run(rootSaga)

ReactDOM.render(
	<React.StrictMode>
		<Provider store={store}>
			<ApolloProvider client={client}>
				<App />
			</ApolloProvider>
		</Provider>
	</React.StrictMode>,
	document.getElementById('root'),
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
