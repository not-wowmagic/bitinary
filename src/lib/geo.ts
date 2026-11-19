const EARTH_RADIUS_KM = 6371

export type GeoPoint = { lat: number; lng: number }

export function isGeoPoint(point: unknown): point is GeoPoint {
  if (typeof point !== 'object' || point === null) return false
  const coordinates = point as Record<string, unknown>
  return typeof coordinates.lat === 'number' && Number.isFinite(coordinates.lat) && coordinates.lat >= -90 && coordinates.lat <= 90 && typeof coordinates.lng === 'number' && Number.isFinite(coordinates.lng) && coordinates.lng >= -180 && coordinates.lng <= 180
}

export function distanceInKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const latDelta = ((to.latitude - from.latitude) * Math.PI) / 180
  const lonDelta = ((to.longitude - from.longitude) * Math.PI) / 180
  const fromLat = (from.latitude * Math.PI) / 180
  const toLat = (to.latitude * Math.PI) / 180
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}
