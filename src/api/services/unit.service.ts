import type { HydroServer } from '../HydroServer'
import { BaseListParams, HydroServerBaseService } from './base'
import type { Unit } from '../../types'
import { UnitModel } from '../models/unit.model'
import type { ItemResult, ListResult } from '../result'

export type UnitListParams = BaseListParams & {
  workspaceId?: string
  type?: string
  name?: string
  search?: string
}

/**
 * Transport layer for /units routes. Returns UnitModel instances and
 * Result envelopes consistent with the rest of the client.
 */
export class UnitService extends HydroServerBaseService<UnitModel> {
  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/units`)
  }

  list(params: UnitListParams = {}): Promise<ListResult<UnitModel>> {
    return super.list(params)
  }

  /** Convenience: units for a workspace */
  listByWorkspace(
    workspaceId: string,
    params: Omit<UnitListParams, 'workspaceId'> = {}
  ) {
    return this.list({ ...params, workspaceId })
  }

  get(id: string): Promise<ItemResult<UnitModel>> {
    return super.get(id)
  }

  create(body: Partial<Unit>): Promise<ItemResult<UnitModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<Unit>,
    originalBody?: Partial<Unit>
  ): Promise<ItemResult<UnitModel>> {
    return super.update(id, body, originalBody)
  }

  delete(id: string) {
    return super.delete(id)
  }

  /* -------------------- Model wiring -------------------- */

  protected override deserialize(data: unknown): UnitModel {
    return new UnitModel(this._client, this, data as Unit)
  }
}
