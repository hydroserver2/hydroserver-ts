import type { HydroServer } from '../HydroServer'
import { apiMethods } from '../apiMethods'
import type { ApiResponse } from '../responseInterceptor'
import type * as Data from '../../generated/data.types'

export const RATING_CURVE_ATTACHMENT_TYPE = 'rating_curve'

export type WorkspaceFileAttachment =
  Data.components['schemas']['WorkspaceFileAttachmentGetResponse']

export type WorkspaceFileAttachmentPatchBody =
  Data.components['schemas']['WorkspaceFileAttachmentPatchBody']

export type WorkspaceFileAttachmentListParams = {
  page?: number | null
  page_size?: number | null
  type?: string | string[]
}

export type UploadWorkspaceFileAttachmentOptions = {
  type?: string
  name?: string
  description?: string
}

export interface RatingCurvePreviewRow {
  inputValue: string
  outputValue: string
}

export class WorkspaceFileAttachmentService {
  private readonly _client: HydroServer
  private readonly _route: string

  constructor(client: HydroServer) {
    this._client = client
    this._route = `${this._client.baseRoute}/workspaces`
  }

  list(workspaceId: string, params: WorkspaceFileAttachmentListParams = {}) {
    const url = this.withQuery(
      `${this.baseAttachmentRoute(workspaceId)}`,
      params
    )
    return apiMethods.paginatedFetch(url) as Promise<
      ApiResponse<WorkspaceFileAttachment[]>
    >
  }

  async listItems(
    workspaceId: string,
    params: WorkspaceFileAttachmentListParams = {}
  ) {
    const res = await this.list(workspaceId, params)
    return res.ok && Array.isArray(res.data) ? res.data : []
  }

  upload(
    workspaceId: string,
    file: File | Blob,
    options: UploadWorkspaceFileAttachmentOptions = {}
  ) {
    const data = new FormData()
    data.append('file', file, file instanceof File ? file.name : 'attachment.csv')
    data.append('type', options.type ?? RATING_CURVE_ATTACHMENT_TYPE)
    if (options.name) data.append('name', options.name)
    if (options.description) data.append('description', options.description)

    return apiMethods.post(this.baseAttachmentRoute(workspaceId), data) as Promise<
      ApiResponse<WorkspaceFileAttachment>
    >
  }

  async uploadItem(
    workspaceId: string,
    file: File | Blob,
    options: UploadWorkspaceFileAttachmentOptions = {}
  ) {
    const res = await this.upload(workspaceId, file, options)
    return res.ok ? res.data : null
  }

  replaceFile(workspaceId: string, fileAttachmentId: string, file: File | Blob) {
    const data = new FormData()
    data.append('file', file, file instanceof File ? file.name : 'attachment.csv')
    const url = `${this.baseAttachmentRoute(workspaceId)}/${fileAttachmentId}/replace`
    return apiMethods.post(url, data) as Promise<ApiResponse<WorkspaceFileAttachment>>
  }

  async replaceItem(
    workspaceId: string,
    fileAttachmentId: string,
    file: File | Blob
  ) {
    const res = await this.replaceFile(workspaceId, fileAttachmentId, file)
    return res.ok ? res.data : null
  }

  update(
    workspaceId: string,
    fileAttachmentId: string,
    body: WorkspaceFileAttachmentPatchBody,
    originalBody?: WorkspaceFileAttachmentPatchBody
  ) {
    const url = `${this.baseAttachmentRoute(workspaceId)}/${fileAttachmentId}`
    return apiMethods.patch(url, body, originalBody ?? null) as Promise<
      ApiResponse<WorkspaceFileAttachment>
    >
  }

  async updateItem(
    workspaceId: string,
    fileAttachmentId: string,
    body: WorkspaceFileAttachmentPatchBody,
    originalBody?: WorkspaceFileAttachmentPatchBody
  ) {
    const res = await this.update(
      workspaceId,
      fileAttachmentId,
      body,
      originalBody
    )
    return res.ok ? res.data : null
  }

