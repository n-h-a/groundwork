import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SensitivePeriod } from './compareTypes'
import { formatPrecipitation, formatTemperature, mmToInches } from './units'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CROP_NAMES: Record<string, string> = { corn: 'Corn', soybean: 'Soybeans' }

const WATER_BLUE = '#2a78d6'
const GRID_GRAY = '#e1e0d9'

// "07-08" -> "Jul 8"
function formatMonthDay(monthDay: string): string {
  const [month, day] = monthDay.split('-').map(Number)
  return `${MONTH_NAMES[month - 1]} ${day}`
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function CropPeriod({ cropId, data }: { cropId: string; data: SensitivePeriod }) {
  const { period, history } = data
  const typicalRain = median(history.map((row) => row.precipitation_mm))
  // NASA POWER data is metric; the precipitation chart shows inches.
  const rows = history.map((row) => ({
    ...row,
    precipitation_in: Math.round(mmToInches(row.precipitation_mm) * 10) / 10,
  }))
  const hotYears = history.filter((row) => row.hot_days !== null && row.hot_days > 0)

  return (
    <div className="period">
      <h3>
        {CROP_NAMES[cropId] ?? cropId}: {formatMonthDay(period.start)} to {formatMonthDay(period.end)}
      </h3>
      <p>{period.description}</p>
      <p className="muted">
        {period.how_dated} {period.caveats}
      </p>

      <div className="period-charts">
        <div>
          <h4>Precipitation in the period (inches)</h4>
          <p className="muted">A typical year: {formatPrecipitation(typicalRain)}.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rows} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_GRAY} vertical={false} />
              <XAxis dataKey="year" tickLine={false} interval={4} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <Tooltip formatter={(value) => [`${value} in`, 'Precipitation']} />
              <Bar dataKey="precipitation_in" fill={WATER_BLUE} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4>Root zone soil wetness in the period</h4>
          <p className="muted">0 is completely dry, 1 is saturated. Lower points are drier years.</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_GRAY} vertical={false} />
              <XAxis dataKey="year" tickLine={false} interval={4} />
              <YAxis tickLine={false} axisLine={false} width={40} domain={[0.4, 0.8]} />
              <Tooltip formatter={(value) => [value, 'Soil wetness']} />
              <Line
                dataKey="root_zone_wetness"
                stroke={WATER_BLUE}
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {period.hot_day_threshold_c !== undefined && (
        <p>
          Days at or above {formatTemperature(period.hot_day_threshold_c)} in the period:{' '}
          {hotYears.length === 0
            ? 'none.'
            : `${hotYears.map((row) => `${row.year} (${row.hot_days})`).join(', ')}. None in the other ${
                history.length - hotYears.length
              } years.`}
        </p>
      )}
    </div>
  )
}

function SensitivePeriodCharts({ periods }: { periods: Record<string, SensitivePeriod> }) {
  return (
    <section>
      <h2>How the sensitive weeks have varied</h2>
      <p>
        Each crop has a few weeks when heat or dry weather costs the most yield. These charts show what those
        weeks were like in each year of NASA data. They describe past weather. They do not predict yield.
      </p>
      {Object.entries(periods).map(([cropId, data]) => (
        <CropPeriod key={cropId} cropId={cropId} data={data} />
      ))}
    </section>
  )
}

export default SensitivePeriodCharts
