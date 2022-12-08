import * as React from 'react'
import { useQuery, gql } from '@apollo/client'

import * as Types from '@shared/declarations'

const taskProcessorSummaryQuery = gql`
	query taskProcessor {
		taskProcessor {
			stopping
			isImportingEnabled
			currentTasksBeingProcessed {
				id
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
	const { stopping, isImportingEnabled } = taskProcessorSummary

	return (
		<React.Fragment>
			[stopping: {String(stopping)}] [importing enabled:{' '}
			{String(isImportingEnabled)}]
		</React.Fragment>
	)
}

export default ProcessorSummaryHeader
