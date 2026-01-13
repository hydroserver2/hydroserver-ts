/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace EtlJobContract {
  export const route = 'etl-jobs' as const
  export type QueryParameters = {}
  export type SummaryResponse = never
  export type DetailResponse  = never
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
