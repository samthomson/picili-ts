import React from 'react'
import { useQuery, gql } from '@apollo/client'
import moment from 'moment'
import * as MantineCore from '@mantine/core'

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
					unblocked
					actionable
				}
			}
			processed {
				recent {
					date
					countSuccessful
					countUnsuccessful
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
				processedCount
			}
		}
	}
`

const TasksOverview: React.FunctionComponent = () => {
	const { loading, error, data, refetch } = useQuery(taskSummaryQuery, {
		fetchPolicy: 'no-cache',
	})

	if (loading) {
		return (
			<MantineCore.LoadingOverlay
				visible={true}
				overlayBlur={2}
				loaderProps={{ color: 'maroon' }}
			/>
		)
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
			<h2 className="admin-page-title">Queued</h2>
			<span title={oldest}>Queue age: {queueAge}</span>
			<br />
			total tasks: {totalTasks}
			<br />
			actionable tasks (isVideoCapable): {actionableTasksVideoCapable}
			<br />
			actionable tasks (non video capable):{' '}
			{actionableTasksNonVideoCapable}
			<br />
			<h2>Queues</h2>
			{queues.length === 0 && <>no tasks queued...</>}
			{queues.length > 0 && (
				<MantineCore.Table
					striped
					highlightOnHover
					withBorder
					withColumnBorders
				>
					<thead>
						<tr>
							<th>type</th>
							<th>count</th>
							<th>unblocked</th>
							<th>actionable</th>
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
								<td>{row.unblocked}</td>
								<td>{row.actionable}</td>
							</tr>
						))}
					</tbody>
				</MantineCore.Table>
			)}
			<h2>Processing</h2>
			{workers.length === 0 && (
				<>[no workers are active at this moment.]</>
			)}
			{/* if start is after end: render start as time spent working on task 
			if end is after start: render time since end as time idle since last task */}
			{workers.length > 0 && (
				<MantineCore.Table
					striped
					highlightOnHover
					withBorder
					withColumnBorders
				>
					<thead>
						<tr>
							<th>thread</th>
							<th>isVideoCapable</th>
							<th>timing</th>
							<th>task: id</th>
							<th>task: type</th>
							<th>task: import?</th>
							<th>task: # completed</th>
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
									processedCount,
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
											timeLastFinished /* || moment()*/,
										)
									) {
										return `started
										${moment.duration(timeLastFinished.diff(moment())).humanize()} ago`
									}

									// finished a task but not started a new one yet
									if (
										// this commented out line doesn't really make sense as there would always be a timeLastStartedATask if we have finished one.
										// (timeLastFinishedATask &&
										// 	!timeLastStartedATask) ||
										timeLastFinished.isAfter(
											timeLastStarted,
										)
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
										<td>{processedCount}</td>
									</tr>
								)
							},
						)}
					</tbody>
				</MantineCore.Table>
			)}
			<h2>Processed</h2>
			{recent.length === 0 && (
				<>no tasks processed in the last month...</>
			)}
			{recent.length > 0 && (
				<MantineCore.Table
					striped
					highlightOnHover
					withBorder
					withColumnBorders
				>
					<thead>
						<tr>
							<th>date</th>
							<th>succeeded</th>
							<th>failed</th>
						</tr>
					</thead>
					<tbody>
						{recent.map((row, i) => (
							<tr key={i}>
								<td>{moment(row.date).format('MMM Do')}</td>
								<td>{row.countSuccessful}</td>
								<td>{row.countUnsuccessful}</td>
							</tr>
						))}
					</tbody>
				</MantineCore.Table>
			)}
			<br />
			<button onClick={() => refetch()}>refetch data</button>
			<br />
			<br />
		</React.Fragment>
	)
}

export default TasksOverview
