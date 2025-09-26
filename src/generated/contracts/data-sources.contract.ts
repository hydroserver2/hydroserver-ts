/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace DataSourceContract {
  export const route = 'data-sources' as const
  export type QueryParameters = {}
  export type SummaryResponse = Data.components['schemas']['DataSourceSummaryResponse']
  export type DetailResponse  = Data.components['schemas']['DataSourceDetailResponse']
  export type PostBody        = Data.components['schemas']['DataSourcePostBody']
  export type PatchBody       = Data.components['schemas']['DataSourcePatchBody']
  export const writableKeys = ["name","settings","orchestrationSystemId","schedule","status"] as const
}
