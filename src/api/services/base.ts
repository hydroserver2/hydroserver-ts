import { apiMethods } from '../apiMethods'
import type { HydroServer } from '../HydroServer'
import { HydroServerCollection } from '../collections/base'
import type {
  ListResult,
  ItemResult,
  VoidResult,
  ItemOk,
  ItemErr,
} from '../result'
import { ApiResponse } from '../responseInterceptor'

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

export type QueryParamsOf<C extends ApiContract> =
  C['__types']['QueryParameters']
export type WritableKeysOf<C extends ApiContract> = C['writableKeys']

export type ServiceClass<C extends ApiContract, M extends { id: string }> = {
  new (client: HydroServer): HydroServerBaseService<C, M>
  route: string
  writableKeys: string[]
  Model: new () => M
}

export type Handle<M, TPayload extends M> = TPayload & {
  save(patch?: Partial<M>): Promise<Handle<M, TPayload>>
  delete(): Promise<void>
}

export abstract class HydroServerBaseService<
  C extends ApiContract,
  M extends { id: string }
> {
  protected _client: HydroServer
  protected _route: string
  protected _writableKeys: readonly string[]
  private _ModelCtor: new () => M

  constructor(client: HydroServer) {
    this._client = client
    const ctor = this.constructor as ServiceClass<C, M>
    this._route = `${client.baseRoute}/${ctor.route}`
    this._writableKeys = (ctor.writableKeys ?? []) as readonly string[]
    this._ModelCtor = ctor.Model
  }

  protected serialize(body: M): unknown {
    return body ?? {}
  }

  protected deserialize(model: M): M {
    const m = new this._ModelCtor()
    Object.assign(m as any, model)
    return m
  }

  protected prepareListParams(params: QueryParamsOf<C>): QueryParamsOf<C> {
    return params
  }

  // protected makeHandle<TPayload extends M>(raw: TPayload): Handle<C, TPayload> {
  //   const id = (raw as any).id
  //   if (!id) throw new Error('Server object is missing id')

  //   let snapshot: Record<string, unknown> = { ...(raw as any) }

  //   const obj: any = { ...(raw as any) }

  //   // Non-enumerable helpers so JSON.stringify(data) stays clean.
  //   Object.defineProperties(obj, {
  //     save: {
  //       enumerable: false,
  //       writable: false,
  //       value: async (patch?: Record<string, unknown>) => {
  //         const url = `${this._route}/${encodeURIComponent(String(id))}`
  //         const res = await apiMethods.patch(url, patch, snapshot)
  //         // Update object and snapshot with server truth
  //         const next = res.data as Record<string, unknown>
  //         for (const k of Object.keys(obj)) delete obj[k]
  //         Object.assign(obj, next)
  //         snapshot = { ...next }
  //         return obj as Handle<M>
  //       },
  //     },
  //     delete: {
  //       enumerable: false,
  //       writable: false,
  //       value: async () => {
  //         const url = `${this._route}/${encodeURIComponent(String(id))}`
  //         await apiMethods.delete(url)
  //       },
  //     },
  //   })

  //   return obj as Handle<C, TPayload>
  // }

  async list(
    params: Partial<QueryParamsOf<C>> & {
      fetch_all?: boolean
    } = {} as Partial<QueryParamsOf<C>>
  ): Promise<ListResult<M>> {
    const { fetch_all, ...query } = params

    const serverQuery = query as Record<string, unknown>
    const url = withQuery(this._route, serverQuery)

    try {
      if (fetch_all) {
        const json = await apiMethods.paginatedFetch(url)
        const items = json.data.map((row: M) => this.deserialize(row))

        const collection = new HydroServerCollection<M>({
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
          items: collection.items,
          collection,
        }
      }

      // Single page (no headers available via apiMethods.fetch)
      const json = await apiMethods.fetch(url)
      const items = json.data.map((row: M) => this.deserialize(row))
      const collection = new HydroServerCollection<M>({
        service: this,
        items,
        filters: removeKeys(serverQuery, ['page', 'page_size', 'order_by']),
        orderBy: toStringArray(serverQuery['order_by']),
      })

      return {
        kind: 'list',
        ok: true,
        status: json.status,
        message: json.message,
        items: collection.items,
        collection,
      }
    } catch (err) {
      return this.listErr(err)
    }
  }

  async get(
    id: string,
    params?: {
      expand_related: boolean
    }
  ): Promise<ItemOk<M> | ItemErr> {
    const route = `${this._route}/${encodeURIComponent(id)}`
    const url = withQuery(route, params)
    try {
      const json = await apiMethods.fetch(url)
      return this.createItemOK(json)
    } catch (err) {
      return itemErr(err)
    }
  }

  async create(body: M): Promise<ItemResult<M>> {
    const url = this._route
    try {
      const json = await apiMethods.post(url, this.serialize(body))
      const item = this.deserialize(json.data)
      return {
        kind: 'item',
        ok: true,
        status: json.status,
        message: json.message,
        item,
      }
    } catch (err) {
      return itemErr(err)
    }
  }

  async update(
    body: Partial<M> & Pick<M, 'id'>,
    originalBody?: Partial<M> & Pick<M, 'id'>
  ): Promise<ItemResult<M>> {
    const url = `${this._route}/${encodeURIComponent(body.id)}`
    try {
      const json = await apiMethods.patch(url, body, originalBody ?? null)
      const item = this.deserialize(json.data as M)
      return {
        kind: 'item',
        ok: true,
        status: json.status,
        message: json.message,
        item,
      }
    } catch (err) {
      return itemErr(err)
    }
  }

  async delete(id: string): Promise<VoidResult> {
    const url = `${this._route}/${encodeURIComponent(id)}`
    try {
      const json = await apiMethods.delete(url)
      return {
        kind: 'none',
        ok: true,
        status: json.status,
        message: json.message,
      }
    } catch (err) {
      return voidErr(err)
    }
  }

  async listItems(
    params?: Partial<QueryParamsOf<C>> & { fetch_all?: boolean }
  ) {
    const res = await this.list(params as any)
    return res.ok ? res.items : []
  }

  async listAllItems(params?: Partial<QueryParamsOf<C>>) {
    return this.listItems({ ...(params as any), fetch_all: true })
  }

  async getItem(
    id: string,
    params?: {
      expand_related: boolean
    }
  ) {
    const res = await this.get(id, params)
    return res.ok ? res.item : null
  }

  createItemOK(apiResponse: ApiResponse): ItemResult<any> {
    const item = this.deserialize(apiResponse.data)
    return {
      kind: 'item',
      ok: true,
      status: apiResponse.status,
      message: apiResponse.message,
      item,
    }
  }

  listErr(apiError: unknown): ListResult<any> {
    const err = apiError as Partial<ApiResponse>
    return {
      kind: 'list',
      ok: false,
      items: [],
      collection: null,
      status: typeof err.status === 'number' ? err.status : 0,
      message: err.message ?? 'Request failed',
    }
  }
}

/* ---------------------------- helpers ---------------------------- */

export function itemErr(apiError: unknown): ItemResult<any> {
  const err = apiError as Partial<ApiResponse>
  return {
    kind: 'item',
    ok: false,
    status: typeof err.status === 'number' ? err.status : 0,
    message: err.message ?? 'Request failed',
  }
}

export function voidErr(apiError: unknown): VoidResult {
  const err = apiError as Partial<ApiResponse>
  return {
    kind: 'none',
    ok: false,
    status: typeof err.status === 'number' ? err.status : 0,
    message: err.message ?? 'Request failed',
  }
}

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
