import { HydroServer, HydroServerOptions } from './HydroServer'

let _hs: HydroServer | null = null
let _creating: Promise<HydroServer> | null = null

const SAFE_PROPS = new Set<PropertyKey>([
  // common harmless probes during import/inspection
  'name',
  'length',
  'prototype',
  'toString',
  'then',
  Symbol.toStringTag,
  Symbol.iterator,
])

function deferredError(name: PropertyKey) {
  return () => {
    throw new Error(
      `HydroServer not initialized before calling ${String(name)}(). ` +
        `Call initHS({ host }) once at app startup.`
    )
  }
}

export async function createHydroServer(
  opts: HydroServerOptions
): Promise<HydroServer> {
  if (_hs) return _hs
  if (_creating) return _creating

  _creating = HydroServer.initialize(opts).then((client) => {
    client.session.enableAutoRefresh()
    _hs = client
    // Rebind the proxy target to the actual instance
    Object.setPrototypeOf(hs, _hs)
    _creating = null
    return client
  })
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
    if (_hs) {
      const v = (_hs as any)[prop]
      return typeof v === 'function' ? v.bind(_hs) : v
    }
    if (SAFE_PROPS.has(prop) || typeof prop === 'symbol') return undefined
    // If someone reads a service getter (e.g., hs.datastreams) before init,
    // give them a callable that throws *on use*, not during import.
    return deferredError(prop)
  },
  set(_t, prop, value) {
    if (!_hs) throw new Error('initHS({ host }) must be called before mutation')
    ;(_hs as any)[prop] = value
    return true
  },
}) as HydroServer
