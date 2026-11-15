import type { Fact, Rotation, Source } from '../compareTypes'
import { FIT, STRENGTH } from './evidenceLabels'
import type { Priority } from './helpers'

const EFFECT_LABELS = { benefit: 'Benefit', cost: 'Cost', neutral: 'No clear change' }

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

// Whether the research behind a fact matches the farmer's field.
function FitNote({ fit }: { fit: Fact['fit'] }) {
  if (fit.status === 'general') return null
  return (
    <span className={`fit fit--${fit.status}`}>
      <strong>{FIT[fit.status]}.</strong> {fit.notes.join(' ')}
    </span>
  )
}

// Facts that do not relate to the chosen priority are dimmed, never hidden.
export function FactList({ facts, sources, priority }: { facts: Fact[]; sources: Source[]; priority: Priority }) {
  return (
    <ul className="fact-list">
      {facts.map((fact) => (
        <li key={fact.fact} className={priority !== 'all' && !fact.topics.includes(priority) ? 'dimmed' : undefined}>
          <span className="fact-labels">
            {fact.effect && <span className="tag">{EFFECT_LABELS[fact.effect]}</span>}
            <span className={`strength strength--${fact.strength}`} title={STRENGTH[fact.strength].explanation}>
              {STRENGTH[fact.strength].label}
            </span>
          </span>
          {fact.fact} <SourceLinks ids={fact.sources} sources={sources} />
          <FitNote fit={fact.fit} />
        </li>
      ))}
    </ul>
  )
}

// Everything the research says about one rotation.
export function RotationEvidence({ rotation, sources, priority }: { rotation: Rotation; sources: Source[]; priority: Priority }) {
  return (
    <div className="evidence-grid">
      <div>
        <h4>For the farm</h4>
        <FactList facts={rotation.for_the_farm} sources={sources} priority={priority} />
      </div>
      <div>
        <h4>For the environment</h4>
        <FactList facts={rotation.for_the_environment} sources={sources} priority={priority} />
      </div>
      <div>
        <h4>Check locally</h4>
        <FactList facts={rotation.risks_needing_local_review} sources={sources} priority={priority} />
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
