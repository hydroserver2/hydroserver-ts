/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/auth.openapi.json */
import type * as Data from '../auth.types'

export namespace AccountContract {
  export const route = 'account' as const
  export type QueryParameters = {}
  export type SummaryResponse = never
  export type DetailResponse  = Data.components['schemas']['AccountDetailResponse']
  export type PostBody        = Data.components['schemas']['AccountPostBody']
  export type PatchBody       = Data.components['schemas']['AccountPatchBody']
  export type DeleteBody      = never
  export const writableKeys = ["phone","address","link","type","firstName","middleName","lastName","organization"] as const
  export declare const __types: {
    SummaryResponse: SummaryResponse
    DetailResponse: DetailResponse
    PostBody: PostBody
    PatchBody: PatchBody
    DeleteBody: DeleteBody
    QueryParameters: QueryParameters
  }
}
