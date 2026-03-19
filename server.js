const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// ── LEADERBOARD (persisted in scores.json) ───────────────────────────────────
const SCORES_FILE = path.join(__dirname, 'scores.json');

function loadScores() {
  try { return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8')); }
  catch { return []; }
}

function saveScore(name, score, time) {
  let scores = loadScores();
  scores.push({ name, score, time, date: new Date().toLocaleDateString('es-CO') });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 20); // keep top 20
  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
  return scores;
}

// ── QUESTIONS ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  { q:"¿Cada cuánto tiempo deben lavarse las manos los operarios durante la producción?", opts:["Cada hora","Antes y después de cada actividad crítica","Solo al inicio del turno","Una vez al día"], ans:1, pts:100, tema:"Higiene Personal" },
  { q:"¿Qué elemento NO debe usarse dentro de la planta de producción?", opts:["Cofia","Guantes","Reloj y joyas","Tapabocas"], ans:2, pts:80, tema:"Higiene Personal" },
  { q:"¿Cuál es la temperatura máxima permitida para almacenar alimentos refrigerados?", opts:["10°C","4°C","0°C","15°C"], ans:1, pts:120, tema:"Higiene Personal" },
  { q:"¿Qué debe hacerse antes de manipular alimentos después de ir al baño?", opts:["Usar guantes directamente","Lavarse y desinfectarse las manos","Ponerse tapabocas","Cambiar uniforme"], ans:1, pts:90, tema:"Higiene Personal" },
  { q:"¿Qué significa BPM en la industria alimentaria?", opts:["Buenas Prácticas de Manufactura","Bases para Producción Masiva","Beneficios por Manufactura","Buena Planificación de Maquinaria"], ans:0, pts:80, tema:"BPM" },
  { q:"¿Cuál es el propósito principal de las BPM en Gaseosas Lux?", opts:["Aumentar la producción","Garantizar la inocuidad y calidad del producto","Reducir costos","Mejorar la velocidad de empaque"], ans:1, pts:100, tema:"BPM" },
  { q:"¿Con qué frecuencia deben revisarse los procedimientos BPM?", opts:["Cada 5 años","Nunca, son permanentes","Periódicamente o cuando haya cambios","Solo cuando hay auditorías"], ans:2, pts:110, tema:"BPM" },
  { q:"¿Qué documento registra las actividades de control en producción?", opts:["Factura","Registro de control de proceso","Hoja de ruta","Contrato"], ans:1, pts:90, tema:"BPM" },
  { q:"¿Qué significa HACCP?", opts:["Hazard Analysis and Critical Control Points","High Accuracy Control Check Process","Health And Clean Control Protocol","Hygiene Analysis for Certified Control Points"], ans:0, pts:150, tema:"HACCP" },
  { q:"¿Cuántos principios tiene el sistema HACCP?", opts:["5","7","9","3"], ans:1, pts:130, tema:"HACCP" },
  { q:"¿Qué es un Punto Crítico de Control (PCC)?", opts:["Un punto donde el proceso es más rápido","Un paso donde se puede aplicar control para prevenir un peligro","Un área de la planta restringida","Un tipo de análisis de laboratorio"], ans:1, pts:140, tema:"HACCP" },
  { q:"¿Qué tipo de peligros analiza el HACCP?", opts:["Solo físicos","Solo biológicos","Biológicos, químicos y físicos","Solo químicos"], ans:2, pts:120, tema:"HACCP" },
  { q:"¿Cuál es la diferencia entre limpiar y desinfectar?", opts:["Son lo mismo","Limpiar elimina suciedad, desinfectar elimina microorganismos","Desinfectar elimina suciedad visible","Limpiar usa químicos, desinfectar usa agua"], ans:1, pts:100, tema:"Limpieza" },
  { q:"¿Con qué debe enjuagarse el equipo después de aplicar desinfectante?", opts:["Agua tibia","Agua potable según protocolo","Alcohol","Vinagre"], ans:1, pts:90, tema:"Limpieza" },
  { q:"¿Qué pasa si se mezclan incorrectamente los productos de limpieza?", opts:["Limpian mejor","Pueden generar reacciones peligrosas y contaminar el producto","No pasa nada","Se evaporan rápido"], ans:1, pts:110, tema:"Limpieza" },
  { q:"¿Qué debe verificarse antes de iniciar la producción respecto al equipo?", opts:["Que esté encendido","Que esté correctamente limpio y desinfectado","Que tenga aceite","Que esté en el lugar correcto"], ans:1, pts:100, tema:"Limpieza" },
  { q:"¿Qué sistema de gestión de inocuidad usa Gaseosas Lux?", opts:["Solo ISO 9001","ISO 22000 / FSSC 22000","Solo BPM","Ninguno formal"], ans:1, pts:160, tema:"BPM" },
  { q:"¿Qué hacer si se detecta una contaminación cruzada en línea?", opts:["Continuar producción y reportar al final","Detener la línea, aislar el producto y reportar inmediatamente","Avisar solo al compañero","Ignorar si es pequeña"], ans:1, pts:150, tema:"HACCP" },
  { q:"¿Cuál es la vestimenta mínima requerida para ingresar a producción?", opts:["Solo guantes","Cofia, tapabocas, uniforme limpio y calzado adecuado","Solo uniforme","Cualquier ropa de trabajo"], ans:1, pts:100, tema:"Higiene Personal" },
  { q:"¿Qué debe hacerse con un producto que cae al suelo?", opts:["Recogerlo y continuar","Lavarlo y usarlo","Descartarlo e iniciar protocolo de producto no conforme","Guardarlo aparte"], ans:2, pts:120, tema:"BPM" },
  { q:"¿Qué significa 'inocuidad alimentaria'?", opts:["Que el alimento es sabroso","Que el alimento no causa daño a la salud","Que el alimento es nutritivo","Que el alimento es económico"], ans:1, pts:100, tema:"BPM" },
  { q:"¿Qué acción tomar al encontrar una plaga dentro de la planta?", opts:["Ignorarla si es pequeña","Reportarla inmediatamente al área de saneamiento","Eliminarla con cualquier producto","Esperar al siguiente turno"], ans:1, pts:130, tema:"BPM" },
  { q:"¿Con qué frecuencia se debe calibrar un termómetro de control?", opts:["Nunca","Solo cuando falla","Según el programa de calibración establecido","Una vez al año"], ans:2, pts:120, tema:"HACCP" },
  { q:"¿Qué es un registro en inocuidad?", opts:["Un informe anual","Una evidencia documentada de actividades de control","Un listado de empleados","Un contrato de calidad"], ans:1, pts:90, tema:"BPM" },
];

