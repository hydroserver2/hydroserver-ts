import { apiMethods } from '../apiMethods'
import { HydroServerBaseService } from './base'
import { WorkspaceContract as C } from '../../generated/contracts'

/**
 * Transport layer for /workspaces routes. Builds URLs, handles pagination,
 * and returns rich WorkspaceModel instances.
 */
export class WorkspaceService extends HydroServerBaseService<typeof C> {
  static route = C.route
  static writableKeys = C.writableKeys

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
}
