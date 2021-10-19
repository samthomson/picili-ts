import React from 'react'
import * as Redux from 'redux'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router } from 'react-router-dom'
import { Provider } from 'react-redux'
import createSagaMiddleware from 'redux-saga'
import { composeWithDevTools } from 'redux-devtools-extension'

import './index.css'
import AppRouter from 'src/components/structure/AppRouter'
import { appReducers } from 'src/redux/reducers'
import { Store } from 'src/redux/store'
import reportWebVitals from './reportWebVitals'

const sagaMiddleware = createSagaMiddleware()
const store: Redux.Store<Store> = Redux.createStore(
	appReducers,
	composeWithDevTools(Redux.applyMiddleware(sagaMiddleware)),
)

ReactDOM.render(
	<React.StrictMode>
		<Provider store={store}>
			<Router>
				<AppRouter />
			</Router>
		</Provider>
	</React.StrictMode>,
	document.getElementById('root'),
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
