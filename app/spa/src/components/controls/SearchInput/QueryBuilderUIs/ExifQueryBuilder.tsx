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

const exifSummaryQuery = gql`
	query {
		UIState {
			queryBuilders {
				exifCameras {
					bucket
					summaries {
						fileId
						value
						count
					}
				}
			}
		}
	}
`

const ExifQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	const { loading, error, data } = useQuery(exifSummaryQuery, {
		fetchPolicy: 'cache-and-network',
	})

	const userId: number = ReactRedux.useSelector(Selectors.userId) as number

	const exifSummaryData: Types.API.ExifCameraSummary[] =
		data?.UIState?.queryBuilders.exifCameras ?? []

	const dispatch = ReactRedux.useDispatch()

	const [selectedQuery, setSelectedQuery] = React.useState<
		{ subtype: string; value: string } | undefined
	>(undefined)

	const addQuery = () => {
		if (!selectedQuery) {
			return
		}

		const newQuery = {
			type: Enums.QueryType.EXIF,
			subtype: selectedQuery.subtype,
			value: selectedQuery.value,
		}
		dispatch(Actions.searchQueryAdd(newQuery))
		dispatch(Actions.attemptSearch())

		// close modal
		closeModal()
	}

	if (loading) {
		// todo: proper loading ui
		return <>loading...</>
	}

	if (error) {
		return <>{error?.message}</>
	}

	// todo: refactor, these are the same thing
	if (exifSummaryData.length === 0) {
		// todo: nicer error
		return <>no exif camera data to search against.</>
	}

	return (
		<div id="folder-query-builder">
			Select a camera make/model/lens and click search.
			<div id="exif-aggregation-bucket-list">
				{exifSummaryData.map(({ bucket, summaries }, bucketIndex) => (
					<>
						<h4>{bucket}</h4>
						<div
							id="exif-aggregation-bucket-summaries-list"
							key={bucketIndex}
						>
							{summaries.map(
								({ fileId, value, count }, plantIndex) => (
									<MantineCore.Card
										shadow="sm"
										p="lg"
										radius="md"
										withBorder
										key={plantIndex}
										onClick={() =>
											setSelectedQuery({
												subtype: bucket,
												value,
											})
										}
										className="exif-summary"
									>
										<MantineCore.Card.Section>
											<MantineCore.Image
												src={HelperUtil.thumbPath(
													userId,
													fileId,
													'm',
												)}
												height={160}
												alt={value}
											/>
										</MantineCore.Card.Section>

										<MantineCore.Group
											position="apart"
											mt="md"
											mb="xs"
										>
											<MantineCore.Text weight={500}>
												{value}
											</MantineCore.Text>

											<MantineCore.Text
												size="sm"
												color="dimmed"
											>
												<small>
													&nbsp;{count} occurence
													{count > 1 && 's'}
												</small>
											</MantineCore.Text>
										</MantineCore.Group>
									</MantineCore.Card>
								),
							)}
						</div>
					</>
				))}
			</div>
			<div className="button-to-add-query-container">
				<MantineCore.Button
					radius="md"
					size="md"
					onClick={addQuery}
					leftIcon={<Icons.IconSearch />}
					variant="outline"
					color="gray"
					disabled={!selectedQuery}
				>
					Search
				</MantineCore.Button>
			</div>
		</div>
	)
}

export default ExifQueryBuilder
