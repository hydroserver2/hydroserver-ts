import type { ObservedProperty } from '../../types'
import type { HydroServer } from '../HydroServer'
import type { ObservedPropertyService } from '../services/observed-property.service'
import { HydroServerBaseModel } from './base'

export class ObservedPropertyModel
  extends HydroServerBaseModel<ObservedProperty, ObservedPropertyService>
  implements ObservedProperty
{
  // --- ObservedProperty fields ---
  declare id: string
  declare workspaceId: string
  declare name: string
  declare definition: string
  declare description: string
  declare type: string
  declare code: string

  constructor(
    client: HydroServer,
    service: ObservedPropertyService,
    serverData: ObservedProperty
  ) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: ObservedProperty): void {
    Object.assign(this, serverData)
    this._serverData = { ...serverData }
  }

  /** Fields we allow PATCHing via save(). */
  protected override editableFields(): (keyof ObservedProperty)[] {
    return ['name', 'definition', 'description', 'type', 'code', 'workspaceId']
  }

  /* ---------------- Convenience cross-resource fetches ---------------- */

  workspace() {
    return this.client.workspaces.get(this.workspaceId)
  }

  datastreams(params: Record<string, unknown> = {}) {
    return this.client.datastreams.list({
      observedPropertyId: this.id,
      ...params,
    })
  }
}
