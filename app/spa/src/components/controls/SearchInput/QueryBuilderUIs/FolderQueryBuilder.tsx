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

const folderSummaryQuery = gql`
	query ($fakeId: Int!) {
		UIState(fakeId: $fakeId) {
			queryBuilders {
				folders {
					id
					fileDirectory
					latestDirectoryPath
					latestDate
					fileCount
				}
			}
		}
	}
`

const FolderQueryBuilder: React.FunctionComponent<{
	closeModal: () => void
}> = ({ closeModal }) => {
	const { error, data } = useQuery(folderSummaryQuery, {
		fetchPolicy: 'cache-and-network',
		variables: { fakeId: 2 },
	})
	const loading = !error && !data

	const userId: number = ReactRedux.useSelector(Selectors.userId) as number

	const folderSummaryData: Types.API.FolderSummary[] =
		data?.UIState?.queryBuilders.folders ?? []

	const dispatch = ReactRedux.useDispatch()

	const [selectedFolder, setSelectedFolder] = React.useState<
		string | undefined
	>(undefined)

	const addFolderQuery = () => {
		if (!selectedFolder) {
			return
		}

		const newDirectoryQuery = {
			type: Enums.QueryType.PATH,
			subtype: Enums.QuerySubtype.DIRECTORY,
			value: selectedFolder,
		}
		dispatch(Actions.searchQueryAdd(newDirectoryQuery))
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
	if (folderSummaryData.length === 0) {
		// todo: nicer error
		return <>no folder data to search against.</>
	}

	return (
		<div id="folder-query-builder">
			Select one of {folderSummaryData.length} folder
			{folderSummaryData.length > 1 && 's'}.
			<div id="folder-summary-list">
				{folderSummaryData.map(
					(
						{
							id,
							fileDirectory,
							latestDirectoryPath,
							latestDate,
							fileCount,
						},
						folderIndex,
					) => (
						<MantineCore.Card
							shadow="sm"
							p="lg"
							radius="md"
							withBorder
							key={folderIndex}
							onClick={() =>
								setSelectedFolder(latestDirectoryPath)
							}
							className="folder-summary"
						>
							<MantineCore.Card.Section>
								<MantineCore.Image
									src={HelperUtil.thumbPath(userId, id, 'm')}
									height={160}
									alt={fileDirectory}
								/>
							</MantineCore.Card.Section>

							<MantineCore.Group position="apart" mt="md" mb="xs">
								<MantineCore.Text
									weight={500}
									className="containing-directory-title"
								>
									{fileDirectory.split('/').pop()}
								</MantineCore.Text>
							</MantineCore.Group>

							<MantineCore.Text size="sm" color="dimmed">
								<small>
									<Icons.IconFolders size={12} />
									&nbsp;{latestDirectoryPath}
								</small>
								<br />
								<small>
									<small>
										{fileCount} file
										{fileCount > 1 && 's'}
										{!!latestDate && (
											<>
												&nbsp;&middot;{' '}
												{HelperUtil.formatDateForUI(
													latestDate,
												)}
											</>
										)}
									</small>
								</small>
							</MantineCore.Text>
						</MantineCore.Card>
					),
				)}
			</div>
			<div className="button-to-add-query-container">
				<MantineCore.Button
					radius="md"
					size="md"
					onClick={addFolderQuery}
					leftIcon={selectedFolder && <Icons.IconSearch size={16} />}
					variant="light"
					color="gray"
					disabled={!selectedFolder}
				>
					{selectedFolder ? (
						<>
							Search for files in:&nbsp;{' '}
							<strong>{selectedFolder.split('/').pop()}</strong>
						</>
					) : (
						'Search'
					)}
				</MantineCore.Button>
			</div>
		</div>
	)
}

export default FolderQueryBuilder
