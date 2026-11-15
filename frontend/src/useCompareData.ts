import { useEffect, useState } from 'react'
import type { CompareResponse } from './compareTypes'

type Result = { key: string; data?: CompareResponse; error?: boolean }

// Loads /api/compare for a field, or for the Dayton area when no field is set.
// Reloads when the field changes.
export function useCompareData(lat: number | null, lon: number | null) {
  const key = lat !== null && lon !== null ? `?lat=${lat}&lon=${lon}` : ''
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

  // Ignore a result left over from a previous field while the new one loads.
  const current = result?.key === key ? result : null
  return { data: current?.data ?? null, error: current?.error ?? false }
}
