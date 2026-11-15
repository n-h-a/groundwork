import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import CropIcon from '../CropIcon'
import FieldMap from '../FieldMap'
import type { CompareResponse } from '../compareTypes'
import { EXAMPLE_FIELD, isInOhio, useField } from '../field'
import type { RotationId, TileDrained, Tillage } from '../field'
import type { IconName } from '../icons'
import { useApi } from '../useApi'
import { formatPrecipitation, mmToInches } from '../units'

// ---------- Shapes of the API responses ----------

type CropYear = { year: number; category: string | null }

type FieldResponse = {
  crop_history: { source: string; resolution: string; years: CropYear[] }
  rotation_guess: RotationId | null
}

type Winter = {
  winter: string // "2023-24"
  winter_ndvi: number
  summer_peak_ndvi: number | null
  share_of_summer_peak: number | null
  composites_used: number
}

type WintersResponse = { source: string; method: string; winters: Winter[] }

// ---------- Labels ----------

const ROTATION_OPTIONS: { id: RotationId; label: string; icons: IconName[] }[] = [
  { id: 'corn-soybean', label: 'Corn, soybeans', icons: ['corn', 'soybean'] },
  { id: 'corn-soybean-wheat', label: 'Corn, soybeans, winter wheat', icons: ['corn', 'soybean', 'wheat'] },
  { id: 'corn-soybean-wheat-clover', label: 'Corn, soybeans, wheat with red clover', icons: ['corn', 'soybean', 'wheat', 'clover'] },
  { id: 'other', label: 'Something else', icons: [] },
]

// Crop map classes -> icons. Anything else is shown as text.
const CATEGORY_ICONS: Record<string, IconName[]> = {
  Corn: ['corn'],
  Soybeans: ['soybean'],
  'Winter Wheat': ['wheat'],
  'Dbl Crop WinWht/Soybeans': ['wheat', 'soybean'],
}

// Short names for the crop map classes most likely to turn up in Ohio, so
// they fit in a small box.
const SHORT_NAMES: Record<string, string> = {
  'Dbl Crop WinWht/Soybeans': 'Wheat, then soybeans',
  'Dbl Crop WinWht/Corn': 'Wheat, then corn',
  'Grassland/Pasture': 'Pasture',
  'Other Hay/Non Alfalfa': 'Hay',
  'Fallow/Idle Cropland': 'Fallow',
  'Clover/Wildflowers': 'Clover',
  'Sod/Grass Seed': 'Sod',
  'Developed/Open Space': 'Built-up',
  'Developed/Low Intensity': 'Built-up',
  'Developed/Med Intensity': 'Built-up',
  'Developed/High Intensity': 'Built-up',
  'Deciduous Forest': 'Forest',
  'Evergreen Forest': 'Forest',
  'Mixed Forest': 'Forest',
  'Woody Wetlands': 'Wetland',
  'Herbaceous Wetlands': 'Wetland',
  'Open Water': 'Water',
  'Nonag/Undefined': 'Not farmed',
  'Clouds/No Data': 'No data',
}

function hasWheat(category: string | null | undefined) {
  return category === 'Winter Wheat' || category === 'Dbl Crop WinWht/Soybeans'
}

// True if the crop map has a record for this point but never corn, soybeans
// or wheat: a town, a wood, a pasture, or a field of something else.
function noFieldCrops(years: CropYear[]) {
  const recorded = years.filter((row) => row.category !== null)
  return recorded.length > 0 && !recorded.some((row) => row.category! in CATEGORY_ICONS)
}

// ---------- Picking a field ----------

function FieldPicker({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  const field = useField()
  const [message, setMessage] = useState<string | null>(null)
  const [latText, setLatText] = useState('')
  const [lonText, setLonText] = useState('')

  function pick(lat: number, lon: number) {
    if (!isInOhio(lat, lon)) {
      setMessage('That point is outside Ohio. Groundwork only covers Ohio, because its crop research comes from Ohio trials.')
      return
    }
    setMessage(null)
    onPick(lat, lon)
  }

  function submitCoordinates(event: FormEvent) {
    event.preventDefault()
    const lat = Number.parseFloat(latText)
    const lon = Number.parseFloat(lonText)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setMessage('Enter a latitude and a longitude as numbers, for example 39.72 and -84.59.')
      return
    }
    pick(lat, lon)
  }

  return (
    <div className="stack-small">
      <p>Zoom in and click the middle of your field. The satellite view shows field edges.</p>
      <FieldMap lat={field.lat} lon={field.lon} onPick={pick} />
      {message && (
        <p className="notice" role="alert">
          {message}
        </p>
      )}
      <div className="picker-options">
        <button
          type="button"
          className="button button--primary"
          onClick={() => pick(EXAMPLE_FIELD.lat, EXAMPLE_FIELD.lon)}
        >
          <span className="icon-row" aria-hidden="true">
            <CropIcon name="corn" size={22} decorative />
            <CropIcon name="soybean" size={22} decorative />
          </span>
          Use the example field west of Dayton
        </button>
        <form className="coordinate-form" onSubmit={submitCoordinates}>
          <label>
            Latitude
            <input inputMode="decimal" value={latText} onChange={(e) => setLatText(e.target.value)} placeholder="39.72" />
          </label>
          <label>
            Longitude
            <input inputMode="decimal" value={lonText} onChange={(e) => setLonText(e.target.value)} placeholder="-84.59" />
          </label>
          <button type="submit" className="button">
            Use these coordinates
          </button>
        </form>
      </div>
      <p className="muted">
        Your location is only used to look up data for this field. It is kept in the page address and is not
        stored with your name or an account.
      </p>
    </div>
  )
}

