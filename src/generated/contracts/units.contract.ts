/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace UnitContract {
  export const route = 'units' as const
  export type SummaryResponse = Data.components['schemas']['UnitSummaryResponse']
  export type PostBody = Data.components['schemas']['UnitPostBody']
  export type PatchBody = Data.components['schemas']['UnitPatchBody']
  export const writableKeys = ["name","symbol","definition","type"] as const
}
