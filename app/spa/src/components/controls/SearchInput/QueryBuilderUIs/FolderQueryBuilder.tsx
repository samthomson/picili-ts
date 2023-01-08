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

	const folderSummaryData: Types.API.FolderSummary[] =
		data?.UIState?.queryBuilders.folders ?? []

	const dispatch = ReactRedux.useDispatch()

	// todo:
	// const addFolderQuery = () => {
	// 	const newElevationQuery = {
	// 		type: Enums.QueryType.,
	// 		value: `${rangeValue?.[0]}:${rangeValue?.[1]}`,
	// 	}
	// 	dispatch(Actions.searchQueryAdd(newElevationQuery))
	// 	dispatch(Actions.attemptSearch())

	// 	// close modal
	// 	closeModal()
	// }

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
						<div className="folder-summary" key={folderIndex}>
							<div className="image-part">
								<img
									key={id}
									src={HelperUtil.thumbPath(
										// todo: get properly
										3,
										id,
										's',
									)}
									className="folder-summary-image"
								/>
							</div>
							<div className="summary-part">
								<Icons.IconFolder size={12} /> {fileDirectory}
								<br />
								<Icons.IconFolders size={12} />{' '}
								{latestDirectoryPath}
								<br />
								{fileCount} file
								{fileCount > 1 && 's'}
								{!!latestDate && (
									<>
										&nbsp;&middot;{' '}
										{HelperUtil.formatDateForUI(latestDate)}
									</>
								)}
							</div>
							<hr />
						</div>
					),
				)}
			</div>

			<div className="button-to-add-query-container">
				<MantineCore.Button
					radius="md"
					size="md"
					// onClick={addElevationQuery}
					leftIcon={<Icons.IconSearch />}
					variant="outline"
					color="gray"
					disabled={true}
				>
					Search for files in {'gfdgfds'}
				</MantineCore.Button>
			</div>
		</div>
	)
}

export default FolderQueryBuilder
