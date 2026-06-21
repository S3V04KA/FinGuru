# AlgoGames SDK

TypeScript SDK для интеграции игр с платформой AlgoGames. Работает через `postMessage` bridge между iframe-игрой и родительским окном.

## Сборка

```bash
cd AlgoGames.SDK
npm install
npm run build
```

Результат:
- `dist/` — CommonJS модуль (для Node.js / npm-пакетов)
- `dist-web/algogames-sdk.umd.js` — UMD модуль (для браузеров через `<script>`)

## Установка в другой проект

### Вариант 1: npm link (локальная разработка)

```bash
# В AlgoGames.SDK
npm link

# В твоём проекте
npm link algogames-sdk
```

### Вариант 2: Копирование файлов

```bash
# Скопировать UMD-билд
cp AlgoGames.SDK/dist-web/algogames-sdk.umd.js /path/to/game/lib/

# Или CommonJS + типы
cp -r AlgoGames.SDK/dist/ /path/to/game/node_modules/algogames-sdk/
```

### Вариант 3: GitHub как依赖

```json
{
  "dependencies": {
    "algogames-sdk": "github:username/AlgoGames#main"
  }
}
```

## Использование

### Браузер (UMD)

```html
<script src="algogames-sdk.umd.js"></script>
<script>
  const sdk = new window['algogames-sdk'].AlgoGamesSDK();
  // или если библиотека экспортируется как AlgoGamesSDK:
  // const sdk = new AlgoGamesSDK();
</script>
```

### TypeScript / ES Modules

```typescript
import { AlgoGamesSDK, TurnStrategy } from 'algogames-sdk';

const sdk = new AlgoGamesSDK();
await sdk.init();
```

### CommonJS (Node.js)

```javascript
const { AlgoGamesSDK } = require('algogames-sdk');
const sdk = new AlgoGamesSDK();
```

## API

### AlgoGamesSDK

| Метод | Описание |
|-------|----------|
| `init()` | Подключение к платформе. Вызывать при старте. |
| `joinRoom(roomId, playerId, displayName)` | Войти в комнату. Возвращает `Promise<RoomInfo>`. |
| `leaveRoom()` | Покинуть комнату. |
| `sendAction(action, data?)` | Отправить действие (ход) на сервер. |
| `validateAction(action, context?)` | Проверить, доступно ли действие сейчас (клиентская валидация). |
| `broadcastMessage(type, data)` | Отправить сообщение всем игрокам в комнате. |
| `sendMessageToPlayer(targetId, type, data)` | Отправить сообщение конкретному игроку. |
| `getTurnManager()` | Получить `TurnManager` для управления ходами. |
| `getPlayerId()` | ID текущего игрока (после `joinRoom`). |
| `getRoomId()` | ID текущей комнаты. |
| `isConnected()` | Проверить подключение. |
| `disconnect()` | Отключиться от платформы. |

### TurnManager

| Метод | Описание |
|-------|----------|
| `isMyTurn()` | Мой ли сейчас ход. |
| `getPhase()` | Текущая фаза игры. |
| `getDirection()` | Направление хода: `1` (по часовой) или `-1` (против). |
| `getPlayerOrder()` | Порядок игроков. |
| `getTurnCount()` | Количество сделанных ходов. |
| `getTimeRemaining()` | Оставшееся время хода (секунды). |
| `getState()` | Полное состояние хода. |
| `setStrategy(strategy)` | Установить стратегию для клиентской валидации. |
| `validateAction(action)` | Проверить действие через стратегию. |
| `onTurnChanged(handler)` | Подписка на смену хода. |
| `onPhaseChanged(handler)` | Подписка на смену фазы. |

### TurnStrategy (интерфейс)

Определяет правила ходов для конкретной игры. **Опциональна** — без неё SDK просто отправляет действия, сервер валидирует.

```typescript
interface TurnStrategy {
  gameType: string;
  getPhases(): string[];
  canAct(state: TurnState, playerId: string, action: string): boolean;
  getNextPlayerIndex(state: TurnState, action: string, context?: Record<string, unknown>): number;
  onTurnStart(state: TurnState): void;
  onTurnEnd(state: TurnState): void;
}
```

## Пример: игра с ходами

```typescript
import { AlgoGamesSDK, TurnStrategy, TurnState } from 'algogames-sdk';

// 1. Определить стратегию (опционально)
const myStrategy: TurnStrategy = {
  gameType: 'my-game',
  getPhases: () => ['waiting', 'playing', 'gameOver'],
  canAct: (state, playerId, action) => {
    if (state.phase !== 'playing') return false;
    return state.currentPlayerId === playerId;
  },
  getNextPlayerIndex: (state, action) => {
    return state.playerOrder.indexOf(state.currentPlayerId) + 1 % state.playerOrder.length;
  },
  onTurnStart: (state) => { state.timeRemaining = 60; },
  onTurnEnd: (state) => { state.timeRemaining = undefined; },
};

// 2. Инициализация
const sdk = new AlgoGamesSDK();
await sdk.init();
const room = await sdk.joinRoom('room-123', 'player-1', 'Игрок 1');

// 3. Подключить стратегию
sdk.getTurnManager().setStrategy(myStrategy);

// 4. Слушать ходы
sdk.getTurnManager().onTurnChanged((turn) => {
  console.log('Ход:', turn.currentPlayerId, 'Фаза:', turn.phase);
});

// 5. Делать ходы
if (sdk.validateAction('move')) {
  sdk.sendAction('move', { from: [0, 0], to: [1, 1] });
}

// 6. Получать сообщения от других игроков
sdk.onBroadcast((msg) => {
  console.log('Сообщение:', msg.type, msg.data);
});
```

## Пример: HTML-страница с игрой

```html
<!DOCTYPE html>
<html>
<head><title>My Game</title></head>
<body>
  <div id="game"></div>
  <script src="algogames-sdk.umd.js"></script>
  <script>
    const sdk = new window['algogames-sdk'].AlgoGamesSDK();

    async function start() {
      await sdk.init();
      const room = await sdk.joinRoom('room-1', 'p1', 'Player 1');

      sdk.getTurnManager().onTurnChanged((turn) => {
        document.getElementById('game').innerHTML =
          `Ход: ${turn.currentPlayerId} | Фаза: ${turn.phase}`;
      });

      // Отправить ход
      document.addEventListener('keydown', (e) => {
        if (sdk.validateAction('move')) {
          sdk.sendAction('move', { key: e.key });
        }
      });
    }

    start();
  </script>
</body>
</html>
```

## Структура пакета

```
algogames-sdk/
├── src/
│   ├── index.ts          # AlgoGamesSDK + типы
│   └── TurnManager.ts    # TurnManager + TurnStrategy
├── dist/                 # CommonJS (tsc)
├── dist-web/             # UMD (vite)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Типы

```typescript
interface TurnState {
  playerOrder: string[];
  currentPlayerId: string;
  currentPlayerIndex: number;
  direction: 1 | -1;
  phase: string;
  timeRemaining?: number;
  turnCount: number;
  maxActionsPerTurn: number;
  actionsThisTurn: number;
}

interface RoomInfo {
  roomId: string;
  playerId: string;
  players: PlayerInfo[];
}

interface PlayerInfo {
  playerId: string;
  displayName: string;
}
```
