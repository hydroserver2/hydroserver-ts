export class Task {
  id = ''
  name = ''
  paused = true
  nextRunAt? = undefined
  latestRun? = undefined
  extractorVariables = {}
  transformerVariables = {}
  loaderVariables = {}
  mappings: Mapping[] = []
  workspace_id = ''
  job_id = ''
  schedule? = undefined

  constructor(init?: Partial<Task>) {
    Object.assign(this, init)
  }
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

export const JOB_STATUS_OPTIONS = [
  { color: 'green', title: 'OK' },
  { color: 'blue', title: 'Pending' },
  { color: 'red', title: 'Needs attention' },
  { color: 'orange-darken-4', title: 'Behind schedule' },
  { color: 'gray', title: 'Unknown' },
  { color: 'gray', title: 'Loading paused' },
] as const
export type StatusType = (typeof JOB_STATUS_OPTIONS)[number]['title']

export interface Status {
  lastRunSuccessful?: boolean
  lastRunMessage?: string
  lastRun?: string
  nextRun?: string
  paused: boolean
}
