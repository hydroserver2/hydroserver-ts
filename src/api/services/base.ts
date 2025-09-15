import { apiMethods } from '../apiMethods'
import type { HydroServer } from '../HydroServer'
import { HydroServerCollection } from '../collections/base'

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

  async list(
    parameters: {
      page?: number
      pageSize?: number
      orderBy?: string[]
      fetchAll?: boolean
      [key: string]: unknown
    } = {}
  ): Promise<HydroServerCollection<TModel>> {
    const { fetchAll, ...query } = parameters
    const base = this.dataUrl()
    const url = withQuery(base, query)

    if (fetchAll) {
      // Uses your apiMethods.paginatedFetch which reads pagination headers for us.
      const allItems = await apiMethods.paginatedFetch(url)
      return new HydroServerCollection<TModel>({
        service: this,
        items: (allItems as unknown[]).map((item) => this.deserialize(item)),
        // When fetching all, we collapse to a single logical page.
        filters: removeKeys(query, ['page', 'pageSize', 'orderBy']),
        orderBy: (query.orderBy as string[]) ?? undefined,
        page: 1,
        pageSize: allItems.length,
        totalPages: 1,
        totalCount: allItems.length,
      })
    }

    // First page only. responseInterceptor returns parsed JSON (no headers).
    const items = await apiMethods.fetch(url)
    return new HydroServerCollection<TModel>({
      service: this,
      items: (items as unknown[]).map((item) => this.deserialize(item)),
      filters: removeKeys(query, ['page', 'pageSize', 'orderBy']),
      orderBy: (query.orderBy as string[]) ?? undefined,
      // No header access here; leave pagination metadata undefined.
      page: undefined,
      pageSize: undefined,
      totalPages: undefined,
      totalCount: undefined,
    })
  }

  async get(id: string): Promise<TModel> {
    const url = `${this.dataUrl()}/${encodeURIComponent(id)}`
    const json = await apiMethods.fetch(url)
    return this.deserialize(json)
  }

  async create(body: unknown): Promise<TModel> {
    const url = this.dataUrl()
    const json = await apiMethods.post(url, body)
    return this.deserialize(json)
  }

  async update(
    id: string,
    body: unknown,
    originalBody?: unknown
  ): Promise<TModel> {
    const url = `${this.dataUrl()}/${encodeURIComponent(id)}`
    const json = await apiMethods.patch(
      url,
      this.serialize(body),
      originalBody ?? null
    )
    return this.deserialize(json)
  }

  async delete(id: string): Promise<void> {
    const url = `${this.dataUrl()}/${encodeURIComponent(id)}`
    await apiMethods.delete(url)
  }

  protected dataUrl(): string {
    // HydroServer.baseRoute is something like `${host}/api/data`
    return `${this._client.baseRoute}/${this._route}`
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
