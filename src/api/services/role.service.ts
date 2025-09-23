import type { HydroServer } from '../HydroServer'
import { BaseListParams, HydroServerBaseService } from './base'
import type { CollaboratorRole } from '../../types'
import { RoleModel } from '../models/role.model'
import type { ItemResult, ListResult } from '../result'

export type RoleListParams = BaseListParams & {
  workspaceId?: string
  isUserRole?: boolean
  isApikeyRole?: boolean
  name?: string
  search?: string
}

/**
 * Transport layer for /roles routes. Returns RoleModel instances and
 * Result envelopes consistent with the rest of the client.
 */
export class RoleService extends HydroServerBaseService<RoleModel> {
  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/roles`)
  }

  list(params: RoleListParams = {}): Promise<ListResult<RoleModel>> {
    return super.list(params)
  }

  /** Convenience: only user-assignable roles. */
  listUserRoles(params: Omit<RoleListParams, 'isUserRole'> = {}) {
    return this.list({ ...params, isUserRole: true })
  }

  /** Convenience: only API-key roles. */
  listApikeyRoles(params: Omit<RoleListParams, 'isApikeyRole'> = {}) {
    return this.list({ ...params, isApikeyRole: true })
  }

  get(id: string): Promise<ItemResult<RoleModel>> {
    return super.get(id)
  }

  create(body: Partial<CollaboratorRole>): Promise<ItemResult<RoleModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<CollaboratorRole>,
    originalBody?: Partial<CollaboratorRole>
  ): Promise<ItemResult<RoleModel>> {
    return super.update(id, body, originalBody)
  }

  delete(id: string) {
    return super.delete(id)
  }

  /* -------------------- Model wiring -------------------- */

  protected override deserialize(data: unknown): RoleModel {
    return new RoleModel(this._client, this, data as CollaboratorRole)
  }
}
