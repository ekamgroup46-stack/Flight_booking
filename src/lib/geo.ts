export interface LatLon {
  lat: number
  lon: number
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Position of point `p` along segment a→b: `t` (0..1 projection) and the
 * perpendicular offset as a fraction of the segment length. Used by mocks to
 * pick plausible intermediate halts.
 */
export function projectOnSegment(a: LatLon, b: LatLon, p: LatLon): { t: number; offset: number } {
  const ax = a.lon
  const ay = a.lat
  const dx = b.lon - ax
  const dy = b.lat - ay
  const len2 = dx * dx + dy * dy || 1
  const t = ((p.lon - ax) * dx + (p.lat - ay) * dy) / len2
  const px = ax + t * dx
  const py = ay + t * dy
  const offset = Math.hypot(p.lon - px, p.lat - py) / Math.sqrt(len2)
  return { t, offset }
}
