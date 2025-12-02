import { HydroServerBaseService } from './base'
import { OrchestrationSystemContract as C } from '../../generated/etl-contracts'

export interface OrchestrationSystem {
  name: string
  id: string
  workspaceId: string
  type: string
}

export class OrchestrationSystemService extends HydroServerBaseService<
  typeof C,
  OrchestrationSystem
> {
  static route = C.route
  static writableKeys = C.writableKeys

  protected override getBaseUrl() {
    return this._client.etlBase
  }
}
