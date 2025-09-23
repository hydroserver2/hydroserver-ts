import type { HydroServer } from '../HydroServer'
import { BaseListParams, HydroServerBaseService } from './base'
import type { DataSource } from '../../types'
import { DataSourceModel } from '../models/data-source.model'
import type { ItemResult, ListResult } from '../result'
import { apiMethods } from '../apiMethods'

export type DataSourceListParams = BaseListParams & {
  workspaceId?: string
  search?: string
  isActive?: boolean
  expandRelated?: boolean
  // type?: string
}

/**
 * Transport for /data-sources routes.
 * Returns DataSourceModel instances wrapped in Result envelopes.
 */
export class DataSourceService extends HydroServerBaseService<DataSourceModel> {
  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/data-sources`)
  }

  list(
    params: DataSourceListParams = {}
  ): Promise<ListResult<DataSourceModel>> {
    return super.list(params)
  }

  /** Convenience: list data sources in a workspace */
  listByWorkspace(
    workspaceId: string,
    params: Omit<DataSourceListParams, 'workspaceId'> = {}
  ) {
    return this.list({ ...params, workspaceId })
  }

  get(id: string): Promise<ItemResult<DataSourceModel>> {
    return super.get(id)
  }

  create(body: Partial<DataSource>): Promise<ItemResult<DataSourceModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<DataSource>,
    originalBody?: Partial<DataSource>
  ): Promise<ItemResult<DataSourceModel>> {
    return super.update(id, body, originalBody)
  }

  delete(id: string) {
    return super.delete(id)
  }

  /* -------------------- sub-resources / actions -------------------- */

  /** Link a datastream to this data source */
  linkDatastream(dataSourceId: string, datastreamId: string) {
    const url = `${this._route}/${encodeURIComponent(
      dataSourceId
    )}/datastreams/${encodeURIComponent(datastreamId)}`
    return apiMethods.post(url)
  }

  /** Unlink a datastream from this data source */
  unlinkDatastream(dataSourceId: string, datastreamId: string) {
    const url = `${this._route}/${encodeURIComponent(
      dataSourceId
    )}/datastreams/${encodeURIComponent(datastreamId)}`
    return apiMethods.delete(url)
  }

  /* -------------------- Model wiring -------------------- */

  protected override deserialize(data: unknown): DataSourceModel {
    return new DataSourceModel(this._client, this, data as DataSource)
  }
}
