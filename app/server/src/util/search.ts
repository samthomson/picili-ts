import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'
import * as Models from '../db/models'
import * as DBUtil from '../util/db'

const individualQuerySearch = async (
    userId: number,
    individualQuery: Types.API.IndividualSearchQuery,
    sort: Enums.SearchSort
): Promise<Types.API.SearchResultItem[]> => {
    const dbResults = await DBUtil.performSearchQuery(userId, individualQuery, sort)
    // filter unique, as a file may match the queries on two tags (eg folder=china, location=china)
    const uniqueDbResults = Array.from(new Set(dbResults.map(x => JSON.stringify(x)))).map(y => JSON.parse(y))
    
    return uniqueDbResults
}

const findOverlappingResults = (arrayOfResultArrays: Types.API.SearchResultItem[][]): Types.API.SearchResultItem[] => {
    // check for no results
    if (arrayOfResultArrays.length === 0) {
        return []
    }
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

export const sortsForSearchQuery = (
    searchQuery: Types.API.SearchQuery,
): Types.Core.SortsForSearchQuery => {
    const { individualQueries } = searchQuery

    const defaultSorts = [Enums.SearchSort.LATEST, Enums.SearchSort.OLDEST]

    // todo: use query type enum
    // const enableElevation = individualQueries.filter(query => query?.type === 'elevation').length > 0
    const enableElevation = true

    const enableRelevance = individualQueries.filter(query => !query?.type || query.type === 'colour').length > 0

    const availableSortModes = [
        ...defaultSorts,
        ...(enableElevation ? [Enums.SearchSort.ELEVATION_HIGHEST, Enums.SearchSort.ELEVATION_LOWEST] : []),
        ...(enableRelevance ? [Enums.SearchSort.RELEVANCE] : [])
    ]

    const recommendedSortMode = availableSortModes.includes(Enums.SearchSort.RELEVANCE) ? Enums.SearchSort.RELEVANCE : Enums.SearchSort.LATEST

    return {
        availableSortModes,
        recommendedSortMode
    }
}

export const search = async (
    userId: number,
    searchQuery: Types.API.SearchQuery,
    sortToUse: Enums.SearchSort
): Promise<Types.API.SearchResultItem[]> => {
    // foreach individual query, perform an individual query search
    const individualQueryPromises = searchQuery.individualQueries.map((individualQuery) =>
        individualQuerySearch(userId, individualQuery, sortToUse),
    )
    const individualQueryResults = await Promise.all(individualQueryPromises)
    // find overlapping results
    const overlappingResults = findOverlappingResults(individualQueryResults)
    // return those results
    const sortedResults = overlappingResults
    return sortedResults
}

export const autoComplete = async (userId: number, partialQuery: Types.API.IndividualSearchQuery): Promise<Types.API.TagSuggestion[]> => {
    //

    return await DBUtil.performAutoCompleteQuery(userId, partialQuery)
}
