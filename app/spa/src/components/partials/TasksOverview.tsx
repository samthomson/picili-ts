import React from 'react'
import { useQuery, gql } from '@apollo/client'
import moment from 'moment'

import * as Types from '@shared/declarations'

const taskSummaryQuery = gql`
	query taskSummary {
		taskSummary {
			oldest
			processable {
				total
				actionable
				queues {
					type
					count
				}
			}
			processed {
				recent {
					date
					count
				}
			}
		}
		taskProcessor {
			workers {
				currentTaskBeingProcessed {
					id
					taskType
					importTask
					timesSeen
				}
			}
		}
	}
`

const TasksOverview: React.FunctionComponent = () => {
	const { loading, error, data, refetch } = useQuery(taskSummaryQuery, {
		fetchPolicy: 'no-cache',
	})

	if (loading) {
		return <>loading...</>
	}

	if (error) {
		return <>{error?.message}</>
	}

	const taskSummary: Types.API.TaskSummary = data.taskSummary
	const {
		oldest,
		processable: { total, actionable, queues },
		processed: { recent },
	} = taskSummary
	const taskProcessor: Types.API.TaskProcessor = data.taskProcessor
	const { workers } = taskProcessor

	const queueAge = !oldest
		? 'no tasks, or tasks are all scheduled in the future'
		: moment(oldest).from(moment())
	const totalTasks = total
	const actionableTasks = actionable
	return (
		<React.Fragment>
			<h2>tasks queued</h2>
			<span title={oldest}>Queue age: {queueAge}</span>
			<br />
			total tasks: {totalTasks}
			<br />
			actionable tasks: {actionableTasks}
			<br />
			<h2>queues</h2>
			{queues.length === 0 && <>no tasks queued...</>}
			{queues.length > 0 && (
				<table>
					<thead>
						<tr>
							<td>type</td>
							<td>count</td>
						</tr>
					</thead>
					<tbody>
						{queues.map((row, i) => (
							<tr key={i}>
								<td>
									{row.type
										.replaceAll('_', ' ')
										.toLowerCase()}
								</td>
								<td>{row.count}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
			<h2>processing</h2>
			{workers.length === 0 && (
				<>[no workers are active at this moment.]</>
			)}
			{workers.length > 0 && (
				<table>
					<thead>
						<tr>
							<td>id</td>
							<td>type</td>
							<td>import?</td>
							<td># attempted</td>
						</tr>
					</thead>
					<tbody>
						{workers.map(({ currentTaskBeingProcessed }, i) => (
							<tr key={i}>
								<td>{currentTaskBeingProcessed.id}</td>
								<td>{currentTaskBeingProcessed.taskType}</td>
								<td>
									{String(
										currentTaskBeingProcessed.importTask,
									)}
								</td>
								<td>{currentTaskBeingProcessed.timesSeen}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
			<h2>processed</h2>
			{recent.length === 0 && (
				<>no tasks processed in the last month...</>
			)}
			{recent.length > 0 && (
				<table>
					<thead>
						<tr>
							<td>date</td>
							<td>count</td>
						</tr>
					</thead>
					<tbody>
						{recent.map((row, i) => (
							<tr key={i}>
								<td>{moment(row.date).format('MMM Do')}</td>
								<td>{row.count}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
			<hr />
			<button onClick={() => refetch()}>refetch data</button>
		</React.Fragment>
	)
}

export default TasksOverview
