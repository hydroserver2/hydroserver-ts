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
  async patch(
    endpoint: string,
    body: any,
    originalBody: any = null,
    options: any = {}
  ): Promise<ApiResponse> {
    options.method = 'PATCH'
    options.body = originalBody ? createPatchObject(originalBody, body) : body
    const bodyIsEmpty =
      typeof options.body === 'object' && Object.keys(options.body).length === 0

    if (!options.body || bodyIsEmpty) {
      return {
        data: originalBody ?? null,
        status: 204,
        message: 'No changes',
        ok: true,
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

  async paginatedFetch<T>(base: string): Promise<ApiResponse> {
    const url = new URL(String(base), globalThis.location?.origin ?? undefined)
    const urlAlreadyHasPage = url.searchParams.has('page')
    if (!urlAlreadyHasPage) url.searchParams.set('page', '1')

    if (url.searchParams.has('page_size'))
      url.searchParams.set('page_size', String(DEFAULT_PAGE_SIZE))

    const opts = requestInterceptor({ method: 'GET' })
    const firstResponse = await limit(() => fetch(url, opts))
    const totalPages = Number(firstResponse.headers.get('X-Total-Pages')) || 1
    const res = await responseInterceptor(firstResponse)

    const all: T[] = Array.isArray(res.data) ? [...res.data] : []
    if (urlAlreadyHasPage)
      return {
        data: all,
        status: res.status,
        message: res.message,
        meta: res.meta,
        ok: res.ok,
      }

    for (let p = 2; p <= totalPages; p++) {
      url.searchParams.set('page', String(p))
      const page = await limit(() =>
        interceptedFetch(url.toString(), { method: 'GET' })
      )
      all.push(...page.data)
    }

    return {
      data: all,
      status: res.status,
      message: res.message,
      meta: res.meta,
      ok: res.ok,
    }
  },
}
