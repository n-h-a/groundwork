import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CompareResponse, Fact, Rotation, Source } from './compareTypes'
import SensitivePeriodCharts from './SensitivePeriodCharts'
import { formatPrecipitation } from './units'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

const CROP_NAMES: Record<string, string> = { corn: 'Corn', soybean: 'Soybeans' }

const EFFECT_LABELS = { benefit: 'Benefit', cost: 'Cost', neutral: 'No clear change' }

// "07-08" -> "Jul 8"
function formatMonthDay(monthDay: string): string {
  const [month, day] = monthDay.split('-').map(Number)
  return `${MONTH_NAMES[month - 1]} ${day}`
}

// Small numbered links to the sources of a fact, such as [1][3].
function SourceLinks({ ids, sources }: { ids: string[]; sources: Source[] }) {
  return (
    <>
      {ids.map((id) => {
        const index = sources.findIndex((source) => source.id === id)
        if (index === -1) return null
        return (
          <a key={id} href={sources[index].url} title={sources[index].title} target="_blank" rel="noreferrer">
            [{index + 1}]
          </a>
        )
      })}
    </>
  )
}

// The farmer's priority. 'all' means nothing is highlighted.
type Priority = 'all' | 'income' | 'soil' | 'water'

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'all', label: 'Show everything' },
  { id: 'income', label: 'Farm income' },
  { id: 'soil', label: 'Soil health' },
  { id: 'water', label: 'Water downstream' },
]

// The farmer's answer to "Is your field tile-drained?"
type TileDrained = 'yes' | 'no' | 'unsure'

const TILE_NOTES: Record<TileDrained, string | null> = {
  yes: null,
  no: 'Measured in tile-drained fields, so this may not apply to your field.',
  unsure: 'Measured in tile-drained fields. Check whether your field has tile drains.',
}

