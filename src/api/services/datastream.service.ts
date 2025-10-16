import { apiMethods } from '../apiMethods'
import { HydroServerBaseService, withQuery } from './base'
import { DatastreamContract as C } from '../../generated/contracts'
import type { ApiResponse } from '../responseInterceptor'
import { Datastream as M, ObservationRecord } from '../../types'

/** Minimal "has id" shape for convenience inputs */
type WithId = { id: string }

/**
 * Transport layer for /datastreams routes.
 * Inherits CRUD + handle helpers from HydroServerBaseService and adds:
 * - CSV download helpers (single + zip)
 * - Enumeration endpoints (/statuses, /aggregation-statistics, /sampled-mediums)
 * - Observation sub-resource endpoints under /datastreams/{id}/observations
 */
export class DatastreamService extends HydroServerBaseService<typeof C, M> {
  static route = C.route
  static writableKeys = C.writableKeys
  static Model = M

  /* ============================== CSV =============================== */

  /** Fetch CSV as a Blob for a datastream (no auto-download). */
  async fetchCsvBlob(id: string): Promise<ApiResponse<Blob>> {
    const url = `${this._route}/${encodeURIComponent(id)}/csv`
    return apiMethods.fetch(url, {
      headers: { Accept: 'text/csv' },
    }) as Promise<ApiResponse<Blob>>
  }

  /** Trigger a browser download for a single datastream CSV. */
  async downloadCsv(id: string, filename?: string): Promise<void> {
    const res = await this.fetchCsvBlob(id)
    const blob =
      res.data instanceof Blob
        ? res.data
        : new Blob([res.data as any], { type: 'text/csv' })
    triggerDownload(blob, filename ?? `datastream_${id}.csv`)
  }

  /** Download many datastream CSVs as a single ZIP. */
  async downloadCsvZip(
    datastreams: Array<string | WithId>,
    zipName = 'datastreams.zip'
  ): Promise<void> {
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()

    // Sequential avoids hammering the API; parallelize if your server allows.
    for (const ds of datastreams) {
      const id = typeof ds === 'string' ? ds : ds.id
      const res = await this.fetchCsvBlob(id)
      const blob =
        res.data instanceof Blob
          ? res.data
          : new Blob([res.data as any], { type: 'text/csv' })
      zip.file(`datastream_${id}.csv`, blob)
    }

    const archive = await zip.generateAsync({ type: 'blob' })
    triggerDownload(archive, zipName)
  }

  /* ======================= Observation APIs ======================== */
  // All of these live under: /datastreams/{datastream_id}/observations

  /**
   * List observations for a datastream.
   * Pass strongly-typed generics if you have them:
   *   listObservations<MyObservationSummary>(id, { page_size: '100' })
   */
  listObservations(datastreamId: string, params: Record<string, unknown> = {}) {
    const url = withQuery(
      `${this._route}/${encodeURIComponent(datastreamId)}/observations`,
      params
    )
    return apiMethods.paginatedFetch<ObservationRecord[]>(url)
  }

  /**
   * Get a single observation by observation id.
   * Endpoint: /datastreams/{id}/observations/{observation_id}
   */
  getObservation(datastreamId: string, observationId: string) {
    const url = `${this._route}/${encodeURIComponent(
      datastreamId
    )}/observations/${encodeURIComponent(observationId)}`
    return apiMethods.fetch(url)
  }

  /**
   * Create observations for a datastream.
   * Accepts single or batch payloads depending on your API.
   */
  createObservations(datastreamId: string, body: unknown) {
    const url = `${this._route}/${encodeURIComponent(
      datastreamId
    )}/observations`
    return apiMethods.post(url, body)
  }

  /**
   * Update one observation (PATCH).
   * Endpoint: /datastreams/{id}/observations/{observation_id}
   */
  updateObservation<TBody = unknown, TOut = unknown>(
    datastreamId: string,
    observationId: string,
    body: TBody,
    originalBody?: TBody
  ): Promise<ApiResponse<TOut>> {
    const url = `${this._route}/${encodeURIComponent(
      datastreamId
    )}/observations/${encodeURIComponent(observationId)}`
    return apiMethods.patch(url, body, originalBody ?? null)
  }

  deleteObservation(datastreamId: string, observationId: string) {
    const url = `${this._route}/${encodeURIComponent(
      datastreamId
    )}/observations/${encodeURIComponent(observationId)}`
    return apiMethods.delete(url)
  }

  deleteObservations = (datastreamId: string, body?: {}) =>
    apiMethods.delete(`${this._route}/${datastreamId}/observations`, body)

  getStatuses = () => apiMethods.paginatedFetch(`${this._route}/statuses`)

  getAggregationStatistics = () =>
    apiMethods.paginatedFetch(`${this._route}/aggregation-statistics`)

  getSampledMediums = () =>
    apiMethods.paginatedFetch(`${this._route}/sampled-mediums`)
}

/* ---------------------------- local helpers ---------------------------- */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
