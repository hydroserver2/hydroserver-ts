/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace OrchestrationSystemContract {
  export const route = 'orchestration-systems' as const
  export type SummaryResponse = Data.components['schemas']['OrchestrationSystemSummaryResponse']
  export type PostBody = Data.components['schemas']['OrchestrationSystemPostBody']
  export type PatchBody = Data.components['schemas']['OrchestrationSystemPatchBody']
  export const writableKeys = ["name","type"] as const
}
