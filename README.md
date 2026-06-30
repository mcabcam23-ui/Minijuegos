# 🎮 Arcade · Minijuegos Multijugador Online

App web de minijuegos para jugar con amigos en tiempo real, **sin necesidad de registrarse**. Un jugador crea una sala y obtiene un código de 4 caracteres; el resto se une con ese código (o con el enlace de invitación) y a jugar.

## ✨ Características

- **Sin login**: tu identidad se guarda localmente en el navegador.
- **Salas con código**: crea una sala, comparte el código `ABCD` o el enlace de invitación.
- **Tiempo real** con WebSockets (Socket.IO): turnos, jugadas y resultados se sincronizan al instante.
- **Juega contra bots 🤖**: rellena la sala con bots para jugar al instante. Hay IA para los 9 juegos (con estrategia básica: ganar/bloquear, captura obligatoria, caza en el tablero, memoria de cartas, etc.).
- **Máximo de jugadores ajustable**: en los juegos que lo permiten, el anfitrión elige cuántos jugadores caben en la sala.
- **Chat en la sala** y **reacciones con emojis** flotantes durante la partida.
- **Marcador de series**: se cuentan las victorias de cada jugador dentro de la sala.
- **Cambia de juego desde el lobby** sin perder la sala (lo decide el anfitrión).
- **Efectos de sonido** (activables/desactivables) generados con WebAudio.
- **Reconexión automática**: si recargas la página vuelves a tu partida.
- **Diseño moderno y responsive**: degradados animados, glassmorphism y animaciones, ideal para móvil y escritorio.
- **Revancha** y **volver al lobby** al terminar.

## 🕹️ Juegos incluidos (9)

| Juego | Jugadores | Descripción |
|-------|-----------|-------------|
| ⭕ Tres en Raya | 2 | El clásico 3 en línea. |
| 🔴 Conecta 4 | 2 | Alinea cuatro fichas dejándolas caer. |
| 🚢 Tocado y Hundido | 2 | Coloca tu flota en secreto y hunde la del rival por turnos. |
| ⚪ Damas | 2 | Reglas inglesas: captura obligatoria, multi-salto y coronación de damas. |
| ⬛ Timbiriche (Dots & Boxes) | 2–4 | Traza líneas y cierra cajas para conquistar el tablero. |
| 🧠 Memoria | 2–4 | Encuentra todas las parejas; gana quien más consiga. |
| 🔤 Ahorcado | 2–6 | Adivinad la palabra por turnos antes de quedaros sin intentos. |
| ❓ Trivia | 2–8 | Preguntas de cultura general con puntos por acierto y rapidez. |
| ✊ Piedra, Papel o Tijera | 2 | Al mejor de 5 rondas, eligiendo a la vez. |

## 🚀 Cómo ejecutar

### Versión completa (con multijugador online)

Requisitos: **Node.js 18+** (probado con Node 24).

```bash
npm install
npm start
```

Abre **http://localhost:3000** en tu navegador. Para jugar con otra persona en tu misma red, comparte tu IP local (p. ej. `http://192.168.1.50:3000`). Para internet, despliega en cualquier hosting de Node (Render, Railway, Fly.io, etc.).

Modo desarrollo (recarga al guardar):

```bash
npm run dev
```

El puerto se puede cambiar con la variable de entorno `PORT`.

### Versión estática (GitHub Pages)

Para desplegar en GitHub Pages sin servidor (solo contra bots):

1. Sube el repositorio a GitHub
2. Ve a **Settings** > **Pages**
3. En **Source**, selecciona `main` branch y carpeta `/public`
4. Accede a `https://tu-usuario.github.io/App-mini-juegos/index-static.html`

La versión estática incluye:
- ⭕ Tres en Raya
- 🔴 Conecta 4
- ✊ Piedra, Papel o Tijera
- 🧠 Memoria

Juegas contra una IA básica. No requiere servidor ni Node.js.

### Despliegue gratuito con multijugador (Render)

Para tener la versión completa con multijugador online desde cualquier dispositivo:

**Opción recomendada: Render (render.com)**

1. Crea una cuenta en [render.com](https://render.com)
2. Sube tu código a GitHub
3. En Render, haz clic en **"New +"** > **"Web Service"**
4. Conecta tu repositorio de GitHub
5. Render detectará automáticamente Node.js y usará `render.yaml`
6. Haz clic en **"Create Web Service"**
7. Espera unos minutos mientras se despliega
8. Render te dará una URL como `https://arcade-minijuegos.onrender.com`

**Ventajas de Render:**
- ✅ Plan gratuito con WebSockets (necesario para Socket.IO)
- ✅ Soporte completo de Node.js
- ✅ Despliegue automático desde GitHub
- ✅ HTTPS incluido
- ✅ Accesible desde cualquier móvil

**Nota:** El plan gratuito de Render tiene "sleep mode" - la app se duerme después de 15 minutos de inactividad y tarda ~30 segundos en despertar. Para evitar esto, puedes usar un servicio como [UptimeRobot](https://uptimerobot.com) para hacer ping cada 5 minutos.

## 🧩 Cómo se juega

1. Elige un juego en la pantalla principal.
2. Escribe tu nombre y pulsa **Crear sala**.
3. Comparte el **código** (o el enlace) con tus amigos.
4. Cuando estén todos, el anfitrión pulsa **Empezar partida**.

## 🏗️ Arquitectura

```
server/
  index.js          # Servidor Express + Socket.IO (salas, eventos, difusión)
  rooms.js          # Gestión de salas, códigos y jugadores
  games/            # Motor de cada juego (lógica pura, validada en servidor)
    index.js, ticTacToe.js, connect4.js, battleship.js, checkers.js,
    dots.js, memory.js, hangman.js, trivia.js, rps.js
    data/           # Bancos de palabras (Ahorcado) y preguntas (Trivia)
public/
  index.html        # Estructura de la app (una sola página)
  css/styles.css    # Estilos, animaciones y responsive
  js/
    app.js          # Lógica de cliente: sockets, pantallas, lobby, toasts
    games/          # Renderizadores de cada juego en el cliente
```

Toda la lógica de juego (turnos, validaciones, condiciones de victoria) vive y se valida en el **servidor**, por lo que los clientes no pueden hacer trampas. Cada juego implementa una interfaz común: `init(players)`, `action(state, playerId, action)` y `view(state, playerId)` (esta última oculta información secreta, como los barcos del rival).

## ➕ Añadir un juego nuevo

1. Crea `server/games/miJuego.js` exportando `meta`, `init`, `action` y opcionalmente `view`.
2. Regístralo en `server/games/index.js`.
3. Crea `public/js/games/miJuego.js` con la función de render y añádelo a `public/js/games/registry.js` con la misma `id`.

## 📄 Licencia

MIT.
