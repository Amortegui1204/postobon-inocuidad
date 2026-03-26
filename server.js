const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.static(path.join(__dirname, 'public')));

const SCORES_FILE = path.join(__dirname, 'scores.json');
function loadScores() { try { return JSON.parse(fs.readFileSync(SCORES_FILE,'utf8')); } catch { return []; } }
function saveScore(name, score) {
  let s = loadScores();
  s.push({ name, score, date: new Date().toLocaleDateString('es-CO') });
  s.sort((a,b)=>b.score-a.score);
  s = s.slice(0,20);
  fs.writeFileSync(SCORES_FILE, JSON.stringify(s,null,2));
  return s;
}

const QUESTIONS = [
  // FSSC 22000 / SGIA
  { q:"¿Qué significa FSSC 22000?", opts:["Certificación en sistema de gestión de inocuidad alimentaria","Norma de calidad de bebidas","Sistema de auditoría de proveedores","Protocolo de limpieza industrial"], ans:0, pts:100, tema:"FSSC 22000" },
  { q:"¿Cuál es el objetivo del SGIA en Gaseosas Lux?", opts:["Aumentar ventas","Definir requisitos para garantizar la seguridad de alimentos en toda la cadena","Reducir costos de producción","Mejorar el empaque"], ans:1, pts:100, tema:"FSSC 22000" },
  { q:"¿Quién es el líder del Comité de Inocuidad en Gaseosas Lux Bogotá?", opts:["El Jefe de Producción","El Director de Calidad","El Gerente de Operaciones","El Supervisor de Planta"], ans:2, pts:120, tema:"FSSC 22000" },
  { q:"¿Cuál es uno de los requisitos para implementar un SGIA?", opts:["Contratar más personal","Conformar un Comité de Inocuidad","Comprar nueva maquinaria","Cambiar el empaque del producto"], ans:1, pts:100, tema:"FSSC 22000" },
  { q:"¿Qué garantiza la inocuidad alimentaria?", opts:["Que el alimento sea económico","Que el alimento no presente riesgo para la salud al ser ingerido","Que el alimento sea sabroso","Que el alimento tenga larga vida útil"], ans:1, pts:100, tema:"Inocuidad" },
  { q:"¿Cuál es el alcance de FSSC 22000 en Gaseosas Lux Bogotá?", opts:["Solo bebidas gaseosas en vidrio","Fabricación de gaseosas, jugos, agua y bebidas hidratantes en diversas líneas","Solo producción de agua","Solo jugos y néctares"], ans:1, pts:130, tema:"FSSC 22000" },
  { q:"¿Cuál es un beneficio del SGIA?", opts:["Reducir el número de empleados","Aumentar la confianza del cliente y consumidor","Disminuir la producción","Eliminar auditorías"], ans:1, pts:90, tema:"FSSC 22000" },
  { q:"¿Qué mejora el SGIA en las operaciones de Gaseosas Lux?", opts:["El precio de venta","La trazabilidad de productos generando transparencia","La velocidad de entrega","El diseño del empaque"], ans:1, pts:110, tema:"FSSC 22000" },

  // Defensa alimentaria
  { q:"¿Qué es la defensa alimentaria?", opts:["Control de calidad del producto","Proceso para garantizar seguridad frente a ataques maliciosos intencionales","Programa de limpieza de equipos","Sistema de control de plagas"], ans:1, pts:120, tema:"Defensa Alimentaria" },
  { q:"¿Cuál es un ejemplo de sabotaje en planta?", opts:["Llegar tarde al trabajo","Contaminación intencional de materias primas durante el proceso","No usar cofia","Hablar con compañeros"], ans:1, pts:120, tema:"Defensa Alimentaria" },
  { q:"¿Qué es el fraude alimentario?", opts:["Un error involuntario en la producción","Sustitución intencional de alimentos para obtener beneficios económicos","Una falla mecánica en los equipos","Una variación en la temperatura"], ans:1, pts:130, tema:"Defensa Alimentaria" },
  { q:"¿Cuál es un tipo de fraude alimentario?", opts:["Mantenimiento preventivo","Adulteración del producto","Capacitación del personal","Control de temperatura"], ans:1, pts:110, tema:"Defensa Alimentaria" },
  { q:"¿Qué es la adulteración de alimentos?", opts:["Mejorar la calidad del producto","Cambio de naturaleza y composición que no corresponde a lo declarado en la etiqueta","Agregar vitaminas al producto","Cambiar el empaque del producto"], ans:1, pts:120, tema:"Defensa Alimentaria" },
  { q:"¿Cuál es una amenaza de espionaje en planta?", opts:["No lavarse las manos","Compartir información clasificada de la compañía","Usar uniforme incompleto","No usar tapabocas"], ans:1, pts:110, tema:"Defensa Alimentaria" },

  // Plan de control de peligros / HACCP
  { q:"¿Cuántos principios tiene el plan de control de peligros (HACCP)?", opts:["5","7","9","3"], ans:1, pts:130, tema:"HACCP" },
  { q:"¿Cuál es el Principio 1 del plan de control de peligros?", opts:["Establecer límites críticos","Análisis de peligros alimentarios","Sistema de documentación","Identificar PCC"], ans:1, pts:130, tema:"HACCP" },
  { q:"¿Qué establece el Principio 3 del HACCP?", opts:["Identificar los PCC","Análisis de peligros","Establecer límites críticos","Sistema de verificación"], ans:2, pts:130, tema:"HACCP" },
  { q:"¿Qué es un Punto Crítico de Control (PCC)?", opts:["Un área de descanso","Un paso donde se puede aplicar control para prevenir un peligro","Un tipo de empaque","Una zona de almacenamiento"], ans:1, pts:140, tema:"HACCP" },
  { q:"¿Cuál es el Principio 7 del HACCP?", opts:["Análisis de peligros","Identificar PCC","Establecer límites críticos","Sistema de documentación y registro"], ans:3, pts:130, tema:"HACCP" },
  { q:"¿Cuál es el primer paso preliminar para el plan de control de peligros?", opts:["Elaborar diagrama de flujo","Conformación del equipo de inocuidad","Descripción del producto","Verificación in situ"], ans:1, pts:110, tema:"HACCP" },
  { q:"¿Qué verifica el Principio 6 del HACCP?", opts:["Los límites críticos","Que el sistema HACCP es eficaz","Los registros del producto","El programa de limpieza"], ans:1, pts:130, tema:"HACCP" },

  // PPR - Programas Prerrequisitos
  { q:"¿Qué son los Programas Prerrequisitos (PPR)?", opts:["Normas de seguridad industrial","Condiciones básicas para mantener un ambiente higiénico en elaboración de alimentos","Procedimientos de mantenimiento","Protocolos de ventas"], ans:1, pts:100, tema:"PPR" },
  { q:"¿Cuál de estos es un Programa Prerrequisito en Gaseosas Lux?", opts:["Programa de ventas","Programa de limpieza y desinfección","Programa de publicidad","Programa de logística"], ans:1, pts:100, tema:"PPR" },
  { q:"¿Qué incluye el PPR de comportamiento higiénico del personal?", opts:["Normas de ventas","Actividades para mantener higiene del personal en planta","Procedimientos de mantenimiento","Protocolo de despacho"], ans:1, pts:100, tema:"PPR" },
  { q:"¿Cuál PPR controla los animales y vectores en planta?", opts:["Programa de capacitación","Programa de manejo de plagas","Programa de trazabilidad","Programa de metrología"], ans:1, pts:100, tema:"PPR" },
  { q:"¿Qué programa PPR garantiza la calidad del agua usada en producción?", opts:["Programa de residuos sólidos","Verificación de suministro de agua","Programa de iluminación","Control de aire comprimido"], ans:1, pts:110, tema:"PPR" },
  { q:"¿Qué PPR garantiza que los equipos midan correctamente?", opts:["Programa de trazabilidad","Programa de aseguramiento metrológico","Programa de capacitación","Control de plagas"], ans:1, pts:120, tema:"PPR" },
  { q:"¿Cuántos Programas Prerrequisitos maneja Gaseosas Lux?", opts:["10","15","24","30"], ans:2, pts:130, tema:"PPR" },

  // BPM e Higiene
  { q:"¿Qué significa BPM?", opts:["Buenas Prácticas de Manufactura","Bases para Producción Masiva","Beneficios por Manufactura","Buena Planificación de Maquinaria"], ans:0, pts:80, tema:"BPM" },
  { q:"¿Cuál es una actividad para un buen comportamiento higiénico en planta?", opts:["Comer en el área de producción","Lavarse las manos antes y después de cada actividad crítica","Usar anillos y pulseras","Ingresar con ropa de calle"], ans:1, pts:90, tema:"BPM" },
  { q:"¿En qué momento el personal debe realizar lavado de manos?", opts:["Solo al inicio del turno","Antes y después de manipular alimentos y después de ir al baño","Una vez al día","Solo cuando estén visiblemente sucias"], ans:1, pts:100, tema:"BPM" },
  { q:"¿Qué elemento NO debe usarse dentro de la planta de producción?", opts:["Cofia","Tapabocas","Reloj y joyas","Guantes"], ans:2, pts:90, tema:"BPM" },
  { q:"¿Cuál es la vestimenta mínima para ingresar a producción?", opts:["Solo guantes","Cofia, tapabocas, uniforme limpio y calzado adecuado","Solo uniforme","Cualquier ropa de trabajo"], ans:1, pts:100, tema:"BPM" },
  { q:"¿Qué debe hacerse con un producto que cae al suelo?", opts:["Recogerlo y continuar","Lavarlo y usarlo","Descartarlo e iniciar protocolo de producto no conforme","Guardarlo aparte"], ans:2, pts:110, tema:"BPM" },
  { q:"¿Qué se debe hacer si se detecta contaminación cruzada en línea?", opts:["Continuar y reportar al final","Detener la línea, aislar el producto y reportar inmediatamente","Avisar solo al compañero","Ignorar si es pequeña"], ans:1, pts:150, tema:"BPM" },

  // Almacén y materias primas
  { q:"¿Cómo deben almacenarse las materias primas?", opts:["Directamente en el piso","Sobre estibas","En cualquier superficie limpia","Apiladas sin orden"], ans:1, pts:100, tema:"Almacenamiento" },
  { q:"¿Qué característica debe cumplir el almacén de materias primas?", opts:["Puertas abiertas para ventilación","Puertas cerradas para evitar ingreso de plagas","Sin iluminación","Con luz solar directa"], ans:1, pts:100, tema:"Almacenamiento" },
  { q:"¿Qué está prohibido en el almacén de materias primas?", opts:["Usar estibas","Comer, beber o fumar","Tener iluminación adecuada","Mantener limpio el área"], ans:1, pts:90, tema:"Almacenamiento" },
  { q:"¿Cómo deben estar los pisos del almacén de materias primas?", opts:["Con agua para limpiar","Planos, limpios y libres de agua estancada","Con alfombra antideslizante","Sin importar el estado"], ans:1, pts:90, tema:"Almacenamiento" },
  { q:"¿Qué se debe reportar respecto a las materias primas?", opts:["Solo el inventario","Características inusuales en las materias primas","El precio de compra","El proveedor"], ans:1, pts:110, tema:"Almacenamiento" },

  // Control de plagas
  { q:"¿Qué se debe hacer al evidenciar presencia de plagas en planta?", opts:["Ignorarla si es pequeña","Reportarla inmediatamente al encargado del programa","Eliminarla con cualquier producto","Esperar al siguiente turno"], ans:1, pts:130, tema:"Control de Plagas" },
  { q:"¿Qué acción ayuda a prevenir plagas en planta?", opts:["Dejar residuos en las áreas de trabajo","Mantener las rejillas puestas en los desagües","Dejar puertas abiertas","Acumular cajas cerca de paredes"], ans:1, pts:110, tema:"Control de Plagas" },
  { q:"¿Qué no se debe hacer con las estaciones de monitoreo de plagas?", opts:["Revisarlas periódicamente","Obstaculizarlas o destruirlas","Reportar su estado","Mantenerlas visibles"], ans:1, pts:110, tema:"Control de Plagas" },
  { q:"¿Dónde está permitido ingerir alimentos en planta?", opts:["En cualquier área","Solo en las áreas permitidas para ello","En el área de producción","En bodega"], ans:1, pts:90, tema:"Control de Plagas" },

  // Qué debemos hacer en planta
  { q:"¿Qué debemos hacer si un producto o materia prima fue manipulado indebidamente?", opts:["Ignorarlo","Informarlo inmediatamente","Continuar con el proceso","Descartarlo sin avisar"], ans:1, pts:120, tema:"Acciones en Planta" },
  { q:"¿Qué debemos hacer con personal que no cumple las BPM?", opts:["Ignorarlo","Reportarlo al supervisor","Retroalimentarlo para que cumpla","Sancionarlo directamente"], ans:2, pts:110, tema:"Acciones en Planta" },
  { q:"¿Qué se debe hacer ante una novedad en planta?", opts:["Resolverla solo","Informar a los integrantes del Comité de Inocuidad","Esperar al final del turno","Anotarla en el cuaderno personal"], ans:1, pts:110, tema:"Acciones en Planta" },
  { q:"¿Cuál es una responsabilidad del personal en planta respecto a los PCC?", opts:["Ignorarlos","Monitorear, controlar y verificar los Puntos Críticos de Control","Solo observarlos","Modificarlos según convenga"], ans:1, pts:140, tema:"Acciones en Planta" },
  { q:"¿Qué debemos controlar respecto al acceso en planta?", opts:["El horario de entrada","El acceso de personal no autorizado","El número de visitantes","El registro de proveedores"], ans:1, pts:110, tema:"Acciones en Planta" },

  // Limpieza y desinfección
  { q:"¿Cuál es la diferencia entre limpiar y desinfectar?", opts:["Son lo mismo","Limpiar elimina suciedad visible, desinfectar elimina microorganismos","Desinfectar elimina suciedad","Limpiar usa químicos, desinfectar usa agua"], ans:1, pts:100, tema:"Limpieza" },
  { q:"¿Con qué debe enjuagarse el equipo después de desinfectar?", opts:["Agua tibia","Agua potable según protocolo","Alcohol","Vinagre"], ans:1, pts:90, tema:"Limpieza" },
  { q:"¿Qué debe verificarse antes de iniciar producción respecto al equipo?", opts:["Que esté encendido","Que esté correctamente limpio y desinfectado","Que tenga aceite","Que esté en lugar correcto"], ans:1, pts:100, tema:"Limpieza" },
  { q:"¿Qué pasa si se mezclan incorrectamente productos de limpieza?", opts:["Limpian mejor","Pueden generar reacciones peligrosas y contaminar el producto","No pasa nada","Se evaporan rápido"], ans:1, pts:110, tema:"Limpieza" },
  { q:"¿Qué debe mantenerse limpio para prevenir plagas según el Plan Maestro de Limpieza?", opts:["Solo los pisos","Paredes, pisos, techos, desagües, ventanas y lámparas","Solo las máquinas","Solo las áreas de producción"], ans:1, pts:120, tema:"Limpieza" },

  // Zonas e infraestructura
  { q:"¿Cuál de estas áreas es considerada zona de producción en Gaseosas Lux?", opts:["Vestieres","Sala de envasado de gaseosa","Estacionamiento","Oficinas administrativas"], ans:1, pts:100, tema:"Zonas" },
  { q:"¿Qué característica debe tener la iluminación en el almacén?", opts:["Puede ser escasa","Debe ser adecuada y evitar luz solar directa sobre materias primas","No importa el tipo","Solo luz natural"], ans:1, pts:90, tema:"Zonas" },
  { q:"¿Cómo debe estar el acceso al almacén de materias primas?", opts:["Abierto para todos","Restringido","Solo para supervisores","Sin restricciones en el día"], ans:1, pts:90, tema:"Zonas" },
];

