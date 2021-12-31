import * as React from 'react'
import { useQuery, gql } from '@apollo/client'

import * as Types from '@shared/declarations'

const taskProcessorSummaryQuery = gql`
	query taskProcessor {
		taskProcessor {
			stopping
			isImportingEnabled
			currentTasksBeingProcessed
		}
	}
`

const ProcessorSummaryHeader: React.FunctionComponent = () => {
	const refetchData = () => {
		refetch()
		setTimeout(refetchData, 15000)
	}

	React.useEffect(() => {
		setTimeout(() => {
			refetchData()
		}, 15000)
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
