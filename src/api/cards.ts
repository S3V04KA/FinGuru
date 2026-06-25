const API_BASE = import.meta.env.VITE_PERSISTENCE_URL ?? 'http://localhost:5013'

export interface CardDetailDto {
  name: string
  amount: number
  value: string
  isNegative: boolean
  sortOrder: number
}

export interface CardDto {
  id: number
  name: string
  description: string
  amount: number
  headerLabel: string
  details: CardDetailDto[]
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/finguru${path}`)
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

export function getBigDealCards(): Promise<CardDto[]> {
  return fetchJson('/deals/big')
}

export function getRandomBigDealCard(): Promise<CardDto> {
  return fetchJson('/deals/big/random')
}

export function getSmallDealCards(): Promise<CardDto[]> {
  return fetchJson('/deals/small')
}

export function getRandomSmallDealCard(): Promise<CardDto> {
  return fetchJson('/deals/small/random')
}

// ─── Negative cards ────────────────────────────────────────────

export interface NegativeCardDto {
  id: number
  name: string
  description: string
  amount: number
}

export function getNegativeCards(): Promise<NegativeCardDto[]> {
  return fetchJson('/negative')
}

export function getRandomNegativeCard(): Promise<NegativeCardDto> {
  return fetchJson('/negative/random')
}
