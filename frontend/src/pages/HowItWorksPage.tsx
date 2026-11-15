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

  // DRAFT TEXT: every section on this page is worth rewording in your own words.
  return (
    <section className="stack">
      <div>
        <h1>How it works</h1>
        <p className="lede">
          Groundwork puts NASA climate and satellite data, the USDA crop map and published Ohio research side by
          side for one field. Every number is a plain calculation described on this page; nothing is predicted by
          a model or written by AI while you use it.
        </p>
      </div>

      <div>
        <h2>Where the data comes from</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Used for</th>
                <th scope="col">Detail</th>
                <th scope="col">Years</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <a href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer">
                    NASA POWER
                  </a>{' '}
                  daily data (MERRA-2): precipitation, daily high, root zone soil wetness
                </th>
                <td>Bare-soil rain, sensitive weeks, the Weather page</td>
                <td>An area about 50 km across</td>
                <td>1991–2025</td>
              </tr>
              <tr>
                <th scope="row">
                  <a href="https://lpdaac.usgs.gov/products/mod13q1v061/" target="_blank" rel="noreferrer">
                    NASA MODIS
                  </a>{' '}
                  vegetation index (MOD13Q1 NDVI), through the ORNL DAAC
                </th>
                <td>Your winters, seen from space</td>
                <td>250 m squares, every 16 days</td>
                <td>The last five winters</td>
              </tr>
              <tr>
                <th scope="row">
                  <a href="https://www.nass.usda.gov/Research_and_Science/Cropland/SARS1a.php" target="_blank" rel="noreferrer">
                    USDA Cropland Data Layer
                  </a>
                  , through CroplandCROS
                </th>
                <td>Your crop history and the rotation guess</td>
                <td>30 m squares (10 m from 2024)</td>
                <td>2008–2025</td>
              </tr>
              <tr>
                <th scope="row">Ohio research and extension (sources below)</th>
                <td>The findings on Compare</td>
                <td>Mostly a few research sites</td>
                <td>Varies</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted">Map images: USGS National Map imagery and OpenStreetMap.</p>
      </div>

      <div>
        <h2>How each number is worked out</h2>
        <ul className="spaced-list">
          <li>
            <strong>Rain and snow on bare soil.</strong> For each calendar month, the average precipitation at your
            field over 1991–2025. Each rotation has a calendar of when a living crop is growing, based on typical
            Ohio planting and harvest dates. A month counts as covered only if a crop is growing for the whole
            month. The figure is the precipitation in uncovered months, averaged over the years of the rotation.
            The percentage is that figure as a share of the year's total.
          </li>
          <li>
            <strong>Your crop history and rotation guess.</strong> The crop the USDA map recorded at your point
            each year. If the last six years were only corn and soybeans, Groundwork guesses corn and soybeans; if
            wheat appears as well, corn, soybeans and wheat. Otherwise it makes no guess. You can always change it.
          </li>
          <li>
            <strong>Your winters, seen from space.</strong> For each winter (December to March), the middle value
            of the cloud-free MODIS measurements, shown as a share of the field's greenest point the summer before
            (June to September). A higher share means more was growing. Groundwork never says a field had a cover
            crop: an Indiana study found this kind of measurement alone is not enough to tell (
            <a href="https://doi.org/10.3390/rs13101998" target="_blank" rel="noreferrer">
              Remote Sensing, 2021
            </a>
            ).
          </li>
          <li>
            <strong>Sensitive weeks.</strong> The weeks when heat or dry weather costs corn and soybeans the most
            yield, dated from Ohio crop progress reports. For each year, the precipitation, average soil wetness
            and, for corn, the number of days at 95 °F or hotter in those weeks.
          </li>
          <li>
            <strong>Is it changing?</strong> The NASA record split into 1991–2007 and 2008–2025. For each half, the
            average number of days with 1 inch or more of rain, the average number of days at 90 °F or hotter,
            and the average yearly precipitation. These thresholds are round numbers chosen to be easy to picture,
            not research cutoffs.
          </li>
        </ul>
      </div>

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
        <h2>Limits</h2>
        <ul className="spaced-list">
          <li>
            The bare-soil figure shows exposure: how much rain and snow falls while nothing is growing. It is not
            a measurement of runoff, erosion or nutrient loss.
          </li>
          <li>
            NASA POWER describes an area about 50 km across. It smooths out local storms, so it counts fewer
            heavy-rain days than a rain gauge on your farm would.
          </li>
          <li>
            A 250 m MODIS square is bigger than many fields, so it can include field edges, roads, trees or a
            neighbour's field.
          </li>
          <li>The USDA crop map is sometimes wrong for a single point and year, especially near field edges.</li>
          <li>
            Soil: the only soil input is the tile-drain question. Soil type, slope and drainage class are not
            included yet.
          </li>
          <li>Crop calendars are statewide typical dates. Your planting and harvest dates may differ.</li>
          <li>
            Groundwork covers Ohio only, because its crop research comes from Ohio. It supports your own judgement
            and local advice. It does not replace them.
          </li>
        </ul>
      </div>

      <div>
        <h2>Your location</h2>
        <p>
          The point you choose is sent to the Groundwork server, which looks it up in the services above. The
          results are saved on the server by coordinates so the next visit is faster. Nothing else about you is
          collected.
        </p>
      </div>

      <div>
        <h2>How AI was used</h2>
        <p>
          Groundwork was built for the NASA Space Apps Challenge 2026 with help from Claude, an AI assistant made
          by Anthropic. Claude helped with planning the project, finding data services, writing code and tests, designing the
          icons, and drafting page text. The Groundwork team reviewed every change, wrote code, came up with ideas, read the research sources, and checked
          the findings against them. The tool itself uses no AI: everything you see is calculated from the data
          above or quoted from the sources below.
        </p>
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
