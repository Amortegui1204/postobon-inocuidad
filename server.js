const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const https = require('https');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.static(path.join(__dirname, 'public')));

const BIN_ID  = process.env.JSONBIN_BIN_ID  || '';
const API_KEY = process.env.JSONBIN_API_KEY || '';

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function loadScores() {
  if (!BIN_ID || !API_KEY) return [];
  try {
    const result = await httpsRequest({
      hostname: 'api.jsonbin.io',
      path: `/v3/b/${BIN_ID}/latest`,
      method: 'GET',
      headers: { 'X-Master-Key': API_KEY, 'X-Bin-Meta': 'false' }
    });
    let arr = [];
    if (Array.isArray(result)) arr = result;
    else if (result && Array.isArray(result.scores)) arr = result.scores;
    else if (result && Array.isArray(result.puntajes)) arr = result.puntajes;
    // Filter out any invalid entries
    return arr.filter(s => s && typeof s.name === 'string' && s.name.trim() !== '' && typeof s.score === 'number');
  } catch(e) {
    console.error('loadScores error:', e.message);
    return [];
  }
}

async function saveScore(name, score) {
  if (!name || !name.trim() || typeof score !== 'number') return await loadScores();
  let scores = await loadScores();
  scores.push({ name: name.trim(), score, date: new Date().toLocaleDateString('es-CO') });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 50);
  if (BIN_ID && API_KEY) {
    try {
      await httpsRequest({
        hostname: 'api.jsonbin.io',
        path: `/v3/b/${BIN_ID}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY, 'X-Bin-Meta': 'false' }
      }, scores);
      console.log(`✅ Score saved: ${name} - ${score}`);
    } catch(e) { console.error('saveScore error:', e.message); }
  }
  return scores;
}

const QUESTIONS = [
  { q:"¿Cada cuánto tiempo deben lavarse las manos los operarios durante la producción?", opts:["Cada hora","Antes y después de cada actividad crítica","Solo al inicio del turno","Una vez al día"], ans:1, pts:100, tema:"Higiene Personal" },
  { q:"¿Qué elemento NO debe usarse dentro de la planta de producción?", opts:["Cofia","Guantes","Reloj y joyas","Tapabocas"], ans:2, pts:80, tema:"Higiene Personal" },
  { q:"¿Cuál es la temperatura máxima permitida para almacenar alimentos refrigerados?", opts:["10°C","4°C","0°C","15°C"], ans:1, pts:120, tema:"Higiene Personal" },
  { q:"¿Qué debe hacerse antes de manipular alimentos después de ir al baño?", opts:["Usar guantes directamente","Lavarse y desinfectarse las manos","Ponerse tapabocas","Cambiar uniforme"], ans:1, pts:90, tema:"Higiene Personal" },
  { q:"¿Qué significa BPM en la industria alimentaria?", opts:["Buenas Prácticas de Manufactura","Bases para Producción Masiva","Beneficios por Manufactura","Buena Planificación de Maquinaria"], ans:0, pts:80, tema:"BPM" },
  { q:"¿Cuál es el propósito principal de las BPM en Gaseosas Lux?", opts:["Aumentar la producción","Garantizar la inocuidad y calidad del producto","Reducir costos","Mejorar la velocidad de empaque"], ans:1, pts:100, tema:"BPM" },
  { q:"¿Con qué frecuencia deben revisarse los procedimientos BPM?", opts:["Cada 5 años","Nunca, son permanentes","Periódicamente o cuando haya cambios","Solo cuando hay auditorías"], ans:2, pts:110, tema:"BPM" },
  { q:"¿Qué documento registra las actividades de control en producción?", opts:["Factura","Registro de control de proceso","Hoja de ruta","Contrato"], ans:1, pts:90, tema:"BPM" },
  { q:"¿Qué significa FSSC 22000?", opts:["Certificación en sistema de gestión de inocuidad alimentaria","Norma de calidad de bebidas","Sistema de auditoría de proveedores","Protocolo de limpieza industrial"], ans:0, pts:100, tema:"FSSC 22000" },
  { q:"¿Cuál es el objetivo del SGIA en Gaseosas Lux?", opts:["Aumentar ventas","Definir requisitos para garantizar la seguridad de alimentos en toda la cadena","Reducir costos de producción","Mejorar el empaque"], ans:1, pts:100, tema:"FSSC 22000" },
  { q:"¿Quién es el líder del Comité de Inocuidad en Gaseosas Lux Bogotá?", opts:["El Jefe de Producción","El Director de Calidad","El Gerente de Operaciones","El Supervisor de Planta"], ans:2, pts:120, tema:"FSSC 22000" },
  { q:"¿Cuál es uno de los requisitos para implementar un SGIA?", opts:["Contratar más personal","Conformar un Comité de Inocuidad","Comprar nueva maquinaria","Cambiar el empaque del producto"], ans:1, pts:100, tema:"FSSC 22000" },
  { q:"¿Qué garantiza la inocuidad alimentaria?", opts:["Que el alimento sea económico","Que el alimento no presente riesgo para la salud al ser ingerido","Que el alimento sea sabroso","Que el alimento tenga larga vida útil"], ans:1, pts:100, tema:"Inocuidad" },
  { q:"¿Qué significa HACCP?", opts:["Hazard Analysis and Critical Control Points","High Accuracy Control Check Process","Health And Clean Control Protocol","Hygiene Analysis for Certified Control Points"], ans:0, pts:150, tema:"HACCP" },
  { q:"¿Cuántos principios tiene el sistema HACCP?", opts:["5","7","9","3"], ans:1, pts:130, tema:"HACCP" },
  { q:"¿Qué es un Punto Crítico de Control (PCC)?", opts:["Un punto donde el proceso es más rápido","Un paso donde se puede aplicar control para prevenir un peligro","Un área de la planta restringida","Un tipo de análisis de laboratorio"], ans:1, pts:140, tema:"HACCP" },
  { q:"¿Qué tipo de peligros analiza el HACCP?", opts:["Solo físicos","Solo biológicos","Biológicos, químicos y físicos","Solo químicos"], ans:2, pts:120, tema:"HACCP" },
  { q:"¿Qué es la defensa alimentaria?", opts:["Control de calidad del producto","Proceso para garantizar seguridad frente a ataques maliciosos intencionales","Programa de limpieza de equipos","Sistema de control de plagas"], ans:1, pts:120, tema:"Defensa Alimentaria" },
  { q:"¿Cuál es un ejemplo de sabotaje en planta?", opts:["Llegar tarde al trabajo","Contaminación intencional de materias primas durante el proceso","No usar cofia","Hablar con compañeros"], ans:1, pts:120, tema:"Defensa Alimentaria" },
  { q:"¿Qué es el fraude alimentario?", opts:["Un error involuntario en la producción","Sustitución intencional de alimentos para obtener beneficios económicos","Una falla mecánica en los equipos","Una variación en la temperatura"], ans:1, pts:130, tema:"Defensa Alimentaria" },
  { q:"¿Cuál es un tipo de fraude alimentario?", opts:["Mantenimiento preventivo","Adulteración del producto","Capacitación del personal","Control de temperatura"], ans:1, pts:110, tema:"Defensa Alimentaria" },
  { q:"¿Cuál es una amenaza de espionaje en planta?", opts:["No lavarse las manos","Compartir información clasificada de la compañía","Usar uniforme incompleto","No usar tapabocas"], ans:1, pts:110, tema:"Defensa Alimentaria" },
  { q:"¿Qué son los Programas Prerrequisitos (PPR)?", opts:["Normas de seguridad industrial","Condiciones básicas para mantener un ambiente higiénico en elaboración de alimentos","Procedimientos de mantenimiento","Protocolos de ventas"], ans:1, pts:100, tema:"PPR" },
  { q:"¿Cuál de estos es un Programa Prerrequisito en Gaseosas Lux?", opts:["Programa de ventas","Programa de limpieza y desinfección","Programa de publicidad","Programa de logística"], ans:1, pts:100, tema:"PPR" },
  { q:"¿Cuántos Programas Prerrequisitos maneja Gaseosas Lux?", opts:["10","15","24","30"], ans:2, pts:130, tema:"PPR" },
  { q:"¿Qué PPR garantiza la calidad del agua usada en producción?", opts:["Programa de residuos sólidos","Verificación de suministro de agua","Programa de iluminación","Control de aire comprimido"], ans:1, pts:110, tema:"PPR" },
  { q:"¿Qué programa PPR garantiza que los equipos midan correctamente?", opts:["Programa de trazabilidad","Programa de aseguramiento metrológico","Programa de capacitación","Control de plagas"], ans:1, pts:120, tema:"PPR" },
  { q:"¿Cuál es la diferencia entre limpiar y desinfectar?", opts:["Son lo mismo","Limpiar elimina suciedad visible, desinfectar elimina microorganismos","Desinfectar elimina suciedad","Limpiar usa químicos, desinfectar usa agua"], ans:1, pts:100, tema:"Limpieza" },
  { q:"¿Qué pasa si se mezclan incorrectamente los productos de limpieza?", opts:["Limpian mejor","Pueden generar reacciones peligrosas y contaminar el producto","No pasa nada","Se evaporan rápido"], ans:1, pts:110, tema:"Limpieza" },
  { q:"¿Qué debe verificarse antes de iniciar producción respecto al equipo?", opts:["Que esté encendido","Que esté correctamente limpio y desinfectado","Que tenga aceite","Que esté en lugar correcto"], ans:1, pts:100, tema:"Limpieza" },
  { q:"¿Cómo deben almacenarse las materias primas?", opts:["Directamente en el piso","Sobre estibas","En cualquier superficie limpia","Apiladas sin orden"], ans:1, pts:100, tema:"Almacenamiento" },
  { q:"¿Qué está prohibido en el almacén de materias primas?", opts:["Usar estibas","Comer, beber o fumar","Tener iluminación adecuada","Mantener limpio el área"], ans:1, pts:90, tema:"Almacenamiento" },
  { q:"¿Qué se debe reportar respecto a las materias primas?", opts:["Solo el inventario","Características inusuales en las materias primas","El precio de compra","El proveedor"], ans:1, pts:110, tema:"Almacenamiento" },
  { q:"¿Qué se debe hacer al evidenciar presencia de plagas en planta?", opts:["Ignorarla si es pequeña","Reportarla inmediatamente al encargado del programa","Eliminarla con cualquier producto","Esperar al siguiente turno"], ans:1, pts:130, tema:"Control de Plagas" },
  { q:"¿Qué acción ayuda a prevenir plagas en planta?", opts:["Dejar residuos en las áreas de trabajo","Mantener las rejillas puestas en los desagües","Dejar puertas abiertas","Acumular cajas cerca de paredes"], ans:1, pts:110, tema:"Control de Plagas" },
  { q:"¿Qué debemos hacer si un producto fue manipulado indebidamente?", opts:["Ignorarlo","Informarlo inmediatamente","Continuar con el proceso","Descartarlo sin avisar"], ans:1, pts:120, tema:"Acciones en Planta" },
  { q:"¿Qué debemos hacer con personal que no cumple las BPM?", opts:["Ignorarlo","Reportarlo al supervisor","Retroalimentarlo para que cumpla","Sancionarlo directamente"], ans:2, pts:110, tema:"Acciones en Planta" },
  { q:"¿Cuál es una responsabilidad del personal respecto a los PCC?", opts:["Ignorarlos","Monitorear, controlar y verificar los Puntos Críticos de Control","Solo observarlos","Modificarlos según convenga"], ans:1, pts:140, tema:"Acciones en Planta" },
  { q:"¿Qué se debe hacer ante una novedad en planta?", opts:["Resolverla solo","Informar a los integrantes del Comité de Inocuidad","Esperar al final del turno","Anotarla en el cuaderno personal"], ans:1, pts:110, tema:"Acciones en Planta" },
  { q:"¿Qué debe mantenerse limpio para prevenir plagas según el Plan Maestro de Limpieza?", opts:["Solo los pisos","Paredes, pisos, techos, desagües, ventanas y lámparas","Solo las máquinas","Solo las áreas de producción"], ans:1, pts:120, tema:"Limpieza" },
  { q:"¿Cuál de estas áreas es considerada zona de producción en Gaseosas Lux?", opts:["Vestieres","Sala de envasado de gaseosa","Estacionamiento","Oficinas administrativas"], ans:1, pts:100, tema:"Zonas" },
  { q:"¿Qué sistema de gestión de inocuidad usa Gaseosas Lux?", opts:["Solo ISO 9001","ISO 22000 / FSSC 22000","Solo BPM","Ninguno formal"], ans:1, pts:160, tema:"BPM" },
  { q:"¿Qué hacer si se detecta contaminación cruzada en línea?", opts:["Continuar y reportar al final","Detener la línea, aislar el producto y reportar inmediatamente","Avisar solo al compañero","Ignorar si es pequeña"], ans:1, pts:150, tema:"HACCP" },
  { q:"¿Cuál es el Principio 1 del plan de control de peligros?", opts:["Establecer límites críticos","Análisis de peligros alimentarios","Sistema de documentación","Identificar PCC"], ans:1, pts:130, tema:"HACCP" },
  { q:"¿Qué es un registro en inocuidad?", opts:["Un informe anual","Una evidencia documentada de actividades de control","Un listado de empleados","Un contrato de calidad"], ans:1, pts:90, tema:"BPM" },
  { q:"¿Cuál es la vestimenta mínima para ingresar a producción?", opts:["Solo guantes","Cofia, tapabocas, uniforme limpio y calzado adecuado","Solo uniforme","Cualquier ropa de trabajo"], ans:1, pts:100, tema:"BPM" },
  { q:"¿Qué debe hacerse con un producto que cae al suelo?", opts:["Recogerlo y continuar","Lavarlo y usarlo","Descartarlo e iniciar protocolo de producto no conforme","Guardarlo aparte"], ans:2, pts:120, tema:"BPM" },
  { q:"¿Qué significa inocuidad alimentaria?", opts:["Que el alimento es sabroso","Que el alimento no causa daño a la salud","Que el alimento es nutritivo","Que el alimento es económico"], ans:1, pts:100, tema:"BPM" },
  { q:"¿Qué acción tomar al encontrar una plaga dentro de la planta?", opts:["Ignorarla si es pequeña","Reportarla inmediatamente al área de saneamiento","Eliminarla con cualquier producto","Esperar al siguiente turno"], ans:1, pts:130, tema:"BPM" },
  { q:"¿Con qué frecuencia se debe calibrar un termómetro de control?", opts:["Nunca","Solo cuando falla","Según el programa de calibración establecido","Una vez al año"], ans:2, pts:120, tema:"HACCP" },
  { q:"¿Cuál es el alcance de FSSC 22000 en Gaseosas Lux Bogotá?", opts:["Solo bebidas gaseosas en vidrio","Fabricación de gaseosas, jugos, agua y bebidas hidratantes en diversas líneas","Solo producción de agua","Solo jugos y néctares"], ans:1, pts:130, tema:"FSSC 22000" },
  { q:"¿Cuál es un beneficio del SGIA para Gaseosas Lux?", opts:["Reducir el número de empleados","Aumentar la confianza del cliente y consumidor","Disminuir la producción","Eliminar auditorías"], ans:1, pts:90, tema:"FSSC 22000" },
  { q:"¿Qué mejora el SGIA en las operaciones de Gaseosas Lux?", opts:["El precio de venta","La trazabilidad de productos generando transparencia","La velocidad de entrega","El diseño del empaque"], ans:1, pts:110, tema:"FSSC 22000" },
  { q:"¿Cuál es el primer paso preliminar para el plan de control de peligros?", opts:["Elaborar diagrama de flujo","Conformación del equipo de inocuidad","Descripción del producto","Verificación in situ"], ans:1, pts:110, tema:"HACCP" },
  { q:"¿Qué PPR controla los animales y vectores en planta?", opts:["Programa de capacitación","Programa de manejo de plagas","Programa de trazabilidad","Programa de metrología"], ans:1, pts:100, tema:"PPR" },
];

const SNAKES  = {60:44,54:36,47:19,41:25,35:6,28:10};
const LADDERS = {4:14,9:31,20:38,33:56,40:59,51:62};
const SNAKE_SET  = new Set(Object.keys(SNAKES).map(Number));
const LADDER_SET = new Set(Object.keys(LADDERS).map(Number));
const ALL_SQUARES = Array.from({length:64},(_,i)=>i+1)
  .filter(n => !SNAKE_SET.has(n) && !LADDER_SET.has(n) && n < 64 && n > 1);

function shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

function shuffleAnswers(q) {
  const indexed = q.opts.map((text, i) => ({text, correct: i === q.ans}));
  const shuffled = shuffle(indexed);
  return { ...q, opts: shuffled.map(o => o.text), ans: shuffled.findIndex(o => o.correct) };
}

function applySnakeLadder(pos) {
  let event = null, scoreChange = 0;
  if (SNAKES[pos])  { event={type:'snake', from:pos,to:SNAKES[pos]};  pos=SNAKES[pos]; scoreChange=-100; }
  if (LADDERS[pos]) { event={type:'ladder',from:pos,to:LADDERS[pos]}; pos=LADDERS[pos]; scoreChange=+50; }
  return {pos, event, scoreChange};
}

async function saveScoreOnce(socket, reason) {
  if (socket.scoreSaved) return await loadScores();
  socket.scoreSaved = true;
  console.log(`✅ Score saved: ${socket.playerName} - ${socket.score} (${reason})`);
  return await saveScore(socket.playerName, socket.score);
}

app.get('/leaderboard', async (req,res) => res.json(await loadScores()));

// In-memory registry of names that have played (persists while server is running)
const playedNames = new Set();

function normalizeNameForComparison(name) {
  return name.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\s+/g, ' '); // normalize spaces
}

function nameAlreadyPlayed(name, scores) {
  const incoming = normalizeNameForComparison(name);
  const incomingWords = incoming.split(' ').filter(w => w.length > 2);

  // Check in-memory registry first
  for (const played of playedNames) {
    const existing = normalizeNameForComparison(played);
    if (existing === incoming) return true;
    const existingWords = existing.split(' ').filter(w => w.length > 2);
    const matches = incomingWords.filter(w => existingWords.includes(w));
    if (matches.length >= 2) return true;
  }

  // Also check against saved scores
  for (const s of scores) {
    if (!s || typeof s.name !== 'string') continue;
    const existing = normalizeNameForComparison(s.name);
    if (existing === incoming) return true;
    const existingWords = existing.split(' ').filter(w => w.length > 2);
    const matches = incomingWords.filter(w => existingWords.includes(w));
    if (matches.length >= 2) return true;
  }
  return false;
}

io.on('connection', async (socket) => {
  try { socket.emit('leaderboard', await loadScores()); } catch(e) { socket.emit('leaderboard', []); }

  socket.on('startSolo', async ({playerName}) => {
    try {
      const name = (playerName || '').trim();
      if (!name) { socket.emit('blocked', { name: '' }); return; }

      const scores = await loadScores();
      if (nameAlreadyPlayed(name, scores)) {
        socket.emit('blocked', { name });
        return;
      }

      // Register name immediately to prevent double entry
      playedNames.add(name);
      socket.playerName = name;
      socket.pos = 0;
      socket.score = 0;
      socket.lives = 3;
      socket.waitingAnswer = false;
      socket.currentQuestion = null;
      socket.scoreSaved = false; // prevent saving score multiple times
      socket.scoreSaved = false; // Flag to prevent saving multiple times
      const shuffledQ = shuffle(QUESTIONS);
      const shuffledS = shuffle(ALL_SQUARES);
      socket.squareMap = {};
      shuffledS.forEach((sq,i) => { socket.squareMap[sq] = shuffleAnswers(shuffledQ[i % shuffledQ.length]); });
      socket.emit('soloStarted', {name: socket.playerName});
    } catch(e) {
      console.error('startSolo error:', e.message);
    }
  });

  socket.on('rollDice', () => {
    try {
      if (socket.waitingAnswer) return;
      if (socket.scoreSaved) return; // Game already ended
      if (!socket.playerName) return; // Not started yet

      const roll = Math.floor(Math.random()*6)+1;
      let newPos = (socket.pos || 0) + roll;

      // If reaches or passes 64, go directly to 64 - WIN
      if (newPos >= 64) {
        socket.pos = 64;
        socket.emit('diceRolled', {roll, newPos:64, event:null, score:socket.score, lives:socket.lives, scoreChange:0});
        saveScoreOnce(socket, 'ganó').then(scores => socket.emit('gameWon', {score:socket.score, leaderboard:scores}));
        return;
      }

      // Apply snakes/ladders only if not winning
      const {pos:finalPos, event, scoreChange} = applySnakeLadder(newPos);
      socket.pos = finalPos;
      if (scoreChange !== 0) socket.score = Math.max(0, (socket.score||0) + scoreChange);
      socket.emit('diceRolled', {roll, newPos:finalPos, event, score:socket.score, lives:socket.lives, scoreChange});

      const q = socket.squareMap && socket.squareMap[finalPos];
      if (q && !SNAKE_SET.has(finalPos) && !LADDER_SET.has(finalPos)) {
        socket.waitingAnswer = true;
        socket.currentQuestion = {...q, id:Date.now()};
        socket.emit('questionAsked', {question:socket.currentQuestion});
      }
    } catch(e) { console.error('rollDice error:', e.message); }
  });

  socket.on('answerQuestion', ({answerId}) => {
    try {
      if (!socket.waitingAnswer || !socket.currentQuestion) return;
      const q = socket.currentQuestion;
      const correct = answerId === q.ans;
      socket.waitingAnswer = false;
      socket.currentQuestion = null;
      if (correct) {
        socket.score += q.pts;
        socket.emit('answerResult', {correct:true, pts:q.pts, score:socket.score, lives:socket.lives, message:`✅ ¡Correcto! +${q.pts} puntos`});
      } else {
        socket.lives -= 1;
        socket.emit('answerResult', {correct:false, pts:0, score:socket.score, lives:socket.lives, message:`❌ Incorrecto. Era: "${q.opts[q.ans]}"`});
        if (socket.lives <= 0) {
          saveScoreOnce(socket, 'sin vidas').then(scores => socket.emit('gameOver', {score:socket.score, leaderboard:scores}));
        }
      }
    } catch(e) { console.error('answerQuestion error:', e.message); }
  });

  socket.on('timeUp', () => {
    try {
      saveScoreOnce(socket, 'tiempo').then(scores => socket.emit('gameOver', {score:socket.score, leaderboard:scores, reason:'tiempo'}));
    } catch(e) { console.error('timeUp error:', e.message); }
  });
});

const PORT = process.env.PORT||3000;
server.listen(PORT, ()=>console.log(`🎮 Gaseosas Lux Inocuidad en http://localhost:${PORT}`));
