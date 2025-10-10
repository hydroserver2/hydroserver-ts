import { apiMethods } from '../apiMethods'
import { AccountContract as C } from '../../generated/auth-contracts'
import { WorkspaceContract } from '../../generated/contracts'
import { type HydroServer } from '../HydroServer'
import type * as Data from '../../generated/data.types'

type Permission = Data.components['schemas']['PermissionDetailResponse']
type PermissionAction =
  Data.components['schemas']['PermissionDetailResponse']['action']
type PermissionResource =
  Data.components['schemas']['PermissionDetailResponse']['resource']

/** Minimal shape of the session user we rely on */
type SessionUser = Partial<Pick<C.DetailResponse, 'email' | 'accountType'>> &
  Record<string, unknown>

export class UserService {
  private readonly _client: HydroServer
  readonly accountBase: string
  readonly providerBase: string

  constructor(client: HydroServer) {
    this._client = client
    this.accountBase = `${this._client.authBase}/browser/account`
    this.providerBase = `${this._client.authBase}/browser/provider`
  }

  async get() {
    return await apiMethods.fetch(this.accountBase)
  }

  async create(user: C.PostBody) {
    return await apiMethods.post(this.accountBase, user)
  }

  async update(user: C.PatchBody, oldUser?: C.PatchBody) {
    return apiMethods.patch(this.accountBase, user, oldUser)
  }

  async delete() {
    return apiMethods.delete(this.accountBase)
  }

  /* ---------------------------- Email verification --------------------------- */
  async sendVerificationEmail(email: string) {
    return apiMethods.put(`${this.accountBase}/email/verify`, { email })
  }

  async verifyEmailWithCode(key: string) {
    return apiMethods.post(`${this.accountBase}/email/verify`, { key })
  }

  /* ---------------------------- Password helpers --------------------------- */
  requestPasswordReset(email: string) {
    const url = `${this.accountBase}/password/request`
    return apiMethods.post(url, { email })
  }

  resetPassword(key: string, password: string) {
    const url = `${this.accountBase}/password/reset`
    return apiMethods.post(url, { key, password })
  }

  /* ----------------------- Organization/User types ------------------------- */
  getOrganizationTypes() {
    const url = `${this.accountBase}/organization-types`
    return apiMethods.fetch(url)
  }

  getUserTypes() {
    const url = `${this.accountBase}/user-types`
    return apiMethods.fetch(url)
  }

  /* ------------------------------ Providers -------------------------------- */
  listProviderConnections() {
    const url = `${this.providerBase}/connections`
    return apiMethods.fetch(url)
  }

  disconnectProvider(provider: string) {
    const url = toUrl(`${this.providerBase}/connections`, { provider })
    return apiMethods.delete(url)
  }

  redirectToProvider(provider: string, next?: string) {
    const url = toUrl(`${this.providerBase}/redirect`, { provider, next })
    return apiMethods.fetch(url)
  }

  providerSignup(payload: unknown) {
    const url = `${this.providerBase}/signup`
    return apiMethods.post(url, payload)
  }

  async can(
    action: PermissionAction,
    resource: PermissionResource,
    workspace: WorkspaceContract.DetailResponse
  ): Promise<boolean> {
    const res = await this.get()
    const sessionUser = res.data

    if (isAdmin(sessionUser)) return true
    if (isOwner(sessionUser, workspace)) return true

    const perms: Permission[] = workspace.collaboratorRole?.permissions ?? []
    const allowed =
      hasGlobalPermission(perms) ||
      perms.some((p) => p.action === action && p.resource === resource)

    return allowed
  }
}

function isAdmin(user: SessionUser | null): boolean {
  return (user?.accountType as string) === 'admin'
}

function isOwner(
  user: SessionUser | null,
  workspace: WorkspaceContract.DetailResponse | null
): boolean {
  if (!user?.email || !workspace?.owner?.email) return false
  return workspace.owner.email === user.email
}

function hasGlobalPermission(perms: Permission[]): boolean {
  return perms.some((p) => p.resource === '*' && p.action === '*')
}

function toUrl(
  base: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) return base
  const url = new URL(base, globalThis.location?.origin ?? undefined)
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    url.searchParams.set(k, String(v))
  }
  return url.toString()
}
