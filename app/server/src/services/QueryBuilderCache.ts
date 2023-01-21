import * as HelperUtil from '../util/helper'
import * as DBUtil from '../util/db'

export class QueryBuilderCache {
    TICK_FREQUENCY = 300_000 // 5 mins?

    public cachedData = {}
    public cachedDataTemplate = {
        elevation: undefined,
        videoLength: undefined,
        dateRange: undefined,
        folders: undefined,
        plants: undefined,
        numberplates: undefined,
        exifCameras: undefined,
    }

    public static getInstance(): QueryBuilderCache {
        return QueryBuilderCache._instance
    }

    private static _instance: QueryBuilderCache = new QueryBuilderCache()

    constructor() {
        if (QueryBuilderCache._instance) {
            throw new Error('Error: Instantiation failed: Use QueryBuilderCache.getInstance() instead of new.')
        }
        QueryBuilderCache._instance = this
    }

    public async start(): Promise<void> {
        const ticking = true
        while (ticking) {
            // call async method synchronously on purpose (so that it gets called at a concistent frequency not defined by the length of time of the recurring function)
            this.tick()
            await HelperUtil.delay(this.TICK_FREQUENCY)
        }
    }

    private async tick(): Promise<void> {
        const userIds = await DBUtil.getUserIds()

        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i]
            if (!this.cachedData?.[userId]) {
                this.cachedData[userId] = this.cachedDataTemplate
            }

            // run each query and put into local structure
            this.cachedData[userId].elevation = await DBUtil.getElevationMinMax(userId)
            ;(this.cachedData[userId].videoLength = await DBUtil.getVideoLengthMinMax(userId)),
                (this.cachedData[userId].dateRange = await DBUtil.getDateRangeMinMax(userId)),
                (this.cachedData[userId].folders = await DBUtil.getFolderSummary(userId))
            this.cachedData[userId].plants = await DBUtil.getPlantSummary(userId)
            this.cachedData[userId].numberplates = await DBUtil.getNumberplateSummary(userId)
            this.cachedData[userId].exifCameras = await DBUtil.getExifSummary(userId)
        }
    }
}

export default QueryBuilderCache
