import React from 'react'
import { useQuery, gql } from '@apollo/client'
import moment from 'moment'
import * as MantineCore from '@mantine/core'

import * as Types from '@shared/declarations'

const systemStatsQuery = gql`
	query systemStats {
		resourceManager {
			stats {
				dateTime
				isOutOfSpace
				isImageProcessingDirOutOfSpace
				isVideoProcessingDirOutOfSpace
			}
		}
	}
`

const SystemStatsOverview: React.FunctionComponent = () => {
	const { loading, error, data, refetch } = useQuery(systemStatsQuery, {
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

	const systemStats: Types.Core.ResourceManagerStats[] =
		data.resourceManager.stats

	return (
		<React.Fragment>
			{systemStats.length === 0 && <>no system stats collated yet...</>}
			{systemStats.length > 0 && (
				<>
					<MantineCore.Table
						striped
						highlightOnHover
						withBorder
						withColumnBorders
					>
						<thead>
							<tr>
								<th>when</th>
								<th>isOutOfSpace</th>
								<th>isImageProcessingDirOutOfSpace</th>
								<th>isVideoProcessingDirOutOfSpace</th>
							</tr>
						</thead>
						<tbody>
							{systemStats.map(
								(
									{
										dateTime,
										isOutOfSpace,
										isImageProcessingDirOutOfSpace,
										isVideoProcessingDirOutOfSpace,
									},
									i,
								) => (
									<tr key={i}>
										<td>
											{moment(dateTime).format(
												'Do of MMM, h:mm:ss a',
											)}
										</td>
										<td>{String(isOutOfSpace)}</td>
										<td>
											{String(
												isImageProcessingDirOutOfSpace,
											)}
										</td>
										<td>
											{String(
												isVideoProcessingDirOutOfSpace,
											)}
										</td>
									</tr>
								),
							)}
						</tbody>
					</MantineCore.Table>
					<br />
					<p>(showing only the most recent - 60?)</p>
				</>
			)}
			<hr />
			<button onClick={() => refetch()}>refetch data</button>
		</React.Fragment>
	)
}

export default SystemStatsOverview
