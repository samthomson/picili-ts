import * as HelperUtil from '../util/helper'
import * as FileUtil from '../util/file'
import * as Types from '@shared/declarations'

import moment from 'moment'

export class ResourceManager {
    TICK_FREQUENCY = 60000

    public static getInstance(): ResourceManager {
        return ResourceManager._instance
    }

    private static _instance: ResourceManager = new ResourceManager()

    private stats: Types.Core.ResourceManagerStats[] = []

    public getStats(): Types.Core.ResourceManagerStats[] {
        return this.stats
    }

    constructor() {
        if (ResourceManager._instance) {
            throw new Error('Error: Instantiation failed: Use ResourceManager.getInstance() instead of new.')
        }
        ResourceManager._instance = this
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
        const ITEM_LIMIT = 60 // an hour of stats
        // todo: get stats
        const { isOutOfSpace, isImageProcessingDirOutOfSpace, isVideoProcessingDirOutOfSpace } =
            await FileUtil.diskSpaceStats()

        // todo: add latest stats to list of stats
        const tempStats = this.stats
        tempStats.push({
            dateTime: moment().toISOString(),
            isOutOfSpace,
            isImageProcessingDirOutOfSpace,
            isVideoProcessingDirOutOfSpace,
        })

        // todo: if list is over ITEM_LIMIT items (minutes), cull the first
        this.stats =
            tempStats.length <= ITEM_LIMIT ? tempStats : tempStats.splice(tempStats.length - ITEM_LIMIT, ITEM_LIMIT)
    }
}

export default ResourceManager
