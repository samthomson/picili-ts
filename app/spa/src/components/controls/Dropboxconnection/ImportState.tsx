import React from 'react'
import { useMutation, gql } from '@apollo/client'

const stopImportingGQL = gql`
	mutation stopImporting {
		taskProcessor {
			stopProcessingImportTasks
		}
	}
`
interface IProps {
	stopping: boolean
	isImportingEnabled: boolean
	refetch: () => void
}

const ImportState: React.FunctionComponent<IProps> = ({
	stopping,
	isImportingEnabled,
	refetch,
}) => {
	const [stopImportingMutation, { error: httpError, data, loading = false }] =
		useMutation(stopImportingGQL)

	const refetchData = () => {
		refetch()
		setTimeout(refetchData, 15000)
	}

	React.useEffect(() => {
		setTimeout(() => {
			refetchData()
		}, 5000)
	}, [])

	const stopImportingFailed =
		httpError?.message ||
		data?.taskProcessor.stopProcessingImportTasks.error

	const stopImportingHandler = async (e: React.FormEvent) => {
		e.preventDefault()
		if (
			confirm(
				'are you sure you want to stop picili from importing the files it has already started?',
			)
		) {
			await stopImportingMutation()
			// refetch parent query so that it trickles down to this component and we block the stop button
			await refetch()
		}
	}

	return (
		<div>
			{isImportingEnabled && stopping && (
				<>
					Picili is stopping the tasks it is already processing.
					Please wait/<a onClick={() => refetch()}>refresh</a>.
				</>
			)}
			{isImportingEnabled && !stopping && (
				<>
					<p>
						Picili is currently importing files and so the dropbox
						connection can&apos;t be changed unless you stop
						importing.
					</p>
					{stopImportingFailed && { stopImportingFailed }}
					<button onClick={stopImportingHandler} disabled={loading}>
						stop importing
					</button>
				</>
			)}
		</div>
	)
}

export default ImportState
