/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/etl.openapi.json */
import type * as Data from '../etl.types'

export namespace JobContract {
  export const route = 'jobs' as const
  export type QueryParameters = Data.components['schemas']['JobQueryParameters']
  export type SummaryResponse = Data.components['schemas']['JobSummaryResponse']
  export type DetailResponse  = Data.components['schemas']['JobDetailResponse']
  export type PostBody        = Data.components['schemas']['JobPostBody']
  export type PatchBody       = Data.components['schemas']['JobPatchBody']
  export type DeleteBody      = never
  export const writableKeys = ["name","type","extractor","transformer","loader"] as const
  export declare const __types: {
    SummaryResponse: SummaryResponse
    DetailResponse: DetailResponse
    PostBody: PostBody
    PatchBody: PatchBody
    DeleteBody: DeleteBody
    QueryParameters: QueryParameters
  }
}
