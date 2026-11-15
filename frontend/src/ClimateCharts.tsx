import { useEffect, useState } from 'react'
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

// Shape of the response from GET /api/climate.
// The series are keyed by "YYYYMM", for example "202507" for July 2025.
type ClimateResponse = {
  location: { name: string }
  source: string
  temperature: Record<string, number>
  precipitation: Record<string, number>
}

type MonthRow = {
  month: string
  temperature: number // average, in °C
  precipitation: number // average monthly total, in mm
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS_IN_MONTH = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

// Average the values for one calendar month (1-12) across all years.
// This also skips NASA POWER's extra month "13", which is the annual average.
function averageForMonth(series: Record<string, number>, month: number): number {
  const suffix = String(month).padStart(2, '0')
  const values = Object.entries(series)
    .filter(([key]) => key.endsWith(suffix))
    .map(([, value]) => value)
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function toMonthRows(data: ClimateResponse): MonthRow[] {
  return MONTH_NAMES.map((name, index) => {
    const temperature = averageForMonth(data.temperature, index + 1)
    // NASA POWER gives precipitation as mm per day; multiply by the number
    // of days to get a monthly total.
    const precipitation = averageForMonth(data.precipitation, index + 1) * DAYS_IN_MONTH[index]
    return {
      month: name,
      temperature: Math.round(temperature * 10) / 10,
      precipitation: Math.round(precipitation),
    }
  })
}

function ClimateCharts() {
  const [data, setData] = useState<ClimateResponse | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/climate')
      .then((res) => {
        if (!res.ok) throw new Error('Request failed')
        return res.json()
      })
      .then((json: ClimateResponse) => setData(json))
      .catch(() => setError(true))
  }, [])

  if (error) return <p>Could not load climate data.</p>
  if (!data) return <p>Loading climate data...</p>

  const rows = toMonthRows(data)

  return (
    <section>
      <h2>Climate in {data.location.name}</h2>
      <p>Monthly averages for 1991-2025. Source: {data.source}.</p>

      <h3>Average temperature (°C)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#e5e4e0" vertical={false} />
          <XAxis dataKey="month" tickLine={false} />
          <YAxis tickLine={false} axisLine={false} width={40} />
          <Tooltip formatter={(value) => [`${value} °C`, 'Temperature']} />
          <Line
            dataKey="temperature"
            stroke="#eb6834"
            strokeWidth={2}
            dot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <h3>Average precipitation, rain plus melted snow (mm per month)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#e5e4e0" vertical={false} />
          <XAxis dataKey="month" tickLine={false} />
          <YAxis tickLine={false} axisLine={false} width={40} />
          <Tooltip formatter={(value) => [`${value} mm`, 'Precipitation']} />
          <Bar
            dataKey="precipitation"
            fill="#2a78d6"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}

export default ClimateCharts
