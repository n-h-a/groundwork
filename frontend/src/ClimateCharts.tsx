import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { GRID_GRAY, HEAT_ORANGE, RAIN_BLUE } from './chartColors'
import { celsiusToFahrenheit, mmToInches } from './units'
import type { WeatherResponse } from './weatherTypes'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// The average year at the field: monthly precipitation and daily highs.
function ClimateCharts({ data }: { data: WeatherResponse }) {
  // NASA POWER data is metric; the page shows US units.
  const rows = data.monthly.map((row) => ({
    month: MONTH_NAMES[row.month - 1],
    high: Math.round(celsiusToFahrenheit(row.high_c)),
    precipitation: Math.round(mmToInches(row.precipitation_mm) * 10) / 10,
  }))

  return (
    <section>
      <h2>An average year here</h2>
      <p className="muted">Monthly averages for 1991 to 2025.</p>

      <div className="period-charts">
        <div>
          <h3>Rain and melted snow (inches a month)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rows} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_GRAY} vertical={false} />
              <XAxis dataKey="month" tickLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <Tooltip formatter={(value) => [`${value} in`, 'Precipitation']} />
              <Bar dataKey="precipitation" fill={RAIN_BLUE} radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3>Average daily high (°F)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={rows} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_GRAY} vertical={false} />
              <XAxis dataKey="month" tickLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <Tooltip formatter={(value) => [`${value} °F`, 'Average high']} />
              <Line dataKey="high" stroke={HEAT_ORANGE} strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}

export default ClimateCharts
