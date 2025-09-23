import type { DataSource } from '../../types'
import type { HydroServer } from '../HydroServer'
import type { DataSourceService } from '../services/data-source.service'
import { HydroServerBaseModel } from './base'

export class DataSourceModel
  extends HydroServerBaseModel<DataSource, DataSourceService>
  implements DataSource
{
  // ---- Core fields (adjust to your schema as needed) ----
  declare id: string
  declare workspaceId: string
  declare name: string
  declare description?: string | null
  declare isActive?: boolean
  // declare type?: string
  // declare config?: unknown

  constructor(
    client: HydroServer,
    service: DataSourceService,
    serverData: DataSource
  ) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: DataSource): void {
    Object.assign(this, serverData)
    this._serverData = { ...serverData }
  }

  /** Fields allowed to be patched via .save() */
  protected override editableFields(): (keyof DataSource)[] {
    return ['name', 'description', 'isActive']
  }

  /* ---------------- Convenience cross-resource helpers ---------------- */

  workspace() {
    return this.client.workspaces.get(this.workspaceId)
  }

  datastreams(params: Record<string, unknown> = {}) {
    return this.client.datastreams.list({
      dataSourceId: this.id,
      ...params,
    } as any)
  }

  linkDatastream(datastreamId: string) {
    return this.service.linkDatastream(this.id, datastreamId)
  }

  unlinkDatastream(datastreamId: string) {
    return this.service.unlinkDatastream(this.id, datastreamId)
  }
}
