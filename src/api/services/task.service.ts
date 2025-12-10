import { HydroServerBaseService } from './base'
import { EtlTaskContract as C } from '../../generated/contracts'
import {
  Task as M,
  StatusType,
  TaskExpanded,
  TaskRun,
} from '../Models/task.model'

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

  getStatusText(task: TaskExpanded): StatusType {
    const { latestRun, schedule } = task
    if (schedule?.paused) return 'Loading paused'
    if (!latestRun) return 'Pending'
    if (latestRun.status === 'FAILURE') return 'Needs attention'

    const { nextRunAt } = schedule!
    const next = nextRunAt ? new Date(nextRunAt) : undefined
    if (next && !Number.isNaN(next.valueOf())) {
      return next.getTime() < Date.now() ? 'Behind schedule' : 'OK'
    }

    return 'Unknown'
  }

  getBadCountText(statusArray: TaskRun[]) {
    const badCount = statusArray.filter((s) => s.status === 'FAILED').length
    if (!badCount) return ''
    if (badCount === 1) return '1 error'
    return `${badCount} errors`
  }

  getBehindScheduleCountText(statusArray: TaskRun[]) {
    const behindCount = statusArray.filter(
      (s) => s.status === 'Behind schedule'
    ).length
    if (!behindCount) return ''
    return `${behindCount} behind schedule`
  }
}
