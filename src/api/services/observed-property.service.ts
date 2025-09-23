import type { HydroServer } from '../HydroServer'
import { BaseListParams, HydroServerBaseService } from './base'
import type { ObservedProperty } from '../../types'
import { ObservedPropertyModel } from '../models/observed-property.model'
import type { ItemResult, ListResult } from '../result'
import type { ApiResponse } from '../responseInterceptor'
import { apiMethods } from '../apiMethods'

export type ObservedPropertyListParams = BaseListParams & {
  workspaceId?: string
  type?: string
  code?: string
  name?: string
  search?: string
  expandRelated?: boolean
}

/**
 * Transport layer for /observed-properties routes.
 * Uses Result envelopes (ListResult/ItemResult) via the base service.
 */
export class ObservedPropertyService extends HydroServerBaseService<ObservedPropertyModel> {
  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/observed-properties`)
  }

  list(
    params: ObservedPropertyListParams = {}
  ): Promise<ListResult<ObservedPropertyModel>> {
    return super.list(params)
  }

  get(id: string): Promise<ItemResult<ObservedPropertyModel>> {
    return super.get(id)
  }

  create(
    body: Partial<ObservedProperty>
  ): Promise<ItemResult<ObservedPropertyModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<ObservedProperty>,
    originalBody?: Partial<ObservedProperty>
  ): Promise<ItemResult<ObservedPropertyModel>> {
    return super.update(id, body, originalBody)
  }

  delete(id: string) {
    return super.delete(id)
  }

  /* ---------------- Static enumerations / helpers ---------------- */

  /** Returns the variable types list as ApiResponse so callers get status/message. */
  listVariableTypes(): Promise<ApiResponse<string[]>> {
    const url = `${this._route}/variable-types`
    // Uses apiMethods.paginatedFetch to collect all pages; returns ApiResponse<string[]>
    return apiMethods.paginatedFetch<string[]>(url)
  }

  /* -------------------- Model wiring -------------------- */

  protected override deserialize(data: unknown): ObservedPropertyModel {
    return new ObservedPropertyModel(
      this._client,
      this,
      data as ObservedProperty
    )
  }
}
