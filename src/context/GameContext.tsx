import { createContext, useContext, useState, ReactNode } from 'react';

export interface PlayerMarker {
  id: string;
  color: string;
  letter: string;
  cellIndex?: number;
  name?: string;
}

export interface Move {
  // Define fields needed for a move (example)
  playerId: string;
  fromSector?: number;
  toSector?: number;
  diceRoll?: number;
  timestamp?: number;
}

export interface Role {
  id: string;
  // other role fields can be added later
}

interface GameContextProps {
  // 1. Players
  players: PlayerMarker[];
  setPlayers: (p: PlayerMarker[]) => void;

  // 2. Current player
  currentPlayerId?: string;
  setCurrentPlayerId: (id: string) => void;

  // 4. Move history
  history: Move[];
  setHistory: (h: Move[]) => void;

  // 8. Current role
  currentRoleId?: string;
  setCurrentRoleId: (id: string) => void;

  // 9. Global callbacks
  onRollDice: () => void;
  onSelectMove: (m: Move) => void;

  // 10. Loading / error state
  isLoading: boolean;
  setLoading: (b: boolean) => void;
  error?: string;
  setError: (e?: string) => void;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [players, setPlayers] = useState<PlayerMarker[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>();
  const [history, setHistory] = useState<Move[]>([]);
  const [currentRoleId, setCurrentRoleId] = useState<string>();

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const onRollDice = () => {
    // placeholder – actual implementation should be provided by the consuming component
    console.log('Roll dice triggered');
  };

  const onSelectMove = (m: Move) => {
    // placeholder – can be used to highlight a selected move in UI
    console.log('Move selected', m);
  };

  return (
    <GameContext.Provider
      value={{
        players,
        setPlayers,
        currentPlayerId,
        setCurrentPlayerId,
        history,
        setHistory,
        currentRoleId,
        setCurrentRoleId,
        onRollDice,
        onSelectMove,
        isLoading,
        setLoading,
        error,
        setError,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
