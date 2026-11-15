import { useEffect, useState } from 'react'
import './App.css'
import ClimateCharts from './ClimateCharts'

function App() {
  const [apiStatus, setApiStatus] = useState('Checking API...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setApiStatus(data.message))
      .catch(() => setApiStatus('Could not reach the API'))
  }, [])

  return (
    <main>
      <h1>Groundwork</h1>
      <p>{apiStatus}</p>
      <ClimateCharts />
    </main>
  )
}

export default App
