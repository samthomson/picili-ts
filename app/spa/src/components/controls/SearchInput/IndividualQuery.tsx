import * as React from 'react'
import * as Types from '@shared/declarations'
interface IProps {
	individualQuery: Types.API.IndividualSearchQuery
}

const IndividualQuery: React.FunctionComponent<IProps> = ({
	individualQuery,
}) => {
	return <div className="individual-query">[{individualQuery.value}]</div>
}

export default IndividualQuery
