import type { HydroServer } from '../HydroServer'
import { apiMethods } from '../apiMethods'
import { BaseListParams, HydroServerBaseService } from './base'
import type { Datastream } from '../../types'
import { DatastreamModel } from '../models/datastream.model'
import type { ItemResult, ListResult } from '../result'
import type { ApiResponse } from '../responseInterceptor'
import { ThingScoped, WorkspaceScoped } from './ref-utils'

export type DatastreamListParams = BaseListParams &
  WorkspaceScoped &
  ThingScoped & {
    unitId?: string
    sensorId?: string
    observedPropertyId?: string
    processingLevelId?: string
    dataSourceId?: string
    status?: string
    sampledMedium?: string
    resultType?: string
    observationType?: string
    excludeUnowned?: boolean
    expandRelated?: boolean
  }

export type DatastreamObservationsParams = {
  /** 'column' or 'json' depending on server support */
  format?: 'column' | 'json'
  /** e.g. 'phenomenonTime' */
  orderBy?: string
  page?: number
  pageSize?: number
  phenomenonTimeMin?: string
  phenomenonTimeMax?: string
}

/**
 * Transport layer for /datastreams routes. Builds URLs, handles pagination,
 * and returns rich DatastreamModel instances.
 */
export class DatastreamService extends HydroServerBaseService<
  DatastreamModel,
  DatastreamListParams
> {
  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/datastreams`)
  }

  list(
    params: DatastreamListParams = {}
  ): Promise<ListResult<DatastreamModel>> {
    return super.list(params)
  }

  get(id: string): Promise<ItemResult<DatastreamModel>> {
    return super.get(id)
  }

  create(body: Partial<Datastream>): Promise<ItemResult<DatastreamModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<Datastream>,
    originalBody?: Partial<Datastream>
  ): Promise<ItemResult<DatastreamModel>> {
    return super.update(id, body, originalBody)
  }

  delete(id: string) {
    return super.delete(id)
  }

  /* ------------------------ Observations ------------------------ */

  /**
   * Fetch observations; returns ApiResponse<T> so caller can use .data/.status/.message.
   * T can be column format data, JSON array, etc., depending on `format` chosen.
   */
  async getObservations<T = unknown>(
    datastreamId: string,
    params: DatastreamObservationsParams = {}
  ): Promise<ApiResponse<T>> {
    const query = normalizeParams(params as Record<string, unknown>)
    const url = withQuery(`${this._route}/${datastreamId}/observations`, query)
    return apiMethods.fetch(url) as Promise<ApiResponse<T>>
  }

  /**
   * Bulk delete observations in a time range (server expects nulls for open-ended).
   * Returns ApiResponse so the caller can display server message/status.
   */
  async deleteObservations(
    datastreamId: string,
    range?: {
      phenomenonTimeStart: string | null
      phenomenonTimeEnd: string | null
    }
  ): Promise<ApiResponse> {
    const body = {
      phenomenonTimeStart: range?.phenomenonTimeStart ?? null,
      phenomenonTimeEnd: range?.phenomenonTimeEnd ?? null,
    }
    const url = `${this._route}/${datastreamId}/observations/bulk-delete`
    return apiMethods.post(url, body)
  }

  /**
   * Fetch CSV as a Blob for a datastream.
   * You can use this to manage your own file saving if you don't want the helper to auto-download.
   */
  async fetchCsvBlob(id: string): Promise<ApiResponse<Blob>> {
    const url = `${this._route}/${encodeURIComponent(id)}/csv`
    return apiMethods.fetch(url, {
      headers: { Accept: 'text/csv' },
    }) as Promise<ApiResponse<Blob>>
  }

  /**
   * Trigger a browser download for a single datastream CSV.
   * Returns void; it performs a side-effect (download).
   */
  async downloadCsv(id: string, filename?: string): Promise<void> {
    const res = await this.fetchCsvBlob(id)
    const blob =
      res.data instanceof Blob
        ? res.data
        : new Blob([res.data], { type: 'text/csv' })
    triggerDownload(blob, filename ?? `datastream_${id}.csv`)
  }

  /**
   * Download many plotted datastreams as a single ZIP file.
   * Accepts either ids or model instances.
   */
  async downloadCsvZip(
    datastreams: Array<string | Pick<Datastream, 'id'>>,
    zipName = 'datastreams.zip'
  ): Promise<void> {
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()

    // Fetch all CSVs (sequential keeps server happy; parallel is possible if rate limits allow)
    for (const ds of datastreams) {
      const id = typeof ds === 'string' ? ds : ds.id
      const res = await this.fetchCsvBlob(id)
      const blob =
        res.data instanceof Blob
          ? res.data
          : new Blob([res.data], { type: 'text/csv' })
      zip.file(`datastream_${id}.csv`, blob)
    }

    const archive = await zip.generateAsync({ type: 'blob' })
    triggerDownload(archive, zipName)
  }

  /* ------------------- Static enumerations ---------------------- */

  listStatuses(): Promise<ApiResponse<string[]>> {
    const url = `${this._route}/statuses`
    return apiMethods.paginatedFetch<string[]>(url)
  }

  listAggregationStatistics(): Promise<ApiResponse<string[]>> {
    const url = `${this._route}/aggregation-statistics`
    return apiMethods.paginatedFetch<string[]>(url)
  }

  listSampledMediums(): Promise<ApiResponse<string[]>> {
    const url = `${this._route}/sampled-mediums`
    return apiMethods.paginatedFetch<string[]>(url)
  }

  /* ------------------------- Model wiring ----------------------- */

  protected override deserialize(data: unknown): DatastreamModel {
    return new DatastreamModel(this._client, this, data as Datastream)
  }
}

/* ---------------------------- local helpers ---------------------------- */

/** Convert camelCase to snake_case for query params. */
function normalizeParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    const key =
      k === 'pageSize'
        ? 'page_size'
        : k === 'orderBy'
        ? 'order_by'
        : k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
    out[key] = Array.isArray(v) ? v.join(',') : v
  }
  return out
}

/** Build a URL with query parameters. */
function withQuery(base: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return base
  const url = new URL(base, globalThis.location?.origin ?? undefined)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