// ---------- Crop history and rotation ----------

function CropHistory({ years }: { years: CropYear[] }) {
  return (
    <ol className="crop-history" aria-label="Crop grown each year">
      {years.map(({ year, category }) => {
        const icons = category ? CATEGORY_ICONS[category] : undefined
        const name = category ? (SHORT_NAMES[category] ?? category) : 'No data'
        return (
          <li key={year} title={`${year}: ${name}`}>
            <span className="crop-history__icons">
              {icons ? (
                icons.map((icon) => <CropIcon key={icon} name={icon} size={26} decorative />)
              ) : (
                <span className="crop-history__other">{name}</span>
              )}
            </span>
            <span className="crop-history__year">{year}</span>
            <span className="visually-hidden">{name}</span>
          </li>
        )
      })}
    </ol>
  )
}

function RotationChoice({ guess, chosen, onChoose }: { guess: RotationId | null; chosen: RotationId | null; onChoose: (id: RotationId) => void }) {
  const selected = chosen ?? guess
  return (
    <fieldset className="choice-group">
      <legend>Which rotation do you grow now?</legend>
      {ROTATION_OPTIONS.map((option) => (
        <label key={option.id} className="choice">
          <input type="radio" name="rotation" checked={selected === option.id} onChange={() => onChoose(option.id)} />
          <span className="icon-row" aria-hidden="true">
            {option.icons.map((icon) => (
              <CropIcon key={icon} name={icon} size={22} decorative />
            ))}
          </span>
          <span>{option.label}</span>
          {option.id === guess && <span className="badge">Matches your crop history</span>}
        </label>
      ))}
    </fieldset>
  )
}

// ---------- Winters seen from space ----------

