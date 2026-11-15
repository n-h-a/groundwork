// The farmer's field and answers, shared by every page.
//
// They live in the page address (for example /compare?lat=39.72&lon=-84.59),
// so moving between pages keeps them, and a result can be linked or
// bookmarked. Nothing is stored anywhere else.

import { useSearchParams } from 'react-router'

export type TileDrained = 'yes' | 'no' | 'unsure'
export type Tillage = 'no-till' | 'tilled' | 'unsure'
export type RotationId = 'corn-soybean' | 'corn-soybean-wheat' | 'corn-soybean-wheat-clover' | 'other'

// Public farmland west of Dayton with a corn and soybean history, so anyone
// (including judges) can try the tool without entering a location.
export const EXAMPLE_FIELD = { lat: 39.72, lon: -84.59 }

// Rough bounding box of Ohio, the same as the backend's check.
export const OHIO_BOUNDS = { south: 38.4, north: 41.98, west: -84.82, east: -80.52 }

export function isInOhio(lat: number, lon: number) {
  const b = OHIO_BOUNDS
  return lat >= b.south && lat <= b.north && lon >= b.west && lon <= b.east
}

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T | null) {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

export function useField() {
  const [params, setParams] = useSearchParams()

  const lat = Number.parseFloat(params.get('lat') ?? '')
  const lon = Number.parseFloat(params.get('lon') ?? '')
  const hasField = Number.isFinite(lat) && Number.isFinite(lon)

  const tile = pick<TileDrained>(params.get('tile'), ['yes', 'no', 'unsure'], 'unsure') as TileDrained
  const tillage = pick<Tillage>(params.get('tillage'), ['no-till', 'tilled', 'unsure'], 'unsure') as Tillage
  // null until the farmer confirms a rotation (or the guess is accepted).
  const rotation = pick<RotationId>(
    params.get('rotation'),
    ['corn-soybean', 'corn-soybean-wheat', 'corn-soybean-wheat-clover', 'other'],
    null,
  )

  function update(changes: Record<string, string | null>) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )
  }

  return {
    lat: hasField ? lat : null,
    lon: hasField ? lon : null,
    hasField,
    tile,
    tillage,
    rotation,
    setTile: (value: TileDrained) => update({ tile: value }),
    setTillage: (value: Tillage) => update({ tillage: value }),
    setRotation: (value: RotationId) => update({ rotation: value }),
    // A new field starts with a fresh rotation answer.
    setLocation: (newLat: number, newLon: number) =>
      update({ lat: newLat.toFixed(4), lon: newLon.toFixed(4), rotation: null }),
    clearField: () => update({ lat: null, lon: null, rotation: null }),
  }
}
