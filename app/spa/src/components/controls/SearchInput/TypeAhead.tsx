import * as React from 'react'
import { useQuery, gql } from '@apollo/client'

import * as Types from '@shared/declarations'

const autoCompleteGQL = gql`
	query autoComplete($query: IndividualQuery!) {
		autoComplete(query: $query) {
			tagSuggestions {
				type
				subtype
				value
				uuid
				confidence
			}
		}
	}
`

interface IProps {
	currentIndividualQuery: Types.API.IndividualSearchQuery
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

	if (!currentIndividualQuery.value) {
		return <></>
	}
	const tagSuggestions: Types.API.TagSuggestion[] =
		data?.autoComplete.tagSuggestions ?? []
	return (
		<div id="type-ahead">
			{loading && <>loading...</>}
			{/* // todo: ui/style this at some point */}
			{error && <>!error fetching suggestions</>}
			{tagSuggestions && (
				<>
					{tagSuggestions.map((suggestion, tagSuggestionIndex) => (
						<li key={tagSuggestionIndex}>
							{suggestion.type}.{suggestion.subtype}=
							{suggestion.value}
						</li>
					))}
				</>
			)}
		</div>
	)
}

export default TypeAhead
