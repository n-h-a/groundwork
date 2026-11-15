import { useRef, useState } from 'react'
import CropIcon from './CropIcon'
import HeadToHead from './compare/HeadToHead'
import RotationRow from './compare/RotationRow'
import { BASELINE_IDS, PRIORITIES, cropIcons } from './compare/helpers'
import type { Priority } from './compare/helpers'
import type { CompareResponse } from './compareTypes'
import { useField } from './field'
import type { TileDrained } from './field'

function RotationComparison({ data, placeName }: { data: CompareResponse; placeName: string }) {
  const field = useField()
  const [priority, setPriority] = useState<Priority>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [compareId, setCompareId] = useState<string | null>(null)
  const headToHeadRef = useRef<HTMLDivElement>(null)

  // Your rotation is the baseline. If you grow something else, or haven't
  // said, corn and soybeans (the most common Ohio rotation) is used.
  const yoursId = field.rotation && BASELINE_IDS.includes(field.rotation) ? field.rotation : 'corn-soybean'
  const yours = data.rotations.find((r) => r.id === yoursId) ?? data.rotations[0]
  const alt = data.rotations.find((r) => r.id === compareId && r.id !== yours.id) ?? null

  function startComparison(id: string) {
    setCompareId(id)
    // Wait for the comparison to render, then bring it into view.
    requestAnimationFrame(() => headToHeadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <section className="comparison stack">
      <div>
        <h1>Compare rotations for {placeName}</h1>
        <p className="lede">
          Three ways to rotate crops on the same field, each shown with what it means for the farm and for the
          land and water around it. These are comparisons to explore, not recommendations.
        </p>
      </div>

      <div className="controls">
        <div className="controls__group">
          <span className="controls__label">What do you grow now?</span>
          <div className="controls__options">
            {data.rotations.map((rotation) => (
              <button
                key={rotation.id}
                type="button"
                className="option"
                aria-pressed={rotation.id === yours.id}
                onClick={() => field.setRotation(rotation.id as typeof yoursId)}
              >
                <span className="icon-row" aria-hidden="true">
                  {cropIcons(rotation).map((icon) => (
                    <CropIcon key={icon} name={icon} size={22} decorative />
                  ))}
                </span>
                {rotation.name}
              </button>
            ))}
          </div>
          {field.rotation === 'other' && (
            <p className="muted">You grow something else, so corn and soybeans is shown as the starting point.</p>
          )}
        </div>

        <div className="controls__group">
          <span className="controls__label">What matters most to you?</span>
          <div className="controls__options">
            {PRIORITIES.map((option) => (
              <button
                key={option.id}
                type="button"
                className="option"
                aria-pressed={priority === option.id}
                onClick={() => setPriority(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {priority !== 'all' && (
            <p className="muted">In the evidence, facts about other priorities are dimmed, not hidden. Nothing is scored or ranked.</p>
          )}
        </div>

        <div className="controls__group controls__group--inline">
          <label className="controls__label" htmlFor="tile-drained">
            Is your field tile-drained?
          </label>
          <select id="tile-drained" value={field.tile} onChange={(event) => field.setTile(event.target.value as TileDrained)}>
            <option value="unsure">Not sure</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <span className="muted">The nitrate figures were measured in tile-drained fields.</span>
        </div>
      </div>

      <div ref={headToHeadRef}>
        {alt && (
          <HeadToHead
            yours={yours}
            alt={alt}
            data={data}
            priority={priority}
            tileDrained={field.tile}
            onClose={() => setCompareId(null)}
          />
        )}
      </div>

      <p className="legend">
        <span><span className="swatch swatch--covered" /> Crop growing</span>
        <span><span className="swatch" /> Bare soil</span>
        <span><span className="swatch swatch--rain" /> Rain on bare soil</span>
        <span><span className="swatch swatch--rain-light" /> Rain on a crop</span>
        <span>One square per month, January to December.</span>
      </p>

      <div className="rot-list">
        {data.rotations.map((rotation) => (
          <RotationRow
            key={rotation.id}
            rotation={rotation}
            yours={yours}
            data={data}
            open={openId === rotation.id}
            onToggle={() => setOpenId(openId === rotation.id ? null : rotation.id)}
            onCompare={() => startComparison(rotation.id)}
            priority={priority}
            tileDrained={field.tile}
          />
        ))}
      </div>
    </section>
  )
}

export default RotationComparison
