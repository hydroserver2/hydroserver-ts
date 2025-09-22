import type { HydroServer } from '../HydroServer'
import { apiMethods } from '../apiMethods'
import { BaseListParams, HydroServerBaseService } from './base'
import type { Workspace } from '../../types'
import { WorkspaceModel } from '../models/workspace.model'
import { ItemResult, ListResult } from '../result'

export type WorkspaceListParams = BaseListParams & {
  isPrivate?: boolean
  isAssociated?: boolean
}

/**
 * Transport layer for /workspaces routes. Builds URLs, handles pagination,
 * and returns rich WorkspaceModel instances.
 */
export class WorkspaceService extends HydroServerBaseService<WorkspaceModel> {
  constructor(client: HydroServer) {
    super(client, `${client.baseRoute}/workspaces`)
  }

  list(params: WorkspaceListParams = {}): Promise<ListResult<WorkspaceModel>> {
    return super.list(params)
  }

  get(id: string): Promise<ItemResult<WorkspaceModel>> {
    return super.get(id)
  }

  create(body: Partial<Workspace>): Promise<ItemResult<WorkspaceModel>> {
    return super.create(body)
  }

  update(
    id: string,
    body: Partial<Workspace>,
    originalBody?: Partial<Workspace>
  ): Promise<ItemResult<WorkspaceModel>> {
    return super.update(id, body, originalBody)
  }

  // ---------- sub-resources: collaborators ----------
  collaborators(workspaceId: string) {
    const url = `${this._route}/${workspaceId}/collaborators`
    return apiMethods.fetch(url)
  }

  addCollaborator(workspaceId: string, email: string, roleId: string) {
    const url = `${this._route}/${workspaceId}/collaborators`
    return apiMethods.post(url, { email, role: roleId })
  }

  editCollaboratorRole(workspaceId: string, email: string, roleId: string) {
    const url = `${this._route}/${workspaceId}/collaborators`
    return apiMethods.patch(url, { email, role: roleId }, null)
  }

  removeCollaborator(workspaceId: string, email: string) {
    const url = new URL(
      `${this._route}/${workspaceId}/collaborators`,
      globalThis.location?.origin ?? undefined
    )
    url.searchParams.set('email', email)
    return apiMethods.delete(url.toString())
  }

  // ---------- sub-resources: ownership transfer ----------
  transferOwnership(workspaceId: string, email: string) {
    const url = `${this._route}/${workspaceId}/ownership/transfer`
    return apiMethods.post(url, { email })
  }

  acceptOwnershipTransfer(workspaceId: string) {
    const url = `${this._route}/${workspaceId}/ownership/accept`
    return apiMethods.post(url, {})
  }

  cancelOwnershipTransfer(workspaceId: string) {
    const url = `${this._route}/${workspaceId}/ownership/cancel`
    return apiMethods.post(url, {})
  }

  // ---------- sub-resources: keys/roles ----------
  apiKeys(workspaceId: string) {
    const url = `${this._route}/${workspaceId}/apikeys`
    return apiMethods.fetch(url)
  }

  roles(workspaceId: string) {
    const url = `${this._route}/${workspaceId}/roles`
    return apiMethods.fetch(url)
  }

  protected override deserialize(data: unknown): WorkspaceModel {
    return new WorkspaceModel(this._client, this, data as Workspace)
  }
}
