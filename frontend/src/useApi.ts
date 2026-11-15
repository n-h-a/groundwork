import { useEffect, useState } from 'react'

type Result<T> = { url: string; data?: T; error?: string }

// Loads JSON from our API. Pass null to load nothing. Reloads when the URL
// changes, and ignores a reply that arrives after the URL has changed.
export function useApi<T>(url: string | null) {
  const [result, setResult] = useState<Result<T> | null>(null)

  useEffect(() => {
    if (url === null) return
    const controller = new AbortController()
    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.detail ?? `HTTP ${res.status}`)
        return body as T
      })
      .then((data) => setResult({ url, data }))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setResult({ url, error: err instanceof Error ? err.message : 'Request failed' })
        }
      })
    return () => controller.abort()
  }, [url])

  const current = result && result.url === url ? result : null
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: url !== null && current === null,
  }
}
