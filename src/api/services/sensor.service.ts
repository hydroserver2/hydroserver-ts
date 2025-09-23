import type { HydroServer } from '../HydroServer'
import { BaseListParams, HydroServerBaseService } from './base'
import type { Sensor } from '../../types'
import { SensorModel } from '../models/sensor.model'
import type { ItemResult, ListResult } from '../result'

export type SensorListParams = BaseListParams & {
  workspaceId?: string
  manufacturer?: string
  model?: string
  methodType?: string
  encodingType?: string
  search?: string
}

/**
 * Transport layer for /sensors routes.
 * Returns SensorModel instances wrapped in Result envelopes.
 */
export class SensorService extends HydroServerBaseService<SensorModel> {
  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/sensors`)
  }

  list(params: SensorListParams = {}): Promise<ListResult<SensorModel>> {
    return super.list(params)
  }

  /** Convenience: sensors scoped to a workspace */
  listByWorkspace(
    workspaceId: string,
    params: Omit<SensorListParams, 'workspaceId'> = {}
  ) {
    return this.list({ ...params, workspaceId })
  }

  get(id: string): Promise<ItemResult<SensorModel>> {
    return super.get(id)
  }

  create(body: Partial<Sensor>): Promise<ItemResult<SensorModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<Sensor>,
    originalBody?: Partial<Sensor>
  ): Promise<ItemResult<SensorModel>> {
    return super.update(id, body, originalBody)
  }

  delete(id: string) {
    return super.delete(id)
  }

  /* -------------------- Model wiring -------------------- */

  protected override deserialize(data: unknown): SensorModel {
    return new SensorModel(this._client, this, data as Sensor)
  }
}
