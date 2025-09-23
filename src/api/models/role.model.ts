import type { CollaboratorRole, Permission } from '../../types'
import type { HydroServer } from '../HydroServer'
import type { RoleService } from '../services/role.service'
import { HydroServerBaseModel } from './base'

export class RoleModel
  extends HydroServerBaseModel<CollaboratorRole, RoleService>
  implements CollaboratorRole
{
  // --- fields from CollaboratorRole ---
  declare id: string
  declare workspaceId: string
  declare name: string
  declare description: string
  declare isApikeyRole: boolean
  declare isUserRole: boolean
  declare permissions: Permission[]

  constructor(
    client: HydroServer,
    service: RoleService,
    serverData: CollaboratorRole
  ) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: CollaboratorRole): void {
    Object.assign(this, serverData)
    this._serverData = { ...serverData }
  }

  /** Allow editing label/description/permissions; leave type flags immutable. */
  protected override editableFields(): (keyof CollaboratorRole)[] {
    return ['name', 'description', 'permissions']
  }

  /* ---------------- Convenience cross-resource fetches ---------------- */

  workspace() {
    return this.client.workspaces.get(this.workspaceId)
  }
}
