import type { HydroServer } from '../HydroServer'
import { BaseListParams, HydroServerBaseService } from './base'
import type { ResultQualifier } from '../../types'
import { ResultQualifierModel } from '../models/result-qualifier.model'
import type { ItemResult, ListResult } from '../result'

export type ResultQualifierListParams = BaseListParams & {
  workspaceId?: string
  code?: string
  search?: string
}

/**
 * Transport layer for /result-qualifiers routes.
 * Returns ResultQualifierModel instances and Result envelopes.
 */
export class ResultQualifierService extends HydroServerBaseService<ResultQualifierModel> {
  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/result-qualifiers`)
  }

  list(
    params: ResultQualifierListParams = {}
  ): Promise<ListResult<ResultQualifierModel>> {
    return super.list(params)
  }

  /** Convenience: result qualifiers scoped to a workspace */
  listByWorkspace(
    workspaceId: string,
    params: Omit<ResultQualifierListParams, 'workspaceId'> = {}
  ) {
    return this.list({ ...params, workspaceId })
  }

  get(id: string): Promise<ItemResult<ResultQualifierModel>> {
    return super.get(id)
  }

  create(
    body: Partial<ResultQualifier>
  ): Promise<ItemResult<ResultQualifierModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<ResultQualifier>,
    originalBody?: Partial<ResultQualifier>
  ): Promise<ItemResult<ResultQualifierModel>> {
    return super.update(id, body, originalBody)
  }

  delete(id: string) {
    return super.delete(id)
  }

  /* -------------------- Model wiring -------------------- */

  protected override deserialize(data: unknown): ResultQualifierModel {
    return new ResultQualifierModel(this._client, this, data as ResultQualifier)
  }
}
