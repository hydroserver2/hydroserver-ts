/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace ThingContract {
  export const route = 'things' as const
  export type SummaryResponse = Data.components['schemas']['ThingSummaryResponse']
  export type PostBody = Data.components['schemas']['ThingPostBody']
  export type PatchBody = Data.components['schemas']['ThingPatchBody']
  export const writableKeys = ["name","description","samplingFeatureType","samplingFeatureCode","siteType","dataDisclaimer","isPrivate","location"] as const
}
