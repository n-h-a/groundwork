import { SourceLinks } from '../compare/Evidence'
import { STRENGTH } from '../compare/evidenceLabels'
import type { CompareResponse, Fact } from '../compareTypes'
import { useField } from '../field'
import { useCompareData } from '../useCompareData'

const STRENGTH_ORDER: Fact['strength'][] = ['measured_ohio', 'measured_other_state', 'crop_calendar', 'guidance']

// Every finding once (some appear under more than one rotation), grouped by
// how it is known.
function findingsByStrength(data: CompareResponse) {
  const seen = new Map<string, { fact: Fact; rotations: string[] }>()
  for (const rotation of data.rotations) {
    for (const fact of [...rotation.for_the_farm, ...rotation.for_the_environment, ...rotation.risks_needing_local_review]) {
      const entry = seen.get(fact.fact) ?? { fact, rotations: [] }
      entry.rotations.push(rotation.name)
      seen.set(fact.fact, entry)
    }
  }
  return STRENGTH_ORDER.map((strength) => ({
    strength,
    findings: [...seen.values()].filter((entry) => entry.fact.strength === strength),
  }))
}

function HowItWorksPage() {
  const field = useField()
  const { data, error } = useCompareData(field.lat, field.lon, field.tillage, field.tile)

  return (
    <section className="stack">
      <h1>How it works</h1>

      <div>
        <h2>How to read this, and its limits</h2>
        <ul className="spaced-list">
          <li>A month counts as covered only if a living crop is growing for the whole month.</li>
          <li>
            Soil: the only soil input is the tile-drain question. Soil type, slope and drainage class are not
            included yet.
          </li>
          <li>
            The precipitation figure shows exposure: how much rain and snow falls while nothing is growing. It is
            not a measurement of runoff or nutrient loss.
          </li>
          {data && (
            <li>
              Climate data: {data.climate_source}. It describes an area about 50 km across, not a single field.
            </li>
          )}
          <li>Crop facts come from the sources below. Most are from trials at a small number of sites.</li>
          <li>This tool supports your own judgment and local advice. It does not replace them.</li>
        </ul>
      </div>

      {/* DRAFT TEXT: rewrite in your own words. */}
      <div>
        <h2>Does the research fit your field?</h2>
        <p>
          Most findings come from a few research sites farmed in a particular way. Groundwork records the
          conditions each finding was measured under and checks them against your answers on the My field page:
        </p>
        <ul className="spaced-list">
          <li>
            <strong>Tillage.</strong> The Ohio rotation trial was no-till, with wheat straw left on the field. Its
            authors think that is why corn yielded less after wheat. If you till, those results may not apply.
          </li>
          <li>
            <strong>Tile drains.</strong> The nitrate and phosphorus figures come from tile-drained fields.
          </li>
          <li>
            <strong>Distance.</strong> For trial results, Groundwork shows how far the nearest trial site is from
            your field.
          </li>
        </ul>
        <p>
          A finding that may not apply is not wrong; it was measured somewhere that differs from your field in a
          way that could matter.
        </p>
      </div>

      <div>
        <h2>How strong is each finding?</h2>
        <p>Every finding in Groundwork carries one of four labels. These are our own judgement of each source.</p>
        {error && <p>Could not load the findings.</p>}
        {!error && !data && <p>Loading...</p>}
        {data &&
          findingsByStrength(data).map(({ strength, findings }) => (
            <details key={strength} className="strength-group">
              <summary>
                <span className={`strength strength--${strength}`}>{STRENGTH[strength].label}</span>
                <span>
                  {STRENGTH[strength].explanation} ({findings.length} {findings.length === 1 ? 'finding' : 'findings'})
                </span>
              </summary>
              <ul className="fact-list">
                {findings.map(({ fact, rotations }) => (
                  <li key={fact.fact}>
                    {fact.fact} <SourceLinks ids={fact.sources} sources={data.sources} />
                    <span className="muted"> {rotations.join('; ')}</span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
      </div>

      <div>
        <h2>Sources</h2>
        {error && <p>Could not load the list of sources.</p>}
        {!error && !data && <p>Loading...</p>}
        {data && (
          <ol className="spaced-list">
            {data.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
                . {source.publisher}.{source.note && <span className="muted"> {source.note}</span>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

export default HowItWorksPage
