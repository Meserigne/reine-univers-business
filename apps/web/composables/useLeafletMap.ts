import type { Map as LeafletMap, Marker, Polyline, CircleMarker } from 'leaflet'
import { DAKAR_CENTER, leafletMaxBounds } from '~/utils/dakar'

export { DAKAR_CENTER, DAKAR_LABEL, DAKAR_DEFAULT_ZOOM, isInDakar } from '~/utils/dakar'

export async function loadLeaflet() {
  // @ts-expect-error css side-effect
  await import('leaflet/dist/leaflet.css')
  const L = await import('leaflet')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
  return L
}

/** Driving route via public OSRM (lng,lat order) */
export async function fetchDrivingRoute(
  from: [number, number],
  to: [number, number],
): Promise<[number, number][] | null> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from[1]},${from[0]};${to[1]},${to[0]}` +
      `?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      code?: string
      routes?: Array<{ geometry: { coordinates: [number, number][] } }>
    }
    if (data.code !== 'Ok' || !data.routes?.[0]) return null
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
  } catch {
    return null
  }
}

export type MapHandles = {
  map: LeafletMap
  destMarker: Marker
  storeMarker: CircleMarker | null
  courierMarker: Marker | null
  routeLine: Polyline | null
}

/** Options carte limitées à Dakar */
export function dakarMapOptions() {
  return {
    maxBounds: leafletMaxBounds(),
    maxBoundsViscosity: 0.85,
    minZoom: 11,
  }
}

export function defaultStoreCoords(): [number, number] {
  return [...DAKAR_CENTER]
}
