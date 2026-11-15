// The farmer's field and answers, shared by every page.
//
// They live in the page address (for example /compare?lat=39.72&lon=-84.59),
// so moving between pages keeps them, and a result can be linked or
// bookmarked. Nothing is stored anywhere else.

import { useSearchParams } from 'react-router'

export type TileDrained = 'yes' | 'no' | 'unsure'

// Public farmland west of Dayton with a corn and soybean history, so anyone
// (including judges) can try the tool without entering a location.
export const EXAMPLE_FIELD = { lat: 39.72, lon: -84.59 }

const TILE_VALUES: TileDrained[] = ['yes', 'no', 'unsure']

export function useField() {
  const [params, setParams] = useSearchParams()

  const lat = Number.parseFloat(params.get('lat') ?? '')
  const lon = Number.parseFloat(params.get('lon') ?? '')
  const hasField = Number.isFinite(lat) && Number.isFinite(lon)

  const tileParam = params.get('tile') as TileDrained | null
  const tile: TileDrained = tileParam && TILE_VALUES.includes(tileParam) ? tileParam : 'unsure'

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
    setTile: (value: TileDrained) => update({ tile: value }),
    setLocation: (newLat: number, newLon: number) => update({ lat: String(newLat), lon: String(newLon) }),
    clearField: () => update({ lat: null, lon: null }),
  }
}
