import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery, gql } from '@apollo/client'
import * as Icons from '@tabler/icons'

import * as Types from '@shared/declarations'

const taskProcessorSummaryQuery = gql`
	query taskProcessor {
		taskProcessor {
			stopping
			isImportingEnabled
			workers {
				id
			}
			storageStates {
				storageSpaceFull {
					value
					updatedAt
				}
				imageProcessingDirFull {
					value
					updatedAt
				}
				videoProcessingDirFull {
					value
					updatedAt
				}
			}
		}
	}
`
const refreshPeriod = 60000
const ProcessorSummaryHeader: React.FunctionComponent = () => {
	const refetchData = () => {
		refetch()
		setTimeout(refetchData, refreshPeriod)
	}

	// do we really need this at all? made sense at one point but not sure anymore.
	React.useEffect(() => {
		setTimeout(() => {
			refetchData()
		}, refreshPeriod)
	}, [])

	const { loading, error, data, refetch } = useQuery(
		taskProcessorSummaryQuery,
		{
			fetchPolicy: 'no-cache',
		},
	)

	if (loading) {
		return <>loading...</>
	}

	if (error) {
		return <>{error?.message}</>
	}

	const taskProcessorSummary: Types.API.TaskProcessor = data.taskProcessor
	// const { stopping, isImportingEnabled } = taskProcessorSummary
	const {
		storageStates: {
			storageSpaceFull: { value: isStorageSpaceFull },
			imageProcessingDirFull: { value: isImageProcessingDirFull },
			videoProcessingDirFull: { value: isVideoProcessingDirFull },
		},
	} = taskProcessorSummary

	return (
		<React.Fragment>
			{/* [stopping: {String(stopping)}] [importing enabled:{' '}
			{String(isImportingEnabled)}] */}
			{isStorageSpaceFull && (
				<NavLink
					exact={true}
					to={'/admin'}
					className="header-summary-icon-link"
				>
					<Icons.IconRefreshOff
						size={24}
						color="red"
						// todo: tooltip?
						// title="out of space - syncing stopped"
					/>
				</NavLink>
			)}
			{isVideoProcessingDirFull ||
				(isImageProcessingDirFull && (
					<NavLink
						exact={true}
						to={'/admin'}
						className="header-summary-icon-link"
					>
						<Icons.IconRefreshAlert
							size={24}
							color="orange"
							// todo: tooltip?
							// title="processing dir is full - syncing paused"
						/>
					</NavLink>
				))}
		</React.Fragment>
	)
}

export default ProcessorSummaryHeader
