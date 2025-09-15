export type Result<T> = {
  data: T | null
  ok: boolean
  status: number
  message: string
  meta?: any
  error?: { code: string; details?: unknown; traceId?: string }
}

export interface StoragePort {
  get(): string | null
  set(value: string): void
  clear(): void
}

export type SessionSnapshot = {
  isAuthenticated: boolean
  user: unknown | null
  expiresAt: string | null
  flows: Array<{ id: string; providers?: string[] }>
  inEmailVerificationFlow: boolean
  inProviderSignupFlow: boolean
  signupEnabled: boolean
  oAuthProviders: string[]
  unverifiedEmail: string | null
}

export interface Provider {
  id: string
  name: string
  iconLink: string | null
  signupEnabled: boolean
  connectEnabled: boolean
}
