import * as React from 'react'
import * as ReactRedux from 'react-redux'
import { useQuery, gql } from '@apollo/client'

import * as Actions from 'src/redux/actions'
import * as AuthUtil from 'src/util/auth'

const tokenCheckQuery = gql`
	query validateToken($token: String!) {
		validateToken(token: $token)
	}
`

const CheckToken: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()
	const token = AuthUtil.getToken()

	if (!token) {
		dispatch(Actions.verifiedAuthStatus(false))
		return null
	} else {
		const { data } = useQuery(tokenCheckQuery, {
			skip: !token,
			variables: { token },
		})

		React.useEffect(() => {
			if (data) {
				const tokenWasValid = data?.validateToken
				dispatch(Actions.verifiedAuthStatus(tokenWasValid))
			}
		}, [data])

		return null
	}
}

export default CheckToken
