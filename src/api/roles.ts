const API_BASE = import.meta.env.VITE_PERSISTENCE_URL ?? ''

export interface RoleItemDto {
  name: string
  amount: number
}

export interface RoleFullDto {
  id: number
  roleKey: string
  displayName: string
  income: number
  expenses: number
  monthlyCashFlow: number
  incomeItems: RoleItemDto[]
  expenseItems: RoleItemDto[]
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/finguru${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
  return res.json()
}

export function getRoleFull(roleKey: string): Promise<RoleFullDto> {
  return fetchJson(`/roles/${roleKey}`)
}
