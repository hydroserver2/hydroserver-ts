import type { HydroServer } from '../HydroServer'
import {
  PermissionAction,
  PermissionResource,
  type Permission,
  type Workspace,
  type User,
} from '../../types'
import { apiMethods } from '../apiMethods'

export type ActionInput =
  | PermissionAction
  | Lowercase<PermissionAction>
  | string
export type ResourceInput =
  | PermissionResource
  | Lowercase<PermissionResource>
  | string

/** Minimal shape of the session user we rely on */
type SessionUser = Partial<Pick<User, 'email' | 'accountType'>> &
  Record<string, unknown>

export class UserService {
  readonly accountBase: string
  private readonly _client: HydroServer

  constructor(client: HydroServer) {
    this._client = client
    this.accountBase = `${this._client.authBase}/browser/account`
  }

  async get() {
    return await apiMethods.fetch(this.accountBase)
  }

  async create(user: User) {
    return await apiMethods.post(this.accountBase, user)
  }

  async update(user: User, oldUser?: User) {
    return apiMethods.patch(this.accountBase, user, oldUser)
  }

  async delete() {
    return apiMethods.delete(this.accountBase)
  }

  async normalizeWorkspace(
    workspaceOrId: Workspace | string | null | undefined
  ) {
    if (typeof workspaceOrId === 'string') {
      const res = await this._client.workspaces.get(workspaceOrId)
      if (res.ok) return res.item
    } else {
      return workspaceOrId ?? null
    }
  }

  async can(
    action: ActionInput,
    resource: ResourceInput,
    workspaceOrId: Workspace | string | null | undefined
  ): Promise<boolean> {
    const normalizedAction = normalizeAction(action)
    const normalizedResource = normalizeResource(resource)

    const workspace = this.normalizeWorkspace(workspaceOrId)

    if (!workspace) return false

    const res = await this.get()
    const sessionUser = res.data

    if (isAdmin(sessionUser)) return true
    if (isOwner(sessionUser, workspace)) return true

    const perms: Permission[] = workspace.collaboratorRole?.permissions ?? []
    const allowed =
      hasGlobalPermission(perms) ||
      perms.some(
        (p) =>
          p.action === normalizedAction && p.resource === normalizedResource
      )

    return allowed
  }

  async sendVerificationEmail(email: string) {
    return apiMethods.put(`${this.accountBase}/email/verify`, { email })
  }

  async verifyEmailWithCode(key: string) {
    return apiMethods.post(`${this.accountBase}/email/verify`, { key })
  }

  async requestPasswordReset(email: string) {
    return apiMethods.post(`${this.accountBase}/password/request`, { email })
  }

  async resetPassword(key: string, password: string) {
    return apiMethods.post(`${this.accountBase}/password/reset`, {
      key,
      password,
    })
  }
}

function isAdmin(user: SessionUser | null): boolean {
  return (user?.accountType as string) === 'admin'
}

function isOwner(
  user: SessionUser | null,
  workspace: Workspace | null
): boolean {
  if (!user?.email || !workspace?.owner?.email) return false
  return workspace.owner.email === user.email
}

function hasGlobalPermission(perms: Permission[]): boolean {
  return perms.some(
    (p) =>
      p.resource === PermissionResource.Global &&
      p.action === PermissionAction.Global
  )
}

function normalizeAction(input: ActionInput): PermissionAction {
  // Accept "edit", "EDIT", PermissionAction.Edit, etc.
  const s = String(input).toLowerCase()
  switch (s) {
    case '*':
      return PermissionAction.Global
    case 'view':
      return PermissionAction.View
    case 'create':
      return PermissionAction.Create
    case 'edit':
      return PermissionAction.Edit
    case 'delete':
      return PermissionAction.Delete
    default:
      // Keep strict: throw if unknown to catch typos early
      throw new Error(`Unknown action: ${input}`)
  }
}

function normalizeResource(input: ResourceInput): PermissionResource {
  // Accept "datastream", "Datastream", PermissionResource.Datastream, etc.
  const s = String(input).toLowerCase()
  switch (s) {
    case '*':
    case 'global':
      return PermissionResource.Global
    case 'workspace':
      return PermissionResource.Workspace
    case 'collaborator':
      return PermissionResource.Collaborator
    case 'thing':
      return PermissionResource.Thing
    case 'datastream':
      return PermissionResource.Datastream
    case 'sensor':
      return PermissionResource.Sensor
    case 'unit':
      return PermissionResource.Unit
    case 'observedproperty':
    case 'observed_property':
      return PermissionResource.ObservedProperty
    case 'processinglevel':
    case 'processing_level':
      return PermissionResource.ProcessingLevel
    case 'observation':
      return PermissionResource.Observation
    default:
      throw new Error(`Unknown resource: ${input}`)
  }
}
