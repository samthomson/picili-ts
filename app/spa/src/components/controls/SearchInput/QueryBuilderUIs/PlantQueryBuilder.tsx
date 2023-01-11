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

const plantSummaryQuery = gql`
	query {
		UIState {
			queryBuilders {
				plants {
					fileId
					name
				}
			}
		}
	}
`

const PlantQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	const { loading, error, data } = useQuery(plantSummaryQuery, {
		fetchPolicy: 'cache-and-network',
	})

	const userId: number = ReactRedux.useSelector(Selectors.userId) as number

	const plantSummaryData: Types.API.PlantSummary[] =
		data?.UIState?.queryBuilders.plants ?? []

	const dispatch = ReactRedux.useDispatch()

	const [selectedPlant, setSelectedPlant] = React.useState<
		string | undefined
	>(undefined)

	const addPlantQuery = () => {
		if (!selectedPlant) {
			return
		}

		const newPlantQuery = {
			type: Enums.QueryType.PLANT,
			subtype: Enums.QuerySubtype.SCIENTIFICNAME,
			value: selectedPlant,
		}
		dispatch(Actions.searchQueryAdd(newPlantQuery))
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
	if (plantSummaryData.length === 0) {
		// todo: nicer error
		return <>no plant data to search against.</>
	}

	return (
		<div id="folder-query-builder">
			Select one of {plantSummaryData.length} plant
			{plantSummaryData.length > 1 && 's'}.
			<div id="flower-summary-list">
				{plantSummaryData.map(({ fileId, name }, plantIndex) => (
					<MantineCore.Card
						shadow="sm"
						p="lg"
						radius="md"
						withBorder
						key={plantIndex}
						onClick={() => setSelectedPlant(name)}
						className="flower-result"
					>
						<MantineCore.Card.Section>
							<MantineCore.Image
								src={HelperUtil.thumbPath(userId, fileId, 'm')}
								height={160}
								alt={name}
							/>
						</MantineCore.Card.Section>

						<MantineCore.Group position="apart" mt="md" mb="xs">
							<MantineCore.Text weight={500}>
								{name}
							</MantineCore.Text>
						</MantineCore.Group>
					</MantineCore.Card>
				))}
			</div>
			<div className="button-to-add-query-container">
				<MantineCore.Button
					radius="md"
					size="md"
					onClick={addPlantQuery}
					leftIcon={<Icons.IconSearch />}
					variant="outline"
					color="gray"
					disabled={!selectedPlant}
				>
					{selectedPlant ? (
						<>
							Search for files in:&nbsp;{' '}
							<strong>{selectedPlant}</strong>
						</>
					) : (
						'Search'
					)}
				</MantineCore.Button>
			</div>
		</div>
	)
}

export default PlantQueryBuilder
