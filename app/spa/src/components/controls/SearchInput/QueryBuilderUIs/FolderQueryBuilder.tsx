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
	query {
		UIState {
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
	const { loading, error, data } = useQuery(folderSummaryQuery, {
		fetchPolicy: 'no-cache',
	})

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
						<div
							className="folder-summary"
							key={folderIndex}
							onClick={() =>
								setSelectedFolder(latestDirectoryPath)
							}
						>
							<div className="image-part">
								<img
									key={id}
									src={HelperUtil.thumbPath(userId, id, 's')}
									className="folder-summary-image"
								/>
							</div>
							<div className="summary-part">
								<Icons.IconFolder size={12} /> {fileDirectory}
								<br />
								<Icons.IconFolders size={12} />{' '}
								<small>{latestDirectoryPath}</small>
								<br />
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
							</div>
						</div>
					),
				)}
			</div>
			<div className="button-to-add-query-container">
				<MantineCore.Button
					radius="md"
					size="md"
					onClick={addFolderQuery}
					leftIcon={<Icons.IconSearch />}
					variant="outline"
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