  delete(workspaceId: string, fileAttachmentId: string) {
    const url = `${this.baseAttachmentRoute(workspaceId)}/${fileAttachmentId}`
    return apiMethods.delete(url)
  }

  getDownloadUrl(workspaceId: string, fileAttachmentId: string, token?: string) {
    const url = new URL(
      `${this.baseAttachmentRoute(workspaceId)}/${fileAttachmentId}/download`,
      globalThis.location?.origin ?? undefined
    )
    if (token) url.searchParams.set('token', token)
    return url.toString()
  }

  async fetchRatingCurvePreview(
    link: string,
    maxRows = 20
  ): Promise<ApiResponse<RatingCurvePreviewRow[]>> {
    const previewUrl = this.resolveAttachmentPreviewUrl(link)
    const response = await apiMethods.fetch(previewUrl, {
      headers: {
        Accept: 'text/csv, text/plain, application/octet-stream',
      },
    })

    if (!response.ok) {
      return {
        ...response,
        data: [],
      }
    }

    const raw = response.data
    let csvText = ''
    if (raw instanceof Blob) {
      csvText = await raw.text()
    } else if (typeof raw === 'string') {
      csvText = raw
    } else if (raw != null) {
      csvText = String(raw)
    }

    return {
      data: parsePreviewRows(csvText, maxRows),
      status: response.status,
      message: response.message,
      meta: response.meta,
      ok: true,
    }
  }

  private baseAttachmentRoute(workspaceId: string) {
    return `${this._route}/${workspaceId}/file-attachments`
  }

  private resolveAttachmentPreviewUrl(link: string) {
    const preferredOrigin = this.preferredOrigin()
    if (!preferredOrigin) return link

    try {
      const parsed = new URL(link, preferredOrigin)
      if (!isWorkspaceAttachmentDownloadPath(parsed.pathname)) {
        return parsed.toString()
      }
      return new URL(`${parsed.pathname}${parsed.search}`, preferredOrigin).toString()
    } catch {
      return link
    }
  }

  private preferredOrigin() {
    try {
      if (this._client.host) {
        return new URL(this._client.host, globalThis.location?.origin).origin
      }
    } catch {
      // no-op
    }

    try {
      return globalThis.location?.origin ?? null
    } catch {
      return null
    }
  }

  private withQuery(base: string, params?: WorkspaceFileAttachmentListParams) {
    if (!params || Object.keys(params).length === 0) return base
    const url = new URL(base, globalThis.location?.origin ?? undefined)

    if (params.page !== undefined && params.page !== null) {
      url.searchParams.set('page', String(params.page))
    }
    if (params.page_size !== undefined && params.page_size !== null) {
      url.searchParams.set('page_size', String(params.page_size))
    }

    const type = params.type
    if (Array.isArray(type)) {
      for (const value of type) {
        if (value) url.searchParams.append('type', value)
      }
    } else if (typeof type === 'string' && type) {
      url.searchParams.set('type', type)
    }

    return url.toString()
  }
}

function isWorkspaceAttachmentDownloadPath(pathname: string) {
  return /^\/api\/data\/workspaces\/[^/]+\/file-attachments\/[^/]+\/download\/?$/.test(
    pathname
  )
}

function parsePreviewRows(csvText: string, maxRows = 20): RatingCurvePreviewRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !!line)

  if (lines.length < 2) return []

  const header = lines[0].split(',').map((part) => part.trim().toLowerCase())
  let inputIndex = header.findIndex((name) => name === 'input_value')
  let outputIndex = header.findIndex((name) => name === 'output_value')

  if (inputIndex === -1 || outputIndex === -1) {
    inputIndex = 0
    outputIndex = 1
  }

  const rows: RatingCurvePreviewRow[] = []
  for (const line of lines.slice(1, 1 + maxRows)) {
    const columns = line.split(',').map((part) => part.trim())
    if (columns.length <= Math.max(inputIndex, outputIndex)) continue

    rows.push({
      inputValue: columns[inputIndex] ?? '',
      outputValue: columns[outputIndex] ?? '',
    })
  }

  return rows
}
