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

const numberplateSummaryQuery = gql`
	query {
		UIState {
			queryBuilders {
				numberplates {
					fileId
					plate
					count
				}
			}
		}
	}
`

const NumberplateQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	const { loading, error, data } = useQuery(numberplateSummaryQuery, {
		fetchPolicy: 'cache-and-network',
	})

	const userId: number = ReactRedux.useSelector(Selectors.userId) as number

	const numberplateSummaryData: Types.API.NumberplateSummary[] =
		data?.UIState?.queryBuilders.numberplates ?? []

	const dispatch = ReactRedux.useDispatch()

	const [selectedPlate, setSelectedPlate] = React.useState<
		string | undefined
	>(undefined)

	const addPlantQuery = () => {
		if (!selectedPlate) {
			return
		}

		const newPlateQuery = {
			type: Enums.QueryType.OCR,
			subtype: Enums.QuerySubtype.NUMBER_PLATE,
			value: selectedPlate,
		}
		dispatch(Actions.searchQueryAdd(newPlateQuery))
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
	if (numberplateSummaryData.length === 0) {
		// todo: nicer error
		return <>no number plate data to search against.</>
	}

	return (
		<div id="folder-query-builder">
			Select one of {numberplateSummaryData.length} plant
			{numberplateSummaryData.length > 1 && 's'}.
			<div id="flower-summary-list">
				{numberplateSummaryData.map(
					({ fileId, plate, count }, plateIndex) => (
						<MantineCore.Card
							shadow="sm"
							p="lg"
							radius="md"
							withBorder
							key={plateIndex}
							onClick={() => setSelectedPlate(plate)}
							className="flower-result"
						>
							<MantineCore.Card.Section>
								<MantineCore.Image
									src={HelperUtil.thumbPath(
										userId,
										fileId,
										'm',
									)}
									height={160}
									alt={plate}
								/>
							</MantineCore.Card.Section>

							<MantineCore.Group position="apart" mt="md" mb="xs">
								<MantineCore.Text weight={500}>
									<Icons.IconCarCrash size={12} />
									{plate}
								</MantineCore.Text>

								<MantineCore.Text size="sm" color="dimmed">
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
			<div className="button-to-add-query-container">
				<MantineCore.Button
					radius="md"
					size="md"
					onClick={addPlantQuery}
					leftIcon={<Icons.IconSearch />}
					variant="outline"
					color="gray"
					disabled={!selectedPlate}
				>
					{selectedPlate ? (
						<>
							Search for files containing the numberplate:&nbsp;{' '}
							<strong>{selectedPlate}</strong>
						</>
					) : (
						'Search'
					)}
				</MantineCore.Button>
			</div>
		</div>
	)
}

export default NumberplateQueryBuilder
