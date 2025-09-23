import type { ProcessingLevel } from '../../types'
import type { HydroServer } from '../HydroServer'
import type { ProcessingLevelService } from '../services/processing-level.service'
import { HydroServerBaseModel } from './base'

export class ProcessingLevelModel
  extends HydroServerBaseModel<ProcessingLevel, ProcessingLevelService>
  implements ProcessingLevel
{
  // --- fields from ProcessingLevel ---
  declare id: string
  declare workspaceId: string
  declare code: string
  declare definition: string
  declare explanation: string

  constructor(
    client: HydroServer,
    service: ProcessingLevelService,
    serverData: ProcessingLevel
  ) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: ProcessingLevel): void {
    Object.assign(this, serverData)
    this._serverData = { ...serverData }
  }

  /** Allow editing of semantic fields; ids remain immutable. */
  protected override editableFields(): (keyof ProcessingLevel)[] {
    return ['code', 'definition', 'explanation']
  }

  /* ---------------- Convenience cross-resource fetches ---------------- */

  workspace() {
    return this.client.workspaces.get(this.workspaceId)
  }

  datastreams(params: Record<string, unknown> = {}) {
    return this.client.datastreams.list({
      processingLevelId: this.id,
      ...params,
    })
  }
}
