import CropIcon from '../CropIcon'
import type { CompareResponse, Rotation } from '../compareTypes'
import { formatTemperature, mmToInches } from '../units'
import { RotationEvidence } from './Evidence'
import { MonthLetters, MonthStrip, SeasonTimeline } from './MonthStrip'
import { CROP_NAMES, bareSoilPercent, bareWintersText, cropIcons, formatMonthDay, hotYears } from './helpers'
import type { Priority } from './helpers'

function RotationRow({
  rotation,
  yours,
  data,
  open,
  onToggle,
  onCompare,
  priority,
}: {
  rotation: Rotation
  yours: Rotation
  data: CompareResponse
  open: boolean
  onToggle: () => void
  onCompare: () => void
  priority: Priority
}) {
  const isYours = rotation.id === yours.id
  const pct = bareSoilPercent(rotation)
  const mm = rotation.indicators.uncovered_precipitation.mm_per_year
  // Inches lead because they depend on the field's weather; the percentage
  // mostly depends on the rotation's calendar and is much the same across Ohio.
  const diffMm = mm - yours.indicators.uncovered_precipitation.mm_per_year
  const diffIn = Math.abs(mmToInches(diffMm)).toFixed(1)
  const detailId = `detail-${rotation.id}`

  return (
    <article className={isYours ? 'rot-row rot-row--yours' : 'rot-row'}>
      <div className="rot-row__main">
        <div className="rot-row__figure">
          <span className="rot-row__pct">
            {mmToInches(mm).toFixed(1)}
            <span className="rot-row__unit"> in</span>
          </span>
          <span className="rot-row__pct-label">
            <CropIcon name="rain" size={18} decorative /> of rain and snow a year on bare soil
          </span>
          <span className="muted">
            {pct}% of the year's total, {mm} mm
          </span>
        </div>

        <div className="rot-row__text">
          <span className="icon-row" aria-hidden="true">
            {cropIcons(rotation).map((icon) => (
              <CropIcon key={icon} name={icon} size={30} decorative />
            ))}
          </span>
          <div className="rot-row__title">
            <h2>{rotation.name}</h2>
            {isYours && <span className="badge badge--dark">You grow this</span>}
          </div>
          <p className="rot-row__headline">
            {bareWintersText(rotation)}
            {!isYours && (
              <>
                {' · '}
                {diffIn === '0.0' ? 'Same as yours' : `${diffIn} in a year ${diffMm < 0 ? 'less' : 'more'} than yours`}
              </>
            )}
          </p>
          {Object.entries(rotation.indicators.sensitive_exposure).map(([cropId, exposure]) => {
            const period = data.sensitive_periods[cropId].period
            const hot = hotYears(data, cropId)
            return (
              <p key={cropId} className="rot-row__exposure">
                {CROP_NAMES[cropId]} is in its sensitive weeks ({formatMonthDay(period.start)} to {formatMonthDay(period.end)})
                {' '}1 year in {exposure.years_in_rotation}.
                {period.hot_day_threshold_c !== undefined &&
                  ` Here those weeks reached ${formatTemperature(period.hot_day_threshold_c)} in ${hot.hot} of ${hot.total} years.`}
              </p>
            )
          })}
        </div>

        <div className="rot-row__strips">
          <MonthLetters />
          {rotation.years.map((year) => (
            <MonthStrip key={year.label} year={year} monthlyMm={data.monthly_precipitation_mm} />
          ))}
        </div>
      </div>

      <div className="button-row">
        {!isYours && (
          <button type="button" className="button button--primary" onClick={onCompare}>
            Compare with mine
          </button>
        )}
        <button type="button" className="button" aria-expanded={open} aria-controls={detailId} onClick={onToggle}>
          {open ? 'Hide the season and evidence' : 'Show the season and evidence'}
        </button>
      </div>

      {open && (
        <div id={detailId} className="rot-row__detail">
          <p className="muted">{rotation.description}</p>
          <SeasonTimeline years={rotation.years} monthlyMm={data.monthly_precipitation_mm} />
          <RotationEvidence rotation={rotation} sources={data.sources} priority={priority} />
        </div>
      )}
    </article>
  )
}

export default RotationRow
