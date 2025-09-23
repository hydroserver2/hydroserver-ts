import type {
  Thing,
  Tag,
  HydroShareArchive,
  PostHydroShareArchive,
} from '../../types'
import type { HydroServer } from '../HydroServer'
import type { ThingService } from '../services/thing.service'
import { HydroServerBaseModel } from './base'

/**
 * Rich Thing instance with instance methods that delegate to ThingService.
 * Fields are taken directly from your shared `Thing` type.
 */
export class ThingModel
  extends HydroServerBaseModel<Thing, ThingService>
  implements Thing
{
  declare id: string
  declare workspaceId: string
  declare name: string
  declare location: Thing['location']
  declare tags: Tag[]
  declare hydroShareArchive?: HydroShareArchive | null
  declare siteType: string
  declare samplingFeatureCode: string
  declare isPrivate: boolean
  declare description: string
  declare samplingFeatureType: string
  declare dataDisclaimer: string

  constructor(client: HydroServer, service: ThingService, serverData: Thing) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: Thing): void {
    // Copy over the server fields (already camelCase)
    this.id = serverData.id
    this.workspaceId = serverData.workspaceId
    this.name = serverData.name
    this.location = serverData.location
    this.tags = serverData.tags ?? []
    this.hydroShareArchive = serverData.hydroShareArchive ?? null
    this.siteType = serverData.siteType
    this.samplingFeatureCode = serverData.samplingFeatureCode
    this.isPrivate = serverData.isPrivate
    this.description = serverData.description
    this.samplingFeatureType = serverData.samplingFeatureType
    this.dataDisclaimer = serverData.dataDisclaimer

    // Track snapshot to compute unsaved changes later
    this._serverData = { ...serverData }
  }

  /** Which fields can be saved via PATCH diff. */
  protected override editableFields(): (keyof Thing)[] {
    return [
      'name',
      'description',
      'isPrivate',
      'siteType',
      'samplingFeatureCode',
      'samplingFeatureType',
      'dataDisclaimer',
      'location',
    ]
  }

  /* -------------------- Sub-resources: Tags -------------------- */

  listTags() {
    return this.service.listTags(this.id)
  }
  createTag(tag: Tag) {
    return this.service.createTag(this.id, tag)
  }
  updateTag(tag: Tag) {
    return this.service.updateTag(this.id, tag)
  }
  deleteTag(tag: Tag) {
    return this.service.deleteTag(this.id, tag)
  }

  /* ------------------- Sub-resources: Photos ------------------- */

  uploadPhotos(formData: FormData) {
    return this.service.uploadPhotos(this.id, formData)
  }
  listPhotos() {
    return this.service.listPhotos(this.id)
  }
  deletePhoto(name: string) {
    return this.service.deletePhoto(this.id, name)
  }

  /* --------------- Sub-resources: HydroShare Archive ----------- */

  createHydroShareArchive(archive: PostHydroShareArchive) {
    return this.service.createHydroShareArchive(this.id, archive)
  }
  updateHydroShareArchive(archive: HydroShareArchive, old?: HydroShareArchive) {
    return this.service.updateHydroShareArchive(this.id, archive, old)
  }
  getHydroShareArchive() {
    return this.service.getHydroShareArchive(this.id)
  }
  deleteHydroShareArchive() {
    return this.service.deleteHydroShareArchive(this.id)
  }
  triggerHydroShareArchive() {
    return this.service.triggerHydroShareArchive(this.id)
  }

  /* --------------- Ownership management helpers ---------------- */

  removeOwner(email: string) {
    return this.service.removeOwner(this.id, email)
  }
  addSecondaryOwner(email: string) {
    return this.service.addSecondaryOwner(this.id, email)
  }
  transferPrimaryOwnership(email: string) {
    return this.service.transferPrimaryOwnership(this.id, email)
  }

  /* ---------------- Cross-table convenience fetches ------------- */

  datastreams(params: Record<string, unknown> = {}) {
    return this.client.datastreams.list({ thingId: this.id, ...params })
  }
}
