import type { HydroServer } from '../HydroServer'
import { apiMethods } from '../apiMethods'
import { BaseListParams, HydroServerBaseService } from './base'
import type {
  Thing,
  Tag,
  HydroShareArchive,
  PostHydroShareArchive,
} from '../../types'
import { ThingModel } from '../models/thing.model'
import type { ItemResult, ListResult } from '../result'

export type ThingListParams = BaseListParams & {
  workspaceId?: string
  ownedOnly?: boolean
  isPrivate?: boolean
  search?: string
  siteType?: string
  samplingFeatureType?: string
  tag?: string[] // comma-joined in query
  expandRelated?: boolean
}

/**
 * Transport layer for /things routes. Builds URLs, handles pagination,
 * and returns rich ThingModel instances.
 */
export class ThingService extends HydroServerBaseService<ThingModel> {
  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/things`)
  }

  list(params: ThingListParams = {}): Promise<ListResult<ThingModel>> {
    return super.list(params)
  }

  get(id: string): Promise<ItemResult<ThingModel>> {
    return super.get(id)
  }

  create(body: Partial<Thing>): Promise<ItemResult<ThingModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<Thing>,
    originalBody?: Partial<Thing>
  ): Promise<ItemResult<ThingModel>> {
    return super.update(id, body, originalBody)
  }

  /* ----------------------- Sub-resources: Tags ----------------------- */

  listTags(thingId: string) {
    const url = `${this._route}/${thingId}/tags`
    return apiMethods.fetch(url)
  }

  createTag(thingId: string, tag: Tag) {
    const url = `${this._route}/${thingId}/tags`
    return apiMethods.post(url, tag)
  }

  updateTag(thingId: string, tag: Tag) {
    const url = `${this._route}/${thingId}/tags`
    return apiMethods.put(url, tag)
  }

  deleteTag(thingId: string, tag: Tag) {
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

  createHydroShareArchive(thingId: string, archive: PostHydroShareArchive) {
    const url = `${this._route}/${thingId}/archive`
    return apiMethods.post(url, archive)
  }

  updateHydroShareArchive(
    thingId: string,
    archive: HydroShareArchive,
    old?: HydroShareArchive
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

  /* ------------------------- Model wiring ---------------------------- */

  protected override deserialize(data: unknown): ThingModel {
    return new ThingModel(this._client, this, data as Thing)
  }
}
