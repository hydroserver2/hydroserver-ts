import type { ThingService } from '../services/thing.service'
import { HydroServerBaseModel } from './base'
import { ThingContract, DataArchiveContract } from '../../generated/contracts'

/**
 * Rich Thing instance with instance methods that delegate to ThingService.
 */
export class ThingModel extends HydroServerBaseModel<
  ThingContract.SummaryResponse,
  ThingService
> {
  static writableKeys =
    ThingContract.writableKeys as readonly (keyof ThingContract.PatchBody)[]

  /* -------------------- Sub-resources: Tags -------------------- */

  listTags() {
    return this.service.listTags(this.id)
  }
  createTag(tag: Parameters<ThingService['createTag']>[1]) {
    return this.service.createTag(this.id, tag)
  }
  updateTag(tag: Parameters<ThingService['updateTag']>[1]) {
    return this.service.updateTag(this.id, tag)
  }
  deleteTag(tag: Parameters<ThingService['deleteTag']>[1]) {
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

  createHydroShareArchive(archive: DataArchiveContract.PostBody) {
    return this.service.createHydroShareArchive(this.id, archive)
  }
  updateHydroShareArchive(
    archive: DataArchiveContract.PatchBody,
    old?: DataArchiveContract.PatchBody
  ) {
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

/**
 * Declaration merging: makes all fields from ThingContract.SummaryResponse
 * visible on ThingModel instances without requiring `implements` or per-field
 * `declare` members.
 */
export interface ThingModel extends ThingContract.SummaryResponse {}
