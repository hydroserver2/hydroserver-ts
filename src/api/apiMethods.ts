import { requestInterceptor } from './requestInterceptor'
import { ApiResponse, responseInterceptor } from './responseInterceptor'
import { createPatchObject } from './createPatchObject'
import pLimit from 'p-limit'

const limit = pLimit(10)
const DEFAULT_PAGE_SIZE = 1000

async function interceptedFetch(endpoint: string, options: any) {
  const opts = requestInterceptor(options)
  const response = await fetch(endpoint, opts)
  return await responseInterceptor(response)
}

export const apiMethods = {
  async fetch(endpoint: string, options: any = {}): Promise<ApiResponse> {
    options.method = 'GET'
    return await limit(() => interceptedFetch(endpoint, options))
  },
  async patch<TResp>(
    endpoint: string,
    body: any,
    originalBody: any = null,
    options: any = {}
  ): Promise<ApiResponse<TResp>> {
    options.method = 'PATCH'
    options.body = originalBody ? createPatchObject(originalBody, body) : body
    const bodyIsEmpty =
      typeof options.body === 'object' && Object.keys(options.body).length === 0

    if (!options.body || bodyIsEmpty) {
      return {
        data: (originalBody ?? null) as TResp,
        status: 204,
        message: 'No changes',
      }
    }
    return await limit(() => interceptedFetch(endpoint, options))
  },
  async post(
    endpoint: string,
    body: any = undefined,
    options: any = {}
  ): Promise<ApiResponse> {
    options.method = 'POST'
    options.body = body
    return await limit(() => interceptedFetch(endpoint, options))
  },
  async put(
    endpoint: string,
    body: any = undefined,
    options: any = {}
  ): Promise<ApiResponse> {
    options.method = 'PUT'
    options.body = body
    return await limit(() => interceptedFetch(endpoint, options))
  },
  async delete(
    endpoint: string,
    body: any = undefined,
    options: any = {}
  ): Promise<ApiResponse> {
    options.method = 'DELETE'
    options.body = body
    return await limit(() => interceptedFetch(endpoint, options))
  },

  async paginatedFetch<T>(
    base: string,
    pageSize?: number
  ): Promise<ApiResponse> {
    const size = pageSize ?? DEFAULT_PAGE_SIZE
    const sep = base.includes('?') ? '&' : '?'
    const url = `${base}${sep}page_size=${size}&page=1`

    const opts = requestInterceptor({ method: 'GET' })
    const firstResponse = await limit(() => fetch(url, opts))
    const totalPages = Number(firstResponse.headers.get('x-total-pages')) || 1
    const iRes = await responseInterceptor(firstResponse)

    console.log('all', iRes)
    const all: T[] = Array.isArray(iRes.data) ? [...iRes.data] : []

    for (let p = 2; p <= totalPages; p++) {
      const url = `${base}${sep}page_size=${size}&page=${p}`
      const page = await limit(() => interceptedFetch(url, { method: 'GET' }))
      all.push(...page.data)
    }

    return {
      data: all,
      status: iRes.status,
      message: iRes.message,
    }
  },
}
