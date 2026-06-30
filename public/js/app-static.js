import { getGame, listGames } from './games-local.js';
import { SFX } from './sfx.js';
import { bindGameFit, resetGameFit } from './gameFit.js';

/* ============ Identidad persistente ============ */
const PID_KEY = 'arcade_pid';
let playerId = localStorage.getItem(PID_KEY);
if (!playerId) {
  playerId = 'p_' + Math.random().toString(36).slice(2, 10);
  localStorage.setItem(PID_KEY, playerId);
}
let nickname = localStorage.getItem('arcade_nick') || '';

/* ============ Estado ============ */
let GAMES = [];
let selectedGameId = null;
let gameState = null;
let gameEngine = null;
let botId = 'bot_' + Math.random().toString(36).slice(2, 8);
let botName = '🤖 Bot';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ============ Navegación de pantallas ============ */
function showScreen(id) {
  $$('.screen').forEach((s) => s.classList.remove('active'));
  $('#screen-' + id).classList.add('active');
  document.body.classList.toggle('game-active', id === 'game');
  if (id !== 'game') {
    resetGameFit($('#game-stage'));
    delete $('#screen-game').dataset.game;
  }
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ============ Toasts ============ */
function toast(message, type = 'info') {
  if (type === 'error') SFX?.error();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  $('#toast-wrap').appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 320);
  }, 3200);
}

