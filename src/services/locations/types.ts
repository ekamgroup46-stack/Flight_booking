export interface Airport {
  code: string
  city: string
  name: string
  country: string
  lat: number
  lon: number
}

export interface Station {
  code: string
  name: string
  city: string
  lat: number
  lon: number
}

export interface City {
  id: string
  name: string
  state: string
  lat: number
  lon: number
  pincode: string
}

export interface Place {
  id: string
  name: string
  city: string
  kind: 'airport' | 'locality' | 'city'
  lat: number
  lon: number
  code?: string
}

/** What a search field asks the catalogue for. */
export type LocationKind = 'airport' | 'station' | 'busCity' | 'cabPlace' | 'cargoCity'

/** Normalised option rendered by the LocationField combobox. */
export interface LocationOption {
  id: string
  label: string
  sublabel: string
  code?: string
  group?: string
}
