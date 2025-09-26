/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace SensorContract {
  export const route = 'sensors' as const
  export type QueryParameters = Data.components['schemas']['SensorQueryParameters']
  export type SummaryResponse = Data.components['schemas']['SensorSummaryResponse']
  export type DetailResponse  = Data.components['schemas']['SensorDetailResponse']
  export type PostBody        = Data.components['schemas']['SensorPostBody']
  export type PatchBody       = Data.components['schemas']['SensorPatchBody']
  export const writableKeys = ["name","description","encodingType","manufacturer","model","modelLink","methodType","methodLink","methodCode"] as const
}
