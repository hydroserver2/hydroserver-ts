import type { HydroServer } from '../HydroServer'
import { BaseListParams, HydroServerBaseService } from './base'
import type { ProcessingLevel } from '../../types'
import { ProcessingLevelModel } from '../models/processing-level.model'
import type { ItemResult, ListResult } from '../result'

export type ProcessingLevelListParams = BaseListParams & {
  workspaceId?: string
  code?: string
  search?: string
}

/**
 * Transport layer for /processing-levels routes.
 * Returns ProcessingLevelModel instances and Result envelopes.
 */
export class ProcessingLevelService extends HydroServerBaseService<ProcessingLevelModel> {
  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/processing-levels`)
  }

  list(
    params: ProcessingLevelListParams = {}
  ): Promise<ListResult<ProcessingLevelModel>> {
    return super.list(params)
  }

  /** Convenience: processing levels scoped to a workspace */
  listByWorkspace(
    workspaceId: string,
    params: Omit<ProcessingLevelListParams, 'workspaceId'> = {}
  ) {
    return this.list({ ...params, workspaceId })
  }

  get(id: string): Promise<ItemResult<ProcessingLevelModel>> {
    return super.get(id)
  }

  create(
    body: Partial<ProcessingLevel>
  ): Promise<ItemResult<ProcessingLevelModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<ProcessingLevel>,
    originalBody?: Partial<ProcessingLevel>
  ): Promise<ItemResult<ProcessingLevelModel>> {
    return super.update(id, body, originalBody)
  }

  delete(id: string) {
    return super.delete(id)
  }

  /* -------------------- Model wiring -------------------- */

  protected override deserialize(data: unknown): ProcessingLevelModel {
    return new ProcessingLevelModel(this._client, this, data as ProcessingLevel)
  }
}
