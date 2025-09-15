import { UserService, SessionService } from './services'

export type AuthTuple = [string, string]

export interface HydroServerOptions {
  host: string
}

export class HydroServer {
  readonly host: string
  readonly baseRoute: string
  readonly authBase: string
  readonly providerBase: string

  // private _workspaces?: WorkspaceService
  // private _roles?: RoleService
  // private _things?: ThingService
  // private _observedProperties?: ObservedPropertyService
  // private _units?: UnitService
  // private _processingLevels?: ProcessingLevelService
  // private _resultQualifiers?: ResultQualifierService
  // private _sensors?: SensorService
  // private _datastreams?: DatastreamService
  // private _orchestrationSystems?: OrchestrationSystemService
  // private _dataSources?: DataSourceService
  // private _dataArchives?: DataArchiveService
  private _session?: SessionService
  private _user?: UserService

  constructor(opts: HydroServerOptions) {
    const { host } = opts
    this.host = host.trim().replace(/\/+$/, '')
    this.baseRoute = `${this.host}/api/data`
    this.authBase = `${this.host}/api/auth`
    this.providerBase = `${this.authBase}/browser/provider`
  }

  static async initialize(options: HydroServerOptions): Promise<HydroServer> {
    const client = new HydroServer(options)
    await client.session.initialize()
    client.session.enableAutoRefresh()
    // if (options.email && options.password) {
    //   await client.session.login(options.email, options.password)
    // }
    return client
  }

  private listeners: Record<string, Array<(...args: any[]) => void>> = {}

  public on(eventName: string, callback: (...args: any[]) => void): void {
    ;(this.listeners[eventName] ??= []).push(callback)
  }

  public emit(eventName: string, ...args: any[]): void {
    for (const callback of this.listeners[eventName] ?? []) {
      callback(...args)
    }
  }

  // get workspaces(): WorkspaceService {
  //   return (this._workspaces ??= new WorkspaceService(this))
  // }
  // get roles(): RoleService {
  //   return (this._roles ??= new RoleService(this))
  // }
  // get things(): ThingService {
  //   return (this._things ??= new ThingService(this))
  // }
  // get observedProperties(): ObservedPropertyService {
  //   return (this._observedProperties ??= new ObservedPropertyService(this))
  // }
  // get units(): UnitService {
  //   return (this._units ??= new UnitService(this))
  // }
  // get processingLevels(): ProcessingLevelService {
  //   return (this._processingLevels ??= new ProcessingLevelService(this))
  // }
  // get resultQualifiers(): ResultQualifierService {
  //   return (this._resultQualifiers ??= new ResultQualifierService(this))
  // }
  // get sensors(): SensorService {
  //   return (this._sensors ??= new SensorService(this))
  // }
  // get datastreams(): DatastreamService {
  //   return (this._datastreams ??= new DatastreamService(this))
  // }
  // get orchestrationsystems(): OrchestrationSystemService {
  //   return (this._orchestrationSystems ??= new OrchestrationSystemService(this))
  // }
  // get datasources(): DataSourceService {
  //   return (this._dataSources ??= new DataSourceService(this))
  // }
  // get dataArchives(): DataArchiveService {
  //   return (this._dataArchives ??= new DataArchiveService(this))
  // }
  get session(): SessionService {
    return (this._session ??= new SessionService(this))
  }
  get user(): UserService {
    return (this._user ??= new UserService(this))
  }
}
