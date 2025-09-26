import { apiMethods } from '../apiMethods'
import type { HydroServer } from '../HydroServer'
import { HydroServerCollection } from '../collections/base'
import type { ListResult, ItemResult, VoidResult, Meta } from '../result'
import { ApiError } from '../responseInterceptor'

type ContractLike = { route: string }

export abstract class HydroServerBaseService<TModel, TQueryParams> {
  protected _client: HydroServer
  protected _route: string

  constructor(client: HydroServer, route: string) {
    this._client = client
    this._route = route
  }

  /** Override in child to map raw JSON into a model instance. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected deserialize(data: unknown): TModel {
    return data as TModel
  }

  protected serialize(body: unknown): unknown {
    return body ?? {}
  }

  protected prepareListParams(params: TQueryParams): TQueryParams {
    return params
  }

  async list(
    params: Partial<TQueryParams> & {
      fetch_all?: boolean
    } = {} as Partial<TQueryParams>
  ): Promise<ListResult<TModel>> {
    const { fetch_all, ...query } = params as Record<string, unknown>
    const serverQuery = normalizeParams(query as Record<string, unknown>)
    const url = withQuery(this._route, serverQuery)
    const startedAt = performance.now()

    try {
      if (fetch_all) {
        const json = await apiMethods.paginatedFetch(url)
        const items = json.data.map((it: TModel) => this.deserialize(it))
        const collection = new HydroServerCollection<TModel>({
          service: this,
          items,
          filters: removeKeys(serverQuery, ['page', 'page_size', 'order_by']),
          orderBy: toStringArray(serverQuery['order_by']),
          page: 1,
          pageSize: items.length,
          totalPages: 1,
          totalCount: items.length,
        })

        return {
          kind: 'list',
          ok: true,
          status: json.status,
          message: json.message,
          items: collection.items, // same array reference
          collection,
          meta: makeMeta(
            'GET',
            url,
            startedAt,
            performance.now() - startedAt,
            0
          ),
        }
      }

      // Single page (no headers available via apiMethods.fetch)
      const json = await apiMethods.fetch(url)
      const items = json.data.map((it: TModel) => this.deserialize(it))
      const collection = new HydroServerCollection<TModel>({
        service: this,
        items,
        filters: removeKeys(serverQuery, ['page', 'page_size', 'order_by']),
        orderBy: toStringArray(serverQuery['order_by']),
        // pagination unknown without headers; leave undefined
      })

      return {
        kind: 'list',
        ok: true,
        status: json.status,
        message: json.message,
        items: collection.items,
        collection,
        meta: makeMeta('GET', url, startedAt, performance.now() - startedAt, 0),
      }
    } catch (err) {
      return listErr('GET', url, startedAt, err)
    }
  }

  /* ------------------------------ GET ------------------------------ */

  async get(id: string): Promise<ItemResult<TModel>> {
    const url = `${this._route}/${encodeURIComponent(id)}`
    const startedAt = performance.now()
    try {
      const json = await apiMethods.fetch(url)
      const item = this.deserialize(json)
      return {
        kind: 'item',
        ok: true,
        status: json.status,
        message: json.message,
        item,
        meta: makeMeta('GET', url, startedAt, performance.now() - startedAt, 0),
      }
    } catch (err) {
      return itemErr('GET', url, startedAt, err)
    }
  }

  /* ------------------------------ CREATE ------------------------------ */

  async create(body: unknown): Promise<ItemResult<TModel>> {
    const url = this._route
    const startedAt = performance.now()
    try {
      const json = await apiMethods.post(url, this.serialize(body))
      const item = this.deserialize(json)
      return {
        kind: 'item',
        ok: true,
        status: json.status,
        message: json.message,
        item,
        meta: makeMeta(
          'POST',
          url,
          startedAt,
          performance.now() - startedAt,
          0
        ),
      }
    } catch (err) {
      return itemErr('POST', url, startedAt, err)
    }
  }

  /* ------------------------------ UPDATE ------------------------------ */

