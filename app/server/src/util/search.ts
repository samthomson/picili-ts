import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'
import Logger from '../services/logging'
import * as DBUtil from '../util/db'
import Supercluster from 'supercluster'
import moment from 'moment'

const individualQuerySearch = async (
    userId: number,
    individualQuery: Types.API.IndividualSearchQuery,
    sort: Enums.SearchSort,
): Promise<Types.Core.SearchQueryResultSet> => {
    const timeAtStart = moment()
    const dbResults = await DBUtil.performSearchQuery(userId, individualQuery)
    // filter unique, as a file may match the queries on two tags (eg folder=china, location=china)
    const uniqueDbResults = Array.from(new Set(dbResults.map((x) => JSON.stringify(x)))).map((y) => JSON.parse(y))

    const searchTime = moment().diff(timeAtStart)
    Logger[searchTime > 250 ? 'warn' : 'info']('SearchUtil.individualQuerySearch', {
        searchTime,
        individualQuery,
        sort,
        userId,
    })

    return { query: individualQuery, results: uniqueDbResults }
}

const findOverlappingResults = (
    arrayOfResultArrays: Types.Core.DBSearchMatch[][],
    sortMode: Enums.SearchSort,
): Types.Core.DBSearchMatch[] => {
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
    const resultsThatAreInAllResultSets: Types.Core.DBSearchMatch[] = []
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

    // scoring can be skipped if the user isn't sorting by confidence - just return early

    if (sortMode !== Enums.SearchSort.RELEVANCE) {
        return resultsThatAreInAllResultSets
    } else {
        // map to k/v structure
        const scores: Record<number, number>[] = new Array(arrayOfResultArrays.length).fill(new Object())

        for (let i = 0; i < arrayOfResultArrays.length; i++) {
            const arrayOfResults = arrayOfResultArrays[i]

            scores[i] = {}

            for (let j = 0; j < arrayOfResults.length; j++) {
                const { fileId, score } = arrayOfResults[j]
                scores[i][fileId] = score
            }
        }

        // sum scores from each result set
        const scoredResults = resultsThatAreInAllResultSets.map((result) => {
            const { fileId, latitude, longitude } = result
            // get scores from each result set
            let cumulativeScore = 0
            for (let i = 0; i < scores.length; i++) {
                cumulativeScore += scores[i][fileId]
            }
            return {
                fileId,
                score: cumulativeScore,
                latitude,
                longitude,
            }
        })

        // DESC sort by default
        const sortedScoredResults = scoredResults.sort(({ score: a }, { score: b }) => b - a)

        // sorting by confidence, so sort accordingly.
        return sortedScoredResults
    }
}

export const sortsForSearchQuery = (searchQuery: Types.API.SearchQuery): Types.Core.SortsForSearchQuery => {
    const { individualQueries } = searchQuery

    const defaultSorts = [Enums.SearchSort.LATEST, Enums.SearchSort.OLDEST]

    // todo: use query type enum
    // const enableElevation = individualQueries.filter(query => query?.type === 'elevation').length > 0
    const enableElevation = true

    const enableRelevance = individualQueries.filter((query) => !query?.type || query.type === 'colour').length > 0

    const availableSortModes = [
        ...defaultSorts,
        ...(enableElevation ? [Enums.SearchSort.ELEVATION_HIGHEST, Enums.SearchSort.ELEVATION_LOWEST] : []),
        ...(enableRelevance ? [Enums.SearchSort.RELEVANCE] : []),
    ]

    const recommendedSortMode = availableSortModes.includes(Enums.SearchSort.RELEVANCE)
        ? Enums.SearchSort.RELEVANCE
        : Enums.SearchSort.LATEST

    return {
        availableSortModes,
        recommendedSortMode,
    }
}

