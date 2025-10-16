import { HydroServerBaseService } from './base'
import { OrchestrationSystemContract as C } from '../../generated/contracts'
import { OrchestrationSystem as M } from '../../types/dataSource'

/**
 * Transport for /orchestration-systems routes.
 * Returns OrchestrationSystemModel instances wrapped in Result envelopes.
 */
export class OrchestrationSystemService extends HydroServerBaseService<
  typeof C,
  M
> {
  static route = C.route
  static writableKeys = C.writableKeys

  protected deserialize(m: unknown): M {
    const o = m as Partial<M>
    return {
      id: String(o.id ?? ''),
      name: String(o.name ?? ''),
      workspaceId: String(o.workspaceId ?? ''),
      type: String(o.type ?? ''),
    }
  }
}
