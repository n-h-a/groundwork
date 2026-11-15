import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import CropIcon from './CropIcon'

// Simple line icons for the navbar, drawn in the text colour.
function NavIcon({ name }: { name: 'field' | 'compare' | 'weather' | 'info' }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'field' && (
        <>
          <path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z" />
          <circle cx="12" cy="10" r="2.2" />
        </>
      )}
      {name === 'compare' && (
        <>
          <rect x="4" y="4" width="6.5" height="16" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="16" rx="1.5" />
        </>
      )}
      {name === 'weather' && (
        <>
          <path d="M7 15.5a4 4 0 0 1 .4-8 5 5 0 0 1 9.6 1.2 3.4 3.4 0 0 1-.4 6.8z" />
          <path d="M9 18.5l-1 2M13 18.5l-1 2M17 18.5l-1 2" />
        </>
      )}
      {name === 'info' && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5.5M12 7.6v.1" />
        </>
      )}
    </svg>
  )
}

const PAGES = [
  { path: '/', label: 'My field', icon: 'field' },
  { path: '/compare', label: 'Compare', icon: 'compare' },
  { path: '/weather', label: 'Weather', icon: 'weather' },
  { path: '/how-it-works', label: 'How it works', icon: 'info' },
] as const

function Layout() {
  // Keep the field and answers (the ?lat=... part of the address) on every link.
  const { search } = useLocation()
  const [apiStatus, setApiStatus] = useState('Checking the data service...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setApiStatus(data.message))
      .catch(() => setApiStatus('Could not reach the data service'))
  }, [])

  return (
    <div className="page">
      <header className="site-header">
        <NavLink to={{ pathname: '/', search }} className="brand">
          <CropIcon name="wheat" size={30} decorative />
          Groundwork
        </NavLink>
        <nav aria-label="Main" className="site-nav">
          {PAGES.map((page) => (
            <NavLink key={page.path} to={{ pathname: page.path, search }} end={page.path === '/'}>
              <NavIcon name={page.icon} />
              <span>{page.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>
          Built for the NASA Space Apps Challenge 2026. Not affiliated with or endorsed by NASA. Built with help
          from an AI assistant (Claude); see the README for details.
        </p>
        <p>Status: {apiStatus}</p>
      </footer>
    </div>
  )
}

export default Layout
