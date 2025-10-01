import { apiMethods } from '../apiMethods'
import type { HydroServer } from '../HydroServer'
import { HydroServerCollection } from '../collections/base'
import type { ListResult, ItemResult, VoidResult, Meta } from '../result'
import { ApiError } from '../responseInterceptor'

export type ApiTypes = {
  SummaryResponse: unknown
  DetailResponse: unknown
  PostBody: unknown
  PatchBody: unknown
  DeleteBody: unknown
  QueryParameters: Record<string, unknown>
}

export type ApiContract = {
  route: string
  writableKeys: readonly string[]
  __types: ApiTypes
}

// Convenience type helpers
export type SummaryOf<C extends ApiContract> = C['__types']['SummaryResponse']
export type DetailOf<C extends ApiContract> = C['__types']['DetailResponse']
export type PostOf<C extends ApiContract> = C['__types']['PostBody']
export type PatchOf<C extends ApiContract> = C['__types']['PatchBody']
export type DeleteOf<C extends ApiContract> = C['__types']['DeleteBody']
export type QueryParamsOf<C extends ApiContract> =
  C['__types']['QueryParameters']
export type WritableKeysOf<C extends ApiContract> = C['writableKeys']

export type ServiceClass<C extends ApiContract> = {
  new (client: HydroServer): HydroServerBaseService<C>
  route: string
  writableKeys: string[]
}

type WithExpand<C extends ApiContract, T extends boolean> = Omit<
  Partial<QueryParamsOf<C>>,
  'expand_related'
> & {
  expand_related?: T
  fetch_all?: boolean
}

type ItemParams<C extends ApiContract, T extends boolean> = Omit<
  WithExpand<C, T>,
  'fetch_all'
>

export type Handle<
  C extends ApiContract,
  TPayload extends SummaryOf<C> | DetailOf<C> = SummaryOf<C>
> = TPayload & {
  save(patch?: Partial<PatchOf<C>>): Promise<Handle<C, TPayload>>
  delete(): Promise<void>
}

export abstract class HydroServerBaseService<C extends ApiContract> {
  protected _client: HydroServer
  protected _route: string
  protected _writableKeys: readonly string[]

  constructor(client: HydroServer) {
    this._client = client
    const ctor = this.constructor as ServiceClass<C>
    this._route = `${client.baseRoute}/${ctor.route}`
    this._writableKeys = (ctor.writableKeys ?? []) as readonly string[]
  }

  protected serialize(body: SummaryOf<C>): unknown {
    return body ?? {}
  }

  protected prepareListParams(params: QueryParamsOf<C>): QueryParamsOf<C> {
    return params
  }

  protected makeHandle<TPayload extends SummaryOf<C> | DetailOf<C>>(
    raw: TPayload
  ): Handle<C, TPayload> {
    const id = (raw as any).id
    if (!id) throw new Error('Server object is missing id')

    // Maintain a snapshot for diffing when save() is called without an explicit patch.
    let snapshot: Record<string, unknown> = { ...(raw as any) }

    // Create a live object carrying the server fields.
    const obj: any = { ...(raw as any) }

    // Non-enumerable helpers so JSON.stringify(data) stays clean.
    Object.defineProperties(obj, {
      save: {
        enumerable: false,
        writable: false,
        value: async (patch?: Record<string, unknown>) => {
          const url = `${this._route}/${encodeURIComponent(String(id))}`
          const res = await apiMethods.patch(url, patch, snapshot)
          // Update object and snapshot with server truth
          const next = res.data as Record<string, unknown>
          for (const k of Object.keys(obj)) delete obj[k]
          Object.assign(obj, next)
          snapshot = { ...next }
          return obj as Handle<C>
        },
      },
      delete: {
        enumerable: false,
        writable: false,
        value: async () => {
          const url = `${this._route}/${encodeURIComponent(String(id))}`
          await apiMethods.delete(url)
        },
      },
    })

    return obj as Handle<C, TPayload>
  }

  async list(
    params: WithExpand<C, true>
  ): Promise<ListResult<Handle<C, DetailOf<C>>>>
  async list(
    params?: WithExpand<C, false> // false or omitted
  ): Promise<ListResult<Handle<C, SummaryOf<C>>>>

