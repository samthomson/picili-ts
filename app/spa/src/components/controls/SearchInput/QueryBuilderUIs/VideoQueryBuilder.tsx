import * as React from 'react'
import { useQuery, gql } from '@apollo/client'
import * as ReactRedux from 'react-redux'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

import * as Actions from 'src/redux/actions'
import * as Selectors from 'src/redux/selectors'
import * as Enums from '../../../../../../shared/enums'
import * as HelperUtil from 'src/util/helper'
import * as Types from '@shared/declarations'

const videoMinMaxQuery = gql`
	query {
		UIState {
			queryBuilders {
				videoLength {
					min
					max
				}
			}
		}
	}
`

const VideoQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	const { loading, error, data } = useQuery(videoMinMaxQuery, {
		fetchPolicy: 'no-cache',
	})

	const dispatch = ReactRedux.useDispatch()

	const videoLengthRangeData: Types.API.UIState = data?.UIState

	const defaultMinMax = videoLengthRangeData?.queryBuilders?.videoLength
		? [
				videoLengthRangeData.queryBuilders.videoLength.min,
				videoLengthRangeData.queryBuilders.videoLength.max,
		  ]
		: undefined

	const currentVideoQuery = ReactRedux.useSelector(
		Selectors.searchIndividualQueryOfType('video', 'length'),
	)

	const [rangeValue, setRangeValue] = React.useState<
		[number, number] | undefined
	>(
		currentVideoQuery &&
			HelperUtil.parseRangeValueToArrayNumeric(currentVideoQuery.value),
	)

	React.useEffect(() => {
		const parsedAPIMinMax = videoLengthRangeData?.queryBuilders
			?.videoLength && [
			videoLengthRangeData.queryBuilders.videoLength.min,
			videoLengthRangeData.queryBuilders.videoLength.max,
		]

		// only overwrite if we don't have an existing query from redux
		if (
			parsedAPIMinMax &&
			parsedAPIMinMax !== rangeValue &&
			!currentVideoQuery
		) {
			setRangeValue([parsedAPIMinMax[0], parsedAPIMinMax[1]])
		}
	}, [videoLengthRangeData?.queryBuilders.videoLength])

	const addVideoQuery = () => {
		const newVideoQuery = {
			type: Enums.QueryType.VIDEO,
			subtype: Enums.QuerySubtype.LENGTH,
			value: `${rangeValue?.[0]}:${rangeValue?.[1]}`,
		}
		dispatch(Actions.searchQueryAdd(newVideoQuery))
		dispatch(Actions.attemptSearch())

		// close modal
		closeModal()
	}

	const parseValueFromDuration = (value?: string): string => {
		return HelperUtil.parseDurationToLengthInSeconds(
			value as string,
		).toString()
	}

	const formatValueToDuration = (value?: string): string => {
		if (!HelperUtil.isNumber(value)) return ''

		// we know it is string/numeric and not undefined from above func
		return HelperUtil.formatLengthToDuration(+(value as string))
	}

	if (loading) {
		// todo: proper loading ui
		return <>loading...</>
	}

	if (error) {
		return <>{error?.message}</>
	}

	// todo: refactor, these are the same thing
	if (!defaultMinMax || !rangeValue) {
		// todo: nicer error
		return <>no video data to search against.</>
	}

	return (
		<div id="date-range-query-builder">
			<MantineCore.RangeSlider
				size="xl"
				radius="xl"
				labelAlwaysOn
				min={defaultMinMax[0]}
				max={defaultMinMax[1]}
				value={rangeValue}
				onChange={setRangeValue}
				label={formatValueToDuration}
			/>
			<div id="elevation-range-inputs">
				<MantineCore.NumberInput
					label="Minimum"
					defaultValue={rangeValue[0]}
					value={rangeValue[0]}
					onChange={(val) =>
						setRangeValue([
							val ? val : defaultMinMax[0],
							rangeValue[1],
						])
					}
					min={defaultMinMax[0]}
					max={defaultMinMax[1]}
					parser={parseValueFromDuration}
					formatter={formatValueToDuration}
					className="elevation-bound-input"
				/>

				<MantineCore.NumberInput
					label="Maximum"
					defaultValue={rangeValue[1]}
					value={rangeValue[1]}
					onChange={(val) =>
						setRangeValue([
							rangeValue[0],
							val ? val : defaultMinMax[1],
						])
					}
					min={defaultMinMax[0]}
					max={defaultMinMax[1]}
					parser={parseValueFromDuration}
					formatter={formatValueToDuration}
					className="elevation-bound-input"
				/>
			</div>
			<div className="button-to-add-query-container">
				<MantineCore.Button
					radius="md"
					size="md"
					onClick={addVideoQuery}
					leftIcon={<Icons.IconSearch />}
					variant="outline"
					color="gray"
				>
					Find videos&nbsp;
					{formatValueToDuration(rangeValue[0].toString())} to{' '}
					{formatValueToDuration(rangeValue[1].toString())} long
				</MantineCore.Button>
			</div>
		</div>
	)
}

export default VideoQueryBuilder
