import type { HydroServer } from '@/api/HydroServer'
import type { HydroServerBaseService } from '../services/base'

/**
 * - Holds client and service references
 * - Tracks server snapshot to compute unsaved changes
 * - save / refresh / delete methods delegate to the service
 */
export abstract class HydroServerBaseModel<
  TSelf extends { id?: string } = any
> {
  id?: string

  protected _client: HydroServer
  protected _service?: HydroServerBaseService<any>
  protected _serverData: Record<string, unknown> = {}

  protected static editableFields: ReadonlySet<string> = new Set()

  constructor(parameters: {
    client: HydroServer
    service?: HydroServerBaseService<any>
    data: Partial<TSelf>
  }) {
    const { client, service, data } = parameters
    this._client = client
    this._service = service
    Object.assign(this, data)
    this._serverData = { ...(data as object) }
  }

  static getRoute(): string {
    throw new Error('Route not defined')
  }

  get client(): HydroServer {
    return this._client
  }

  get service(): HydroServerBaseService<any> | undefined {
    return this._service
  }

  get unsavedChanges(): Record<string, unknown> {
    const editableFields =
      (this.constructor as typeof HydroServerBaseModel).editableFields ??
      HydroServerBaseModel.editableFields

    const differences: Record<string, unknown> = {}
    for (const key of editableFields) {
      const currentValue = (this as any)[key]
      const originalValue = this._serverData[key]
      const isDifferent =
        JSON.stringify(currentValue) !== JSON.stringify(originalValue)
      if (isDifferent) differences[key] = currentValue
    }
    return differences
  }

  async save(): Promise<void> {
    if (!this._service) throw new Error('Saving not enabled for this object.')
    if (!this.id) throw new Error('Data cannot be saved: id is not set.')

    const changes = this.unsavedChanges
    if (Object.keys(changes).length === 0) return

    const updated = await this._service.update(this.id, changes)
    Object.assign(this, updated)
    this._serverData = { ...(updated as object) }
  }

  async refresh(): Promise<void> {
    if (!this._service)
      throw new Error('Refreshing not enabled for this object.')
    if (!this.id) throw new Error('Cannot refresh data without a valid id.')

    const latest = await this._service.get(this.id)
    Object.assign(this, latest)
    this._serverData = { ...(latest as object) }
  }

  async delete(): Promise<void> {
    if (!this._service) throw new Error('Deleting not enabled for this object.')
    if (!this.id) throw new Error('Cannot delete data without a valid id.')

    await this._service.delete(this.id)
    this.id = undefined
  }
}
