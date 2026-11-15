// Small calculations shared by the Compare page's pieces.

import type { CompareResponse, Fact, Rotation } from '../compareTypes'
import type { RotationId } from '../field'
import { CROP_ICON } from '../icons'
import type { IconName } from '../icons'

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

export const CROP_NAMES: Record<string, string> = {
  corn: 'Corn',
  soybean: 'Soybeans',
  winter_wheat: 'Wheat',
  red_clover: 'Red clover',
}

// The farmer's priority. 'all' means nothing is highlighted.
export type Priority = 'all' | 'income' | 'soil' | 'water'

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'all', label: 'Show everything' },
  { id: 'income', label: 'Farm income' },
  { id: 'soil', label: 'Soil health' },
  { id: 'water', label: 'Water downstream' },
]

export const BASELINE_IDS: RotationId[] = ['corn-soybean', 'corn-soybean-wheat', 'corn-soybean-wheat-clover']

// Each crop in the rotation once, in the same order on every rotation.
export function cropIcons(rotation: Rotation): IconName[] {
  const grown = new Set(rotation.years.flatMap((year) => year.crops))
  return Object.keys(CROP_ICON)
    .filter((crop) => grown.has(crop))
    .map((crop) => CROP_ICON[crop])
}

export function bareSoilPercent(rotation: Rotation) {
  return Math.round(rotation.indicators.uncovered_precipitation.share_of_annual * 100)
}

// A winter counts as bare if nothing is growing in January.
export function bareWinters(rotation: Rotation) {
  const bare = rotation.years.filter((year) => !year.covered_months.includes(1)).length
  return { bare, total: rotation.years.length }
}

export function bareWintersText(rotation: Rotation) {
  const { bare, total } = bareWinters(rotation)
  if (bare === total) return 'Bare soil every winter'
  if (bare === 0) return 'Covered every winter'
  return `Bare soil in ${bare} of ${total} winters`
}

// Years in the NASA record when a crop's sensitive weeks had at least one hot day.
export function hotYears(data: CompareResponse, cropId: string) {
  const history = data.sensitive_periods[cropId]?.history ?? []
  return { hot: history.filter((row) => (row.hot_days ?? 0) > 0).length, total: history.length }
}

// All of a rotation's facts that relate to one priority.
export function factsAbout(rotation: Rotation, topic: Exclude<Priority, 'all'>): Fact[] {
  return [...rotation.for_the_farm, ...rotation.for_the_environment, ...rotation.risks_needing_local_review].filter(
    (fact) => fact.topics.includes(topic),
  )
}

// "07-08" -> "Jul 8"
export function formatMonthDay(monthDay: string): string {
  const [month, day] = monthDay.split('-').map(Number)
  return `${MONTH_NAMES[month - 1].slice(0, 3)} ${day}`
}
