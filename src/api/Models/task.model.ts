export class Task {
  id = ''
  name = ''
  paused = true
  nextRunAt?: TaskRun = undefined
  latestRun?: TaskRun = undefined
  extractorVariables = {}
  transformerVariables = {}
  loaderVariables = {}
  mappings: Mapping[] = []
  workspaceId = ''
  jobId = ''
  orchestrationSystemId = ''
  schedule: TaskSchedule | null = null

  constructor(init?: Partial<Task>) {
    Object.assign(this, init)
  }
}

export type IntervalPeriod = 'minutes' | 'hours' | 'days'

export type TaskRun = {
  status: string
  result: {}
  startedAt?: string
  finishedAt?: string
  id: string
}

export type TaskSchedule = {
  paused: boolean
  startTime: string | null
  nextRunAt: string | null
  crontab: string | null
  interval: number | null
  intervalPeriod: IntervalPeriod | null
}

export interface ExpressionDataTransformation {
  type: 'expression'
  expression: string
}

export interface LookupTableDataTransformation {
  lookupTableId: string
  type: 'lookup'
}

export type DataTransformation =
  | ExpressionDataTransformation
  | LookupTableDataTransformation

export interface MappingPath {
  targetIdentifier: string | number
  dataTransformations: DataTransformation[]
}

export interface Mapping {
  sourceIdentifier: string | number
  paths: MappingPath[]
}

export const STATUS_OPTIONS = [
  { color: 'green', title: 'OK' },
  { color: 'blue', title: 'Pending' },
  { color: 'red', title: 'Needs attention' },
  { color: 'orange-darken-4', title: 'Behind schedule' },
  { color: 'gray', title: 'Unknown' },
  { color: 'gray', title: 'Loading paused' },
] as const
export type StatusType = (typeof STATUS_OPTIONS)[number]['title']

export interface Status {
  lastRunSuccessful?: boolean
  lastRunMessage?: string
  lastRun?: string
  nextRun?: string
  paused: boolean
}