/* ============ Avatares ============ */
const AVATAR_COLORS = [
  'linear-gradient(135deg,#7c5cff,#9b6cff)', 'linear-gradient(135deg,#46e0c8,#1fb6a0)',
  'linear-gradient(135deg,#ff5c9c,#ff8a5c)', 'linear-gradient(135deg,#5c9cff,#46c8e0)',
  'linear-gradient(135deg,#f6c343,#ff9f43)', 'linear-gradient(135deg,#36d399,#22a06b)',
];
function avatarFor(id, name) {
  let h = 0;
  for (const ch of (id || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const color = AVATAR_COLORS[h % AVATAR_COLORS.length];
  const initials = (name || '?').trim().slice(0, 2).toUpperCase();
  return { color, initials };
}

/* ============ Renderizado de juegos ============ */
function renderGamesGrid() {
  const grid = $('#games-grid');
  grid.innerHTML = '';
  GAMES.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="game-emoji" style="background: ${game.gradient}">${game.emoji}</div>
      <h3 class="game-name">${game.name}</h3>
      <p class="game-tagline">${game.tagline}</p>
      <p class="game-desc">${game.description}</p>
      <button class="btn btn-primary btn-sm game-play" data-id="${game.id}">Jugar</button>
    `;
    grid.appendChild(card);
  });

  $$('.game-play').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedGameId = btn.dataset.id;
      showSetup();
    });
  });
}

function showSetup() {
  const game = getGame(selectedGameId);
  $('#setup-title').textContent = `Jugar ${game.meta.name}`;
  $('#nickname').value = nickname;
  showScreen('setup');
}

/* ============ Iniciar juego ============ */
function startLocalGame() {
  nickname = $('#nickname').value.trim() || 'Jugador';
  localStorage.setItem('arcade_nick', nickname);

  const game = getGame(selectedGameId);
  gameEngine = game;

  const players = [
    { id: playerId, name: nickname },
    { id: botId, name: botName },
  ];

  gameState = game.init(players);
  renderGame();
  showScreen('game');
  updateTurnBanner();

  // Si es turno del bot, ejecutar su acción
  if (gameState.turn === botId) {
    setTimeout(botTurn, 500);
  }
}

/* ============ Renderizado del juego ============ */
function renderGame() {
  const game = gameEngine;
  const stage = $('#game-stage');
  $('#game-title').textContent = game.meta.name;

  // Renderizado simple según el tipo de juego
  if (selectedGameId === 'tictactoe') {
    renderTicTacToe(stage);
  } else if (selectedGameId === 'connect4') {
    renderConnect4(stage);
  } else if (selectedGameId === 'rps') {
    renderRPS(stage);
  } else if (selectedGameId === 'memory') {
    renderMemory(stage);
  } else {
    stage.innerHTML = `<p class="text-center">Juego: ${game.meta.name}</p>`;
  }

  bindGameFit(stage);
}

function renderTicTacToe(stage) {
  const board = gameState.board;
  let html = '<div class="ttt-board">';
  board.forEach((cell, i) => {
    const isWin = gameState.winningLine?.includes(i);
    html += `<button class="ttt-cell ${isWin ? 'win' : ''}" data-index="${i}">${cell || ''}</button>`;
  });
  html += '</div>';
  stage.innerHTML = html;

  $$('.ttt-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      if (gameState.status !== 'playing' || gameState.turn !== playerId) return;
      const index = parseInt(cell.dataset.index);
      const result = gameEngine.action(gameState, playerId, { type: 'place', index });
      if (result.error) {
        toast(result.error, 'error');
      } else {
        gameState = result.state;
        renderGame();
        updateTurnBanner();
        checkGameEnd();
        if (gameState.status === 'playing' && gameState.turn === botId) {
          setTimeout(botTurn, 500);
        }
      }
    });
  });
}

function renderConnect4(stage) {
  const board = gameState.board;
  let html = '<div class="c4-board">';
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const cell = board[r][c];
      const color = cell === playerId ? 'red' : cell === botId ? 'yellow' : '';
      html += `<button class="c4-cell ${color}" data-col="${c}"></button>`;
    }
  }
  html += '</div>';
  stage.innerHTML = html;

  $$('.c4-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      if (gameState.status !== 'playing' || gameState.turn !== playerId) return;
      const col = parseInt(cell.dataset.col);
      const result = gameEngine.action(gameState, playerId, { type: 'drop', col });
      if (result.error) {
        toast(result.error, 'error');
      } else {
        gameState = result.state;
        renderGame();
        updateTurnBanner();
        checkGameEnd();
        if (gameState.status === 'playing' && gameState.turn === botId) {
          setTimeout(botTurn, 500);
        }
      }
    });
  });
}

function renderRPS(stage) {
  const scores = gameState.scores;
  const choices = gameState.currentChoices;
  let html = `
    <div class="rps-info">
      <div class="rps-score">
        <span>${nickname}: ${scores[playerId]}</span>
        <span>${botName}: ${scores[botId]}</span>
      </div>
      <div class="rps-round">Ronda ${gameState.round}/${gameState.maxRounds}</div>
    </div>
    <div class="rps-choices">
      <button class="rps-btn" data-choice="rock">✊ Piedra</button>
      <button class="rps-btn" data-choice="paper">✋ Papel</button>
      <button class="rps-btn" data-choice="scissors">✌️ Tijera</button>
    </div>
  `;
  if (choices[playerId]) {
    html += `<div class="rps-result">Elegiste: ${choices[playerId]}</div>`;
  }
  stage.innerHTML = html;

  $$('.rps-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (gameState.status !== 'playing' || choices[playerId]) return;
      const choice = btn.dataset.choice;
      const result = gameEngine.action(gameState, playerId, { type: 'choose', choice });
      gameState = result.state;
      renderGame();
      checkGameEnd();
      // Bot elige automáticamente
      if (gameState.status === 'playing' && !gameState.currentChoices[botId]) {
        setTimeout(() => {
          const botAction = gameEngine.botAction(gameState, botId);
          if (botAction) {
            const result = gameEngine.action(gameState, botId, botAction);
            gameState = result.state;
            renderGame();
            checkGameEnd();
          }
        }, 500);
      }
    });
  });
}

function renderMemory(stage) {
  const cards = gameState.cards;
  const scores = gameState.scores;
  let html = `
    <div class="memory-info">
      <span>${nickname}: ${scores[playerId]}</span>
      <span>${botName}: ${scores[botId]}</span>
    </div>
    <div class="memory-grid">
  `;
  cards.forEach(card => {
    html += `<button class="memory-card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}" data-index="${card.id}">
      <span class="memory-front">${card.emoji}</span>
      <span class="memory-back">?</span>
    </button>`;
  });
  html += '</div>';
  stage.innerHTML = html;

  $$('.memory-card').forEach(card => {
    card.addEventListener('click', () => {
      if (gameState.status !== 'playing' || gameState.turn !== playerId) return;
      const index = parseInt(card.dataset.index);
      const result = gameEngine.action(gameState, playerId, { type: 'flip', index });
      if (result.error) {
        toast(result.error, 'error');
      } else {
        gameState = result.state;
        renderGame();
        checkGameEnd();
        if (gameState.status === 'playing' && gameState.turn === botId) {
          setTimeout(botTurn, 800);
        }
      }
    });
  });
}

/* ============ Turno del bot ============ */
function botTurn() {
  if (gameState.status !== 'playing') return;
  const action = gameEngine.botAction(gameState, botId);
  if (action) {
    const result = gameEngine.action(gameState, botId, action);
    if (!result.error) {
      gameState = result.state;
      renderGame();
      updateTurnBanner();
      checkGameEnd();
    }
  }
}

/* ============ Actualizar banner de turno ============ */
function updateTurnBanner() {
  const banner = $('#turn-banner');
  if (gameState.status !== 'playing') {
    banner.textContent = '';
    return;
  }
  const name = gameState.turn === playerId ? nickname : botName;
  banner.textContent = `Turno de: ${name}`;
}

/* ============ Verificar fin del juego ============ */
function checkGameEnd() {
  if (gameState.status === 'finished') {
    let title, sub, emoji;
    if (gameState.winner === playerId) {
      title = '¡Ganaste!';
      sub = 'Has vencido a la IA';
      emoji = '🏆';
    } else if (gameState.winner === botId) {
      title = '¡Perdiste!';
      sub = 'La IA te ha ganado';
      emoji = '😢';
    } else {
      title = '¡Empate!';
      sub = 'Nadie gana esta vez';
      emoji = '🤝';
    }
    showOverlay(emoji, title, sub);
  }
}

/* ============ Overlay de fin de partida ============ */
function showOverlay(emoji, title, sub) {
  $('#overlay-emoji').textContent = emoji;
  $('#overlay-title').textContent = title;
  $('#overlay-sub').textContent = sub;
  $('#overlay').classList.remove('hidden');
  $('#overlay').style.display = 'flex';
}

function hideOverlay() {
  $('#overlay').classList.add('hidden');
  $('#overlay').style.display = 'none';
}

/* ============ Event listeners ============ */
$('#home-play').addEventListener('click', () => {
  document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
});

$('#btn-start-local').addEventListener('click', startLocalGame);

$('#leave-game').addEventListener('click', () => {
  gameState = null;
  gameEngine = null;
  hideOverlay();
  showScreen('home');
});

$('#btn-rematch').addEventListener('click', () => {
  hideOverlay();
  startLocalGame();
});

$('#btn-home').addEventListener('click', () => {
  hideOverlay();
  gameState = null;
  gameEngine = null;
  showScreen('home');
});

$$('.back-link').forEach(link => {
  link.addEventListener('click', () => {
    const target = link.dataset.go || 'home';
    showScreen(target);
  });
});

$('#brand').addEventListener('click', () => {
  showScreen('home');
});

$('#sound-toggle').addEventListener('click', () => {
  const btn = $('#sound-toggle');
  if (btn.textContent === '🔊') {
    btn.textContent = '🔇';
    SFX?.setEnabled(false);
  } else {
    btn.textContent = '🔊';
    SFX?.setEnabled(true);
  }
});

/* ============ Inicialización ============ */
function init() {
  GAMES = listGames();
  $('#stat-games').textContent = GAMES.length;
  renderGamesGrid();
  $('#conn').className = 'conn online';
}

init();
