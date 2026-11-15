import { Link, useLocation } from 'react-router'
import CropIcon from '../CropIcon'
import { EXAMPLE_FIELD, useField } from '../field'

function MyFieldPage() {
  const field = useField()
  const { search } = useLocation()

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

      <div className="panel">
        <h2>Your field</h2>
        {field.hasField ? (
          <>
            <p>
              Field at {field.lat}, {field.lon}.
            </p>
            <div className="button-row">
              <Link className="button button--primary" to={{ pathname: '/compare', search }}>
                Compare rotations for this field
              </Link>
              <button type="button" className="button" onClick={field.clearField}>
                Choose another field
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Picking your field on a map is coming next. For now, try the example field.</p>
            <div className="button-row">
              <button
                type="button"
                className="button button--primary"
                onClick={() => field.setLocation(EXAMPLE_FIELD.lat, EXAMPLE_FIELD.lon)}
              >
                <span className="icon-row" aria-hidden="true">
                  <CropIcon name="corn" size={22} decorative />
                  <CropIcon name="soybean" size={22} decorative />
                </span>
                Use the example field west of Dayton
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default MyFieldPage
