/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/etl.openapi.json */
import type * as Data from '../etl.types'

export namespace OrchestrationSystemContract {
  export const route = 'orchestration-systems' as const
  export type QueryParameters = Data.components['schemas']['OrchestrationSystemQueryParameters']
  export type SummaryResponse = Data.components['schemas']['OrchestrationSystemSummaryResponse']
  export type DetailResponse  = Data.components['schemas']['OrchestrationSystemDetailResponse']
  export type PostBody        = Data.components['schemas']['OrchestrationSystemPostBody']
  export type PatchBody       = Data.components['schemas']['OrchestrationSystemPatchBody']
  export type DeleteBody      = never
  export const writableKeys = ["name","type"] as const
  export declare const __types: {
    SummaryResponse: SummaryResponse
    DetailResponse: DetailResponse
    PostBody: PostBody
    PatchBody: PatchBody
    DeleteBody: DeleteBody
    QueryParameters: QueryParameters
  }
}
