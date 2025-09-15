import type { HydroServer } from '../HydroServer'
import {
  PermissionAction,
  PermissionResource,
  type Permission,
  type Workspace,
  type User as AppUser,
} from '../../types'

export type ActionInput =
  | PermissionAction
  | Lowercase<PermissionAction>
  | string
export type ResourceInput =
  | PermissionResource
  | Lowercase<PermissionResource>
  | string

/** Minimal shape of the session user we rely on */
type SessionUser = Partial<Pick<AppUser, 'email' | 'accountType'>> &
  Record<string, unknown>

export class UserService {
  readonly accountBase: string
  private readonly _client: HydroServer

  constructor(client: HydroServer) {
    this._client = client
    this.accountBase = `${this._client.authBase}/browser/account`
  }

  async can(
    action: ActionInput,
    resource: ResourceInput,
    workspaceOrId: Workspace | string | null | undefined
  ): Promise<boolean> {
    const normalizedAction = normalizeAction(action)
    const normalizedResource = normalizeResource(resource)

    const workspace =
      typeof workspaceOrId === 'string'
        ? await this._client.workspaces.get(workspaceOrId)
        : workspaceOrId ?? null

    if (!workspace) return false

    const sessionUser = this.getSessionUser()

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

  private getSessionUser(): SessionUser | null {
    // Your HydroServer stores the server-returned account object in `hs.session.user`.
    // We only rely on `email` and optional `accountType`.
    const u = this._client.userFromSession?.() // optional helper (see note below)
    if (u && typeof u === 'object') return u as SessionUser

    // If you don't add `userFromSession()`, fall back to accessing hs.session.user directly:
    // return (this.client as any).session?.user ?? null;

    return null
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
