import { apiMethods } from '../apiMethods'
import { HydroServerBaseService } from './base'
import { ThingModel } from '../models/thing.model'
import { ThingContract, DataArchiveContract } from '../../generated/contracts'
import type * as Data from '../../generated/data.types'

type TagPostBody = Data.components['schemas']['TagPostBody']
type TagDeleteBody = Data.components['schemas']['TagDeleteBody']

/**
 * Transport layer for /things routes. Builds URLs, handles pagination,
 * and returns rich ThingModel instances.
 */
export class ThingService extends HydroServerBaseService<typeof ThingContract> {
  static route = ThingContract.route
  static writableKeys = ThingContract.writableKeys

  /* ----------------------- Sub-resources: Tags ----------------------- */

  listTags(thingId: string) {
    const url = `${this._route}/${thingId}/tags`
    return apiMethods.fetch(url)
  }

  createTag(thingId: string, tag: TagPostBody) {
    const url = `${this._route}/${thingId}/tags`
    return apiMethods.post(url, tag)
  }

  updateTag(thingId: string, tag: TagPostBody) {
    const url = `${this._route}/${thingId}/tags`
    return apiMethods.put(url, tag)
  }

  deleteTag(thingId: string, tag: TagDeleteBody) {
    const url = `${this._route}/${thingId}/tags`
    return apiMethods.delete(url, tag)
  }

  /* ---------------------- Sub-resources: Photos ---------------------- */

  uploadPhotos(thingId: string, data: FormData) {
    const url = `${this._route}/${thingId}/photos`
    return apiMethods.post(url, data)
  }

  listPhotos(thingId: string) {
    const url = `${this._route}/${thingId}/photos`
    return apiMethods.paginatedFetch(url)
  }

  deletePhoto(thingId: string, name: string) {
    const url = `${this._route}/${thingId}/photos`
    return apiMethods.delete(url, { name })
  }

  /* --------------- Sub-resources: HydroShare Archive ----------------- */

  createHydroShareArchive(
    thingId: string,
    archive: DataArchiveContract.PostBody
  ) {
    const url = `${this._route}/${thingId}/archive`
    return apiMethods.post(url, archive)
  }

  updateHydroShareArchive(
    thingId: string,
    archive: DataArchiveContract.PatchBody,
    old?: DataArchiveContract.PatchBody
  ) {
    const url = `${this._route}/${thingId}/archive`
    return apiMethods.patch(url, archive, old)
  }

  getHydroShareArchive(thingId: string) {
    const url = `${this._route}/${thingId}/archive`
    return apiMethods.fetch(url)
  }

  deleteHydroShareArchive(thingId: string) {
    const url = `${this._route}/${thingId}/archive`
    return apiMethods.delete(url)
  }

  triggerHydroShareArchive(thingId: string) {
    const url = `${this._route}/${thingId}/archive/trigger`
    return apiMethods.post(url, {})
  }

  /* ---------------------- Ownership management ----------------------- */

  removeOwner(thingId: string, email: string) {
    const url = `${this._route}/${thingId}/ownership`
    return apiMethods.patch(url, { email, removeOwner: true })
  }

  addSecondaryOwner(thingId: string, email: string) {
    const url = `${this._route}/${thingId}/ownership`
    return apiMethods.patch(url, { email, makeOwner: true })
  }

  transferPrimaryOwnership(thingId: string, email: string) {
    const url = `${this._route}/${thingId}/ownership`
    return apiMethods.patch(url, { email, transferPrimary: true })
  }
}
