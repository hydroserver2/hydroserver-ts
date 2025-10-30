import { apiMethods } from '../apiMethods'
import { HydroServerBaseService } from './base'
import { WorkspaceContract as C } from '../../generated/contracts'
import { ApiKey, Workspace as M } from '../../types'
import type * as Data from '../../generated/data.types'
import { ApiResponse } from '../responseInterceptor'

type RoleQueryParameters = Data.components['schemas']['RoleQueryParameters']

/**
 * Transport layer for /workspaces routes. Builds URLs, handles pagination,
 * and returns rich WorkspaceModel instances.
 */
export class WorkspaceService extends HydroServerBaseService<typeof C, M> {
  static route = C.route
  static writableKeys = C.writableKeys
  static Model = M

  // ---------- sub-resources: collaborators ----------
  getCollaborators(workspaceId: string) {
    const url = `${this._route}/${workspaceId}/collaborators`
    return apiMethods.fetch(url)
  }

  addCollaborator(workspaceId: string, email: string, roleId: string) {
    const url = `${this._route}/${workspaceId}/collaborators`
    return apiMethods.post(url, { email, role: roleId })
  }

  updateCollaboratorRole(workspaceId: string, email: string, roleId: string) {
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

  rejectWorkspaceTransfer = (id: string) =>
    apiMethods.delete(`${this.removeCollaborator}/${id}/transfer`)

  // ---------- sub-resources: keys/roles ----------
  getApiKeys(workspaceId: string) {
    const url = `${this._route}/${workspaceId}/api-keys`
    return apiMethods.fetch(url)
  }

  getApiKey = (workspaceId: string, apiKeyId: string) =>
    apiMethods.fetch(
      `${this._route}/${workspaceId}/api-keys/${apiKeyId}?expand_related=true`
    )

  createApiKey = async (apiKey: ApiKey): Promise<ApiResponse<ApiKey>> => {
    return apiMethods.post(
      `${this._route}/${apiKey.workspaceId}/api-keys?expand_related=true`,
      {
        name: apiKey.name,
        description: apiKey.description,
        isActive: true,
        roleId: apiKey.role!.id,
      }
    )
  }

  updateApiKey = async (
    newKey: ApiKey,
    oldKey?: ApiKey
  ): Promise<ApiResponse<ApiKey>> => {
    return await apiMethods.patch(
      `${this._route}/${newKey.workspaceId}/api-keys/${newKey.id}?expand_related=true`,
      {
        name: newKey.name,
        description: newKey.description,
        isActive: true,
        roleId: newKey.role!.id,
      },
      oldKey
        ? {
            name: oldKey.name,
            description: oldKey.description,
            isActive: true,
            roleId: oldKey.role!.id,
          }
        : oldKey
    )
  }

  regenerateApiKey = async (id: string, apiKeyId: string) =>
    apiMethods.put(
      `${this._route}/${id}/api-keys/${apiKeyId}/regenerate?expand_related=true`
    )

  deleteApiKey = async (id: string, apiKeyId: string) =>
    apiMethods.delete(`${this._route}/${id}/api-keys/${apiKeyId}`)

  getRoles = (params?: RoleQueryParameters) => {
    const url = this.withQuery(`${this._client.baseRoute}/roles`, params)
    return apiMethods.paginatedFetch(url)
  }

  getRole = (id: string) =>
    apiMethods.fetch(`${this._client.baseRoute}/roles/${id}`)
}
