import { HydroServerBaseService } from './base'
import { EtlTaskContract as C } from '../../generated/contracts'
import { Task as M } from '../Models/task.model'

export class TaskService extends HydroServerBaseService<typeof C, M> {
  static route = C.route
  static writableKeys = C.writableKeys
  static Model = M

  addMapping(task: M) {
    task.mappings.push({
      sourceIdentifier: '',
      paths: [{ targetIdentifier: '', dataTransformations: [] }],
    })
  }

  /**  Remove mapping path if datastream id is targetId. Remove mappings that now have no paths. */
  removeTarget(task: M, id: string | number): void {
    const key = String(id)
    for (const m of task.mappings) {
      m.paths = m.paths.filter((p) => String(p.targetIdentifier) !== key)
    }
    task.mappings = task.mappings.filter((m) => m.paths.length > 0)
  }

  // TODO: I don't think we'll need these functions anymore since the backend handles
  // Task runs and their statuses. Just fetch from there

  // getStatusText({
  //   lastRun,
  //   lastRunSuccessful,
  //   nextRun,
  //   paused,
  // }: Status): StatusType {
  //   if (paused) return 'Loading paused'
  //   if (!lastRun) return 'Pending'
  //   if (!lastRunSuccessful) return 'Needs attention'

  //   const next = nextRun ? new Date(nextRun) : undefined
  //   if (next && !Number.isNaN(next.valueOf())) {
  //     return next.getTime() < Date.now() ? 'Behind schedule' : 'OK'
  //   }

  //   return 'Unknown'
  // }

  // getBadCountText(statusArray: Status[]) {
  //   const badCount = statusArray.filter(
  //     (s) => getStatusText(s) === 'Needs attention'
  //   ).length
  //   if (!badCount) return ''
  //   if (badCount === 1) return '1 error'
  //   return `${badCount} errors`
  // }

  // getBehindScheduleCountText(statusArray: Status[]) {
  //   const behindCount = statusArray.filter(
  //     (s) => getStatusText(s) === 'Behind schedule'
  //   ).length
  //   if (!behindCount) return ''
  //   return `${behindCount} behind schedule`
  // }
}
