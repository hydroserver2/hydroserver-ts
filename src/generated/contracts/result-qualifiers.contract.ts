/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace ResultQualifierContract {
  export const route = 'result-qualifiers' as const
  export type QueryParameters = Data.components['schemas']['ResultQualifierQueryParameters']
  export type SummaryResponse = Data.components['schemas']['ResultQualifierSummaryResponse']
  export type DetailResponse  = Data.components['schemas']['ResultQualifierDetailResponse']
  export type PostBody        = Data.components['schemas']['ResultQualifierPostBody']
  export type PatchBody       = Data.components['schemas']['ResultQualifierPatchBody']
  export type DeleteBody      = never
  export const writableKeys = ["code","description"] as const
  export declare const __types: {
    SummaryResponse: SummaryResponse
    DetailResponse: DetailResponse
    PostBody: PostBody
    PatchBody: PatchBody
    DeleteBody: DeleteBody
    QueryParameters: QueryParameters
  }
}
