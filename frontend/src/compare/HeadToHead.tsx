import type { ReactNode } from 'react'
import CropIcon from '../CropIcon'
import type { CompareResponse, Rotation } from '../compareTypes'
import type { TileDrained } from '../field'
import { formatPrecipitation, mmToInches } from '../units'
import { FactList } from './Evidence'
import { MonthLetters, MonthStrip } from './MonthStrip'
import { PRIORITIES, bareSoilPercent, bareWintersText, cropIcons, factsAbout } from './helpers'
import type { Priority } from './helpers'

function Row({ label, yours, alt }: { label: string; yours: ReactNode; alt: ReactNode }) {
  return (
    <div className="h2h__row">
      <span className="h2h__label">{label}</span>
      <div className="h2h__cell">{yours}</div>
      <div className="h2h__cell h2h__cell--alt">{alt}</div>
    </div>
  )
}

function Heading({ rotation, badge, badgeClass }: { rotation: Rotation; badge: string; badgeClass: string }) {
  return (
    <div className="h2h__heading">
      <span className="icon-row" aria-hidden="true">
        {cropIcons(rotation).map((icon) => (
          <CropIcon key={icon} name={icon} size={26} decorative />
        ))}
      </span>
      <strong>{rotation.name}</strong>
      <span className={badgeClass}>{badge}</span>
    </div>
  )
}

// Your rotation against one alternative, side by side.
function HeadToHead({
  yours,
  alt,
  data,
  priority,
  tileDrained,
  onClose,
}: {
  yours: Rotation
  alt: Rotation
  data: CompareResponse
  priority: Priority
  tileDrained: TileDrained
  onClose: () => void
}) {
  const yoursPct = bareSoilPercent(yours)
  const altPct = bareSoilPercent(alt)
  const diff = altPct - yoursPct
  const diffIn = mmToInches(alt.indicators.uncovered_precipitation.mm_per_year - yours.indicators.uncovered_precipitation.mm_per_year)
  const months = data.monthly_precipitation_mm
  const exposure = (rotation: Rotation, crop: string) => {
    const e = rotation.indicators.sensitive_exposure[crop]
    return e ? `${e.years_with_crop} year in ${e.years_in_rotation}` : 'Not grown'
  }
  // The chosen priority comes first; the others follow.
  const topics = PRIORITIES.filter((p) => p.id !== 'all').sort((a, b) => Number(b.id === priority) - Number(a.id === priority))

  return (
    <section className="h2h" aria-labelledby="h2h-title">
      <div className="h2h__top">
        <h2 id="h2h-title">What would change if you switched?</h2>
        <button type="button" className="button" onClick={onClose}>
          Close comparison
        </button>
      </div>

      <div className="h2h__band">
        <div>
          <span className="muted">Rain and snow on bare soil, yours</span>
          <span className="h2h__pct">{yoursPct}%</span>
        </div>
        <div className="h2h__diff">
          <span className={diff < 0 ? 'h2h__diff-value h2h__diff-value--better' : 'h2h__diff-value'}>
            {diff > 0 ? '+' : ''}
            {diff} points
          </span>
          <span className="muted">
            {Math.abs(diffIn).toFixed(1)} in {diff < 0 ? 'less' : 'more'} rain landing on bare soil each year
          </span>
        </div>
        <div className="h2h__band-alt">
          <span className="muted">If you switched</span>
          <span className="h2h__pct h2h__pct--alt">{altPct}%</span>
        </div>
      </div>

      <div className="h2h__table">
        <Row
          label=""
          yours={<Heading rotation={yours} badge="You grow this" badgeClass="badge badge--dark" />}
          alt={<Heading rotation={alt} badge="Alternative" badgeClass="badge" />}
        />
        <Row
          label="When the field is covered"
          yours={
            <>
              <MonthLetters />
              {yours.years.map((y) => <MonthStrip key={y.label} year={y} monthlyMm={months} />)}
            </>
          }
          alt={
            <>
              <MonthLetters />
              {alt.years.map((y) => <MonthStrip key={y.label} year={y} monthlyMm={months} />)}
            </>
          }
        />
        <Row
          label="Bare-soil rain"
          yours={`${yoursPct}%, ${formatPrecipitation(yours.indicators.uncovered_precipitation.mm_per_year)} a year`}
          alt={`${altPct}%, ${formatPrecipitation(alt.indicators.uncovered_precipitation.mm_per_year)} a year`}
        />
        <Row label="Winters" yours={bareWintersText(yours)} alt={bareWintersText(alt)} />
        <Row label="Corn in its sensitive weeks" yours={exposure(yours, 'corn')} alt={exposure(alt, 'corn')} />
        {topics.map((topic) => (
          <Row
            key={topic.id}
            label={topic.label}
            yours={<FactList facts={factsAbout(yours, topic.id as Exclude<Priority, 'all'>)} sources={data.sources} priority="all" tileDrained={tileDrained} />}
            alt={<FactList facts={factsAbout(alt, topic.id as Exclude<Priority, 'all'>)} sources={data.sources} priority="all" tileDrained={tileDrained} />}
          />
        ))}
      </div>
    </section>
  )
}

export default HeadToHead
