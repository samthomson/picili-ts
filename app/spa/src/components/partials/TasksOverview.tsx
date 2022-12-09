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
				actionable {
					actionableTasksVideoCapable
					actionableTasksNonVideoCapable
				}
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
				threadNo
				isVideoCapable
				timeLastStartedATask
				timeLastFinishedATask
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
	const { actionableTasksVideoCapable, actionableTasksNonVideoCapable } =
		actionable
	return (
		<React.Fragment>
			<h2>tasks queued</h2>
			<span title={oldest}>Queue age: {queueAge}</span>
			<br />
			total tasks: {totalTasks}
			<br />
			actionable tasks (isVideoCapable): {actionableTasksVideoCapable}
			<br />
			actionable tasks (non video capable):{' '}
			{actionableTasksNonVideoCapable}
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
			{/* if start is after end: render start as time spent working on task 
			if end is after start: render time since end as time idle since last task */}
			{workers.length > 0 && (
				<table>
					<thead>
						<tr>
							<td>thread</td>
							<td>isVideoCapable</td>
							<td>timing</td>
							<td>task: id</td>
							<td>task: type</td>
							<td>task: import?</td>
							<td>task: # attempted</td>
						</tr>
					</thead>
					<tbody>
						{workers.map(
							(
								{
									threadNo,
									isVideoCapable,
									timeLastStartedATask,
									timeLastFinishedATask,
									currentTaskBeingProcessed,
								},
								i,
							) => {
								const timeLastStarted =
									moment(timeLastStartedATask)
								const timeLastFinished = moment(
									timeLastFinishedATask,
								)

								const timingDisplay = (() => {
									// haven't yet done anything
									if (!timeLastStartedATask) {
										return 'n/a'
									}

									// started a task but haven't finished one
									if (
										timeLastStartedATask &&
										!timeLastFinishedATask
									) {
										return `started ${moment
											.duration(
												timeLastStarted.diff(moment()),
											)
											.humanize()} ago`
									}

									// started a task after last finishing one
									if (
										timeLastStarted.isAfter(
											timeLastFinished,
										)
									) {
										return `started
										${moment.duration(timeLastFinished.diff(moment())).humanize()} ago`
									}

									// finished a task but not started a new one yet
									if (
										timeLastFinishedATask &&
										!timeLastStartedATask
									) {
										return `idle since
										${moment.duration(timeLastFinished.diff(moment())).humanize()} ago`
									}

									return '[unexpected timing state?]'
								})()

								return (
									<tr key={i}>
										<td>{threadNo}</td>
										<td>{isVideoCapable.toString()}</td>
										<td>{timingDisplay}</td>
										{currentTaskBeingProcessed && (
											<>
												<td>
													{
														currentTaskBeingProcessed.id
													}
												</td>
												<td>
													{
														currentTaskBeingProcessed.taskType
													}
												</td>
												<td>
													{String(
														currentTaskBeingProcessed.importTask,
													)}
												</td>
											</>
										)}

										{!currentTaskBeingProcessed && (
											<td colSpan={3}>[no task]</td>
										)}
									</tr>
								)
							},
						)}
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
