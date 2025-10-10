// src/services/datastream.service.ts
import { apiMethods } from '../apiMethods'
import { HydroServerBaseService, withQuery } from './base'
import { DatastreamContract as C } from '../../generated/contracts'
import type { ApiResponse } from '../responseInterceptor'

/** Minimal "has id" shape for convenience inputs */
type WithId = { id: string }

/**
 * Transport layer for /datastreams routes.
 * Inherits CRUD + handle helpers from HydroServerBaseService and adds:
 * - CSV download helpers (single + zip)
 * - Enumeration endpoints (/statuses, /aggregation-statistics, /sampled-mediums)
 * - Observation sub-resource endpoints under /datastreams/{id}/observations
 */
export class DatastreamService extends HydroServerBaseService<typeof C> {
  static route = C.route
  static writableKeys = C.writableKeys

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
  listObservations<T = unknown>(
    datastreamId: string,
    params: Record<string, unknown> = {}
  ): Promise<ApiResponse<T[]>> {
    const url = withQuery(
      `${this._route}/${encodeURIComponent(datastreamId)}/observations`,
      params
    )
    return apiMethods.paginatedFetch<T[]>(url)
  }

  /**
   * Get a single observation by observation id.
   * Endpoint: /datastreams/{id}/observations/{observation_id}
   */
  getObservation<T = unknown>(
    datastreamId: string,
    observationId: string
  ): Promise<ApiResponse<T>> {
    const url = `${this._route}/${encodeURIComponent(
      datastreamId
    )}/observations/${encodeURIComponent(observationId)}`
    return apiMethods.fetch(url)
  }

  /**
   * Create observations for a datastream.
   * Accepts single or batch payloads depending on your API.
   */
  createObservations<TBody = unknown, TOut = unknown>(
    datastreamId: string,
    body: TBody
  ): Promise<ApiResponse<TOut>> {
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

  /**
   * Delete one observation.
   * Endpoint: /datastreams/{id}/observations/{observation_id}
   */
  deleteObservation(
    datastreamId: string,
    observationId: string
  ): Promise<ApiResponse<void>> {
    const url = `${this._route}/${encodeURIComponent(
      datastreamId
    )}/observations/${encodeURIComponent(observationId)}`
    return apiMethods.delete(url)
  }

  /**
   * Bulk delete observations (if your API supports it).
   * Often a time-range or filter-based delete via request body.
   * Endpoint: /datastreams/{id}/observations (DELETE + body)
   */
  deleteObservations<TBody = unknown>(
    datastreamId: string,
    body?: TBody
  ): Promise<ApiResponse<void>> {
    const url = `${this._route}/${encodeURIComponent(
      datastreamId
    )}/observations`
    return apiMethods.delete(url, body as any)
  }

  /* ====================== Enumeration helpers ====================== */

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
