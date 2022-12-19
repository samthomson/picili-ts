import * as Types from '@shared/declarations'
import * as Enums from '../../../shared/enums'
import * as DBUtil from '../util/db'
import Supercluster from 'supercluster'

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

export const autoComplete = async (
    userId: number,
    partialQuery: Types.API.IndividualSearchQuery,
): Promise<Types.API.TagSuggestion[]> => {
    //

    return await DBUtil.performAutoCompleteQuery(userId, partialQuery)
}

export const geoAggregateResults = (
    results: Types.API.SearchResultItem[],
    mapBounds: number[], // [-180, -85, 180, 85]
    zoom: number, // 2
): Types.API.GeoAggregations => {
    const supercluster = new Supercluster()

    // first filter to results with lat/lon and parse to required format
    const points = results
        .filter(({ latitude, longitude }) => latitude !== undefined && longitude !== undefined)
        .map((result) => ({
            type: 'Feature',
            properties: { cluster: false, fileId: result.fileId, uuid: result.uuid },
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
        const { fileId, uuid, fileCount } = (() => {
            if (cluster.properties.cluster) {
                // lots of results per aggregation, take the first
                const { fileId, uuid } = supercluster.getLeaves(cluster.id, 1)[0].properties
                const { point_count: fileCount } = cluster.properties
                return { fileId, uuid, fileCount }
            } else {
                const { fileId, uuid } = cluster.properties
                return { fileId, uuid, fileCount: 1 }
            }
        })()

        const userId = results[0].userId
        return {
            latitude,
            longitude,
            fileCount,
            fileId,
            uuid,
            userId,
        }
    })
    return {
        clusters,
    }
}

// get just the map query
export const extractMapQueryFromSearchQueries = (
    individualQueries: Types.API.IndividualSearchQuery[],
): Types.API.IndividualSearchQuery | undefined => individualQueries.find((query) => query.type === 'map')

export const extractMapParamsFromSearchQueries = (
    individualQueries: Types.API.IndividualSearchQuery[],
): [number[], number] | undefined => {
    // get just the map query
    const geoQuery = extractMapQueryFromSearchQueries(individualQueries)

    if (!geoQuery) {
        return undefined
    }

    // convert our search map bounds to what the supercluster library wants.
    const [swLat, neLat, swLng, neLng, zoom] = geoQuery.value.split(',')

    // eg [[-180, -85, 180, 85], 2]
    // [-longitude, -latitude, +longitude, +latitude] ???

    return [[+swLng, +swLat, +neLng, +neLat], +zoom]
}
