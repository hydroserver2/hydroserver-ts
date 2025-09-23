import type { HydroServer } from '../HydroServer'
import { BaseListParams, HydroServerBaseService } from './base'
import type { OrchestrationSystem } from '../../types'
import { OrchestrationSystemModel } from '../models/orchestration-system.model'
import type { ItemResult, ListResult } from '../result'

export type OrchestrationSystemListParams = BaseListParams & {
  workspaceId?: string
  search?: string
  isActive?: boolean
}

/**
 * Transport for /orchestration-systems routes.
 * Returns OrchestrationSystemModel instances wrapped in Result envelopes.
 */
export class OrchestrationSystemService extends HydroServerBaseService<OrchestrationSystemModel> {
  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/orchestration-systems`)
  }

  list(
    params: OrchestrationSystemListParams = {}
  ): Promise<ListResult<OrchestrationSystemModel>> {
    return super.list(params)
  }

  /** Convenience: list systems in a workspace */
  listByWorkspace(
    workspaceId: string,
    params: Omit<OrchestrationSystemListParams, 'workspaceId'> = {}
  ) {
    return this.list({ ...params, workspaceId })
  }

  get(id: string): Promise<ItemResult<OrchestrationSystemModel>> {
    return super.get(id)
  }

  create(
    body: Partial<OrchestrationSystem>
  ): Promise<ItemResult<OrchestrationSystemModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<OrchestrationSystem>,
    originalBody?: Partial<OrchestrationSystem>
  ): Promise<ItemResult<OrchestrationSystemModel>> {
    return super.update(id, body, originalBody)
  }

  delete(id: string) {
    return super.delete(id)
  }

  /* -------------------- Model wiring -------------------- */

  protected override deserialize(data: unknown): OrchestrationSystemModel {
    return new OrchestrationSystemModel(
      this._client,
      this,
      data as OrchestrationSystem
    )
  }
}
