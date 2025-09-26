/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace DataArchiveContract {
  export const route = 'data-archives' as const
  export type SummaryResponse = Data.components['schemas']['DataArchiveSummaryResponse']
  export type PostBody = Data.components['schemas']['DataArchivePostBody']
  export type PatchBody = Data.components['schemas']['DataArchivePatchBody']
  export const writableKeys = ["name","settings","orchestrationSystemId","schedule","status"] as const
}
