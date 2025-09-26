/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace ResultQualifierContract {
  export const route = 'result-qualifiers' as const
  export type SummaryResponse = Data.components['schemas']['ResultQualifierSummaryResponse']
  export type PostBody = Data.components['schemas']['ResultQualifierPostBody']
  export type PatchBody = Data.components['schemas']['ResultQualifierPatchBody']
  export const writableKeys = ["code","description"] as const
}