function WintersFromSpace({ lat, lon, years }: { lat: number; lon: number; years: CropYear[] }) {
  const { data, error, loading } = useApi<WintersResponse>(`/api/field/winters?lat=${lat}&lon=${lon}`)
  const categoryByYear = new Map(years.map((row) => [row.year, row.category]))

  return (
    <div className="panel">
      <h2>Your winters, seen from space</h2>
      <p>
        NASA's MODIS satellite measures how green the ground is every 16 days. Each bar compares your field's
        greenness from December to March with its own peak the summer before. A bare field stays low; a field
        with wheat or a cover crop growing is greener.
      </p>

      {loading && (
        <p className="notice" role="status">
          Looking up five winters of satellite measurements. The first time for a field this can take up to a
          minute.
        </p>
      )}
      {error && <p className="notice">Could not load the satellite data: {error}</p>}

      {data && (
        <>
          <ul className="winter-bars">
            {data.winters.map((winter) => {
              const share = winter.share_of_summer_peak
              const percent = share === null ? null : Math.round(share * 100)
              const startYear = Number(winter.winter.slice(0, 4))
              const wheatThatWinter = hasWheat(categoryByYear.get(startYear + 1))
              return (
                <li key={winter.winter}>
                  <span className="winter-bars__label">Winter {winter.winter.replace('-', '–')}</span>
                  <span className="winter-bars__track" aria-hidden="true">
                    <span className="winter-bars__fill" style={{ width: `${Math.min(percent ?? 0, 100)}%` }} />
                  </span>
                  <span className="winter-bars__value">
                    {percent === null ? 'No summer to compare' : `${percent}% of summer green`}
                  </span>
                  {wheatThatWinter && (
                    <span className="winter-bars__note">
                      <CropIcon name="wheat" size={18} decorative /> Crop map: wheat growing
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="muted">
            {data.source}. A 250 m square can include field edges, roads or trees. Something green in winter could
            be a cover crop, wheat or weeds; the satellite cannot tell which.
          </p>
        </>
      )}
    </div>
  )
}

// ---------- Bare-soil rain ----------

function BareSoilRain({ lat, lon, rotation }: { lat: number; lon: number; rotation: RotationId | null }) {
  const { data, error, loading } = useApi<CompareResponse>(`/api/compare?lat=${lat}&lon=${lon}`)
  const match = data?.rotations.find((r) => r.id === rotation)

  return (
    <div className="panel">
      <h2>Bare-soil rain</h2>
      <p>How much of your field's yearly rain and snow falls in months when nothing is growing on it.</p>
      {loading && <p role="status">Loading NASA weather for your field...</p>}
      {error && <p className="notice">Could not load the weather data: {error}</p>}
      {/* Inches lead, as on Compare: they depend on the field's weather, while
          the percentage mostly depends on the rotation. */}
      {data && match && (
        <div className="big-figure">
          <span className="big-figure__value">
            <CropIcon name="rain" size={36} decorative />
            <span>
              {mmToInches(match.indicators.uncovered_precipitation.mm_per_year).toFixed(1)}
              <span className="big-figure__unit"> in</span>
            </span>
          </span>
          <span>
            a year on bare soil with your current rotation: {Math.round(match.indicators.uncovered_precipitation.share_of_annual * 100)}%
            of the {formatPrecipitation(data.annual_precipitation_mm)} that falls each year.
          </span>
        </div>
      )}
      {data && !match && (
        <p>
          Choose your rotation above to see this figure. If you grow something else, the Compare page shows the
          three rotations we have research for.
        </p>
      )}
    </div>
  )
}

// ---------- Questions ----------

function Questions() {
  const field = useField()
  return (
    <div className="panel">
      <h2>Two questions about your field</h2>
      <p>Your answers decide which research findings fit your field.</p>
      <div className="question-grid">
        <fieldset className="choice-group">
          <legend>How do you prepare the field?</legend>
          {(
            [
              ['no-till', 'No-till'],
              ['tilled', 'Tilled'],
              ['unsure', 'Not sure'],
            ] as [Tillage, string][]
          ).map(([value, label]) => (
            <label key={value} className="choice">
              <input type="radio" name="tillage" checked={field.tillage === value} onChange={() => field.setTillage(value)} />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset className="choice-group">
          <legend>Is the field tile-drained?</legend>
          {(
            [
              ['yes', 'Yes'],
              ['no', 'No'],
              ['unsure', 'Not sure'],
            ] as [TileDrained, string][]
          ).map(([value, label]) => (
            <label key={value} className="choice">
              <input type="radio" name="tile" checked={field.tile === value} onChange={() => field.setTile(value)} />
              {label}
            </label>
          ))}
        </fieldset>
      </div>
      <p className="muted">Tile drains are pipes buried under a field to drain wet soil.</p>
    </div>
  )
}

// ---------- The page ----------

function FieldSummary({ lat, lon }: { lat: number; lon: number }) {
  const field = useField()
  const { search } = useLocation()
  const { data, error, loading } = useApi<FieldResponse>(`/api/field?lat=${lat}&lon=${lon}`)
  const guess = data?.rotation_guess ?? null
  const { rotation: chosen, setRotation } = field
  const rotation = chosen ?? guess

  // Until the farmer picks a rotation, put the crop map's guess in the page
  // address, so Compare and the other pages start from the same rotation.
  useEffect(() => {
    if (chosen === null && guess !== null) setRotation(guess)
  }, [chosen, guess, setRotation])

  return (
    <>
      <div className="panel">
        <h2>Your rotation</h2>
        {loading && <p role="status">Loading your field's crop history...</p>}
        {error && <p className="notice">Could not load the crop history: {error}</p>}
        {data && (
          <div className="stack-small">
            <p>What the USDA crop map recorded on your field each year, from satellite imagery.</p>
            <CropHistory years={data.crop_history.years} />
            {noFieldCrops(data.crop_history.years) && (
              <p className="notice">
                The crop map shows no corn, soybeans or wheat at this point since {data.crop_history.years[0].year},
                so it may not be a crop field. Groundwork's rotations are built around those crops. If you meant
                to pick a field, choose another point.
              </p>
            )}
            <RotationChoice guess={data.rotation_guess} chosen={field.rotation} onChoose={field.setRotation} />
            <p className="muted">
              {data.crop_history.source}, {data.crop_history.resolution}. The crop map can be wrong in some
              years, so check it against what you know.
            </p>
          </div>
        )}
      </div>

      {data && <WintersFromSpace lat={lat} lon={lon} years={data.crop_history.years} />}

      <BareSoilRain lat={lat} lon={lon} rotation={rotation} />

      <Questions />

      <div className="button-row">
        <Link className="button button--primary" to={{ pathname: '/compare', search }}>
          Compare rotations for this field
        </Link>
      </div>
    </>
  )
}

function MyFieldPage() {
  const field = useField()
  const [changing, setChanging] = useState(false)

  function choose(lat: number, lon: number) {
    field.setLocation(lat, lon)
    setChanging(false)
  }

  return (
    <section className="stack">
      <div className="hero">
        <h1>Is your soil bare when the rain comes?</h1>
        <p className="lede">
          What you plant, and in what order, decides how long your soil sits bare. Groundwork uses NASA data
          for your field to show how much rain lands on bare soil, and compares rotations that would keep it
          covered.
        </p>
      </div>

      {field.hasField && field.lat !== null && field.lon !== null && !changing ? (
        <>
          <div className="field-bar">
            <span>
              Your field: {field.lat.toFixed(4)}, {field.lon.toFixed(4)}
            </span>
            <button type="button" className="button" onClick={() => setChanging(true)}>
              Choose another field
            </button>
          </div>
          <FieldSummary key={`${field.lat},${field.lon}`} lat={field.lat} lon={field.lon} />
        </>
      ) : (
        <div className="panel">
          <h2>Find your field</h2>
          <FieldPicker onPick={choose} />
        </div>
      )}
    </section>
  )
}

export default MyFieldPage
