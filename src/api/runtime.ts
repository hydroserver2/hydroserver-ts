import { HydroServer } from './HydroServer'

type HSOpts = { host?: string }

let _hs: HydroServer | null = null
let _creating: Promise<HydroServer> | null = null

function assertHS(): HydroServer {
  if (!_hs) {
    throw new Error(
      'HydroServer not initialized. Call createHydroServer({...}) before using `hs`.'
    )
  }
  return _hs
}

export async function createHydroServer(
  opts: HSOpts = {}
): Promise<HydroServer> {
  if (_hs) return _hs
  if (_creating) return _creating

  _creating = HydroServer.initialize({ host: opts.host ?? '' }).then(
    (client) => {
      client.session.enableAutoRefresh()
      _hs = client
      _creating = null
      return client
    }
  )
  return _creating
}

export function ready(): Promise<HydroServer> {
  return _hs
    ? Promise.resolve(_hs)
    : _creating ??
        Promise.reject(new Error('createHydroServer() was never called'))
}

export const hs = new Proxy({} as unknown as HydroServer, {
  get(_t, prop) {
    const target = assertHS() as any
    const v = target[prop]
    return typeof v === 'function' ? v.bind(target) : v
  },
  set(_t, prop, value) {
    ;(assertHS() as any)[prop] = value
    return true
  },
}) as HydroServer