  async update(
    id: string,
    body: unknown,
    originalBody?: unknown
  ): Promise<ItemResult<TModel>> {
    const url = `${this._route}/${encodeURIComponent(id)}`
    const startedAt = performance.now()
    try {
      const json = await apiMethods.patch(
        url,
        this.serialize(body),
        originalBody ?? null
      )
      const item = this.deserialize(json)
      return {
        kind: 'item',
        ok: true,
        status: json.status,
        message: json.message,
        item,
        meta: makeMeta(
          'PATCH',
          url,
          startedAt,
          performance.now() - startedAt,
          0
        ),
      }
    } catch (err) {
      return itemErr('PATCH', url, startedAt, err)
    }
  }

  /* ------------------------------ DELETE ------------------------------ */

  async delete(id: string): Promise<VoidResult> {
    const url = `${this._route}/${encodeURIComponent(id)}`
    const startedAt = performance.now()
    try {
      const json = await apiMethods.delete(url)
      return {
        kind: 'none',
        ok: true,
        status: json.status,
        message: json.message,
        meta: makeMeta(
          'DELETE',
          url,
          startedAt,
          performance.now() - startedAt,
          0
        ),
      }
    } catch (err) {
      return voidErr('DELETE', url, startedAt, err)
    }
  }

  /* ------------------------------ SUGAR ------------------------------ */

  async listItems(params?: Partial<TQueryParams> & { fetch_all?: boolean }) {
    const res = await this.list(params as any)
    return res.ok ? res.items : []
  }

  async listAllItems(params?: TQueryParams) {
    return this.listItems({ ...(params as any), fetch_all: true })
  }

  async getItem(id: string) {
    const res = await this.get(id)
    return res.ok ? res.item : null
  }
}

/* ---------------------------- helpers ---------------------------- */

function makeMeta(
  method: string,
  url: string,
  startedAt: number,
  durationMs: number,
  retryCount: number,
  extra?: Partial<Meta>
): Meta {
  return {
    request: { method, url, startedAt, durationMs, retryCount },
    ...extra,
  }
}

function listErr(
  method: string,
  url: string,
  startedAt: number,
  apiError: unknown
): ListResult<any> {
  const err = apiError as Partial<ApiError>
  return {
    kind: 'list',
    ok: false,
    items: [],
    collection: null,
    status: typeof err.status === 'number' ? err.status : 0,
    message: err.message ?? 'Request failed',
    meta: makeMeta(method, url, startedAt, performance.now() - startedAt, 0),
  }
}

function itemErr(
  method: string,
  url: string,
  startedAt: number,
  apiError: unknown
): ItemResult<any> {
  const err = apiError as Partial<ApiError>
  return {
    kind: 'item',
    ok: false,
    status: typeof err.status === 'number' ? err.status : 0,
    message: err.message ?? 'Request failed',
    meta: makeMeta(method, url, startedAt, performance.now() - startedAt, 0),
  }
}

function voidErr(
  method: string,
  url: string,
  startedAt: number,
  apiError: unknown
): VoidResult {
  const err = apiError as Partial<ApiError>
  return {
    kind: 'none',
    ok: false,
    status: typeof err.status === 'number' ? err.status : 0,
    message: err.message ?? 'Request failed',
    meta: makeMeta(method, url, startedAt, performance.now() - startedAt, 0),
  }
}

/** Convert camelCase keys to snake_case for query params the API expects. */
function normalizeParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    const key =
      k === 'pageSize'
        ? 'page_size'
        : k === 'orderBy'
        ? 'order_by'
        : camelToSnake(k)
    out[key] = Array.isArray(v) ? v.join(',') : v
  }
  return out
}

/** Build a URL with query parameters. */
function withQuery(base: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return base
  const url = new URL(base, globalThis.location?.origin ?? undefined)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function removeKeys<T extends Record<string, unknown>>(
  object: T,
  keys: string[]
): T {
  const output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(object)) {
    if (!keys.includes(key)) output[key] = value
  }
  return output as T
}

function toStringArray(v: unknown): string[] | undefined {
  if (typeof v === 'string') return v.split(',').filter(Boolean)
  if (Array.isArray(v)) return v.map(String)
  return undefined
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
}
