import * as React from 'react'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'
import { useQuery, gql } from '@apollo/client'
import debounce from 'lodash.debounce'
import * as Icons from '@tabler/icons'

import * as Types from '@shared/declarations'
import * as HelperUtil from 'src/util/helper'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'

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

interface ItemProps extends MantineCore.SelectItemProps {
	uuid: string
	value: string
	userId: number
}

const parseTextToQuery = (text: string): Types.API.IndividualSearchQuery => {
	// split on equals sign
	let type = undefined
	let subtype = undefined
	let value = ''
	const typeValueParts = text.split('=')
	if (typeValueParts.length === 1) {
		// take the only part as the value
		value = typeValueParts[0]
	} else {
		// at least two parts
		const [typePart, ...valueParts] = typeValueParts
		// split first part into type/subtype
		const typeSubtypeParts = typePart.split('.')
		// set the value via a join (incase there were multiple chunks)
		value = valueParts.join('=')

		if (typeSubtypeParts.length === 1) {
			// no subtype, just a type
			type = typeSubtypeParts[0]
		} else {
			const [parsedType, ...subtypes] = typeSubtypeParts
			type = parsedType
			subtype = subtypes.join('.')
		}
	}

	const isNotQuery = value.indexOf('!') === 0
	value = isNotQuery ? value.substring(1) : value

	return {
		type,
		subtype,
		value,
		isNotQuery: isNotQuery ? isNotQuery : undefined,
	}
}

const TypeAhead: React.FunctionComponent<{
	textInputRef: React.RefObject<HTMLInputElement>
}> = ({ textInputRef }) => {
	const [textInputValue, setTextInputValue] = React.useState<string>('')
	const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState<
		Types.API.IndividualSearchQuery | undefined
	>(undefined)

	const debouncedSearch = React.useRef(
		debounce((textInputValue) => {
			setDebouncedSearchQuery(parseTextToQuery(textInputValue))
		}, 300),
	).current

	React.useEffect(() => {
		// reset the 'query' used for the typeahead - as we know it's out of date now.
		setDebouncedSearchQuery(undefined)
		debouncedSearch.cancel()
		if (textInputValue !== '') {
			debouncedSearch(textInputValue)
		}
	}, [textInputValue])

	const dispatch = ReactRedux.useDispatch()

	const individualQueries = ReactRedux.useSelector(
		Selectors.searchIndividualQueries,
	)

	const {
		error,
		data,
		loading = false,
	} = useQuery(autoCompleteGQL, {
		skip: !debouncedSearchQuery,
		variables: { query: debouncedSearchQuery },
	})

	const AutoCompleteItem = React.forwardRef<HTMLDivElement, ItemProps>(
		function whatever({ uuid, value, userId, ...others }: ItemProps, ref) {
			/*
			subtype: "imagga"
			type: "subject"
			uuid: "246e2bd7-8c86-4427-bb75-9c75f60f614c"
			value: "canyon"
			*/
			return (
				<div ref={ref} {...others}>
					<MantineCore.Group noWrap>
						<img
							key={uuid}
							src={HelperUtil.thumbPath(userId, uuid, 'i')}
							className="auto-complete-item-image"
						/>
						<div>
							<MantineCore.Text>
								<MantineCore.Highlight
									highlight={textInputValue}
									highlightStyles={{
										// todo: get from some centralized place; sass or styled js
										backgroundColor: 'maroon',
										color: '#fff',
									}}
								>
									{value}
								</MantineCore.Highlight>
							</MantineCore.Text>
						</div>
					</MantineCore.Group>
				</div>
			)
		},
	)

	// return pressed: parse/add as query to redux and clear textInputValue
	const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		// return/enter is handled in a warpping form element to the dropdown
		if (event.key === 'Backspace' && textInputValue === '') {
			const lastQuery = individualQueries?.[individualQueries.length - 1]
			if (lastQuery) {
				dispatch(Actions.searchQueryRemove(lastQuery))
				dispatch(Actions.attemptSearch())
			}
		}
	}

	const autoCompleteResponse: Types.API.AutoCompleteResponse =
		data?.autoComplete

	const results =
		autoCompleteResponse?.tagSuggestions.map((item) => ({
			...item,
			userId: autoCompleteResponse.userId,
		})) ?? []

	return (
		<form
			onSubmit={(e) => {
				/*
				hackily wrap the typeahead in a form so I can get the user
				pressing return but only when they are not pressing return
				to select a dropdown item (as then I'd add the text and item 
				to the search query).
				*/
				e.preventDefault()

				if (textInputValue === '') {
					return
				}
				// parse/add to query
				const add = parseTextToQuery(textInputValue)
				dispatch(Actions.searchQueryAdd(add))
				// clear input
				setTextInputValue('')
				// do search
				dispatch(Actions.attemptSearch())
			}}
			id="typeahead-form-wrapper"
		>
			<MantineCore.Autocomplete
				id="typeahead-search-input"
				placeholder="type a query or search '*' for all"
				itemComponent={AutoCompleteItem}
				data={results}
				value={textInputValue}
				onChange={setTextInputValue}
				ref={textInputRef}
				// todo: if no icon show a fixed width whatever so there's no resize on load
				rightSection={
					<div
						style={{
							width: 18,
							display: 'flex',
						}}
					>
						{error ? (
							<Icons.IconMoodCry size={18} color="red" />
						) : loading ? (
							<MantineCore.Loader size={18} color="grey" />
						) : (
							''
						)}
					</div>
				}
				onItemSubmit={(item) => {
					const { type, subtype, value } = item

					dispatch(Actions.searchQueryAdd({ type, subtype, value }))
					setTextInputValue('')
					dispatch(Actions.attemptSearch())
				}}
				onKeyDown={onKeyDown}
				// todo: get these from vars (shared above with style of right section)
				// 26 = width of 18 + margin of 8.
				rightSectionWidth={26}
				// todo: get this from a const, and use in the api too.
				limit={50}
				variant="unstyled"
				// clicking this shouldn't trigger focus event in parent
				onClick={(e) => e.stopPropagation()}
			/>
		</form>
	)
}

export default TypeAhead
