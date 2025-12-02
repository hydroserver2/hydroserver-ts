/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace EtlTaskContract {
  export const route = 'etl-tasks' as const
  export type QueryParameters = {}
  export type SummaryResponse = Data.components['schemas']['TaskMappingPathResponse']
  export type DetailResponse  = Data.components['schemas']['TaskMappingPathResponse']
  export type PostBody        = Data.components['schemas']['TaskPostBody']
  export type PatchBody       = Data.components['schemas']['TaskPatchBody']
  export type DeleteBody      = never
  export const writableKeys = ["name","extractorVariables","transformerVariables","loaderVariables","jobId","orchestrationSystemId","schedule","mappings"] as const
  export declare const __types: {
    SummaryResponse: SummaryResponse
    DetailResponse: DetailResponse
    PostBody: PostBody
    PatchBody: PatchBody
    DeleteBody: DeleteBody
    QueryParameters: QueryParameters
  }
}
