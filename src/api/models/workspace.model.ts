import type { Workspace } from '../../types'
import type { HydroServer } from '../HydroServer'
import type { WorkspaceService } from '../services/workspace.service'
import { HydroServerBaseModel } from './base'

export class WorkspaceModel
  extends HydroServerBaseModel<Workspace, WorkspaceService>
  implements Workspace
{
  declare id: string
  declare name: string
  declare isPrivate: boolean
  declare owner: Workspace['owner']
  declare collaboratorRole: Workspace['collaboratorRole']
  declare pendingTransferTo?: Workspace['pendingTransferTo']
  declare description?: string | null
  declare createdAt?: string
  declare updatedAt?: string

  constructor(
    client: HydroServer,
    service: WorkspaceService,
    serverData: Workspace
  ) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: Workspace): void {
    this.id = serverData.id
    this.name = serverData.name
    this.isPrivate = serverData.isPrivate
    this.owner = serverData.owner
    this.collaboratorRole = serverData.collaboratorRole
    this.pendingTransferTo = serverData.pendingTransferTo
    this._serverData = { ...serverData }
  }

  protected override editableFields(): (keyof Workspace)[] {
    return ['name', 'isPrivate']
  }

  collaborators() {
    return this.client.workspaces.collaborators(this.id)
  }
  addCollaborator(email: string, roleId: string) {
    return this.client.workspaces.addCollaborator(this.id, email, roleId)
  }
  editCollaboratorRole(email: string, roleId: string) {
    return this.client.workspaces.editCollaboratorRole(this.id, email, roleId)
  }
  removeCollaborator(email: string) {
    return this.client.workspaces.removeCollaborator(this.id, email)
  }

  transferOwnership(email: string) {
    return this.client.workspaces.transferOwnership(this.id, email)
  }
  acceptOwnershipTransfer() {
    return this.client.workspaces.acceptOwnershipTransfer(this.id)
  }
  cancelOwnershipTransfer() {
    return this.client.workspaces.cancelOwnershipTransfer(this.id)
  }

  // things(params: Record<string, unknown> = {}) {
  //   return this.client.things.list({ workspaceId: this.id, ...params })
  // }
  // observedProperties(params: Record<string, unknown> = {}) {
  //   return this.client.observedProperties.list({
  //     workspaceId: this.id,
  //     ...params,
  //   })
  // }
  // units(params: Record<string, unknown> = {}) {
  //   return this.client.units.list({ workspaceId: this.id, ...params })
  // }
  // processingLevels(params: Record<string, unknown> = {}) {
  //   return this.client.processingLevels.list({
  //     workspaceId: this.id,
  //     ...params,
  //   })
  // }
  // sensors(params: Record<string, unknown> = {}) {
  //   return this.client.sensors.list({ workspaceId: this.id, ...params })
  // }
  // datastreams(params: Record<string, unknown> = {}) {
  //   return this.client.datastreams.list({ workspaceId: this.id, ...params })
  // }
  // orchestrationSystems(params: Record<string, unknown> = {}) {
  //   return this.client.orchestrationSystems.list({
  //     workspaceId: this.id,
  //     ...params,
  //   })
  // }
  // dataSources(params: Record<string, unknown> = {}) {
  //   return this.client.dataSources.list({ workspaceId: this.id, ...params })
  // }
  // dataArchives(params: Record<string, unknown> = {}) {
  //   return this.client.dataArchives.list({ workspaceId: this.id, ...params })
  // }
}
