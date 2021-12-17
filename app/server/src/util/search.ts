import * as Types from '@shared/declarations'
import * as Models from '../db/models'
import * as DBUtil from '../util/db'

const individualQuerySearch = async (
    userId: number,
    individualQuery: Types.API.IndividualSearchQuery,
): Promise<Types.API.SearchResultItem[]> => {
    return await DBUtil.performSearchQuery(userId, individualQuery)
}

const findOverlappingResults = (arrayOfResultArrays: Types.API.SearchResultItem[][]): Types.API.SearchResultItem[] => {
    if (arrayOfResultArrays.length < 2) {
        return arrayOfResultArrays[0]
    }

    // start with the smallest array
    let smallestIndex = 0
    let smallestLength = arrayOfResultArrays[0].length
    for (let i = 1; i < arrayOfResultArrays.length; i++) {
        if (arrayOfResultArrays[i].length < smallestLength) {
            smallestIndex = i
            smallestLength = arrayOfResultArrays[i].length
        }
    }
    const shortestSetOfResults = arrayOfResultArrays[smallestIndex]
    const otherSetsOfResultsIdsOnly: number[][] = arrayOfResultArrays
        .filter((array, index) => index !== smallestIndex)
        .map((arrayOfResults) => arrayOfResults.map(({ fileId }) => fileId))

    // then go through each item and see if it is in all other arrays
    const resultsThatAreInAllResultSets: Types.API.SearchResultItem[] = []
    shortestSetOfResults.map((resultItem) => {
        // now see if it is in all other sets
        const occuringInOtherSet = otherSetsOfResultsIdsOnly.filter((arrayOfIds) =>
            arrayOfIds.includes(resultItem.fileId),
        )
        // occurs in as many arrays of results as there are (all)

        if (occuringInOtherSet.length === otherSetsOfResultsIdsOnly.length) {
            resultsThatAreInAllResultSets.push(resultItem)
        }
    })

    return resultsThatAreInAllResultSets
}

export const search = async (
    userId: number,
    searchQuery: Types.API.SearchQuery,
): Promise<Types.API.SearchResultItem[]> => {
    // foreach individual query, perform an individual query search
    const individualQueryPromises = searchQuery.individualQueries.map((individualQuery) =>
        individualQuerySearch(userId, individualQuery),
    )
    const individualQueryResults = await Promise.all(individualQueryPromises)
    // find overlapping results
    const overlappingResults = findOverlappingResults(individualQueryResults)
    // return those results
    return overlappingResults
}
