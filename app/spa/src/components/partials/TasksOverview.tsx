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
	}
`

const TasksOverview: React.FunctionComponent = () => {
	const { loading, error, data } = useQuery(taskSummaryQuery)

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
					<tr>
						<td>type</td>
						<td>count</td>
					</tr>
					{queues.map((row, i) => (
						<tr key={i}>
							<td>
								{row.type.replaceAll('_', ' ').toLowerCase()}
							</td>
							<td>{row.count}</td>
						</tr>
					))}
				</table>
			)}
			<h2>processed</h2>
			{recent.length === 0 && (
				<>no tasks processed in the last month...</>
			)}
			{recent.length > 0 && (
				<table>
					<tr>
						<td>date</td>
						<td>count</td>
					</tr>
					{recent.map((row, i) => (
						<tr key={i}>
							<td>{moment(row.date).format('MMM Do')}</td>
							<td>{row.count}</td>
						</tr>
					))}
				</table>
			)}
		</React.Fragment>
	)
}

export default TasksOverview
