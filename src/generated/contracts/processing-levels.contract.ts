/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace ProcessingLevelContract {
  export const route = 'processing-levels' as const
  export type SummaryResponse = Data.components['schemas']['ProcessingLevelSummaryResponse']
  export type PostBody = Data.components['schemas']['ProcessingLevelPostBody']
  export type PatchBody = Data.components['schemas']['ProcessingLevelPatchBody']
  export const writableKeys = ["code","definition","explanation"] as const
}