const SNAKES  = {60:44,41:25,28:10,54:36,47:19,35:6};
const LADDERS = {4:14,9:31,20:38,40:59,51:67,63:81,15:44,33:56};
// ALL squares that are not snakes or ladders get questions
const SNAKE_SET  = new Set(Object.keys(SNAKES).map(Number));
const LADDER_SET = new Set(Object.keys(LADDERS).map(Number));
const ALL_SQUARES = Array.from({length:64},(_,i)=>i+1)
  .filter(n => !SNAKE_SET.has(n) && !LADDER_SET.has(n) && n < 64);

function shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

function applySnakeLadder(pos, score) {
  let event = null;
  let scoreChange = 0;
  if (SNAKES[pos])  { event={type:'snake', from:pos,to:SNAKES[pos]};  pos=SNAKES[pos]; scoreChange=-100; }
  if (LADDERS[pos]) { event={type:'ladder',from:pos,to:LADDERS[pos]}; pos=LADDERS[pos]; scoreChange=+50; }
  return {pos, event, scoreChange};
}

app.get('/leaderboard', (req,res) => res.json(loadScores()));

io.on('connection', (socket) => {
  socket.emit('leaderboard', loadScores());

  socket.on('startSolo', ({playerName}) => {
    const name = (playerName || 'Jugador').trim();
    // Check if player already played
    const played = loadScores().find(s => s.name.toLowerCase() === name.toLowerCase());
    if (played) {
      socket.emit('blocked', { name });
      return;
    }
    socket.playerName = name;
    socket.pos = 0;
    socket.score = 0;
    socket.lives = 3;
    socket.waitingAnswer = false;
    socket.currentQuestion = null;
    // Shuffle questions and assign one per square
    const shuffledQ = shuffle(QUESTIONS);
    const shuffledS = shuffle(ALL_SQUARES);
    socket.squareMap = {};
    shuffledS.forEach((sq,i) => {
      socket.squareMap[sq] = shuffledQ[i % shuffledQ.length];
    });
    socket.emit('soloStarted', {name: socket.playerName});
  });

  socket.on('rollDice', () => {
    if (socket.waitingAnswer) return;
    const roll = Math.floor(Math.random()*6)+1;
    let newPos = socket.pos + roll;
    if (newPos >= 64) newPos = 64; // any roll that reaches or passes 64 wins
    const {pos:finalPos, event, scoreChange} = applySnakeLadder(newPos, socket.score);
    socket.pos = finalPos;
    // Apply snake/ladder score bonus
    if (scoreChange !== 0) {
      socket.score = Math.max(0, socket.score + scoreChange);
    }
    socket.emit('diceRolled', {roll, newPos:finalPos, event, score:socket.score, lives:socket.lives, scoreChange});
    if (finalPos >= 64) {
      const scores = saveScore(socket.playerName, socket.score);
      socket.emit('gameWon', {score:socket.score, leaderboard:scores});
      return;
    }
    const q = socket.squareMap && socket.squareMap[finalPos];
    if (q && !SNAKE_SET.has(finalPos) && !LADDER_SET.has(finalPos)) {
      socket.waitingAnswer = true;
      socket.currentQuestion = {...q, id:Date.now()};
      socket.emit('questionAsked', {question:socket.currentQuestion});
    }
  });

  socket.on('answerQuestion', ({answerId}) => {
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
        const scores = saveScore(socket.playerName, socket.score);
        socket.emit('gameOver', {score:socket.score, leaderboard:scores});
      }
    }
  });

  socket.on('timeUp', () => {
    const scores = saveScore(socket.playerName, socket.score);
    socket.emit('gameOver', {score:socket.score, leaderboard:scores, reason:'tiempo'});
  });
});

const PORT = process.env.PORT||3000;
server.listen(PORT, ()=>console.log(`🎮 Gaseosas Lux Inocuidad en http://localhost:${PORT}`));
