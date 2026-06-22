import { useState, useCallback, useEffect } from 'react'
import { GameProvider, useGame } from './context/GameContext'
import { Routes, Route, useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom'
import RoleCardPage from './pages/RoleCardPage'
import RoleDetailsPage from './pages/RoleDetailsPage'
import DreamPage from './pages/DreamPage'
import GamePage from './pages/GamePage'
import { icons, roleData, roleKeys, roleNames } from './data/roles'
import { dreams as defaultDreams } from './data/dreams'
import {
  initFinGuruGame, getGameState, selectDream,
  subscribeDreamSelection,
  type GameState, type DreamSelectionUpdate,
} from './sdk'
import type { DreamItem } from './pages/DreamPage'
import './App.css'

const PLAYER_COLORS = ['#FF3B30', '#007AFF', '#34C759', '#FF9500', '#AF52DE', '#5856D6', '#FF2D55', '#5AC8FA', '#4A90D9', '#50C878', '#FF6B6B', '#6B5B95', '#88B04B', '#F7CAC9']

function RoleDetailsPageRoute() {
  const navigate = useNavigate()
  const { roleName } = useParams<{ roleName: string }>()
  const data = roleName ? roleData[roleName] : undefined
  if (!data) return <p>Роль не найдена</p>
  return <RoleDetailsPage
    icon={icons[`/src/assets/roles/${roleName}.svg`] ?? ''}
    roleName={data.name}
    financialData={data.financialData}
    onStartGame={() => navigate(`/role/${roleName}/dreams${window.location.search}`)}
  />
}

function dreamsFromGameState(state: GameState, currentPlayerId: string): DreamItem[] {
  return defaultDreams.map(d => {
    const serverDream = state.dreams.find(sd => sd.id === d.id)
    if (!serverDream?.chosenByPlayerId) return { ...d, status: 'default' as const }
    if (serverDream.chosenByPlayerId === currentPlayerId) {
      const me = state.players.find(p => p.playerId === currentPlayerId)
      return { ...d, status: 'selected' as const, takenByPlayerId: currentPlayerId, playerName: me?.displayName ?? 'Игрок', color: me?.color }
    }
    const other = state.players.find(p => p.playerId === serverDream.chosenByPlayerId)
    return { ...d, status: 'chosen' as const, takenByPlayerId: serverDream.chosenByPlayerId, playerName: other?.displayName ?? 'Игрок', color: other?.color }
  })
}

function DreamPageRoute() {
  const navigate = useNavigate()
  const { roleName } = useParams<{ roleName: string }>()
  const data = roleName ? roleData[roleName] : undefined
  const { players, currentPlayerId, setCurrentPlayerId, setCurrentRoleId } = useGame()

  const params = new URLSearchParams(window.location.search)
  const roomId = params.get('roomId') ?? ''
  const sdkPlayerId = params.get('playerId') ?? currentPlayerId ?? ''

  const [dreams, setDreams] = useState<DreamItem[]>(defaultDreams.map(d => ({ ...d, status: 'default' as const })))
  const [myColor, setMyColor] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    if (!roomId) return
    getGameState(roomId).then(state => {
      if (state) {
        setGameState(state)
        setDreams(dreamsFromGameState(state, sdkPlayerId))
        const me = state.players.find(p => p.playerId === sdkPlayerId)
        if (me) {
          setMyColor(me.color)
          setCurrentPlayerId(sdkPlayerId)
          setCurrentRoleId(me.roleId)
          if (me.dreamId != null && state.phase === 'playing') {
            navigate(`/role/${me.roleId}/game` + window.location.search, { replace: true })
            return
          }
        }
      }
      setLoading(false)
    })
  }, [roomId])

  useEffect(() => {
    if (!roomId) return
    const unsub = subscribeDreamSelection(roomId, (update: DreamSelectionUpdate) => {
      if (update.playerColors[sdkPlayerId]) setMyColor(update.playerColors[sdkPlayerId])
      if (gameState) {
        const merged: GameState = { ...gameState, dreams: update.dreams.map(d => ({ ...d, title: '', number: '', description: '', price: 0 })) }
        setDreams(dreamsFromGameState(merged, sdkPlayerId))
      }
    })
    return unsub
  }, [roomId, gameState])

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
    if (roomId && sdkPlayerId) selectDream(roomId, sdkPlayerId, dreamId)
  }, [players, currentPlayerId, sdkPlayerId, myColor, roomId])

  if (!data) return <p>Роль не найдена</p>
  if (loading) return <div className="loading">Загрузка...</div>

  return <DreamPage
    icon={icons[`/src/assets/roles/${roleName}.svg`] ?? ''}
    roleName={data.name}
    monthlyCashFlow={data.financialData.monthlyCashFlow}
    dreams={dreams}
    currentPlayerId={sdkPlayerId}
    onDreamSelect={handleDreamSelect}
    onStartGame={() => navigate(`/role/${roleName}/game` + window.location.search)}
  />
}

function RandomRoleRedirect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('roomId') ?? ''
  const sdkPlayerId = searchParams.get('playerId') ?? ''
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId || !sdkPlayerId) {
      setLoading(false)
      return
    }

    let cancelled = false

    getGameState(roomId).then(async (state) => {
      if (cancelled) return

      // Game exists — redirect based on phase & player state
      if (state) {
        const me = state.players.find(p => p.playerId === sdkPlayerId)
        if (me?.dreamId != null && state.phase === 'playing') {
          navigate(`/role/${me.roleId}/game?roomId=${roomId}&playerId=${sdkPlayerId}`, { replace: true })
          return
        }
        if (me?.roleId) {
          if (me.dreamId != null) {
            navigate(`/role/${me.roleId}/game?roomId=${roomId}&playerId=${sdkPlayerId}`, { replace: true })
          } else {
            navigate(`/role/${me.roleId}?roomId=${roomId}&playerId=${sdkPlayerId}`, { replace: true })
          }
          return
        }
        setLoading(false)
        return
      }

      // No game yet — initialize and wait for role assignment
      const role = await initFinGuruGame(roomId, sdkPlayerId)
      if (cancelled) return

      if (role) {
        navigate(`/role/${role.roleId}?roomId=${roomId}&playerId=${sdkPlayerId}`, { replace: true })
      } else {
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [])

  if (loading) return null

  const idx = Math.floor(Math.random() * roleKeys.length)
  return <Navigate to={`/role/${roleKeys[idx]}`} replace />
}

function App() {
  const navigate = useNavigate()

  return (
    <GameProvider>
      <Routes>
      <Route path="/role/:roleName" element={
        <RoleCardPage onTimeout={(roleName) => navigate(`/role/${roleName}/details${window.location.search}`)} />
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
