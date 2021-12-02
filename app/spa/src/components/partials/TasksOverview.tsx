import React from 'react'
import { useQuery, gql } from '@apollo/client'
import moment from 'moment'

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

	const {
		oldest,
		processable: { total, actionable },
	} = data.taskSummary

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
		</React.Fragment>
	)
}

export default TasksOverview
