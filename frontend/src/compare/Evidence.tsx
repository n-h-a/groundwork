import type { Fact, Rotation, Source } from '../compareTypes'
import type { TileDrained } from '../field'
import type { Priority } from './helpers'

const EFFECT_LABELS = { benefit: 'Benefit', cost: 'Cost', neutral: 'No clear change' }

const TILE_NOTES: Record<TileDrained, string | null> = {
  yes: null,
  no: 'Measured in tile-drained fields, so this may not apply to your field.',
  unsure: 'Measured in tile-drained fields. Check whether your field has tile drains.',
}

// Small numbered links to the sources of a fact, such as [1][3].
export function SourceLinks({ ids, sources }: { ids: string[]; sources: Source[] }) {
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

// Facts that do not relate to the chosen priority are dimmed, never hidden.
export function FactList({
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
    <ul className="fact-list">
      {facts.map((fact) => (
        <li key={fact.fact} className={priority !== 'all' && !fact.topics.includes(priority) ? 'dimmed' : undefined}>
          {fact.effect && <span className="tag">{EFFECT_LABELS[fact.effect]}</span>}
          {fact.fact} <SourceLinks ids={fact.sources} sources={sources} />
          {fact.tile_drained_only && TILE_NOTES[tileDrained] && <span className="tile-note">{TILE_NOTES[tileDrained]}</span>}
        </li>
      ))}
    </ul>
  )
}

// Everything the research says about one rotation.
export function RotationEvidence({
  rotation,
  sources,
  priority,
  tileDrained,
}: {
  rotation: Rotation
  sources: Source[]
  priority: Priority
  tileDrained: TileDrained
}) {
  return (
    <div className="evidence-grid">
      <div>
        <h4>For the farm</h4>
        <FactList facts={rotation.for_the_farm} sources={sources} priority={priority} tileDrained={tileDrained} />
      </div>
      <div>
        <h4>For the environment</h4>
        <FactList facts={rotation.for_the_environment} sources={sources} priority={priority} tileDrained={tileDrained} />
      </div>
      <div>
        <h4>Check locally</h4>
        <FactList facts={rotation.risks_needing_local_review} sources={sources} priority={priority} tileDrained={tileDrained} />
      </div>
      <div>
        <h4>What we don't know</h4>
        <ul className="fact-list">
          {rotation.information_gaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
