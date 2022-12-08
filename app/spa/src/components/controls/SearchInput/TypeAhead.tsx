import * as React from 'react'
import { useQuery, gql } from '@apollo/client'

import * as Types from '@shared/declarations'
import * as HelperUtil from 'src/util/helper'

const autoCompleteGQL = gql`
	query autoComplete($query: IndividualQuery!) {
		autoComplete(query: $query) {
			userId
			tagSuggestions {
				type
				subtype
				value
				uuid
			}
		}
	}
`

interface IProps {
	currentIndividualQuery?: Types.API.IndividualSearchQuery
}

const TypeAhead: React.FunctionComponent<IProps> = ({
	currentIndividualQuery,
}) => {
	const {
		error,
		data,
		loading = false,
	} = useQuery(autoCompleteGQL, {
		skip: !currentIndividualQuery || !currentIndividualQuery.value,
		variables: { query: currentIndividualQuery },
	})

	if (!currentIndividualQuery?.value) {
		return <></>
	}
	const autoCompleteResponse: Types.API.AutoCompleteResponse =
		data?.autoComplete

	return (
		<div id="type-ahead">
			{loading && <>loading...</>}
			{/* // todo: ui/style this at some point */}
			{error && <>!error fetching suggestions</>}
			{autoCompleteResponse && (
				<>
					{autoCompleteResponse.tagSuggestions.map(
						(
							{ type, subtype, value, uuid },
							tagSuggestionIndex,
						) => (
							<li key={tagSuggestionIndex}>
								<img
									src={HelperUtil.thumbPath(
										autoCompleteResponse.userId,
										uuid,
										'i',
									)}
								/>
								{type}.{subtype}={value}
							</li>
						),
					)}
				</>
			)}
		</div>
	)
}

export default TypeAhead
