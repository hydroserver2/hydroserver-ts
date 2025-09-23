import type { Unit } from '../../types'
import type { HydroServer } from '../HydroServer'
import type { UnitService } from '../services/unit.service'
import { HydroServerBaseModel } from './base'

export class UnitModel
  extends HydroServerBaseModel<Unit, UnitService>
  implements Unit
{
  // --- fields from Unit ---
  declare id: string
  declare workspaceId: string
  declare name: string
  declare symbol: string
  declare definition: string
  declare type: string

  constructor(client: HydroServer, service: UnitService, serverData: Unit) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: Unit): void {
    Object.assign(this, serverData)
    this._serverData = { ...serverData }
  }

  /** Allow editing of user-facing fields; ids remain immutable. */
  protected override editableFields(): (keyof Unit)[] {
    return ['name', 'symbol', 'definition', 'type']
  }

  /* ---------------- Convenience cross-resource fetches ---------------- */

  workspace() {
    return this.client.workspaces.get(this.workspaceId)
  }

  datastreams(params: Record<string, unknown> = {}) {
    return this.client.datastreams.list({ unitId: this.id, ...params })
  }
}
