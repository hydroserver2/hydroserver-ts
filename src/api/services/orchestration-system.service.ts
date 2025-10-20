import { HydroServerBaseService } from './base'
import { OrchestrationSystemContract as C } from '../../generated/contracts'

export interface OrchestrationSystem {
  name: string
  id: string
  workspaceId: string
  type: string
}

/**
 * Transport for /orchestration-systems routes.
 * Returns OrchestrationSystemModel instances wrapped in Result envelopes.
 */
export class OrchestrationSystemService extends HydroServerBaseService<
  typeof C,
  OrchestrationSystem
> {
  static route = C.route
  static writableKeys = C.writableKeys

  protected deserialize(m: unknown): OrchestrationSystem {
    const o = m as Partial<OrchestrationSystem>
    return {
      id: String(o.id ?? ''),
      name: String(o.name ?? ''),
      workspaceId: String(o.workspaceId ?? ''),
      type: String(o.type ?? ''),
    }
  }
}
