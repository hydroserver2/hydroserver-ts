import type { HydroServerBaseService } from '../services/base'

export class HydroServerCollection<TItem> {
  items: TItem[] = []
  filters?: Record<string, unknown>
  orderBy?: string[]
  page?: number | null
  pageSize?: number | null
  totalPages?: number | null
  totalCount?: number | null

  protected serviceInstance?: HydroServerBaseService<TItem>

  constructor(parameters: {
    service?: HydroServerBaseService<TItem>
    items?: TItem[]
    filters?: Record<string, unknown>
    orderBy?: string[]
    page?: number | null
    pageSize?: number | null
    totalPages?: number | null
    totalCount?: number | null
  }) {
    Object.assign(this, parameters)
    this.items = parameters.items ?? []
    this.serviceInstance = parameters.service
  }

  get service(): HydroServerBaseService<TItem> | undefined {
    return this.serviceInstance
  }

  async nextPage(): Promise<HydroServerCollection<TItem>> {
    if (!this.serviceInstance)
      throw new Error('Pagination not enabled for this collection.')
    const currentPage = this.page ?? 1
    const size = this.pageSize ?? 100
    return this.serviceInstance.list({
      ...(this.filters ?? {}),
      page: currentPage + 1,
      pageSize: size,
      orderBy: this.orderBy,
    })
  }

  async previousPage(): Promise<HydroServerCollection<TItem> | null> {
    if (!this.serviceInstance)
      throw new Error('Pagination not enabled for this collection.')
    const currentPage = this.page ?? 1
    if (currentPage <= 1) return null
    const size = this.pageSize ?? 100
    return this.serviceInstance.list({
      ...(this.filters ?? {}),
      page: currentPage - 1,
      pageSize: size,
      orderBy: this.orderBy,
    })
  }

  async fetchAll(): Promise<HydroServerCollection<TItem>> {
    if (!this.serviceInstance)
      throw new Error('Pagination not enabled for this collection.')

    const first = this
    const allItems: TItem[] = [...first.items]

    // Simple loop: keep asking nextPage() until empty or until page stops advancing.
    let next = await this.nextPage()
    while (next.items.length) {
      allItems.push(...next.items)
      // advance
      // if next.page is undefined, we cannot advance safely; break
      if (next.page == null) break
      next = await next.nextPage()
    }

    return new HydroServerCollection<TItem>({
      service: this.serviceInstance,
      items: allItems,
      filters: first.filters,
      orderBy: first.orderBy,
      page: 1,
      pageSize: allItems.length,
      totalPages: 1,
      totalCount: allItems.length,
    })
  }
}
