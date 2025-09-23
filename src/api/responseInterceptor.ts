export interface ApiError {
  status: number
  message?: string
}

export interface ApiResponse<T = any> {
  data: T
  status: number
  message: string
}

export function extractErrorMessage(body: any) {
  if (Array.isArray(body?.errors) && body.errors.length) {
    body = body.errors[0]
  }

  if (typeof body !== 'object' || body === null) {
    return 'An unknown error occurred.'
  }

  const possibleKeys = ['message', 'detail', 'error']
  for (const key of possibleKeys) {
    if (body[key]) return body[key]
  }

  return 'An unknown error occurred.'
}

function extractSuccessMessage(body: any, response: Response): string {
  // Prefer an explicit message only when the body is a JSON object with a message-like field.
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const possibleKeys = ['message', 'detail']
    for (const key of possibleKeys) {
      const val = (body as any)[key]
      if (typeof val === 'string' && val.trim()) return val
    }
  }
  // Fallback to HTTP status text or "OK"
  return response.statusText || 'OK'
}

export async function responseInterceptor<T = any>(
  response: Response
): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type') || ''
  const noBody =
    response.headers.get('Content-Length') === '0' ||
    response.statusText === 'No Content'

  let parsedBody: any = null
  if (!noBody) {
    try {
      if (contentType.includes('application/json')) {
        parsedBody = await response.json()
      } else if (contentType.includes('text/csv')) {
        parsedBody = await response.blob()
      } else {
        parsedBody = await response.text().catch(() => null)
      }
    } catch {
      parsedBody = null
    }
  }

  // Django AllAuth doesn't consider 401 responses errors but rather an
  // message to put the caller in an unauthenticated flow state.
  // Pass the response to the calling component to handle the returned AllAuth flows.
  if (response.ok || response.status === 401)
    return {
      data: parsedBody as T,
      status: response.status,
      message: extractSuccessMessage(parsedBody, response),
    }

  const apiError: ApiError = {
    status: response.status,
    message: extractErrorMessage(parsedBody),
  }

  console.error('API response not OK:', apiError.message)
  throw apiError
}
