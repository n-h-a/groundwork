import { useEffect, useState } from 'react'
import type { CompareResponse } from './compareTypes'

type Result = { key: string; data?: CompareResponse; error?: boolean }

// Loads /api/compare for a field, or for the Dayton area when no field is set.
// The farmer's answers decide which research findings fit. Reloads when any
// of them change.
export function useCompareData(lat: number | null, lon: number | null, tillage = 'unsure', tile = 'unsure') {
  const params = new URLSearchParams({ tillage, tile })
  if (lat !== null && lon !== null) {
    params.set('lat', String(lat))
    params.set('lon', String(lon))
  }
  const key = `?${params}`
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/compare${key}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: CompareResponse) => setResult({ key, data }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, error: true })
      })
    return () => controller.abort()
  }, [key])

  // While new answers load, keep showing the previous result rather than
  // blanking the page; it is replaced as soon as the new one arrives.
  const current = result?.key === key ? result : null
  return { data: current?.data ?? result?.data ?? null, error: current?.error ?? false }
}
