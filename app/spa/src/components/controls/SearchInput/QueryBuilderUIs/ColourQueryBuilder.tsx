import * as React from 'react'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Actions from 'src/redux/actions'
import * as Enums from '../../../../../../shared/enums'

const ColourQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	const [value, setValue] = React.useState('')

	const dispatch = ReactRedux.useDispatch()

	const addColourQuery = () => {
		if (value === '') {
			return
		}
		// parse out rgb
		const rgbString = value.replace('rgb(', '').replace(')', '')
		const [r, g, b] = rgbString.split(',').map((val) => +val)
		const newColourQuery = {
			type: Enums.QueryType.COLOUR,
			value: `${r},${g},${b}`,
		}
		dispatch(Actions.searchQueryAdd(newColourQuery))
		dispatch(Actions.attemptSearch())

		// close modal
		closeModal()
	}

	return (
		<div id="date-range-query-builder">
			<MantineCore.ColorInput
				placeholder="Select a colour"
				withEyeDropper
				radius="md"
				size="md"
				format="rgb"
				value={value}
				onChange={setValue}
			/>
			value: {value}
			<div className="button-to-add-query-container">
				<MantineCore.Button
					radius="md"
					size="md"
					onClick={addColourQuery}
					leftIcon={<Icons.IconSearch />}
					variant="outline"
					color="gray"
					disabled={value === ''}
				>
					Search for files
				</MantineCore.Button>
			</div>
		</div>
	)
}

export default ColourQueryBuilder
