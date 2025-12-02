/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/etl.openapi.json */
import type * as Data from '../etl.types'

export namespace TaskContract {
  export const route = 'tasks' as const
  export type QueryParameters = Data.components['schemas']['TaskQueryParameters']
  export type SummaryResponse = Data.components['schemas']['TaskSummaryResponse']
  export type DetailResponse  = Data.components['schemas']['TaskDetailResponse']
  export type PostBody        = Data.components['schemas']['TaskPostBody']
  export type PatchBody       = Data.components['schemas']['TaskPatchBody']
  export type DeleteBody      = never
  export const writableKeys = ["name","paused","nextRunAt","extractorVariables","transformerVariables","loaderVariables","jobId","orchestrationSystemId","schedule","mappings"] as const
  export declare const __types: {
    SummaryResponse: SummaryResponse
    DetailResponse: DetailResponse
    PostBody: PostBody
    PatchBody: PatchBody
    DeleteBody: DeleteBody
    QueryParameters: QueryParameters
  }
}
