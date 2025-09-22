import { apiMethods } from '../apiMethods'
import type { HydroServer } from '../HydroServer'
import { HydroServerCollection } from '../collections/base'

export type BaseListParams = {
  page?: number
  pageSize?: number
  orderBy?: string[]
  expandRelated?: boolean
  fetchAll?: boolean
}

export abstract class HydroServerBaseService<TModel> {
  protected _client: HydroServer
  protected _route: string

  constructor(client: HydroServer, route: string) {
    this._client = client
    this._route = route
  }

  protected deserialize(data: unknown): TModel {
    return data as TModel
  }

  protected serialize(body: unknown): unknown {
    return body ?? {}
  }

  async list<P extends BaseListParams = BaseListParams>(
    parameters: P = {} as P
  ): Promise<HydroServerCollection<TModel>> {
    const { fetchAll, ...rawQuery } = parameters
    const query = normalizeParams(rawQuery as Record<string, unknown>)
    const url = withQuery(this._route, query)

    if (fetchAll) {
      const allItems = await apiMethods.paginatedFetch(url)
      return new HydroServerCollection<TModel>({
        service: this,
        items: (allItems as unknown[]).map((item) => this.deserialize(item)),
        filters: removeKeys(query, ['page', 'pageSize', 'orderBy']),
        orderBy: (query.orderBy as string[]) ?? undefined,
        page: 1,
        pageSize: allItems.length,
        totalPages: 1,
        totalCount: allItems.length,
      })
    }

    const items = await apiMethods.fetch(url)
    return new HydroServerCollection<TModel>({
      service: this,
      items: (items as unknown[]).map((item) => this.deserialize(item)),
      filters: removeKeys(query, ['page', 'pageSize', 'orderBy']),
      orderBy: (query.orderBy as string[]) ?? undefined,
      page: undefined,
      pageSize: undefined,
      totalPages: undefined,
      totalCount: undefined,
    })
  }

  async get(id: string): Promise<TModel> {
    const url = `${this._route}/${encodeURIComponent(id)}`
    const json = await apiMethods.fetch(url)
    return this.deserialize(json)
  }

  async create(body: unknown): Promise<TModel> {
    const url = this._route
    const json = await apiMethods.post(url, body)
    return this.deserialize(json)
  }

  async update(
    id: string,
    body: unknown,
    originalBody?: unknown
  ): Promise<TModel> {
    const url = `${this._route}/${encodeURIComponent(id)}`
    const json = await apiMethods.patch(
      url,
      this.serialize(body),
      originalBody ?? null
    )
    return this.deserialize(json)
  }

  async delete(id: string): Promise<void> {
    const url = `${this._route}/${encodeURIComponent(id)}`
    await apiMethods.delete(url)
  }
}

/** Build a URL with query parameters. Arrays are comma-joined. null => "null". */
function withQuery(base: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return base
  const url = new URL(base, globalThis.location?.origin ?? undefined)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    if (value === null) {
      url.searchParams.set(key, 'null')
    } else if (Array.isArray(value)) {
      url.searchParams.set(key, value.map((v) => String(v)).join(','))
    } else {
      url.searchParams.set(key, String(value))
    }
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

const CAMEL_RE = /[A-Z]/g
const camelToSnake = (s: string) =>
  s.includes('_') ? s : s.replace(CAMEL_RE, (c) => `_${c.toLowerCase()}`)

function normalizeParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  const map: Record<string, string> = {
    pageSize: 'page_size',
    orderBy: 'order_by',
  }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    const key = map[k] ?? camelToSnake(k)
    out[key] = Array.isArray(v) ? v.join(',') : v
  }
  return out
}