export const search = async (
    userId: number,
    searchQuery: Types.API.SearchQuery,
    sortToUse: Enums.SearchSort,
): Promise<Types.Core.MatchingResultData> => {
    // foreach individual query, perform an individual query search
    const individualQueryPromises = searchQuery.individualQueries.map((individualQuery) =>
        individualQuerySearch(userId, individualQuery, sortToUse),
    )
    const individualQueryResultSets: Types.Core.SearchQueryResultSet[] = await Promise.all(individualQueryPromises)

    const queryStats: Types.API.QueryStats[] = await Promise.all(
        individualQueryResultSets.map(async (results) => ({
            query: results.query,
            resultCount: results.results.length,
            // firstResultUUID: (await DBUtil.getFileById(results.results[0]?.fileId))?.uuid,
            firstResultFileId: results.results[0]?.fileId,
        })),
    )

    // divide `individualQueryResults` into normal queries and not queries.
    const normalQueryResults: Types.Core.SearchQueryResultSet[] = individualQueryResultSets.filter(
        ({ query }) => !(query?.isNotQuery ?? false),
    )
    const notQueryResults: Types.Core.SearchQueryResultSet[] = individualQueryResultSets.filter(
        ({ query }) => query?.isNotQuery ?? false,
    )

    // find overlapping results
    const overlappingResults = findOverlappingResults([...normalQueryResults.map(({ results }) => results)], sortToUse)

    // remove any not query results
    const notResultIds = notQueryResults.map(({ results }) => results)
    const allNotResultIds = notResultIds.flat()
    // const flattenedNotResultIds: number[] = [...new Set(allNotResultIds)]
    const flattenedNotResultIds: Types.Core.DBSearchMatch[] = allNotResultIds
    const filteredResults = overlappingResults.filter((result) => !flattenedNotResultIds.includes(result))

    // return those results
    const sortedResults = filteredResults
    return { searchMatches: sortedResults, queryStats }
}

export const autoComplete = async (
    userId: number,
    partialQuery: Types.API.IndividualSearchQuery,
): Promise<Types.API.TagSuggestion[]> => {
    //

    return await DBUtil.performAutoCompleteQuery(userId, partialQuery)
}

export const geoAggregateResults = (
    results: Types.Core.DBSearchMatch[],
    mapBounds: number[], // [-180, -85, 180, 85]
    zoom: number, // 2
    userId: number,
): Types.API.GeoAggregations => {
    const supercluster = new Supercluster()

    // first filter to results with lat/lon and parse to required format
    const points = results
        .filter(({ latitude, longitude }) => latitude !== undefined && longitude !== undefined)
        .map((result) => ({
            type: 'Feature',
            // todo: get uuid without selecting for every sub query?
            properties: { cluster: false, fileId: result.fileId /*, uuid: null*/ /*result.uuid*/ },
            geometry: {
                type: 'Point',
                coordinates: [result.longitude, result.latitude],
            },
        }))
    supercluster.load(points)

    // get clustered points relative to the map bounds and zoom
    const geoClusters = supercluster.getClusters(mapBounds, Math.floor(zoom))

    // parse out what we want from supercluster's data structure
    const clusters = geoClusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates

        // for each cluster we'll return, get the data either from the first result in the cluster or from the cluster itself when there is only one result in that aggregation.
        const { fileId, fileCount } = (() => {
            if (cluster.properties.cluster) {
                // lots of results per aggregation, take the first
                const { fileId } = supercluster.getLeaves(cluster.id, 1)[0].properties
                const { point_count: fileCount } = cluster.properties
                return { fileId, fileCount }
            } else {
                const { fileId } = cluster.properties
                return { fileId, fileCount: 1 }
            }
        })()

        return {
            latitude,
            longitude,
            fileCount,
            fileId,
            // uuid,
            userId,
        }
    })
    return {
        clusters,
    }
}

export const extractMapParamsFromSearchQueries = (
    individualQueries: Types.API.IndividualSearchQuery[],
): [number[], number] | undefined => {
    // get just the map query
    const geoQuery = individualQueries.find((query) => query.type === Enums.QueryType.MAP)

    if (!geoQuery) {
        return undefined
    }
    // convert our search map bounds to what the supercluster library wants.
    const [swLat, neLat, swLng, neLng, zoom] = geoQuery.value.split(',')

    // eg [[-180, -85, 180, 85], 2]
    // [-longitude, -latitude, +longitude, +latitude] ???

    return [[+swLng, +swLat, +neLng, +neLat], +zoom]
}
