/** Zone de livraison — Dakar, Sénégal */
export const DAKAR_CENTER: [number, number] = [14.7167, -17.4677]
export const DAKAR_LABEL = 'Dakar, Sénégal'
export const DAKAR_DEFAULT_ZOOM = 12

/** Limites approx. de la région de Dakar (carte + GPS) */
export const DAKAR_BOUNDS = {
  south: 14.55,
  north: 14.92,
  west: -17.58,
  east: -17.2,
} as const

export function isInDakar(lat: number, lng: number) {
  return (
    lat >= DAKAR_BOUNDS.south &&
    lat <= DAKAR_BOUNDS.north &&
    lng >= DAKAR_BOUNDS.west &&
    lng <= DAKAR_BOUNDS.east
  )
}

export function leafletMaxBounds(): [[number, number], [number, number]] {
  return [
    [DAKAR_BOUNDS.south, DAKAR_BOUNDS.west],
    [DAKAR_BOUNDS.north, DAKAR_BOUNDS.east],
  ]
}
