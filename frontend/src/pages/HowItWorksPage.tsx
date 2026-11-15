import { useField } from '../field'
import { useCompareData } from '../useCompareData'

function HowItWorksPage() {
  const field = useField()
  const { data, error } = useCompareData(field.lat, field.lon)

  return (
    <section className="stack">
      <h1>How it works</h1>

      {/* DRAFT TEXT: rewrite this list in your own words. */}
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
