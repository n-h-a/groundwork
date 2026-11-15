import RotationComparison from '../RotationComparison'
import { useField } from '../field'
import { useCompareData } from '../useCompareData'

function ComparePage() {
  const field = useField()
  const { data, error } = useCompareData(field.lat, field.lon)

  if (error) return <p>Could not load the rotation comparison.</p>
  if (!data) return <p>Loading the rotation comparison...</p>

  return <RotationComparison data={data} placeName={field.hasField ? 'your field' : 'the Dayton, OH area'} />
}

export default ComparePage
