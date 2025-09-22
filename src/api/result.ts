import type { HydroServerCollection } from './collections/base'

/** Request/response metadata useful for telemetry and UI hints. */
export type Meta = {
  request: {
    method: string
    url: string
    startedAt: number // ms since epoch
    durationMs: number // total wall time
    retryCount: number // how many retries were attempted
    fromCache?: boolean // optional: if a cache layer served it
  }
  /** Present for list endpoints when pagination headers exist. */
  pagination?: {
    page?: number
    pageSize?: number
    totalPages?: number
    totalCount?: number
  }
  /** Correlate client UI to server logs. */
  traceId?: string
  /** Deprecation notices, truncation warnings, etc. */
  warnings?: string[]
  /** Cache validators if the server provides them. */
  etag?: string
  lastModified?: string
}

/** Common fields shared by all result kinds. */
type BaseResult = {
  ok: boolean
  status: number
  /** Human-friendly message (from API if provided, otherwise synthesized). */
  message: string
  meta?: Meta
}

/* ──────────────────────────────────────────────────────────────────────────
 * LIST RESULTS
 * ────────────────────────────────────────────────────────────────────────── */

export type ListOk<T> = BaseResult & {
  kind: 'list'
  ok: true
  /** Direct reference to collection.items (no copy). */
  items: T[]
  /** Pagination context & helpers. */
  collection: HydroServerCollection<T>
}

export type ListErr = BaseResult & {
  kind: 'list'
  ok: false
  items: []
  collection: null
}

export type ListResult<T> = ListOk<T> | ListErr

/* ──────────────────────────────────────────────────────────────────────────
 * ITEM RESULTS
 * ────────────────────────────────────────────────────────────────────────── */

export type ItemOk<T> = BaseResult & {
  kind: 'item'
  ok: true
  item: T
}

export type ItemErr = BaseResult & {
  kind: 'item'
  ok: false
}

export type ItemResult<T> = ItemOk<T> | ItemErr

/* ──────────────────────────────────────────────────────────────────────────
 * VOID RESULTS (delete, etc.)
 * ────────────────────────────────────────────────────────────────────────── */

export type VoidOk = BaseResult & {
  kind: 'none'
  ok: true
}

export type VoidErr = BaseResult & {
  kind: 'none'
  ok: false
}

export type VoidResult = VoidOk | VoidErr

/** Convenience union when you don’t care which kind it is. */
export type AnyResult = ListResult<any> | ItemResult<any> | VoidResult

/* ──────────────────────────────────────────────────────────────────────────
 * TYPE GUARDS
 * ────────────────────────────────────────────────────────────────────────── */

/** True when the result is ok (success). Narrows the union accordingly. */
export const isOk = <R extends AnyResult>(
  r: R
): r is Extract<R, { ok: true }> => r.ok
/** True when the result is an error (not ok). */
export const isErr = <R extends AnyResult>(
  r: R
): r is Extract<R, { ok: false }> => !r.ok

export const isList = <T>(r: AnyResult): r is ListResult<T> =>
  (r as any).kind === 'list'
export const isItem = <T>(r: AnyResult): r is ItemResult<T> =>
  (r as any).kind === 'item'
export const isVoid = (r: AnyResult): r is VoidResult =>
  (r as any).kind === 'none'

/* ──────────────────────────────────────────────────────────────────────────
 * ERGONOMIC ACCESSORS (non-throwing)
 * ────────────────────────────────────────────────────────────────────────── */

/** Get the items array from a ListResult or an empty array if error. */
export const okItems = <T>(r: ListResult<T>): T[] => (r.ok ? r.items : [])

/** Get the item from an ItemResult or null if error. */
export const okItem = <T>(r: ItemResult<T>): T | null => (r.ok ? r.item : null)

/* ──────────────────────────────────────────────────────────────────────────
 * EXPECT HELPERS (opt-in throwing)
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Return items on success; throw an Error carrying status/code on failure.
 * Useful in route guards, app init, and tests where failure must halt flow.
 */
export function expectList<T>(r: ListResult<T>): T[] {
  if (r.ok) return r.items
  throw toError(r)
}

/** Return item on success; throw on failure. */
export function expectItem<T>(r: ItemResult<T>): T {
  if (r.ok) return r.item
  throw toError(r)
}

/** Return void on success; throw on failure. */
export function expectVoid(r: VoidResult): void {
  if (r.ok) return
  throw toError(r)
}

/* ──────────────────────────────────────────────────────────────────────────
 * MAP / TAP HELPERS
 * ────────────────────────────────────────────────────────────────────────── */

/** Map items in a ListResult without touching meta/message/status. */
export function mapList<A, B>(
  r: ListResult<A>,
  fn: (a: A) => B
): ListResult<B> {
  if (!r.ok) return r as ListErr as ListResult<B>
  // Preserve array reference semantics if you prefer; here we map to a new array.
  const mapped = r.items.map(fn)
  return {
    ...r,
    items: mapped,
    collection: r.collection as unknown as HydroServerCollection<B>,
  }
}

/** Map item in an ItemResult. */
export function mapItem<A, B>(
  r: ItemResult<A>,
  fn: (a: A) => B
): ItemResult<B> {
  if (!r.ok) return r as ItemErr as ItemResult<B>
  return { ...r, item: fn(r.item) }
}

/** Side-effects on success/error paths; returns the same result. */
export function tapList<T>(
  r: ListResult<T>,
  onOk?: (ok: ListOk<T>) => void,
  onErr?: (err: ListErr) => void
): ListResult<T> {
  r.ok ? onOk?.(r) : onErr?.(r)
  return r
}

export function tapItem<T>(
  r: ItemResult<T>,
  onOk?: (ok: ItemOk<T>) => void,
  onErr?: (err: ItemErr) => void
): ItemResult<T> {
  r.ok ? onOk?.(r) : onErr?.(r)
  return r
}

export function tapVoid(
  r: VoidResult,
  onOk?: (ok: VoidOk) => void,
  onErr?: (err: VoidErr) => void
): VoidResult {
  r.ok ? onOk?.(r) : onErr?.(r)
  return r
}

/* ──────────────────────────────────────────────────────────────────────────
 * ERROR CONVERSION
 * ────────────────────────────────────────────────────────────────────────── */

/** Convert an error result into a thrown Error enriched with status/code/details. */
export function toError(r: Extract<AnyResult, { ok: false }>): Error {
  const e = new Error(r.message)
  ;(e as any).status = r.status
  return e
}

/* ──────────────────────────────────────────────────────────────────────────
 * LITTLE UTILITIES
 * ────────────────────────────────────────────────────────────────────────── */

/** Human-friendly HTTP category (e.g., "2xx", "4xx"). */
export function statusBucket(
  status: number
): '0' | '1xx' | '2xx' | '3xx' | '4xx' | '5xx' {
  if (status === 0) return '0'
  const h = Math.floor(status / 100)
  return (['1xx', '2xx', '3xx', '4xx', '5xx'][h - 1] ?? '0') as any
}

/** True when the error is likely retriable (rate-limit or server-side). */
// export function isRetriable(r: AnyResult): boolean {
//   if (r.ok) return false
//   return (
//     Boolean(r.error?.retriable) ||
//     r.status === 429 ||
//     (r.status >= 500 && r.status < 600)
//   )
// }
