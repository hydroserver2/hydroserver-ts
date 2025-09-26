/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace DatastreamContract {
  export const route = 'datastreams' as const
  export type SummaryResponse = Data.components['schemas']['DatastreamSummaryResponse']
  export type PostBody = Data.components['schemas']['DatastreamPostBody']
  export type PatchBody = Data.components['schemas']['DatastreamPatchBody']
  export const writableKeys = ["dataSourceId","thingId","sensorId","observedPropertyId","processingLevelId","unitId","name","description","observationType","sampledMedium","noDataValue","aggregationStatistic","timeAggregationInterval","status","resultType","valueCount","phenomenonBeginTime","phenomenonEndTime","resultBeginTime","resultEndTime","isPrivate","isVisible","timeAggregationIntervalUnit","intendedTimeSpacing","intendedTimeSpacingUnit"] as const
}
