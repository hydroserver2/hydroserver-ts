import type { HydroServerBaseService, BaseListParams } from '../services/base'

type FetchResponse = { json: unknown; headers: Headers }

export class HydroServerCollection<TModel> {
  readonly items: TModel[]
  readonly filters?: Record<string, unknown>
  readonly orderBy?: string[]
  readonly page?: number
  readonly pageSize?: number
  readonly totalPages?: number
  readonly totalCount?: number

  private _service: HydroServerBaseService<TModel>

  constructor(opts: {
    service: HydroServerBaseService<TModel>
    items?: TModel[]
    response?: FetchResponse
    filters?: Record<string, unknown>
    orderBy?: string[]
    page?: number
    pageSize?: number
    totalPages?: number
    totalCount?: number
  }) {
    this._service = opts.service

    this.items = opts.items ?? []
    this.filters = opts.filters
    this.orderBy = opts.orderBy

    const h = opts.response?.headers
    this.page = opts.page ?? (h ? intOrNull(h.get('X-Page')) : undefined)
    this.pageSize =
      opts.pageSize ?? (h ? intOrNull(h.get('X-Page-Size')) : undefined)
    this.totalPages =
      opts.totalPages ?? (h ? intOrNull(h.get('X-Total-Pages')) : undefined)
    this.totalCount =
      opts.totalCount ?? (h ? intOrNull(h.get('X-Total-Count')) : undefined)
  }

  get service(): HydroServerBaseService<TModel> {
    return this._service
  }

  async nextPage() {
    if (!this.page || !this.pageSize) return null
    return this._service.list({
      ...(this.filters ?? {}),
      orderBy: this.orderBy,
      page: this.page + 1,
      pageSize: this.pageSize,
    } as BaseListParams)
  }

  async previousPage() {
    if (!this.page || this.page <= 1 || !this.pageSize) return null
    return this._service.list({
      ...(this.filters ?? {}),
      orderBy: this.orderBy,
      page: this.page - 1,
      pageSize: this.pageSize,
    } as BaseListParams)
  }
}

function intOrNull(v: string | null): number | undefined {
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
