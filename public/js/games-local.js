// Lógica de juegos adaptada para ejecución local (sin servidor)
// Basado en server/games/*.js

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// Tres en Raya
export const ticTacToe = {
  meta: {
    id: 'tictactoe',
    name: 'Tres en Raya',
    emoji: '⭕',
    tagline: 'El clásico de toda la vida',
    description: 'Consigue tres símbolos en línea antes que la IA.',
    minPlayers: 2,
    maxPlayers: 2,
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  init(players) {
    return {
      board: Array(9).fill(null),
      marks: { [players[0].id]: 'X', [players[1].id]: 'O' },
      turn: players[0].id,
      status: 'playing',
      winner: null,
      winningLine: null,
    };
  },
  action(state, playerId, action) {
    if (state.status !== 'playing') return { error: 'La partida ha terminado.' };
    if (action.type !== 'place') return { error: 'Acción no válida.' };
    if (state.turn !== playerId) return { error: 'No es tu turno.' };

    const i = action.index;
    if (typeof i !== 'number' || i < 0 || i > 8) return { error: 'Casilla no válida.' };
    if (state.board[i] !== null) return { error: 'Casilla ocupada.' };

    const mark = state.marks[playerId];
    state.board[i] = mark;

    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
        state.status = 'finished';
        state.winner = playerId;
        state.winningLine = line;
        return { state };
      }
    }

    if (state.board.every((cell) => cell !== null)) {
      state.status = 'finished';
      state.winner = null;
      return { state };
    }

    const ids = Object.keys(state.marks);
    state.turn = ids.find((id) => id !== playerId);
    return { state };
  },
  botAction(state, botId) {
    if (state.status !== 'playing' || state.turn !== botId) return null;
    const me = botId;
    const opp = Object.keys(state.marks).find((id) => id !== me);
    const myMark = state.marks[me];
    const oppMark = state.marks[opp];
    const b = state.board;
    const tryWin = (mark) => {
      for (const [a, c, d] of WIN_LINES) {
        const line = [a, c, d];
        const marks = line.map((i) => b[i]);
        const empties = line.filter((i) => b[i] === null);
        if (empties.length === 1 && marks.filter((m) => m === mark).length === 2) return empties[0];
      }
      return -1;
    };
    let idx = tryWin(myMark);
    if (idx < 0) idx = tryWin(oppMark);
    if (idx < 0 && b[4] === null) idx = 4;
    if (idx < 0) {
      const prefs = [0, 2, 6, 8, 1, 3, 5, 7].filter((i) => b[i] === null);
      idx = prefs.length ? prefs[Math.floor(Math.random() * prefs.length)] : b.findIndex((c) => c === null);
    }
    return { type: 'place', index: idx };
  },
};

// Conecta 4
export const connect4 = {
  meta: {
    id: 'connect4',
    name: 'Conecta 4',
    emoji: '🔴',
    tagline: 'Alinea cuatro fichas',
    description: 'Deja caer fichas para alinear cuatro en vertical, horizontal o diagonal.',
    minPlayers: 2,
    maxPlayers: 2,
    gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
  },
  init(players) {
    return {
      board: Array(6).fill(null).map(() => Array(7).fill(null)),
      turn: players[0].id,
      status: 'playing',
      winner: null,
      players: players.map(p => ({ id: p.id, color: p.id === players[0].id ? 'red' : 'yellow' })),
    };
  },
  action(state, playerId, action) {
    if (state.status !== 'playing') return { error: 'Partida terminada' };
    if (action.type !== 'drop') return { error: 'Acción inválida' };
    if (state.turn !== playerId) return { error: 'No es tu turno' };

    const col = action.col;
    if (col < 0 || col > 6) return { error: 'Columna inválida' };

    // Encontrar la fila vacía más baja
    let row = -1;
    for (let r = 5; r >= 0; r--) {
      if (state.board[r][col] === null) {
        row = r;
        break;
      }
    }
    if (row === -1) return { error: 'Columna llena' };

    state.board[row][col] = playerId;

    // Verificar victoria
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (r < 0 || r > 5 || c < 0 || c > 6 || state.board[r][c] !== playerId) break;
        count++;
      }
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i, c = col - dc * i;
        if (r < 0 || r > 5 || c < 0 || c > 6 || state.board[r][c] !== playerId) break;
        count++;
      }
      if (count >= 4) {
        state.status = 'finished';
        state.winner = playerId;
        return { state };
      }
    }

    // Verificar empate
    if (state.board.every(row => row.every(cell => cell !== null))) {
      state.status = 'finished';
      state.winner = null;
      return { state };
    }

    const ids = state.players.map(p => p.id);
    state.turn = ids.find(id => id !== playerId);
    return { state };
  },
  botAction(state, botId) {
    if (state.status !== 'playing' || state.turn !== botId) return null;
    // IA simple: elegir columna aleatoria válida
    const validCols = [];
    for (let c = 0; c < 7; c++) {
      if (state.board[0][c] === null) validCols.push(c);
    }
    if (validCols.length === 0) return null;
    const col = validCols[Math.floor(Math.random() * validCols.length)];
    return { type: 'drop', col };
  },
};

