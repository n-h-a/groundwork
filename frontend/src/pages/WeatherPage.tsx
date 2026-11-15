import ClimateCharts from '../ClimateCharts'
import SensitivePeriodCharts from '../SensitivePeriodCharts'
import { useField } from '../field'
import { useCompareData } from '../useCompareData'

function WeatherPage() {
  const field = useField()
  const { data, error } = useCompareData(field.lat, field.lon)

  return (
    <section className="stack">
      <div>
        <h1>Weather</h1>
        <p className="lede">
          What the weather has been like {field.hasField ? 'at your field' : 'in the Dayton area'}, from NASA
          data for 1991 to 2025.
        </p>
      </div>

      {error && <p>Could not load the weather data.</p>}
      {!error && !data && <p>Loading the weather data...</p>}
      {data && <SensitivePeriodCharts periods={data.sensitive_periods} />}

      {/* Monthly averages are still for Dayton; phase 6 moves them to the chosen field. */}
      <ClimateCharts />
    </section>
  )
}

export default WeatherPage
