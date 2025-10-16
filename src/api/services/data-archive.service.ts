import { HydroServerBaseService } from './base'
import type { HydroShareArchive as M } from '../../types'
import { DataArchiveContract as C } from '../../generated/contracts'

export class DataArchiveService extends HydroServerBaseService<typeof C, M> {
  static route = C.route
  static writableKeys = C.writableKeys

  /* ---------------- Standard collection surface ---------------- */

  // listByWorkspace(workspaceId: string, params = {}) {
  //   return this.list({ ...params, workspaceId })
  // }

  // listByThing(thingId: string, params = {}) {
  //   return this.list({ ...params, thing_id: thingId })
  // }

  // async getForThing(thingId: string): Promise<ItemResult<DataArchiveModel>> {
  //   const startedAt = performance.now()
  //   const url = `${this._thingsRoute}/${encodeURIComponent(thingId)}/archive`
  //   try {
  //     const res = await apiMethods.fetch(url)
  //     const item = this.deserialize(res.data)
  //     return {
  //       kind: 'item',
  //       ok: true,
  //       status: res.status,
  //       message: res.message,
  //       item,
  //       meta: makeMeta('GET', url, startedAt, performance.now() - startedAt, 0),
  //     }
  //   } catch (e: any) {
  //     return itemErr('GET', url, startedAt, e)
  //   }
  // }

  // async createForThing(
  //   thingId: string,
  //   body: PostHydroShareArchive | Partial<HydroShareArchive>
  // ): Promise<ItemResult<DataArchiveModel>> {
  //   const startedAt = performance.now()
  //   const url = `${this._thingsRoute}/${encodeURIComponent(thingId)}/archive`
  //   try {
  //     const res = await apiMethods.post(url, body)
  //     const item = this.deserialize(res.data)
  //     return {
  //       kind: 'item',
  //       ok: true,
  //       status: res.status,
  //       message: res.message,
  //       item,
  //       meta: makeMeta(
  //         'POST',
  //         url,
  //         startedAt,
  //         performance.now() - startedAt,
  //         0
  //       ),
  //     }
  //   } catch (e: any) {
  //     return itemErr('POST', url, startedAt, e)
  //   }
  // }

  // async updateForThing(
  //   thingId: string,
  //   body: Partial<HydroShareArchive>,
  //   originalBody?: Partial<HydroShareArchive>
  // ): Promise<ItemResult<DataArchiveModel>> {
  //   const startedAt = performance.now()
  //   const url = `${this._thingsRoute}/${encodeURIComponent(thingId)}/archive`
  //   try {
  //     const res = await apiMethods.patch(url, body, originalBody ?? null)
  //     const item = this.deserialize(res.data)
  //     return {
  //       kind: 'item',
  //       ok: true,
  //       status: res.status,
  //       message: res.message,
  //       item,
  //       meta: makeMeta(
  //         'PATCH',
  //         url,
  //         startedAt,
  //         performance.now() - startedAt,
  //         0
  //       ),
  //     }
  //   } catch (e: any) {
  //     return itemErr('PATCH', url, startedAt, e)
  //   }
  // }

  // async deleteForThing(thingId: string): Promise<VoidResult> {
  //   const startedAt = performance.now()
  //   const url = `${this._thingsRoute}/${encodeURIComponent(thingId)}/archive`
  //   try {
  //     const res = await apiMethods.delete(url)
  //     return {
  //       kind: 'none',
  //       ok: true,
  //       status: res.status,
  //       message: res.message,
  //       meta: makeMeta(
  //         'DELETE',
  //         url,
  //         startedAt,
  //         performance.now() - startedAt,
  //         0
  //       ),
  //     }
  //   } catch (e: any) {
  //     return voidErr('DELETE', url, startedAt, e)
  //   }
  // }

  // async triggerForThing(thingId: string): Promise<VoidResult> {
  //   const startedAt = performance.now()
  //   const url = `${this._thingsRoute}/${encodeURIComponent(
  //     thingId
  //   )}/archive/trigger`
  //   try {
  //     const res = await apiMethods.post(url, {})
  //     return {
  //       kind: 'none',
  //       ok: true,
  //       status: res.status,
  //       message: res.message || 'Archive triggered',
  //       meta: makeMeta(
  //         'POST',
  //         url,
  //         startedAt,
  //         performance.now() - startedAt,
  //         0
  //       ),
  //     }
  //   } catch (e: any) {
  //     return voidErr('POST', url, startedAt, e)
  //   }
  // }
}
