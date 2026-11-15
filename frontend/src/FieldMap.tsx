import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { CircleMarker, LayersControl, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'

const OHIO_CENTER: [number, number] = [40.3, -82.8]

// Calls onPick with the latitude and longitude of a click on the map.
function ClickToPick({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

// Moves the map to the chosen field when it changes.
function FollowField({ lat, lon }: { lat: number | null; lon: number | null }) {
  const map = useMap()
  useEffect(() => {
    if (lat !== null && lon !== null) map.setView([lat, lon], Math.max(map.getZoom(), 14))
  }, [map, lat, lon])
  return null
}

function FieldMap({
  lat,
  lon,
  onPick,
}: {
  lat: number | null
  lon: number | null
  onPick: (lat: number, lon: number) => void
}) {
  const hasField = lat !== null && lon !== null
  return (
    <MapContainer
      center={hasField ? [lat, lon] : OHIO_CENTER}
      zoom={hasField ? 14 : 7}
      className="field-map"
      scrollWheelZoom={false}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satellite (USGS)">
          <TileLayer
            url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}"
            attribution='Imagery: <a href="https://www.usgs.gov/programs/national-geospatial-program/national-map">USGS The National Map</a>'
            maxZoom={16}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Roads (OpenStreetMap)">
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={18}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <ClickToPick onPick={onPick} />
      <FollowField lat={lat} lon={lon} />
      {hasField && (
        <CircleMarker center={[lat, lon]} radius={9} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1f7a3a', fillOpacity: 1 }} />
      )}
    </MapContainer>
  )
}

export default FieldMap
