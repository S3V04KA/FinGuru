import { useState, useCallback, useEffect } from 'react'
import { GameProvider, useGame } from './context/GameContext'
import { Routes, Route, useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom'
import RoleCardPage from './pages/RoleCardPage'
import RoleDetailsPage from './pages/RoleDetailsPage'
import DreamPage from './pages/DreamPage'
import GamePage from './pages/GamePage'
import { icons, roleData, roleKeys, roleNames } from './data/roles'
import { dreams as defaultDreams } from './data/dreams'
import { getSdk, subscribeDreamSelection, getPlayerInfo, getGameState, selectDream, type GameState } from './sdk'
import type { DreamItem } from './pages/DreamPage'
import './App.css'

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
  const [dreams, setDreams] = useState<DreamItem[]>(() =>
    defaultDreams.map(d => ({ ...d, status: 'default' as const }))
  )
  const [myColor, setMyColor] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const currentPlayer = players.find(p => p.id === currentPlayerId)

  const params = new URLSearchParams(window.location.search)
  const roomId = params.get('roomId') ?? ''
  const sdkPlayerId = params.get('playerId') ?? currentPlayerId ?? ''

  function applyGameState(state: GameState) {
    const me = state.players.find(p => p.playerId === sdkPlayerId)
    if (!me) return

    setMyColor(me.color)
    if (me.roleId) setCurrentRoleId(me.roleId)
    if (!currentPlayerId) setCurrentPlayerId(sdkPlayerId)

    const updated: DreamItem[] = defaultDreams.map(d => {
      const base: DreamItem = { ...d, status: 'default' }
      if (d.id === me.dreamId) {
        return { ...base, status: 'selected', takenByPlayerId: sdkPlayerId, playerName: me.displayName, color: me.color }
      }
      const serverDream = state.dreams.find(sd => sd.id === d.id)
      if (serverDream?.chosenByPlayerId && serverDream.chosenByPlayerId !== sdkPlayerId) {
        const otherPlayer = state.players.find(p => p.playerId === serverDream.chosenByPlayerId)
        return { ...base, status: 'chosen', takenByPlayerId: serverDream.chosenByPlayerId, playerName: otherPlayer?.displayName ?? 'Игрок', color: otherPlayer?.color }
      }
      return base
    })
    setDreams(updated)
  }

  useEffect(() => {
    if (!roomId || !sdkPlayerId) return
    setLoading(true)
    const sdk = getSdk()
    getGameState(sdk, roomId)
      .then(state => {
        if (state) applyGameState(state)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [roomId, sdkPlayerId, currentPlayerId, setCurrentPlayerId, setCurrentRoleId])

  useEffect(() => {
    if (!roomId || !sdkPlayerId) return
    const sdk = getSdk()
    const unsub = subscribeDreamSelection(sdk, roomId, sdkPlayerId, (update) => {
      if (update.playerColors[sdkPlayerId]) setMyColor(update.playerColors[sdkPlayerId])
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
          return { ...d, status: 'selected' as const, playerName: currentPlayer?.name ?? 'Игрок', color: myColor, takenByPlayerId: sdkPlayerId }
        }
        if (d.status === 'selected') {
          return { ...d, status: 'default' as const, playerName: undefined, color: undefined, takenByPlayerId: undefined }
        }
        return d
      })
    })
    if (roomId && sdkPlayerId) {
      const sdk = getSdk()
      selectDream(sdk, roomId, sdkPlayerId, dreamId)
    }
  }, [currentPlayer, sdkPlayerId, myColor, roomId])

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
  const [randomRole] = useState(() => roleKeys[Math.floor(Math.random() * roleKeys.length)])
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!roomId || !sdkPlayerId) {
      setChecking(false)
      return
    }
    const sdk = getSdk()
    const timeout = setTimeout(() => setChecking(false), 2000)
    getGameState(sdk, roomId).then(state => {
      clearTimeout(timeout)
      if (state?.phase === 'playing') {
        const me = state.players.find(p => p.playerId === sdkPlayerId)
        if (me?.dreamId != null) {
          navigate(`/role/${me.roleId}/game` + window.location.search, { replace: true })
          return
        }
        if (me?.roleId) {
          navigate(`/role/${me.roleId}/dreams` + window.location.search, { replace: true })
          return
        }
      }
      setChecking(false)
    }).catch(() => {
      clearTimeout(timeout)
      setChecking(false)
    })
  }, [])

  if (checking) return null
  return <Navigate to={`/role/${randomRole}`} replace />
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
