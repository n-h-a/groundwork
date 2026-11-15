import CropIcon from '../CropIcon'
import type { RotationYear } from '../compareTypes'
import { CROP_ICON } from '../icons'
import { formatPrecipitation } from '../units'
import { CROP_NAMES, MONTH_LETTERS, MONTH_NAMES } from './helpers'

// One year of a rotation: 12 month squares (green = crop growing, brown =
// bare soil) with each month's average precipitation drawn underneath, dark
// blue where it falls on bare soil.
export function MonthStrip({ year, monthlyMm }: { year: RotationYear; monthlyMm: number[] }) {
  const maxMm = Math.max(...monthlyMm)
  const iconCrops = year.crops.filter((crop) => CROP_ICON[crop])
  return (
    <div className="strip">
      <div className="strip__months" role="img" aria-label={`${year.label}. Crop growing in ${year.covered_months.map((m) => MONTH_NAMES[m - 1]).join(', ')}.`}>
        {MONTH_NAMES.map((name, index) => {
          const covered = year.covered_months.includes(index + 1)
          const mm = monthlyMm[index]
          return (
            <span key={name} className="strip__month" title={`${name}: ${covered ? 'crop growing' : 'bare soil'}, ${formatPrecipitation(mm)} of precipitation on average`}>
              <span className={covered ? 'strip__cell strip__cell--covered' : 'strip__cell'} />
              <span className="strip__rain-area">
                <span className={covered ? 'strip__rain strip__rain--covered' : 'strip__rain'} style={{ height: `${Math.round((mm / maxMm) * 100)}%` }} />
              </span>
            </span>
          )
        })}
      </div>
      <span className="strip__label">
        <span className="icon-row" aria-hidden="true">
          {iconCrops.map((crop) => (
            <CropIcon key={crop} name={CROP_ICON[crop]} size={18} decorative />
          ))}
        </span>
        {year.label}
      </span>
    </div>
  )
}

export function MonthLetters() {
  return (
    <div className="strip__letters" aria-hidden="true">
      {MONTH_LETTERS.map((letter, index) => (
        <span key={index}>{letter}</span>
      ))}
    </div>
  )
}

// The full season view: one row per year, with crop icons where each crop
// starts, planting and harvest markers, and precipitation.
export function SeasonTimeline({ years, monthlyMm }: { years: RotationYear[]; monthlyMm: number[] }) {
  const maxMm = Math.max(...monthlyMm)
  return (
    <div className="timeline">
      <div className="timeline__legend">
        <span><span className="dot dot--plant" /> Planted or seeded</span>
        <span><span className="dot dot--harvest" /> Harvested or ended</span>
      </div>
      {years.map((year) => (
        <div key={year.label} className="timeline__year">
          <span className="timeline__year-label">{year.label}</span>
          <div className="timeline__grid">
            {MONTH_NAMES.map((name, index) => {
              const month = index + 1
              const span = year.spans.find((s) => s.months.includes(month))
              const startsHere = span && span.months[0] === month
              const events = year.events.filter((e) => e.month === month)
              const planted = events.some((e) => e.type === 'plant')
              const ended = events.some((e) => e.type !== 'plant')
              const description = [
                `${name}: ${span ? `${CROP_NAMES[span.crop]} growing` : 'bare soil'}`,
                ...events.map((e) => `${CROP_NAMES[e.crop]} ${e.type === 'plant' ? 'planted' : e.type === 'harvest' ? 'harvested' : 'ended'}`),
                `${formatPrecipitation(monthlyMm[index])} of precipitation on average`,
              ].join('. ')
              return (
                <div key={name} className="timeline__month" title={description}>
                  <span className="timeline__markers">
                    {planted && <span className="dot dot--plant" />}
                    {ended && <span className="dot dot--harvest" />}
                  </span>
                  <span className={span ? 'timeline__band timeline__band--covered' : 'timeline__band'}>
                    {startsHere && CROP_ICON[span.crop] && <CropIcon name={CROP_ICON[span.crop]} size={22} decorative />}
                  </span>
                  <span className="timeline__rain-area">
                    <span className={span ? 'strip__rain strip__rain--covered' : 'strip__rain'} style={{ height: `${Math.round((monthlyMm[index] / maxMm) * 100)}%` }} />
                  </span>
                  <span className="timeline__letter">{MONTH_LETTERS[index]}</span>
                  <span className="visually-hidden">{description}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
