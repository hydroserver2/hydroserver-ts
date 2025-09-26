/* AUTO-GENERATED. DO NOT EDIT.
   Generated from schemas/data.openapi.json */
import type * as Data from '../data.types'

export namespace WorkspaceContract {
  export const route = 'workspaces' as const
  export type SummaryResponse = Data.components['schemas']['WorkspaceSummaryResponse']
  export type PostBody = Data.components['schemas']['WorkspacePostBody']
  export type PatchBody = Data.components['schemas']['WorkspacePatchBody']
  export const writableKeys = ["name","isPrivate"] as const
}
