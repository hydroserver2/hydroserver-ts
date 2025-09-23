import type { HydroServer } from '../HydroServer'
import { BaseListParams, HydroServerBaseService } from './base'
import type { HydroShareArchive, PostHydroShareArchive } from '../../types'
import {
  DataArchiveModel,
  DataArchiveWritable,
} from '../models/data-archive.model'
import type { ItemResult, ListResult, VoidResult, Meta } from '../result'
import { apiMethods } from '../apiMethods'

export type DataArchiveListParams = BaseListParams & {
  workspaceId?: string
  thingId?: string
  publicResource?: boolean
  search?: string
}

/**
 * Transport for Data Archive endpoints.
 *
 * Supports two patterns:
 *  1) Top-level `/data-archives` (list/get/create/update/delete)
 *  2) Thing-scoped `/things/{thingId}/archive[...]` helpers
 */
export class DataArchiveService extends HydroServerBaseService<DataArchiveModel> {
  private _thingsRoute: string

  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/data-archives`)
    this._thingsRoute = `${client.baseRoute}/things`
  }

  /* ---------------- Standard collection surface ---------------- */

  list(
    params: DataArchiveListParams = {}
  ): Promise<ListResult<DataArchiveModel>> {
    return super.list(params)
  }

  listByWorkspace(
    workspaceId: string,
    params: Omit<DataArchiveListParams, 'workspaceId'> = {}
  ) {
    return this.list({ ...params, workspaceId })
  }

  listByThing(
    thingId: string,
    params: Omit<DataArchiveListParams, 'thingId'> = {}
  ) {
    return this.list({ ...params, thingId })
  }

  get(id: string): Promise<ItemResult<DataArchiveModel>> {
    return super.get(id)
  }

  create(
    body: Partial<HydroShareArchive>
  ): Promise<ItemResult<DataArchiveModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<HydroShareArchive>,
    originalBody?: Partial<HydroShareArchive>
  ): Promise<ItemResult<DataArchiveModel>> {
    return super.update(id, body, originalBody)
  }

  delete(id: string): Promise<VoidResult> {
    return super.delete(id)
  }

  /* ---------------- Thing-scoped helpers (current server behavior) ----------------
     These map to:
       GET    /things/{thingId}/archive
       POST   /things/{thingId}/archive
       PATCH  /things/{thingId}/archive
       DELETE /things/{thingId}/archive
       POST   /things/{thingId}/archive/trigger
  */

  async getForThing(thingId: string): Promise<ItemResult<DataArchiveModel>> {
    const startedAt = performance.now()
    const url = `${this._thingsRoute}/${encodeURIComponent(thingId)}/archive`
    try {
      const res = await apiMethods.fetch(url)
      const item = this.deserialize(res.data)
      return {
        kind: 'item',
        ok: true,
        status: res.status,
        message: res.message,
        item,
        meta: makeMeta('GET', url, startedAt, performance.now() - startedAt, 0),
      }
    } catch (e: any) {
      return itemErr('GET', url, startedAt, e)
    }
  }

  async createForThing(
    thingId: string,
    body: PostHydroShareArchive | Partial<HydroShareArchive>
  ): Promise<ItemResult<DataArchiveModel>> {
    const startedAt = performance.now()
    const url = `${this._thingsRoute}/${encodeURIComponent(thingId)}/archive`
    try {
      const res = await apiMethods.post(url, body)
      const item = this.deserialize(res.data)
      return {
        kind: 'item',
        ok: true,
        status: res.status,
        message: res.message,
        item,
        meta: makeMeta(
          'POST',
          url,
          startedAt,
          performance.now() - startedAt,
          0
        ),
      }
    } catch (e: any) {
      return itemErr('POST', url, startedAt, e)
    }
  }

  async updateForThing(
    thingId: string,
    body: Partial<HydroShareArchive>,
    originalBody?: Partial<HydroShareArchive>
  ): Promise<ItemResult<DataArchiveModel>> {
    const startedAt = performance.now()
    const url = `${this._thingsRoute}/${encodeURIComponent(thingId)}/archive`
    try {
      const res = await apiMethods.patch(url, body, originalBody ?? null)
      const item = this.deserialize(res.data)
      return {
        kind: 'item',
        ok: true,
        status: res.status,
        message: res.message,
        item,
        meta: makeMeta(
          'PATCH',
          url,
          startedAt,
          performance.now() - startedAt,
          0
        ),
      }
    } catch (e: any) {
      return itemErr('PATCH', url, startedAt, e)
    }
  }

  async deleteForThing(thingId: string): Promise<VoidResult> {
    const startedAt = performance.now()
    const url = `${this._thingsRoute}/${encodeURIComponent(thingId)}/archive`
    try {
      const res = await apiMethods.delete(url)
      return {
        kind: 'none',
        ok: true,
        status: res.status,
        message: res.message,
        meta: makeMeta(
          'DELETE',
          url,
          startedAt,
          performance.now() - startedAt,
          0
        ),
      }
    } catch (e: any) {
      return voidErr('DELETE', url, startedAt, e)
    }
  }

  async triggerForThing(thingId: string): Promise<VoidResult> {
    const startedAt = performance.now()
    const url = `${this._thingsRoute}/${encodeURIComponent(
      thingId
    )}/archive/trigger`
    try {
      const res = await apiMethods.post(url, {})
      return {
        kind: 'none',
        ok: true,
        status: res.status,
        message: res.message || 'Archive triggered',
        meta: makeMeta(
          'POST',
          url,
          startedAt,
          performance.now() - startedAt,
          0
        ),
      }
    } catch (e: any) {
      return voidErr('POST', url, startedAt, e)
    }
  }

  /* ---------------- Model wiring ---------------- */

  protected override deserialize(data: unknown): DataArchiveModel {
    // Cast to the widened shape so optional write-only fields are allowed
    return new DataArchiveModel(this._client, this, data as DataArchiveWritable)
  }
}

/* ---------------- small local helpers (same pattern you used) ---------------- */

type ApiErrorLike = { status?: number; message?: string }

function makeMeta(
  method: string,
  url: string,
  startedAt: number,
  durationMs: number,
  retryCount: number,
  extra?: Partial<Meta>
): Meta {
  return {
    request: { method, url, startedAt, durationMs, retryCount },
    ...extra,
  }
}

function itemErr(
  method: string,
  url: string,
  startedAt: number,
  apiError: unknown
): ItemResult<any> {
  const err = apiError as ApiErrorLike
  return {
    kind: 'item',
    ok: false,
    status: typeof err.status === 'number' ? err.status : 0,
    message: err.message ?? 'Request failed',
    meta: makeMeta(method, url, startedAt, performance.now() - startedAt, 0),
  }
}

function voidErr(
  method: string,
  url: string,
  startedAt: number,
  apiError: unknown
): VoidResult {
  const err = apiError as ApiErrorLike
  return {
    kind: 'none',
    ok: false,
    status: typeof err.status === 'number' ? err.status : 0,
    message: err.message ?? 'Request failed',
    meta: makeMeta(method, url, startedAt, performance.now() - startedAt, 0),
  }
}
