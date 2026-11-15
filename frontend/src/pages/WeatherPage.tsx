import ChangeCharts from '../ChangeCharts'
import ClimateCharts from '../ClimateCharts'
import SensitivePeriodCharts from '../SensitivePeriodCharts'
import { useField } from '../field'
import { useApi } from '../useApi'
import { useCompareData } from '../useCompareData'
import type { WeatherResponse } from '../weatherTypes'

function WeatherPage() {
  const field = useField()
  const query = field.hasField ? `?lat=${field.lat}&lon=${field.lon}` : ''
  const weather = useApi<WeatherResponse>(`/api/weather${query}`)
  const compare = useCompareData(field.lat, field.lon)

  return (
    <section className="stack">
      <div>
        <h1>Weather</h1>
        <p className="lede">
          What the weather has been like {field.hasField ? 'at your field' : 'in the Dayton area'}, from NASA data
          for 1991 to 2025.
        </p>
        {weather.data && <p className="muted">Source: {weather.data.source}.</p>}
      </div>

      {weather.error && <p>Could not load the weather data.</p>}
      {weather.loading && <p>Loading the weather data...</p>}
      {weather.data && <ClimateCharts data={weather.data} />}
      {weather.data && <ChangeCharts data={weather.data} />}

      {compare.error && <p>Could not load the sensitive weeks.</p>}
      {compare.data && <SensitivePeriodCharts periods={compare.data.sensitive_periods} />}
    </section>
  )
}

export default WeatherPage
