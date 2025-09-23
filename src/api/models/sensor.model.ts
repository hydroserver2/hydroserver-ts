import type { Sensor } from '../../types'
import type { HydroServer } from '../HydroServer'
import type { SensorService } from '../services/sensor.service'
import { HydroServerBaseModel } from './base'

export class SensorModel
  extends HydroServerBaseModel<Sensor, SensorService>
  implements Sensor
{
  // --- fields from Sensor ---
  declare id: string
  declare workspaceId: string
  declare name: string
  declare description: string
  declare manufacturer: string
  declare model: string
  declare methodType: string
  declare methodCode: string
  declare methodLink: string
  declare encodingType: string
  declare modelLink: string

  constructor(client: HydroServer, service: SensorService, serverData: Sensor) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: Sensor): void {
    Object.assign(this, serverData)
    this._serverData = { ...serverData }
  }

  /** Fields allowed to be patched via .save() */
  protected override editableFields(): (keyof Sensor)[] {
    return [
      'name',
      'description',
      'manufacturer',
      'model',
      'methodType',
      'methodCode',
      'methodLink',
      'encodingType',
      'modelLink',
      // workspaceId typically immutable; omit on purpose
    ]
  }

  /* ---------------- Convenience cross-resource fetches ---------------- */

  workspace() {
    return this.client.workspaces.get(this.workspaceId)
  }

  datastreams(params: Record<string, unknown> = {}) {
    // Assumes datastreams.list supports { sensorId }, and base will camel->snake for queries
    return this.client.datastreams.list({ sensorId: this.id, ...params })
  }
}
