import React from 'react'
import { useQuery, gql } from '@apollo/client'
import moment from 'moment'
import * as MantineCore from '@mantine/core'

import * as Types from '@shared/declarations'

const systemEventsQuery = gql`
	query systemEvents {
		systemEvents {
			items {
				id
				message
				datetime
			}
		}
	}
`

const SystemEventsOverview: React.FunctionComponent = () => {
	const { loading, error, data, refetch } = useQuery(systemEventsQuery, {
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

	const systemEvents: Types.API.SystemEventsResponse = data.systemEvents
	const { items } = systemEvents

	return (
		<React.Fragment>
			<h2>system events</h2>
			{items.length === 0 && <>no system events have occured...</>}
			{items.length > 0 && (
				<>
					<table>
						<thead>
							<tr>
								<td>when</td>
								<td>event</td>
							</tr>
						</thead>
						<tbody>
							{items.map((row, i) => (
								<tr key={i}>
									<td>
										{moment(row.datetime).format(
											'Do of MMM, h:mm:ss a',
										)}
									</td>
									<td>{row.message}</td>
								</tr>
							))}
						</tbody>
					</table>
					<br />
					<p>(showing only the most recent 100)</p>
				</>
			)}
			<hr />
			<button onClick={() => refetch()}>refetch data</button>
		</React.Fragment>
	)
}

export default SystemEventsOverview