// Piedra Papel Tijera
export const rps = {
  meta: {
    id: 'rps',
    name: 'Piedra, Papel o Tijera',
    emoji: '✊',
    tagline: 'Al mejor de 5',
    description: 'El clásico juego de manos. Gana quien llegue a 3 victorias.',
    minPlayers: 2,
    maxPlayers: 2,
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  },
  init(players) {
    return {
      round: 1,
      maxRounds: 5,
      scores: { [players[0].id]: 0, [players[1].id]: 0 },
      currentChoices: {},
      turn: null, // Simultáneo
      status: 'playing',
      winner: null,
    };
  },
  action(state, playerId, action) {
    if (state.status !== 'playing') return { error: 'Partida terminada' };
    if (action.type !== 'choose') return { error: 'Acción inválida' };

    state.currentChoices[playerId] = action.choice;
    const players = Object.keys(state.scores);

    // Cuando ambos eligen
    if (Object.keys(state.currentChoices).length === 2) {
      const [p1, p2] = players;
      const c1 = state.currentChoices[p1];
      const c2 = state.currentChoices[p2];

      // Determinar ganador
      const wins = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
      if (c1 === c2) {
        // Empate
      } else if (wins[c1] === c2) {
        state.scores[p1]++;
      } else {
        state.scores[p2]++;
      }

      state.currentChoices = {};
      state.round++;

      // Verificar fin del juego
      if (state.round > state.maxRounds || state.scores[p1] >= 3 || state.scores[p2] >= 3) {
        state.status = 'finished';
        if (state.scores[p1] > state.scores[p2]) state.winner = p1;
        else if (state.scores[p2] > state.scores[p1]) state.winner = p2;
        else state.winner = null;
      }
    }
    return { state };
  },
  botAction(state, botId) {
    if (state.status !== 'playing') return null;
    if (state.currentChoices[botId]) return null;
    const choices = ['rock', 'paper', 'scissors'];
    return { type: 'choose', choice: choices[Math.floor(Math.random() * choices.length)] };
  },
};

// Memoria
export const memory = {
  meta: {
    id: 'memory',
    name: 'Memoria',
    emoji: '🧠',
    tagline: 'Encuentra las parejas',
    description: 'Gira las cartas y encuentra todas las parejas. Gana quien encuentre más.',
    minPlayers: 2,
    maxPlayers: 4,
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  },
  init(players) {
    const emojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'];
    const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    return {
      cards: cards.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false })),
      flipped: [],
      scores: Object.fromEntries(players.map(p => [p.id, 0])),
      turn: players[0].id,
      status: 'playing',
      winner: null,
    };
  },
  action(state, playerId, action) {
    if (state.status !== 'playing') return { error: 'Partida terminada' };
    if (action.type !== 'flip') return { error: 'Acción inválida' };
    if (state.turn !== playerId) return { error: 'No es tu turno' };
    if (state.flipped.length >= 2) return { error: 'Espera a que se verifiquen las cartas' };

    const card = state.cards[action.index];
    if (card.flipped || card.matched) return { error: 'Carta no válida' };

    card.flipped = true;
    state.flipped.push(action.index);

    if (state.flipped.length === 2) {
      const [i1, i2] = state.flipped;
      const c1 = state.cards[i1];
      const c2 = state.cards[i2];

      if (c1.emoji === c2.emoji) {
        c1.matched = true;
        c2.matched = true;
        state.scores[playerId]++;
        state.flipped = [];
        // Verificar fin
        if (state.cards.every(c => c.matched)) {
          state.status = 'finished';
          const maxScore = Math.max(...Object.values(state.scores));
          const winners = Object.entries(state.scores).filter(([_, s]) => s === maxScore);
          state.winner = winners.length === 1 ? winners[0][0] : null;
        }
        // Sigue el mismo jugador
      } else {
        // Cambiar turno después de un delay
        setTimeout(() => {
          c1.flipped = false;
          c2.flipped = false;
          state.flipped = [];
          const players = Object.keys(state.scores);
          state.turn = players.find(id => id !== playerId);
        }, 1000);
      }
    }
    return { state };
  },
  botAction(state, botId) {
    if (state.status !== 'playing' || state.turn !== botId || state.flipped.length >= 2) return null;
    const unflipped = state.cards.filter(c => !c.flipped && !c.matched);
    if (unflipped.length === 0) return null;
    const card = unflipped[Math.floor(Math.random() * unflipped.length)];
    return { type: 'flip', index: card.id };
  },
};

// Exportar todos los juegos
export const games = {
  tictactoe: ticTacToe,
  connect4: connect4,
  rps: rps,
  memory: memory,
};

export function getGame(id) {
  return games[id] || null;
}

export function listGames() {
  return Object.values(games).map(g => g.meta);
}
