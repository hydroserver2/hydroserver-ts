/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace ObservedPropertyContract {
  export const route = 'observed-properties' as const
  export type QueryParameters = Data.components['schemas']['ObservedPropertyQueryParameters']
  export type SummaryResponse = Data.components['schemas']['ObservedPropertySummaryResponse']
  export type DetailResponse  = Data.components['schemas']['ObservedPropertyDetailResponse']
  export type PostBody        = Data.components['schemas']['ObservedPropertyPostBody']
  export type PatchBody       = Data.components['schemas']['ObservedPropertyPatchBody']
  export const writableKeys = ["name","definition","description","type","code"] as const
}