const SNAKES  = { 60:44, 41:25, 28:10, 54:36 };
const LADDERS = { 4:14, 9:31, 20:38, 40:59, 51:67, 63:81 };
const Q_SQUARES = [3,4,5,8,11,12,13,19,21,23,29,30,32,37,39,44,46,49,52,53,58];

function randomQuestion() {
  return { ...QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)], id: Date.now() };
}

function applySnakeLadder(pos) {
  let event = null;
  if (SNAKES[pos])  { event = { type:'snake',  from:pos, to:SNAKES[pos]  }; pos = SNAKES[pos]; }
  if (LADDERS[pos]) { event = { type:'ladder', from:pos, to:LADDERS[pos] }; pos = LADDERS[pos]; }
  return { pos, event };
}

// ── ROUTES ───────────────────────────────────────────────────────────────────
app.get('/leaderboard', (req, res) => {
  res.json(loadScores());
});

// ── SOCKET ───────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {

  // Send leaderboard on connect
  socket.emit('leaderboard', loadScores());

  socket.on('startSolo', ({ playerName }) => {
    socket.playerName = playerName || 'Jugador';
    socket.pos = 0;
    socket.score = 0;
    socket.lives = 3;
    socket.waitingAnswer = false;
    socket.currentQuestion = null;
    socket.emit('soloStarted', { name: socket.playerName });
  });

  socket.on('rollDice', () => {
    if (socket.waitingAnswer) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    let newPos = socket.pos + roll;
    if (newPos > 64) newPos = socket.pos;

    const { pos: finalPos, event } = applySnakeLadder(newPos);
    socket.pos = finalPos;

    socket.emit('diceRolled', { roll, newPos: finalPos, event, score: socket.score, lives: socket.lives });

    if (finalPos >= 64) {
      const scores = saveScore(socket.playerName, socket.score, null);
      socket.emit('gameWon', { score: socket.score, leaderboard: scores });
      return;
    }

    if (Q_SQUARES.includes(finalPos)) {
      socket.waitingAnswer = true;
      socket.currentQuestion = randomQuestion();
      socket.emit('questionAsked', { question: socket.currentQuestion });
    }
  });

  socket.on('answerQuestion', ({ answerId }) => {
    if (!socket.waitingAnswer || !socket.currentQuestion) return;
    const q = socket.currentQuestion;
    const correct = answerId === q.ans;
    socket.waitingAnswer = false;
    socket.currentQuestion = null;

    if (correct) {
      socket.score += q.pts;
      socket.emit('answerResult', { correct: true, pts: q.pts, score: socket.score, lives: socket.lives, message: `✅ ¡Correcto! +${q.pts} puntos` });
    } else {
      socket.lives -= 1;
      socket.emit('answerResult', { correct: false, pts: 0, score: socket.score, lives: socket.lives, message: `❌ Incorrecto. Era: "${q.opts[q.ans]}"` });
      if (socket.lives <= 0) {
        const scores = saveScore(socket.playerName, socket.score, null);
        socket.emit('gameOver', { score: socket.score, leaderboard: scores });
      }
    }
  });

  socket.on('timeUp', () => {
    const scores = saveScore(socket.playerName, socket.score, 'tiempo');
    socket.emit('gameOver', { score: socket.score, leaderboard: scores, reason: 'tiempo' });
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎮 Gaseosas Lux – Juego de Inocuidad corriendo en http://localhost:${PORT}`));
