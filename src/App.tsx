import { useState, useCallback, useEffect } from 'react'
import { GameProvider, useGame } from './context/GameContext'
import { Routes, Route, useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom'
import RoleCardPage from './pages/RoleCardPage'
import RoleDetailsPage from './pages/RoleDetailsPage'
import DreamPage from './pages/DreamPage'
import GamePage from './pages/GamePage'
import { icons, roleData, roleKeys, roleNames } from './data/roles'
import { dreams as defaultDreams } from './data/dreams'
import { getSdk, subscribeDreamSelection, selectDream, initFinGuruGame } from './sdk'
import type { DreamItem } from './pages/DreamPage'
import './App.css'

const STORAGE_PREFIX = 'finguru_'
const PLAYER_COLORS = ['#FF3B30', '#007AFF', '#34C759', '#FF9500', '#AF52DE', '#5856D6', '#FF2D55', '#5AC8FA', '#4A90D9', '#50C878', '#FF6B6B', '#6B5B95', '#88B04B', '#F7CAC9']

function storageKey(roomId: string, playerId: string, key: string): string {
  return `${STORAGE_PREFIX}${roomId}_${playerId}_${key}`
}

function parsePlayers(): { id: string; name: string }[] {
  try {
    const raw = new URLSearchParams(window.location.search).get('players') ?? ''
    if (!raw) return []
    return JSON.parse(decodeURIComponent(atob(raw)))
  } catch {
    return []
  }
}

function loadRole(roomId: string, playerId: string): { roleKey: string; color: string } | null {
  try {
    const stored = localStorage.getItem(storageKey(roomId, playerId, 'role'))
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function computeRole(playerId: string): { roleKey: string; color: string } {
  const params = new URLSearchParams(window.location.search)
  const roomId = params.get('roomId') ?? ''

  const existing = roomId ? loadRole(roomId, playerId) : null
  if (existing) return existing

  const allPlayers = parsePlayers()
  const sorted = [...allPlayers].sort((a, b) => a.id.localeCompare(b.id))
  const idx = sorted.findIndex(p => p.id === playerId)
  const roleIdx = idx >= 0 ? idx % roleKeys.length : Math.floor(Math.random() * roleKeys.length)
  const colorIdx = idx >= 0 ? idx % PLAYER_COLORS.length : Math.floor(Math.random() * PLAYER_COLORS.length)
  return { roleKey: roleKeys[roleIdx], color: PLAYER_COLORS[colorIdx] }
}

function persistRole(roomId: string, playerId: string, role: { roleKey: string; color: string }): void {
  localStorage.setItem(storageKey(roomId, playerId, 'role'), JSON.stringify(role))
}

function loadDream(roomId: string, playerId: string): number | null {
  const raw = localStorage.getItem(storageKey(roomId, playerId, 'dream'))
  return raw ? Number(raw) : null
}

function persistDream(roomId: string, playerId: string, dreamId: number): void {
  localStorage.setItem(storageKey(roomId, playerId, 'dream'), String(dreamId))
  const key = `${STORAGE_PREFIX}${roomId}_selections`
  const all: Record<string, number> = JSON.parse(localStorage.getItem(key) || '{}')
  all[playerId] = dreamId
  localStorage.setItem(key, JSON.stringify(all))
}

function buildDreamsFromStorage(roomId: string, currentPlayerId: string): DreamItem[] {
  const selectionsKey = `${STORAGE_PREFIX}${roomId}_selections`
  const all: Record<string, number> = JSON.parse(localStorage.getItem(selectionsKey) || '{}')
  const allPlayers = parsePlayers()
  const nameMap: Record<string, string> = {}
  allPlayers.forEach(p => { nameMap[p.id] = p.name })

  return defaultDreams.map(d => {
    const base: DreamItem = { ...d, status: 'default' }
    const takenBy = Object.entries(all).find(([, did]) => did === d.id)
    if (!takenBy) return base
    const [pid] = takenBy
    const role = pid ? loadRole(roomId, pid) : null
    if (pid === currentPlayerId) {
      return { ...base, status: 'selected', takenByPlayerId: pid, playerName: nameMap[pid] ?? 'Игрок', color: role?.color }
    }
    return { ...base, status: 'chosen', takenByPlayerId: pid, playerName: nameMap[pid] ?? 'Игрок', color: role?.color }
  })
}

function RoleDetailsPageRoute() {
  const navigate = useNavigate()
  const { roleName } = useParams<{ roleName: string }>()
  const data = roleName ? roleData[roleName] : undefined
  if (!data) return <p>Роль не найдена</p>
  return <RoleDetailsPage
    icon={icons[`/src/assets/roles/${roleName}.svg`] ?? ''}
    roleName={data.name}
    financialData={data.financialData}
    onStartGame={() => navigate(`/role/${roleName}/dreams`)}
  />
}

function DreamPageRoute() {
  const navigate = useNavigate()
  const { roleName } = useParams<{ roleName: string }>()
  const data = roleName ? roleData[roleName] : undefined
  const { players, currentPlayerId, setCurrentPlayerId, setCurrentRoleId } = useGame()

  const params = new URLSearchParams(window.location.search)
  const roomId = params.get('roomId') ?? ''
  const sdkPlayerId = params.get('playerId') ?? currentPlayerId ?? ''

  const savedRole = roomId && sdkPlayerId ? loadRole(roomId, sdkPlayerId) : null
  const myColor = savedRole?.color

  const [dreams, setDreams] = useState<DreamItem[]>(() => {
    if (roomId && sdkPlayerId) return buildDreamsFromStorage(roomId, sdkPlayerId)
    return defaultDreams.map(d => ({ ...d, status: 'default' as const }))
  })

  useEffect(() => {
    if (!sdkPlayerId) return
    if (!currentPlayerId) setCurrentPlayerId(sdkPlayerId)
    if (savedRole?.roleKey) setCurrentRoleId(savedRole.roleKey)
  }, [])

  useEffect(() => {
    if (!roomId || !sdkPlayerId) return
    const sdk = getSdk()
    const unsub = subscribeDreamSelection(sdk, roomId, sdkPlayerId, (update) => {
      setDreams(prev => prev.map(d => {
        const serverDream = update.dreams.find(sd => sd.id === d.id)
        if (!serverDream?.chosenByPlayerId) return d
        if (serverDream.chosenByPlayerId === sdkPlayerId) {
          return { ...d, status: 'selected' as const, takenByPlayerId: sdkPlayerId, playerName: update.playerNames[sdkPlayerId] ?? 'Игрок', color: update.playerColors[sdkPlayerId] }
        }
        return { ...d, status: 'chosen' as const, takenByPlayerId: serverDream.chosenByPlayerId, playerName: update.playerNames[serverDream.chosenByPlayerId] ?? 'Игрок', color: update.playerColors[serverDream.chosenByPlayerId] }
      }))
    })
    return unsub
  }, [roomId, sdkPlayerId])

  const handleDreamSelect = useCallback((dreamId: number) => {
    setDreams(prev => {
      const clicked = prev.find(d => d.id === dreamId)
      if (!clicked) return prev
      if (clicked.takenByPlayerId && clicked.takenByPlayerId !== sdkPlayerId) return prev
      if (clicked.status === 'selected') {
        return prev.map(d => d.id === dreamId
          ? { ...d, status: 'default' as const, playerName: undefined, color: undefined, takenByPlayerId: undefined }
          : d
        )
      }
      return prev.map(d => {
        if (d.id === dreamId) {
          return { ...d, status: 'selected' as const, playerName: players.find(p => p.id === currentPlayerId)?.name ?? 'Игрок', color: myColor, takenByPlayerId: sdkPlayerId }
        }
        if (d.status === 'selected') {
          return { ...d, status: 'default' as const, playerName: undefined, color: undefined, takenByPlayerId: undefined }
        }
        return d
      })
    })
    if (roomId && sdkPlayerId) {
      persistDream(roomId, sdkPlayerId, dreamId)
      const sdk = getSdk()
      selectDream(sdk, roomId, sdkPlayerId, dreamId)
    }
  }, [players, currentPlayerId, sdkPlayerId, myColor, roomId])

  if (!data && !savedRole) return <p>Роль не найдена</p>
  const resolvedRoleKey = roleName ?? savedRole?.roleKey ?? ''
  const resolvedData = data ?? roleData[resolvedRoleKey]
  if (!resolvedData) return <p>Роль не найдена</p>

  return <DreamPage
    icon={icons[`/src/assets/roles/${resolvedRoleKey}.svg`] ?? ''}
    roleName={resolvedData.name}
    monthlyCashFlow={resolvedData.financialData.monthlyCashFlow}
    dreams={dreams}
    currentPlayerId={sdkPlayerId}
    onDreamSelect={handleDreamSelect}
    onStartGame={() => navigate(`/role/${resolvedRoleKey}/game` + window.location.search)}
  />
}

function RandomRoleRedirect() {
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('roomId') ?? ''
  const sdkPlayerId = searchParams.get('playerId') ?? ''

  const assignment = computeRole(sdkPlayerId)
  const savedDream = roomId && sdkPlayerId ? loadDream(roomId, sdkPlayerId) : null

  useEffect(() => {
    if (roomId && sdkPlayerId) {
      persistRole(roomId, sdkPlayerId, assignment)
    }
  }, [])

  if (roomId && sdkPlayerId) {
    if (savedDream != null) {
      return <Navigate to={`/role/${assignment.roleKey}/game?roomId=${roomId}&playerId=${sdkPlayerId}`} replace />
    }
    return <Navigate to={`/role/${assignment.roleKey}`} replace />
  }

  return <Navigate to={`/role/${assignment.roleKey}`} replace />
}

function App() {
  const navigate = useNavigate()

  return (
    <GameProvider>
      <Routes>
      <Route path="/role/:roleName" element={
        <RoleCardPage onTimeout={(roleName) => navigate(`/role/${roleName}/details`)} />
      } />
      <Route path="/role/:roleName/details" element={<RoleDetailsPageRoute />} />
      <Route path="/role/:roleName/dreams" element={<DreamPageRoute />} />
      <Route path="/role/:roleName/game" element={<GamePage />} />
      <Route path="*" element={<RandomRoleRedirect />} />
      </Routes>
    </GameProvider>
  )
}

export default App
