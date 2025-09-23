import type { Datastream } from '../../types'
import type { HydroServer } from '../HydroServer'
import type {
  DatastreamService,
  DatastreamObservationsParams,
} from '../services/datastream.service'
import { HydroServerBaseModel } from './base'
import type { ApiResponse } from '../responseInterceptor'

/**
 * Rich Datastream instance with instance methods that delegate to DatastreamService.
 */
export class DatastreamModel
  extends HydroServerBaseModel<Datastream, DatastreamService>
  implements Datastream
{
  // --- Datastream fields (declare keeps TS strict + intellisense clean) ---
  declare id: string
  declare workspaceId: string
  declare name: string
  declare description: string
  declare thingId: string
  declare observationType: string
  declare resultType?: string
  declare status?: string
  declare sampledMedium: string
  declare noDataValue: number
  declare aggregationStatistic: string
  declare unitId: string
  declare observedPropertyId: string
  declare sensorId: string
  declare processingLevelId: string
  declare isPrivate: boolean
  declare isVisible: boolean
  declare phenomenonBeginTime?: string | null
  declare phenomenonEndTime?: string | null
  declare intendedTimeSpacing?: number
  declare intendedTimeSpacingUnit?: Datastream['intendedTimeSpacingUnit']
  declare timeAggregationInterval: number | null
  declare timeAggregationIntervalUnit: Datastream['timeAggregationIntervalUnit']
  declare dataSourceId?: string | null
  declare valueCount: number

  constructor(
    client: HydroServer,
    service: DatastreamService,
    serverData: Datastream
  ) {
    super({ client, service, serverData })
  }

  protected override hydrate(serverData: Datastream): void {
    Object.assign(this, serverData)
    this._serverData = { ...serverData }
  }

  /** Fields we allow PATCHing via save(). */
  protected override editableFields(): (keyof Datastream)[] {
    return [
      'name',
      'description',
      'observationType',
      'resultType',
      'status',
      'sampledMedium',
      'noDataValue',
      'aggregationStatistic',
      'unitId',
      'observedPropertyId',
      'sensorId',
      'processingLevelId',
      'isPrivate',
      'isVisible',
      'intendedTimeSpacing',
      'intendedTimeSpacingUnit',
      'timeAggregationInterval',
      'timeAggregationIntervalUnit',
      'dataSourceId',
    ]
  }

  /* ---------------- Cross-table convenience fetches ------------- */

  workspace() {
    return this.client.workspaces.get(this.workspaceId)
  }
  thing() {
    return this.client.things.get(this.thingId)
  }
  unit() {
    return this.client.units.get(this.unitId)
  }
  observedProperty() {
    return this.client.observedProperties.get(this.observedPropertyId)
  }
  sensor() {
    return this.client.sensors.get(this.sensorId)
  }
  processingLevel() {
    return this.client.processingLevels.get(this.processingLevelId)
  }

  /* ----------------------- Observations helpers ----------------- */
  /** Fetch observations; returns ApiResponse so callers can inspect status/message. */
  getObservations<T = unknown>(
    params: DatastreamObservationsParams = {}
  ): Promise<ApiResponse<T>> {
    return this.service.getObservations<T>(this.id, params)
  }

  /** Bulk delete observations in a time range; returns ApiResponse for status/message. */
  deleteObservations(range?: {
    phenomenonTimeStart: string | null
    phenomenonTimeEnd: string | null
  }) {
    return this.service.deleteObservations(this.id, range)
  }

  /** Download CSV as Blob wrapped in ApiResponse. */
  downloadCsv(): Promise<ApiResponse<Blob>> {
    return this.service.downloadCsv(this.id)
  }
}
