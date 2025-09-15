import Storage from '../utils/storage'
import { api } from './api'
import { Provider, SessionSnapshot } from './types'

export interface FlowItem {
  id: string
  providers?: string[]
}

const DEFAULT_SNAPSHOT: SessionSnapshot = {
  isAuthenticated: false,
  user: null,
  expiresAt: null,
  flows: [],
  inEmailVerificationFlow: false,
  inProviderSignupFlow: false,
  signupEnabled: false,
  oAuthProviders: [],
  unverifiedEmail: null,
}

export class Session {
  _snapshot: SessionSnapshot = { ...DEFAULT_SNAPSHOT }

  get isAuthenticated() {
    return this._snapshot.isAuthenticated
  }
  get user() {
    return this._snapshot.user
  }
  get expiresAt() {
    return this._snapshot.expiresAt
  }
  get flows() {
    return this._snapshot.flows
  }
  get inEmailVerificationFlow() {
    return this._snapshot.inEmailVerificationFlow
  }
  get inProviderSignupFlow() {
    return this._snapshot.inProviderSignupFlow
  }
  get signupEnabled() {
    return this._snapshot.signupEnabled
  }
  get oAuthProviders() {
    return this._snapshot.oAuthProviders
  }
  get unverifiedEmail() {
    return this._snapshot.unverifiedEmail
  }

  async initialize() {
    // const vocabularyStore = useVocabularyStore()

    try {
      const [sessionResponse] = await Promise.all([api.fetchSession()])
      this.setSession(sessionResponse)
    } catch (error) {
      console.log('Error initializing session', error)
    }
  }

  setSession(apiResponse: any) {
    this._snapshot.isAuthenticated = apiResponse?.meta?.is_authenticated
    this._snapshot.expiresAt = apiResponse?.meta?.expires
    this._snapshot.flows = apiResponse?.data?.flows || []
    this._snapshot.user = apiResponse?.data?.account || null
  }

  checkSessionExpiration() {
    if (
      this.isAuthenticated &&
      this.expiresAt &&
      Date.now() >= new Date(this.expiresAt).getTime()
    ) {
      this.logout()
    }
  }

  //   login = async () => {
  //     try {
  //       //   Snackbar.success('You have logged in!')
  //       await router.push({ name: 'Sites' })
  //     } catch (e) {
  //       console.log('Failed to fetch user info')
  //     }
  //   }

  loggingOut = false
  async logout() {
    if (this.loggingOut) return
    try {
      this.loggingOut = true
      localStorage.clear()
      sessionStorage.clear()
      const response = await api.logout()
      this.setSession(response)
      //   await router.push({ name: 'Login' })
    } catch (error) {
      console.error('Error logging out.', error)
    } finally {
      this.loggingOut = false
    }
  }

  // Check if the session has expired when the user switches to this tab
  // and/or when the browser comes into focus
  //   window.addEventListener('focus', () => {
  //     checkSessionExpiration()
  //   })

  //   document.addEventListener('visibilitychange', () => {
  //     if (document.visibilityState === 'visible') {
  //       checkSessionExpiration()
  //     }
  //   })
}
