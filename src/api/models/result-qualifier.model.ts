import type { ResultQualifier } from '../../types'
import type { HydroServer } from '../HydroServer'
import type { ResultQualifierService } from '../services/result-qualifier.service'
import { HydroServerBaseModel } from './base'

export class ResultQualifierModel
  extends HydroServerBaseModel<ResultQualifier, ResultQualifierService>
  implements ResultQualifier
{
  // --- fields from ResultQualifier ---
  declare id: string
  declare workspaceId: string
  declare code: string
  declare description: string

  constructor(
    client: HydroServer,
    service: ResultQualifierService,
    serverData: ResultQualifier
  ) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: ResultQualifier): void {
    Object.assign(this, serverData)
    this._serverData = { ...serverData }
  }

  /** Allow these to be patched via .save() */
  protected override editableFields(): (keyof ResultQualifier)[] {
    return ['code', 'description']
  }

  /* ---------------- Convenience cross-resource fetches ---------------- */

  workspace() {
    return this.client.workspaces.get(this.workspaceId)
  }

  datastreams(params: Record<string, unknown> = {}) {
    // Assumes datastreams.list supports { resultQualifierId }
    return this.client.datastreams.list({
      resultQualifierId: this.id,
      ...params,
    })
  }
}
