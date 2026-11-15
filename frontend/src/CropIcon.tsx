// Crop and weather icons drawn for Groundwork (24 px grid, flat colour fills
// with a darker outline). Designed on the project's design canvas.

import type { IconName } from './icons'

const LABELS: Record<IconName, string> = {
  corn: 'Corn',
  soybean: 'Soybeans',
  wheat: 'Wheat',
  clover: 'Red clover',
  rain: 'Rain',
  soil: 'Bare soil',
}

function Shapes({ name }: { name: IconName }) {
  switch (name) {
    case 'corn':
      return (
        <>
          <path d="M12 2.3c2.3 0 3.8 3.4 3.8 7.7S14.4 18.2 12 18.2 8.2 14.3 8.2 10 9.7 2.3 12 2.3z" fill="#F2C230" stroke="#8A6A10" strokeWidth="1.1" />
          <path d="M9.4 5.6h5.2M8.7 8.3h6.6M8.6 11h6.8M8.9 13.7h6.2M10.6 3.4v13.6M13.4 3.4v13.6" fill="none" stroke="#B8901A" strokeWidth="0.8" />
          <path d="M12 21.2C8 20.6 5.3 16.6 5.4 8.6c2.7 1.5 4.4 4.6 5 8.8L12 21.2z" fill="#4E9A3A" stroke="#2E6B24" strokeWidth="1.1" />
          <path d="M12 21.2c4-.6 6.7-4.6 6.6-12.6-2.7 1.5-4.4 4.6-5 8.8L12 21.2z" fill="#5FAE47" stroke="#2E6B24" strokeWidth="1.1" />
          <path d="M7.6 13.5c.6 2.4 1.9 4.6 3.6 6.2M16.4 13.5c-.6 2.4-1.9 4.6-3.6 6.2" fill="none" stroke="#2E6B24" strokeWidth="0.7" />
          <path d="M10.9 21h2.2v1.8h-2.2z" fill="#4E9A3A" stroke="#2E6B24" strokeWidth="1" />
        </>
      )
    case 'soybean':
      return (
        <>
          <path d="M18.6 4.8c.1-1.3.6-2.3 1.6-3" fill="none" stroke="#6B7A35" strokeWidth="1.5" />
          <path d="M3.4 17.2C9 14.5 15 10 18.6 4.8 12.5 3.6 5.5 8.5 3.4 17.2z" fill="#F6E7C8" stroke="#8A5A1A" strokeWidth="1.1" />
          <ellipse cx="14.7" cy="6.9" rx="2.4" ry="1.8" transform="rotate(-35 14.7 6.9)" fill="#E9D2A4" stroke="#7A5A32" strokeWidth="0.9" />
          <ellipse cx="10.6" cy="9.7" rx="2.7" ry="2.2" transform="rotate(-38 10.6 9.7)" fill="#E9D2A4" stroke="#7A5A32" strokeWidth="0.9" />
          <ellipse cx="6.8" cy="13.1" rx="2.4" ry="1.8" transform="rotate(-45 6.8 13.1)" fill="#E9D2A4" stroke="#7A5A32" strokeWidth="0.9" />
          <path d="M18.6 4.8C18.8 11 12 17.5 3.4 17.2 9 14.5 15 10 18.6 4.8z" fill="#D9952E" stroke="#8A5A1A" strokeWidth="1.1" />
          <path d="M8 15.8c2.8-.8 5.4-2.4 7.6-4.6" fill="none" stroke="#F0C060" strokeWidth="1.1" />
        </>
      )
    case 'wheat':
      return (
        <>
          <path d="M12 21.5V5.5" fill="none" stroke="#8A6512" strokeWidth="1.3" />
          <path d="M12 5.8c-1-1-1-2.4 0-3.5 1 1.1 1 2.5 0 3.5z" fill="#E3B23C" stroke="#8A6512" strokeWidth="1" />
          <path d="M12 9.6c-2.2-.2-3.6-1.7-3.8-3.9 2.2.2 3.6 1.7 3.8 3.9zM12 9.6c2.2-.2 3.6-1.7 3.8-3.9-2.2.2-3.6 1.7-3.8 3.9z" fill="#E3B23C" stroke="#8A6512" strokeWidth="1" />
          <path d="M12 13.6c-2.2-.2-3.6-1.7-3.8-3.9 2.2.2 3.6 1.7 3.8 3.9zM12 13.6c2.2-.2 3.6-1.7 3.8-3.9-2.2.2-3.6 1.7-3.8 3.9z" fill="#D9A521" stroke="#8A6512" strokeWidth="1" />
          <path d="M12 17.6c-2.2-.2-3.6-1.7-3.8-3.9 2.2.2 3.6 1.7 3.8 3.9zM12 17.6c2.2-.2 3.6-1.7 3.8-3.9-2.2.2-3.6 1.7-3.8 3.9z" fill="#CC981A" stroke="#8A6512" strokeWidth="1" />
        </>
      )
    case 'clover':
      return (
        <>
          <path d="M12 12.5v9" fill="none" stroke="#3F7D2C" strokeWidth="1.4" />
          <path d="M12 16.2c-1.8-1.6-4.6-1.8-6.6-.4 1.8 1.8 4.6 2 6.6.4z" fill="#4E9A3A" stroke="#2E6B24" strokeWidth="1" />
          <path d="M12 16.2c1.8-1.6 4.6-1.8 6.6-.4-1.8 1.8-4.6 2-6.6.4z" fill="#5FAE47" stroke="#2E6B24" strokeWidth="1" />
          <path d="M12 2.6c3 0 5.2 2.4 5.2 5.3 0 2.7-2.3 4.8-5.2 4.8s-5.2-2.1-5.2-4.8c0-2.9 2.2-5.3 5.2-5.3z" fill="#C62E46" stroke="#7E1C2C" strokeWidth="1.1" />
          <path d="M12 4v2.2M9.4 5l.9 1.8M14.6 5l-.9 1.8M8.4 7.8l1.7.7M15.6 7.8l-1.7.7M10.6 9.4l.6 1.4M13.4 9.4l-.6 1.4" fill="none" stroke="#EE8A97" strokeWidth="0.9" />
        </>
      )
    case 'rain':
      return (
        <>
          <path d="M12 3.2s-5.2 5.8-5.2 9.8a5.2 5.2 0 0 0 10.4 0c0-4-5.2-9.8-5.2-9.8z" fill="#4A90D9" stroke="#1F5FA6" strokeWidth="1.1" />
          <path d="M9.6 13.4a2.6 2.6 0 0 0 2 2.4" fill="none" stroke="#BFDCF7" strokeWidth="1.1" />
        </>
      )
    case 'soil':
      return (
        <>
          <path d="M2.5 12.5c3-1.2 6-1.2 9.5 0s6.5 1.2 9.5 0V20H2.5z" fill="#A8875E" stroke="#6B5236" strokeWidth="1.1" />
          <path d="M6 15.5h2.2M11 17h2.4M16 15.2h2.2M8 18.5h1.8M15 18.6h1.8" fill="none" stroke="#6B5236" strokeWidth="1" />
        </>
      )
  }
}

// decorative: hide from screen readers when a text label sits next to the icon.
function CropIcon({ name, size = 24, decorative = false }: { name: IconName; size?: number; decorative?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="crop-icon"
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': LABELS[name] })}
    >
      <Shapes name={name} />
    </svg>
  )
}

export default CropIcon
