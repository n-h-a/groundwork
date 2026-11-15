// Shape of the response from GET /api/compare.
// The rotation facts come from backend/rotations.json; the indicators and
// the history are calculated in backend/comparison.py.

export type Source = {
  id: string
  title: string
  publisher: string
  url: string
  note?: string
}

export type Fact = {
  effect?: 'benefit' | 'cost' | 'neutral'
  topics: string[] // 'income', 'soil' or 'water'
  // How the fact is known, and whether the research fits the farmer's field.
  strength: 'measured_ohio' | 'measured_other_state' | 'crop_calendar' | 'guidance'
  conditions?: { tillage?: string; tile_drained?: boolean }
  fit: { status: 'general' | 'fits' | 'unknown' | 'may_not_apply'; notes: string[] }
  fact: string
  sources: string[]
}

export type RotationYear = {
  label: string
  crops: string[]
  covered_months: number[] // 1 = January ... 12 = December
  spans: { crop: string; months: number[] }[] // which crop covers which months
  events: { month: number; type: 'plant' | 'harvest' | 'end'; crop: string }[]
}

export type Rotation = {
  id: string
  name: string
  description: string
  years: RotationYear[]
  for_the_farm: Fact[]
  for_the_environment: Fact[]
  risks_needing_local_review: Fact[]
  information_gaps: string[]
  indicators: {
    uncovered_precipitation: { mm_per_year: number; share_of_annual: number }
    sensitive_exposure: Record<string, { years_with_crop: number; years_in_rotation: number }>
  }
}

export type SensitivePeriod = {
  period: {
    start: string // "MM-DD"
    end: string // "MM-DD"
    description: string
    how_dated: string
    caveats: string
    hot_day_threshold_c?: number
  }
  history: {
    year: number
    precipitation_mm: number
    root_zone_wetness: number // 0 = completely dry, 1 = saturated
    hot_days: number | null
  }[]
}

export type CompareResponse = {
  location: { name: string }
  climate_source: string
  annual_precipitation_mm: number
  monthly_precipitation_mm: number[]
  rotations: Rotation[]
  sensitive_periods: Record<string, SensitivePeriod>
  sources: Source[]
}
