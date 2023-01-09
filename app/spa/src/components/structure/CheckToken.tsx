import * as React from 'react'
import * as ReactRedux from 'react-redux'
import { useQuery, gql } from '@apollo/client'

import * as Actions from 'src/redux/actions'
import * as AuthUtil from 'src/util/auth'
import * as HelperUtil from 'src/util/helper'
import * as Types from '@shared/declarations'

const tokenCheckQuery = gql`
	query validateToken($token: String!) {
		validateToken(token: $token) {
			isValid
			userId
		}
	}
`

const CheckToken: React.FunctionComponent = () => {
	const dispatch = ReactRedux.useDispatch()
	const token = AuthUtil.getToken()

	if (!token) {
		dispatch(Actions.verifiedAuthStatus(false, undefined))
		return null
	} else {
		const { data } = useQuery(tokenCheckQuery, {
			skip: !token,
			variables: { token },
		})

		React.useEffect(() => {
			if (data) {
				const {
					isValid: tokenWasValid,
					userId,
				}: Types.API.Response.VerifyToken = data?.validateToken
				if (tokenWasValid && HelperUtil.isNumber(userId)) {
					dispatch(
						Actions.verifiedAuthStatus(
							tokenWasValid,
							userId as number,
						),
					)
				}
			}
		}, [data])

		return null
	}
}

export default CheckToken