// Facts that do not relate to the chosen priority are dimmed, never hidden.
function FactList({
  facts,
  sources,
  priority,
  tileDrained,
}: {
  facts: Fact[]
  sources: Source[]
  priority: Priority
  tileDrained: TileDrained
}) {
  return (
    <ul>
      {facts.map((fact) => (
        <li
          key={fact.fact}
          className={priority !== 'all' && !fact.topics.includes(priority) ? 'dimmed' : undefined}
        >
          {fact.effect && <span className="tag">{EFFECT_LABELS[fact.effect]}</span>}
          {fact.fact} <SourceLinks ids={fact.sources} sources={sources} />
          {fact.tile_drained_only && TILE_NOTES[tileDrained] && (
            <span className="tile-note">{TILE_NOTES[tileDrained]}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

// One strip of 12 months per year of the rotation.
function GroundCover({ rotation }: { rotation: Rotation }) {
  return (
    <div>
      <h4>When a living crop is on the field</h4>
      <div className="month-strip month-letters" aria-hidden="true">
        {MONTH_LETTERS.map((letter, index) => (
          <span key={index}>{letter}</span>
        ))}
      </div>
      {rotation.years.map((year) => {
        const coveredNames = year.covered_months.map((month) => MONTH_NAMES[month - 1]).join(', ')
        return (
          <div key={year.label} className="year-row">
            <div
              className="month-strip"
              role="img"
              aria-label={`${year.label}. Living crop in: ${coveredNames}.`}
            >
              {MONTH_NAMES.map((name, index) => {
                const covered = year.covered_months.includes(index + 1)
                return (
                  <span
                    key={name}
                    className={covered ? 'covered' : undefined}
                    title={`${name}: ${covered ? 'living crop' : 'no living crop'}`}
                  />
                )
              })}
            </div>
            <p className="muted">{year.label}</p>
          </div>
        )
      })}
    </div>
  )
}

function UncoveredPrecipitation({ rotation, annualMm }: { rotation: Rotation; annualMm: number }) {
  const { mm_per_year, share_of_annual } = rotation.indicators.uncovered_precipitation
  const percent = Math.round(share_of_annual * 100)
  return (
    <div>
      <h4>Precipitation falling on ground with no living crop</h4>
      <p className="stat-value">{percent}%</p>
      <div className="meter" role="img" aria-label={`${percent} percent`}>
        <div style={{ width: `${percent}%` }} />
      </div>
      <p className="muted">
        {formatPrecipitation(mm_per_year)} of {formatPrecipitation(annualMm)} in an average year
      </p>
    </div>
  )
}

function RotationCard({
  rotation,
  data,
  priority,
  tileDrained,
}: {
  rotation: Rotation
  data: CompareResponse
  priority: Priority
  tileDrained: TileDrained
}) {
  return (
    <article className="rotation-card">
      <div>
        <h3>{rotation.name}</h3>
        <p className="muted">{rotation.description}</p>
      </div>

      <GroundCover rotation={rotation} />

      <UncoveredPrecipitation rotation={rotation} annualMm={data.annual_precipitation_mm} />

      <div>
        <h4>For the farm</h4>
        <p className="muted">
          {Object.entries(rotation.indicators.sensitive_exposure).map(([cropId, exposure]) => {
            const period = data.sensitive_periods[cropId].period
            return (
              <span key={cropId}>
                {CROP_NAMES[cropId] ?? cropId} is in its sensitive period ({formatMonthDay(period.start)} to{' '}
                {formatMonthDay(period.end)}) in {exposure.years_with_crop} of every {exposure.years_in_rotation}{' '}
                years.{' '}
              </span>
            )
          })}
        </p>
        <FactList facts={rotation.for_the_farm} sources={data.sources} priority={priority} tileDrained={tileDrained} />
      </div>

      <div>
        <h4>For the environment</h4>
        <FactList facts={rotation.for_the_environment} sources={data.sources} priority={priority} tileDrained={tileDrained} />
      </div>

      <div>
        <h4>Check locally</h4>
        <FactList facts={rotation.risks_needing_local_review} sources={data.sources} priority={priority} tileDrained={tileDrained} />
      </div>

      <div>
        <h4>What we don't know</h4>
        <ul>
          {rotation.information_gaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}

// "children" is shown between the charts and the "How to read this" list.
function RotationComparison({ children }: { children?: ReactNode }) {
  const [data, setData] = useState<CompareResponse | null>(null)
  const [error, setError] = useState(false)
  const [priority, setPriority] = useState<Priority>('all')
  const [tileDrained, setTileDrained] = useState<TileDrained>('unsure')

  useEffect(() => {
    fetch('/api/compare')
      .then((res) => {
        if (!res.ok) throw new Error('Request failed')
        return res.json()
      })
      .then((json: CompareResponse) => setData(json))
      .catch(() => setError(true))
  }, [])

  if (error) return <p>Could not load the rotation comparison.</p>
  if (!data) return <p>Loading the rotation comparison...</p>

  return (
    <section className="comparison">
      <h2>Compare rotations for the {data.location.name} area</h2>
      <p>
        Three ways to rotate crops on the same field, each shown with what it means for the farm and for the
        land and water around it. These are comparisons to explore, not recommendations.
      </p>

      <div className="priorities">
        <span>What matters most to you?</span>
        {PRIORITIES.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={priority === option.id}
            onClick={() => setPriority(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {priority !== 'all' && (
        <p className="muted">
          Facts about other priorities are dimmed, not hidden. Nothing is scored or ranked.
        </p>
      )}

      <div className="priorities">
        <label htmlFor="tile-drained">Is your field tile-drained?</label>
        <select
          id="tile-drained"
          value={tileDrained}
          onChange={(event) => setTileDrained(event.target.value as TileDrained)}
        >
          <option value="unsure">Not sure</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        <span className="muted">
          Tile drains are pipes buried under a field to drain wet soil. The nitrate figures below were measured
          in tile-drained fields.
        </span>
      </div>

      <p className="legend">
        <span>
          <span className="swatch covered" />
          Living crop on the field
        </span>
        <span>
          <span className="swatch" />
          No living crop
        </span>
      </p>

      <div className="rotation-grid">
        {data.rotations.map((rotation) => (
          <RotationCard key={rotation.id} rotation={rotation} data={data} priority={priority} tileDrained={tileDrained} />
        ))}
      </div>

      <SensitivePeriodCharts periods={data.sensitive_periods} />

      {children}

      {/* DRAFT TEXT: rewrite this list in your own words. */}
      <h2>How to read this, and its limits</h2>
      <ul>
        <li>A month counts as covered only if a living crop is growing for the whole month.</li>
        <li>
          Soil: the only soil input is the tile-drain question. Soil type, slope and drainage class are not
          included yet.
        </li>
        <li>
          The precipitation figure shows exposure: how much rain and snow falls while nothing is growing. It is
          not a measurement of runoff or nutrient loss.
        </li>
        <li>
          Climate data: {data.climate_source}. It describes an area about 50 km across, not a single field.
        </li>
        <li>Crop facts come from the sources below. Most are from trials at a small number of sites.</li>
        <li>This tool supports your own judgment and local advice. It does not replace them.</li>
      </ul>

      <h2>Sources</h2>
      <ol>
        {data.sources.map((source) => (
          <li key={source.id}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.title}
            </a>
            . {source.publisher}.{source.note && <span className="muted"> {source.note}</span>}
          </li>
        ))}
      </ol>
    </section>
  )
}

export default RotationComparison
