import type { HydroServer } from '../HydroServer'

/**
 * - Holds client and service references
 * - Tracks server snapshot to compute unsaved changes
 * - save / refresh / delete methods delegate to the service
 */
export abstract class HydroServerBaseModel<TServerData, TService = unknown> {
  abstract id: string

  protected _client: HydroServer
  protected _service!: TService
  protected _serverData: Partial<TServerData> = {}

  /** Generated code makes patchBody variables available at runtime for creating patch diffs */
  private getWritableKeys(): (keyof TServerData)[] {
    const ctor = this.constructor as any
    const keys: readonly string[] | undefined = ctor?.writableKeys
    if (Array.isArray(keys) && keys.length) {
      return keys as (keyof TServerData)[]
    }
    return Object.keys(this._serverData) as (keyof TServerData)[]
  }

  constructor(opts: {
    client: HydroServer
    service?: TService
    serverData?: TServerData
  }) {
    this._client = opts.client
    if (opts.service) (this as any)._service = opts.service
    if (opts.serverData) this.hydrate(opts.serverData)
  }

  protected hydrate(serverData: TServerData): void {
    Object.assign(this as any, serverData)
    this._serverData = { ...serverData }
  }

  protected editableFields(): (keyof TServerData)[] {
    return Object.keys(this._serverData) as (keyof TServerData)[]
  }

  get client(): HydroServer {
    return this._client
  }
  get service(): TService {
    return this._service
  }

  get unsavedChanges(): Partial<TServerData> {
    const out: Partial<TServerData> = {}
    for (const key of this.editableFields()) {
      const curr = (this as any)[key]
      const prev = (this._serverData as any)[key]
      if (!shallowEqual(curr, prev)) (out as any)[key] = curr
    }
    return out
  }

  async save(patch?: Partial<TServerData>): Promise<this> {
    if (!(this as any)._service)
      throw new Error('Saving not enabled for this object.')
    if (!this.id) throw new Error('Data cannot be saved: id is not set.')

    const allowed = new Set(this.getWritableKeys() as string[])
    const body = patch ?? this.unsavedChanges
    // Filter to runtime-allowed keys to avoid 400s on readOnly fields
    const filtered: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(body)) {
      if (allowed.has(k)) filtered[k] = v
    }

    const updated = await (this._service as any).update(
      this.id,
      filtered,
      this._serverData
    )
    this.hydrate(updated as TServerData)
    return this
  }

  async refresh(): Promise<this> {
    if (!(this as any)._service)
      throw new Error('Refreshing not enabled for this object.')
    if (!this.id) throw new Error('Cannot refresh without a valid id.')
    const fresh = await (this._service as any).get(this.id)
    this.hydrate(fresh as TServerData)
    return this
  }

  async delete(): Promise<void> {
    if (!(this as any)._service)
      throw new Error('Deleting not enabled for this object.')
    if (!this.id) throw new Error('Cannot delete without a valid id.')
    await (this._service as any).delete(this.id)
  }
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object(a) !== a || Object(b) !== b) return a === b
  return a === b
}
