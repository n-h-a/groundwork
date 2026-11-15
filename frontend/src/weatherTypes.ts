// Shape of the response from GET /api/weather. All values are metric, as
// NASA POWER gives them; the page converts to US units.

export type WeatherMeasure = 'precipitation_mm' | 'heavy_rain_days' | 'hot_days'

export type PeriodChange = {
  early_average: number
  late_average: number
  late_years_above_early_average: number
  late_years: number
}

export type WeatherResponse = {
  location: { name: string; latitude: number; longitude: number }
  source: string
  days_with_missing_data: number
  monthly: { month: number; precipitation_mm: number; high_c: number }[]
  yearly: ({ year: number } & Record<WeatherMeasure, number>)[]
  periods: { early: [number, number]; late: [number, number] }
  change: Record<WeatherMeasure, PeriodChange | null>
  thresholds: { heavy_rain_mm: number; hot_day_c: number }
}
