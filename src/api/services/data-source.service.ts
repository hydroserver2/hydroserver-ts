import { HydroServerBaseService } from './base'
import { apiMethods } from '../apiMethods'
import { DataSource as M } from '../../types/dataSource'
import { DataSourceContract as C } from '../../generated/contracts'

export class DataSourceService extends HydroServerBaseService<typeof C, M> {
  static route = C.route
  static writableKeys = C.writableKeys
  static Model = M

  linkDatastream(dataSourceId: string, datastreamId: string) {
    const url = `${this._route}/${encodeURIComponent(
      dataSourceId
    )}/datastreams/${encodeURIComponent(datastreamId)}`
    return apiMethods.post(url)
  }

  unlinkDatastream(dataSourceId: string, datastreamId: string) {
    const url = `${this._route}/${encodeURIComponent(
      dataSourceId
    )}/datastreams/${encodeURIComponent(datastreamId)}`
    return apiMethods.delete(url)
  }

  updatePartial(newS: M) {
    return apiMethods.patch(
      `${this._route}/${newS.id}?expand_related=true`,
      newS
    )
  }
}
