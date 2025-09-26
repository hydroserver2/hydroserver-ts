/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace ProcessingLevelContract {
  export const route = 'processing-levels' as const
  export type QueryParameters = Data.components['schemas']['ProcessingLevelQueryParameters']
  export type SummaryResponse = Data.components['schemas']['ProcessingLevelSummaryResponse']
  export type DetailResponse  = Data.components['schemas']['ProcessingLevelDetailResponse']
  export type PostBody        = Data.components['schemas']['ProcessingLevelPostBody']
  export type PatchBody       = Data.components['schemas']['ProcessingLevelPatchBody']
  export type DeleteBody      = never
  export const writableKeys = ["code","definition","explanation"] as const
  export declare const __types: {
    SummaryResponse: SummaryResponse
    DetailResponse: DetailResponse
    PostBody: PostBody
    PatchBody: PatchBody
    DeleteBody: DeleteBody
    QueryParameters: QueryParameters
  }
}
