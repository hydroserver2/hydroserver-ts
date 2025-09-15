import type { HydroServer } from '@/api/HydroServer'
import { api } from '@/api/api'
import { apiMethods } from '@/api/apiMethods'

export type SessionSnapshot = {
  isAuthenticated: boolean
  expiresAt: string | null
  flows: Array<{ id: string; providers?: string[] }>
  oAuthProviders: string[]
  signupEnabled: boolean
}

const DEFAULT_SESSION_SNAPSHOT: SessionSnapshot = {
  isAuthenticated: false,
  expiresAt: null,
  flows: [],
  oAuthProviders: [],
  signupEnabled: false,
}

type SessionEvents =
  | 'session:changed'
  | 'session:expired'
  | 'session:login'
  | 'session:logout'

export class SessionService {
  readonly sessionBase: string

  private _client: HydroServer
  private snapshot: SessionSnapshot = { ...DEFAULT_SESSION_SNAPSHOT }
  private autoRefreshEnabled = false

  constructor(client: HydroServer) {
    this._client = client
    this.sessionBase = `${this._client.authBase}/browser/session`
  }

  get isAuthenticated(): boolean {
    return this.snapshot.isAuthenticated
  }
  get expiresAt(): string | null {
    return this.snapshot.expiresAt
  }
  get flows(): Array<{ id: string; providers?: string[] }> {
    return this.snapshot.flows
  }
  get oAuthProviders(): string[] {
    return this.snapshot.oAuthProviders
  }
  get signupEnabled(): boolean {
    return this.snapshot.signupEnabled
  }

  async initialize(): Promise<void> {
    const sessionResponse = await apiMethods.fetch(this.sessionBase)
    this._setSession(sessionResponse)
  }

  async login(email: string, password: string) {
    const apiResponse = await apiMethods.post(this.sessionBase, {
      email,
      password,
    })
    this._setSession(apiResponse)
  }

  private _loggingOut = false
  async logout() {
    if (this._loggingOut) return
    try {
      this._loggingOut = true
      for (const store of [localStorage, sessionStorage]) {
        for (const key of Object.keys(store)) {
          if (key.startsWith('hydroserver:')) {
            store.removeItem(key)
          }
        }
      }
      const response = await apiMethods.delete(this.sessionBase)
      this._setSession(response)
    } catch (error) {
      console.error('Error logging out.', error)
    } finally {
      this._loggingOut = false
    }
  }

  _setSession(apiResponse: any) {
    const meta = apiResponse?.meta ?? {}
    const data = apiResponse?.data ?? {}

    this.snapshot = {
      isAuthenticated: Boolean(meta.is_authenticated),
      expiresAt: meta.expires ?? null,
      flows: Array.isArray(data.flows) ? data.flows : [],
      oAuthProviders: Array.isArray(meta.oAuthProviders ?? [])
        ? meta.oAuthProviders
        : [],
      signupEnabled: Boolean(meta.signupEnabled ?? false),
    }
  }

  checkExpiration() {
    if (!this.snapshot.isAuthenticated) return
    if (!this.snapshot.expiresAt) return

    const expirationTime = new Date(this.snapshot.expiresAt).getTime()
    if (Number.isFinite(expirationTime) && Date.now() >= expirationTime) {
      this._client.emit('session:expired')
      this.logout()
    }
  }

  enableAutoRefresh() {
    if (this.autoRefreshEnabled) return
    const handler = () => this.checkExpiration()
    window.addEventListener('focus', handler)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handler()
    })
    this.autoRefreshEnabled = true
  }

  disableAutoRefresh() {
    if (!this.autoRefreshEnabled) return
    const handler = () => this.checkExpiration()
    window.removeEventListener('focus', handler)
    document.removeEventListener('visibilitychange', handler)
    this.autoRefreshEnabled = false
  }
}
