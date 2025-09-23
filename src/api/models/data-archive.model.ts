// src/api/models/data-archive.model.ts
import type { HydroServer } from '../HydroServer'
import type { DataArchiveService } from '../services/data-archive.service'
import { HydroServerBaseModel } from './base'
import type { HydroShareArchive, PostHydroShareArchive } from '../../types'

// Make a writable shape that includes the extra (optional) POST/PATCH fields
export type DataArchiveWritable = HydroShareArchive &
  Partial<
    Pick<
      PostHydroShareArchive,
      'resourceTitle' | 'resourceAbstract' | 'resourceKeywords'
    >
  >

export class DataArchiveModel
  extends HydroServerBaseModel<DataArchiveWritable, DataArchiveService>
  implements HydroShareArchive
{
  // Base fields from HydroShareArchive
  declare id: string
  declare thingId: string
  declare link: string
  declare frequency: HydroShareArchive['frequency']
  declare path: string
  declare datastreamIds: string[]
  declare publicResource: boolean

  // Optional write-only fields (available on create/update)
  declare resourceTitle?: string
  declare resourceAbstract?: string
  declare resourceKeywords?: string[]

  constructor(
    client: HydroServer,
    service: DataArchiveService,
    serverData: DataArchiveWritable
  ) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: DataArchiveWritable): void {
    this.id = serverData.id
    this.thingId = serverData.thingId
    this.link = serverData.link
    this.frequency = serverData.frequency
    this.path = serverData.path
    this.datastreamIds = serverData.datastreamIds
    this.publicResource = serverData.publicResource

    // Only present on some responses/operations
    this.resourceTitle = serverData.resourceTitle
    this.resourceAbstract = serverData.resourceAbstract
    this.resourceKeywords = serverData.resourceKeywords

    this._serverData = { ...serverData }
  }

  /** Fields we allow to PATCH via .save() */
  protected override editableFields(): (keyof DataArchiveWritable)[] {
    return [
      'link',
      'frequency',
      'path',
      'datastreamIds',
      'publicResource',
      'resourceTitle',
      'resourceAbstract',
      'resourceKeywords',
    ]
  }
}
