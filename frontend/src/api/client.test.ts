import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DELUGE_ENDPOINTS, auth, delugeRPC, setAuthFailureHandler, uploadTorrent } from './client'

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

describe('Deluge API client', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => {
    setAuthFailureHandler(null)
    vi.unstubAllGlobals()
  })

  it('posts RPC requests to the same-origin endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue(response({ result: true, error: null, id: 1 }))
    await expect(auth.check()).resolves.toBe(true)
    expect(fetch).toHaveBeenCalledWith(DELUGE_ENDPOINTS.rpc, expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }))
    const request = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))
    expect(request).toMatchObject({ method: 'auth.check_session', params: [] })
  })

  it('reports an expired authenticated session', async () => {
    const expired = vi.fn()
    setAuthFailureHandler(expired)
    vi.mocked(fetch).mockResolvedValue(response({ result: null, error: { code: 1, message: 'Not authenticated' }, id: 2 }))
    await expect(auth.check()).rejects.toMatchObject({ code: 1 })
    expect(expired).toHaveBeenCalledOnce()
  })

  it('rejects malformed and non-JSON RPC responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({ unexpected: true }))
    await expect(delugeRPC('test.method')).rejects.toThrow('Malformed RPC response')
    vi.mocked(fetch).mockResolvedValueOnce(response('<html>not json</html>', { headers: { 'Content-Type': 'text/html' } }))
    await expect(delugeRPC('test.method')).rejects.toThrow('Invalid JSON response')
  })

  it('includes a bounded upstream error in HTTP failures', async () => {
    vi.mocked(fetch).mockResolvedValue(response('upstream unavailable', { status: 502 }))
    await expect(delugeRPC('core.get_config')).rejects.toMatchObject({ code: 502, name: 'Error' })
  })

  it('uploads a torrent using the same-origin upload endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue(response(['/tmp/example.torrent']))
    const file = new File(['torrent'], 'example.torrent', { type: 'application/x-bittorrent' })
    await expect(uploadTorrent(file)).resolves.toBe('/tmp/example.torrent')
    expect(fetch).toHaveBeenCalledWith(DELUGE_ENDPOINTS.upload, expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: expect.any(FormData),
    }))
  })
})
