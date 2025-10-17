import { HydroServerBaseService } from './base'
import type { HydroShareArchive as M } from '../../types'
import { DataArchiveContract as C } from '../../generated/contracts'

export class DataArchiveService extends HydroServerBaseService<typeof C, M> {
  static route = C.route
  static writableKeys = C.writableKeys
}