  async list(
    params: Partial<QueryParamsOf<C>> & {
      fetch_all?: boolean
    } = {} as Partial<QueryParamsOf<C>>
  ): Promise<ListResult<SummaryOf<C> | DetailOf<C>>> {
    const { fetch_all, ...query } = params
    const wantsDetail = params.expand_related === true

    const serverQuery = query as Record<string, unknown>
    const url = withQuery(this._route, serverQuery)
    const startedAt = performance.now()

    try {
      if (fetch_all) {
        const json = await apiMethods.paginatedFetch(url)

        const items = (
          wantsDetail
            ? (json.data as DetailOf<C>[])
            : (json.data as SummaryOf<C>[])
        ).map((row) =>
          wantsDetail
            ? this.makeHandle<DetailOf<C>>(row as DetailOf<C>)
            : this.makeHandle<SummaryOf<C>>(row as SummaryOf<C>)
        )

        const collection = new HydroServerCollection<SummaryOf<C>>({
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
      const rows = wantsDetail
        ? (json.data as DetailOf<C>[])
        : (json.data as SummaryOf<C>[])
      const items = rows.map((row) =>
        wantsDetail
          ? this.makeHandle<DetailOf<C>>(row as DetailOf<C>)
          : this.makeHandle<SummaryOf<C>>(row as SummaryOf<C>)
      )
      const collection = new HydroServerCollection<SummaryOf<C>>({
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

  async get(
    id: string,
    params: ItemParams<C, true>
  ): Promise<ItemResult<Handle<C, DetailOf<C>>>>
  async get(
    id: string,
    params?: ItemParams<C, false> // false or omitted
  ): Promise<ItemResult<Handle<C, SummaryOf<C>>>>

  async get(id: string) {
    const url = `${this._route}/${encodeURIComponent(id)}`
    const startedAt = performance.now()
    try {
      const json = await apiMethods.fetch(url)
      const item = this.makeHandle(json)
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

  async create(body: PostOf<C>): Promise<ItemResult<SummaryOf<C>>> {
    const url = this._route
    const startedAt = performance.now()
    try {
      const json = await apiMethods.post(url, this.serialize(body))
      const item = this.makeHandle(json)
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

  async update(
    id: string,
    body: PatchOf<C>,
    originalBody?: PatchOf<C>
  ): Promise<ItemResult<SummaryOf<C>>> {
    const url = `${this._route}/${encodeURIComponent(id)}`
    const startedAt = performance.now()
    try {
      const json = await apiMethods.patch(
        url,
        this.serialize(body),
        originalBody ?? null
      )
      const item = this.makeHandle(json)
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

  async listItems(
    params: WithExpand<C, true>
  ): Promise<Handle<C, DetailOf<C>>[]>
  async listItems(
    params?: WithExpand<C, false>
  ): Promise<Handle<C, SummaryOf<C>>[]>
  async listItems(
    params?: Partial<QueryParamsOf<C>> & { fetch_all?: boolean }
  ) {
    const res = await this.list(params as any)
    return res.ok ? res.items : []
  }

  async listAllItems(
    params: Omit<WithExpand<C, true>, 'fetch_all'>
  ): Promise<Handle<C, DetailOf<C>>[]>
  async listAllItems(
    params?: Omit<WithExpand<C, false>, 'fetch_all'>
  ): Promise<Handle<C, SummaryOf<C>>[]>
  async listAllItems(params?: QueryParamsOf<C>) {
    return this.listItems({ ...(params as any), fetch_all: true })
  }

  async getItem(id: string) {
    const res = await this.get(id)
    return res.ok ? res.item : null
  }

  newForm(overrides?: Partial<PostOf<C>>): PostOf<C> {
    return { ...(overrides ?? {}) } as PostOf<C>
  }

  getFormFrom(
    payload: SummaryOf<C> | DetailOf<C>,
    overrides?: Partial<PatchOf<C>>
  ): PatchOf<C> {
    const src = payload as Record<string, unknown>
    const allowed = new Set(this._writableKeys as readonly string[])

    const base: Record<string, unknown> = {}
    for (const k of allowed) {
      if (k in src) base[k] = src[k]
    }

    return { ...base, ...(overrides ?? {}) } as PatchOf<C>
  }
}

/* ---------------------------- helpers ---------------------------- */

export function makeMeta(
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

export function listErr(
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

export function itemErr(
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

export function voidErr(
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

/** Build a URL with query parameters. */
export function withQuery(
  base: string,
  params?: Record<string, unknown>
): string {
  if (!params || Object.keys(params).length === 0) return base
  const url = new URL(base, globalThis.location?.origin ?? undefined)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

export function removeKeys<T extends Record<string, unknown>>(
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
