import type { OrchestrationSystem } from '../../types'
import type { HydroServer } from '../HydroServer'
import type { OrchestrationSystemService } from '../services/orchestration-system.service'
import { HydroServerBaseModel } from './base'

export class OrchestrationSystemModel
  extends HydroServerBaseModel<OrchestrationSystem, OrchestrationSystemService>
  implements OrchestrationSystem
{
  // ---- fields from OrchestrationSystem (adjust to your schema) ----
  declare id: string
  declare workspaceId: string
  declare name: string
  declare description?: string | null
  declare isActive?: boolean

  constructor(
    client: HydroServer,
    service: OrchestrationSystemService,
    serverData: OrchestrationSystem
  ) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: OrchestrationSystem): void {
    Object.assign(this, serverData)
    this._serverData = { ...serverData }
  }

  /** Fields allowed to be patched via .save() */
  protected override editableFields(): (keyof OrchestrationSystem)[] {
    return ['name', 'description', 'isActive']
  }

  /* ---------------- Convenience cross-resource fetches ---------------- */

  workspace() {
    return this.client.workspaces.get(this.workspaceId)
  }
}
