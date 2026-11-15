import { useEffect, useState } from 'react'
import './App.css'
import ClimateCharts from './ClimateCharts'
import RotationComparison from './RotationComparison'

function App() {
  const [apiStatus, setApiStatus] = useState('Checking API...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setApiStatus(data.message))
      .catch(() => setApiStatus('Could not reach the API'))
  }, [])

  return (
    <div className="page">
      <header>
        <h1>Groundwork</h1>
        <p className="lede">
          What you plant, and in what order, affects your farm and the land and water around it. Groundwork
          puts NASA climate data next to published crop research so you can compare rotations on both.
        </p>
      </header>

      <main>
        <RotationComparison>
          <ClimateCharts />
        </RotationComparison>
      </main>

      <footer>
        <p>
          Built for the NASA Space Apps Challenge 2026. Not affiliated with or endorsed by NASA. Built with help
          from an AI assistant (Claude); see the README for details.
        </p>
        <p>Status: {apiStatus}</p>
      </footer>
    </div>
  )
}

export default App
