import * as React from 'react'
import * as MantineCore from '@mantine/core'
import * as Icons from '@tabler/icons'

const ErrorBoundaryFallback: React.FunctionComponent<{
	error: Error
	resetErrorBoundary: (...args: Array<unknown>) => void
}> = ({ error, resetErrorBoundary }) => {
	return (
		<div id="error-boundary-ui">
			<h2>
				<Icons.IconMoodOff />
				&nbsp;Something went wrong...
			</h2>
			<pre>{error.message}</pre>

			<MantineCore.Button
				variant="default"
				radius="md"
				size="sm"
				leftIcon={<Icons.IconReload size={14} />}
				onClick={resetErrorBoundary}
			>
				Reload
			</MantineCore.Button>
		</div>
	)
}

export default ErrorBoundaryFallback
