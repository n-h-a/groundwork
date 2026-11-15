import { Route, Routes } from 'react-router'
import './App.css'
import Layout from './Layout'
import ComparePage from './pages/ComparePage'
import HowItWorksPage from './pages/HowItWorksPage'
import MyFieldPage from './pages/MyFieldPage'
import WeatherPage from './pages/WeatherPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<MyFieldPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="weather" element={<WeatherPage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="*" element={<p>Page not found.</p>} />
      </Route>
    </Routes>
  )
}

export default App
