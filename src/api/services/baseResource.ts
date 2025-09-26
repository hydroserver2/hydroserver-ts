// src/api/services/resource.ts
import type { HydroServer } from '../HydroServer'
import { HydroServerBaseService, BaseListParams } from './base'

/**
 * All list calls for HydroServer resources are scoped by workspace.
 * We accept a Workspace model-ish object (with id) or a string id.
 * We also allow expandRelated to request related objects.
 */
export type WorkspaceScopedParams = BaseListParams & {
  workspace: { id: string } | string
  expandRelated?: boolean
}

/**
 * Tiny static-config base that removes CRUD boilerplate.
 * Subclasses provide `static route` and `static model`, and optionally add unique methods.
 */
type Ctor<T> = new (client: HydroServer, service: unknown, serverData: any) => T

export abstract class ResourceService<
  TModel,
  TParams extends WorkspaceScopedParams = WorkspaceScopedParams
> extends HydroServerBaseService<TModel, TParams> {
  // Subclasses must provide these:
  // static route: (c: HydroServer) => string
  // static model: Ctor<TModel>

  constructor(client: HydroServer) {
    const C = new.target as any
    const route = (C.route as (c: HydroServer) => string)(client)
    super(client, route)
  }

  /** Build model instances without per-service boilerplate. */
  protected override deserialize(data: unknown): TModel {
    const C = this.constructor as any
    const Model: Ctor<TModel> = C.model
    return new Model(this._client, this, data as any)
  }

  /**
   * Enforce public `workspace` prop only, and map it to `workspaceId`
   * which the server expects; also keep `expandRelated` as array—our base
   * normalizer will turn arrays into comma-joined strings and camel→snake.
   */
  protected override prepareListParams(params: TParams): TParams {
    const out: any = { ...params }

    // required: workspace
    const w = out.workspace
    if (!w) {
      throw new Error(
        'A `workspace` (id or object with {id}) is required for list() and listAllItems().'
      )
    }
    out.workspaceId = typeof w === 'string' ? w : w.id
    delete out.workspace

    return out
  }
}
