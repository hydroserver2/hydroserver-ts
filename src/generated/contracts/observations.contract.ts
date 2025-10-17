/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace ObservationContract {
  export const route = 'observations' as const
  export type QueryParameters = Data.components['schemas']['ObservationQueryParameters']
  export type SummaryResponse = Data.components['schemas']['ObservationSummaryResponse']
  export type DetailResponse  = Data.components['schemas']['ObservationDetailResponse']
  export type PostBody        = Data.components['schemas']['ObservationPostBody']
  export type PatchBody       = Data.components['schemas']['ObservationPatchBody']
  export type DeleteBody      = never
  export const writableKeys = ["phenomenonTime","result"] as const
  export declare const __types: {
    SummaryResponse: SummaryResponse
    DetailResponse: DetailResponse
    PostBody: PostBody
    PatchBody: PatchBody
    DeleteBody: DeleteBody
    QueryParameters: QueryParameters
  }
}
