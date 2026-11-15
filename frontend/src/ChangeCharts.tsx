import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { GRID_GRAY, HEAT_LIGHT, HEAT_ORANGE, INK, RAIN_BLUE, RAIN_LIGHT } from './chartColors'
import { formatTemperature, mmToInches } from './units'
import type { WeatherMeasure, WeatherResponse } from './weatherTypes'

type MeasureInfo = {
  title: string
  why: string
  unit: string
  convert: (value: number) => number
  dark: string
  light: string
}

function measures(data: WeatherResponse): Record<WeatherMeasure, MeasureInfo> {
  return {
    heavy_rain_days: {
      title: 'Days with 1 inch or more of rain',
      why: 'Heavy downpours are when bare soil is most likely to wash away, taking fertilizer with it.',
      unit: 'days a year',
      convert: (days) => days,
      dark: RAIN_BLUE,
      light: RAIN_LIGHT,
    },
    hot_days: {
      title: `Days at ${formatTemperature(data.thresholds.hot_day_c)} or hotter`,
      why: 'Heat stresses crops, most of all during their sensitive weeks.',
      unit: 'days a year',
      convert: (days) => days,
      dark: HEAT_ORANGE,
      light: HEAT_LIGHT,
    },
    precipitation_mm: {
      title: 'Rain and melted snow in a year',
      why: 'The total that falls on the field, covered or not.',
      unit: 'inches a year',
      convert: (mm) => mmToInches(mm),
      dark: RAIN_BLUE,
      light: RAIN_LIGHT,
    },
  }
}

const round1 = (value: number) => Math.round(value * 10) / 10

function ChangeChart({ data, measure, info }: { data: WeatherResponse; measure: WeatherMeasure; info: MeasureInfo }) {
  const change = data.change[measure]
  if (!change) return null
  const [earlyStart, earlyEnd] = data.periods.early
  const [lateStart, lateEnd] = data.periods.late
  const early = round1(info.convert(change.early_average))
  const late = round1(info.convert(change.late_average))

  // Each period's average is drawn as a flat line over that period's bars.
  const rows = data.yearly.map((row) => {
    const isEarly = row.year <= earlyEnd
    return {
      year: row.year,
      value: round1(info.convert(row[measure])),
      earlyAverage: isEarly ? early : null,
      lateAverage: isEarly ? null : late,
      isEarly,
    }
  })

  return (
    <div className="change">
      <h3>{info.title}</h3>
      <p className="muted">{info.why}</p>
      <p className="change__figure">
        <span>
          {earlyStart}–{earlyEnd}: <strong>{early}</strong> {info.unit}
        </span>
        <span>
          {lateStart}–{lateEnd}: <strong>{late}</strong> {info.unit}
        </span>
      </p>
      <p>
        {change.late_years_above_early_average} of the {change.late_years} recent years were above the earlier
        average.
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={rows} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID_GRAY} vertical={false} />
          {/* Only the first year of each half, and the last year, so labels never overlap. */}
          <XAxis dataKey="year" tickLine={false} ticks={[earlyStart, lateStart, lateEnd]} interval={0} />
          <YAxis tickLine={false} axisLine={false} width={40} />
          <Tooltip
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                value: 'This year',
                earlyAverage: `${earlyStart}–${earlyEnd} average`,
                lateAverage: `${lateStart}–${lateEnd} average`,
              }
              return [`${value} ${info.unit.replace(' a year', '')}`, labels[String(name)] ?? name]
            }}
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.year} fill={row.isEarly ? info.light : info.dark} />
            ))}
          </Bar>
          <Line dataKey="earlyAverage" stroke={INK} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="lateAverage" stroke={INK} strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// "Is it changing?": the two halves of the NASA record, side by side.
function ChangeCharts({ data }: { data: WeatherResponse }) {
  const info = measures(data)
  const [earlyStart, earlyEnd] = data.periods.early
  const [lateStart, lateEnd] = data.periods.late

  return (
    <section>
      <h2>Is it changing?</h2>
      <p>
        These charts split the NASA record into two halves, {earlyStart}–{earlyEnd} and {lateStart}–{lateEnd}, and
        compare their averages. Lighter bars are the earlier years, darker bars the recent ones, and each black
        line is that half's average.
      </p>
      <p className="muted">
        Weather swings a lot from year to year, so two halves can differ by chance. The count of recent years
        above the earlier average shows whether a difference comes from most years or from a few unusual ones.
        NASA POWER describes an area about 50 km across and smooths out local storms, so a rain gauge on your
        farm would count more heavy-rain days.
      </p>
      <div className="change-grid">
        {(['heavy_rain_days', 'hot_days', 'precipitation_mm'] as const).map((measure) => (
          <ChangeChart key={measure} data={data} measure={measure} info={info[measure]} />
        ))}
      </div>
    </section>
  )
}

export default ChangeCharts
