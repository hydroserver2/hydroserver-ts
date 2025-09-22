import { User } from '../../types'
import type { HydroServer } from '../HydroServer'
import { apiMethods } from '../apiMethods'
import Storage from '../../utils/storage'

export interface Provider {
  id: string
  name: string
  iconLink: string | null
  signupEnabled: boolean
  connectEnabled: boolean
}

export type SessionSnapshot = {
  isAuthenticated: boolean
  expiresAt: string | null
  flows: Array<{ id: string; providers?: string[] }>
  oAuthProviders: Provider[]
  signupEnabled: boolean
}

const DEFAULT_SESSION_SNAPSHOT: SessionSnapshot = {
  isAuthenticated: false,
  expiresAt: null,
  flows: [],
  oAuthProviders: [],
  signupEnabled: false,
}

export const emailStorage = new Storage<string>('hydroserver:unverifiedEmail')

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
  /**
   * Determines if signing up on the website is available at all.
   * Some organizations will want an admin signing up for their users
   * to be the only way to create an account.
   *
   * Not to be confused with `oAuthProviders.signupEnabled` that tells us if
   * that particular OAuth service can be used to create an account.
   */
  get signupEnabled() {
    return this.snapshot.signupEnabled
  }
  /**
   * An array of OAuth providers that the user can use to authenticate.
   * In some cases, such as with HydroShare, this allows connecting to the provider
   * for data archival instead of direct authentication.
   *
   * This array determines which login with OAuth buttons are available on the login and signup pages.
   */
  get oAuthProviders() {
    return this.snapshot.oAuthProviders || []
  }
  get flows(): Array<{ id: string; providers?: string[] }> {
    return this.snapshot.flows
  }
  get flowIds() {
    return this.flows.map((f) => f.id)
  }
  get inEmailVerificationFlow(): boolean {
    return this.flowIds.includes('verify_email')
  }
  get inProviderSignupFlow(): boolean {
    return this.flowIds.includes('provider_signup')
  }
  /**
   * Persist the state of unverified email since it won't be saved in the db
   * during the verify_email flow. Used for
   * re-emailing the verification code to the user upon request.
   */
  get unverifiedEmail() {
    return emailStorage.get() || ''
  }
  set unverifiedEmail(email: string) {
    emailStorage.set(email)
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

  async signup(user: User) {
    const apiResponse = await apiMethods.post(this._client.authBase, user)
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
