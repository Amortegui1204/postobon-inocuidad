const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};
const MAX_PLAYERS = 6;
const SNAKES  = { 60:44, 41:25, 28:10, 54:36 };
const LADDERS = { 4:14, 9:31, 20:38, 40:59, 51:67, 63:81 };
const PLAYER_COLORS = ['#E8272A','#FF8C00','#2ECC71','#3498DB','#9B59B6','#F1C40F'];
const PLAYER_LABELS = ['P1','P2','P3','P4','P5','P6'];

const QUESTIONS = [
  { q:"¿Cada cuánto tiempo deben lavarse las manos los operarios durante la producción?", opts:["Cada hora","Antes y después de cada actividad crítica","Solo al inicio del turno","Una vez al día"], ans:1, pts:100, tema:"Higiene Personal" },
  { q:"¿Qué elemento NO debe usarse dentro de la planta de producción?", opts:["Cofia","Guantes","Reloj y joyas","Tapabocas"], ans:2, pts:80, tema:"Higiene Personal" },
  { q:"¿Cuál es la temperatura máxima permitida para almacenar alimentos refrigerados?", opts:["10°C","4°C","0°C","15°C"], ans:1, pts:120, tema:"Higiene Personal" },
  { q:"¿Qué debe hacerse antes de manipular alimentos después de ir al baño?", opts:["Usar guantes directamente","Lavarse y desinfectarse las manos","Ponerse tapabocas","Cambiar uniforme"], ans:1, pts:90, tema:"Higiene Personal" },
  { q:"¿Qué significa BPM en la industria alimentaria?", opts:["Buenas Prácticas de Manufactura","Bases para Producción Masiva","Beneficios por Manufactura","Buena Planificación de Maquinaria"], ans:0, pts:80, tema:"BPM" },
  { q:"¿Cuál es el propósito principal de las BPM en Postobón?", opts:["Aumentar la producción","Garantizar la inocuidad y calidad del producto","Reducir costos","Mejorar la velocidad de empaque"], ans:1, pts:100, tema:"BPM" },
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
  { q:"¿Qué sistema de gestión de inocuidad usa Postobón?", opts:["Solo ISO 9001","ISO 22000 / FSSC 22000","Solo BPM","Ninguno formal"], ans:1, pts:160, tema:"BPM" },
  { q:"¿Qué hacer si se detecta una contaminación cruzada en línea?", opts:["Continuar producción y reportar al final","Detener la línea, aislar el producto y reportar inmediatamente","Avisar solo al compañero","Ignorar si es pequeña"], ans:1, pts:150, tema:"HACCP" },
  { q:"¿Cuál es la vestimenta mínima requerida para ingresar a producción?", opts:["Solo guantes","Cofia, tapabocas, uniforme limpio y calzado adecuado","Solo uniforme","Cualquier ropa de trabajo"], ans:1, pts:100, tema:"Higiene Personal" },
  { q:"¿Qué debe hacerse con un producto que cae al suelo?", opts:["Recogerlo y continuar","Lavarlo y usarlo","Descartarlo e iniciar protocolo de producto no conforme","Guardarlo aparte"], ans:2, pts:120, tema:"BPM" },
  { q:"¿Qué significa 'inocuidad alimentaria'?", opts:["Que el alimento es sabroso","Que el alimento no causa daño a la salud","Que el alimento es nutritivo","Que el alimento es económico"], ans:1, pts:100, tema:"BPM" },
  { q:"¿Qué acción tomar al encontrar una plaga dentro de la planta?", opts:["Ignorarla si es pequeña","Reportarla inmediatamente al área de saneamiento","Eliminarla con cualquier producto","Esperar al siguiente turno"], ans:1, pts:130, tema:"BPM" },
  { q:"¿Con qué frecuencia se debe calibrar un termómetro de control?", opts:["Nunca","Solo cuando falla","Según el programa de calibración establecido","Una vez al año"], ans:2, pts:120, tema:"HACCP" },
  { q:"¿Qué es un registro en inocuidad?", opts:["Un informe anual","Una evidencia documentada de actividades de control","Un listado de empleados","Un contrato de calidad"], ans:1, pts:90, tema:"BPM" },
];

function createRoom(roomId) {
  rooms[roomId] = { id:roomId, players:[], turn:0, started:false, currentQuestion:null, waitingAnswer:false };
}
function getRoom(roomId) { return rooms[roomId]; }
function randomQuestion() { return { ...QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)], id:Date.now() }; }
function applySnakeLadder(pos) {
  let event = null;
  if (SNAKES[pos])  { event={type:'snake', from:pos,to:SNAKES[pos]};  pos=SNAKES[pos]; }
  if (LADDERS[pos]) { event={type:'ladder',from:pos,to:LADDERS[pos]}; pos=LADDERS[pos]; }
  return { pos, event };
}
function nextAliveTurn(room, current) {
  let next = (current+1) % room.players.length;
  let tries = 0;
  while (room.players[next].lives<=0 && tries<room.players.length) { next=(next+1)%room.players.length; tries++; }
  return next;
}

io.on('connection', (socket) => {

  socket.on('joinRoom', ({ roomId, playerName }) => {
    let room = getRoom(roomId);
    if (!room) createRoom(roomId);
    room = getRoom(roomId);
    if (room.started)              { socket.emit('roomFull',{reason:'El juego ya comenzó'}); return; }
    if (room.players.length>=MAX_PLAYERS) { socket.emit('roomFull',{reason:'Sala llena (máx. 6)'}); return; }

    const idx = room.players.length;
    const player = { id:socket.id, name:playerName||`Jugador ${idx+1}`, pos:0, score:0, lives:3,
                     color:PLAYER_COLORS[idx], label:PLAYER_LABELS[idx], index:idx, eliminated:false };
    room.players.push(player);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerIndex = idx;

    socket.emit('joined', { player, playerIndex:idx, roomId });
    io.to(roomId).emit('roomUpdate', { players:room.players, turn:room.turn, started:room.started });
  });

  socket.on('startGame', () => {
    const room = getRoom(socket.roomId);
    if (!room || socket.playerIndex!==0) return;
    if (room.players.length<2) { socket.emit('notEnough'); return; }
    room.started = true;
    io.to(socket.roomId).emit('gameStart', { players:room.players });
  });

  socket.on('rollDice', () => {
    const room = getRoom(socket.roomId);
    if (!room||!room.started||room.turn!==socket.playerIndex||room.waitingAnswer) return;
    const roll = Math.floor(Math.random()*6)+1;
    const player = room.players[socket.playerIndex];
    let newPos = player.pos+roll;
    if (newPos>64) newPos=player.pos;
    const {pos:finalPos,event} = applySnakeLadder(newPos);
    player.pos = finalPos;
    io.to(socket.roomId).emit('diceRolled',{playerIndex:socket.playerIndex,roll,newPos:finalPos,event,players:room.players});
    if (finalPos>=64) { io.to(socket.roomId).emit('gameOver',{winner:player}); delete rooms[socket.roomId]; return; }
    const qSquares=[3,4,5,8,11,12,13,19,21,23,29,30,32,37,39,44,46,49,52,53,58];
    if (qSquares.includes(finalPos)) {
      room.waitingAnswer=true; room.currentQuestion=randomQuestion();
      io.to(socket.roomId).emit('questionAsked',{question:room.currentQuestion,playerIndex:socket.playerIndex});
    } else {
      if (roll!==6) room.turn=nextAliveTurn(room,room.turn);
      io.to(socket.roomId).emit('turnChanged',{turn:room.turn,players:room.players});
    }
  });

  socket.on('answerQuestion', ({answerId}) => {
    const room = getRoom(socket.roomId);
    if (!room||!room.waitingAnswer||room.turn!==socket.playerIndex) return;
    const q=room.currentQuestion, player=room.players[socket.playerIndex], correct=answerId===q.ans;
    room.waitingAnswer=false; room.currentQuestion=null;
    if (correct) {
      player.score+=q.pts;
      io.to(socket.roomId).emit('answerResult',{correct:true,pts:q.pts,playerIndex:socket.playerIndex,players:room.players,message:`✅ ¡Correcto! +${q.pts} puntos`});
    } else {
      player.lives-=1;
      io.to(socket.roomId).emit('answerResult',{correct:false,pts:0,playerIndex:socket.playerIndex,players:room.players,message:`❌ Incorrecto. Respuesta: "${q.opts[q.ans]}"`,lives:player.lives});
      if (player.lives<=0) {
        player.eliminated=true;
        io.to(socket.roomId).emit('playerEliminated',{playerIndex:socket.playerIndex,name:player.name});
        const alive=room.players.filter(p=>p.lives>0);
        if (alive.length===1) { io.to(socket.roomId).emit('gameOver',{winner:alive[0]}); delete rooms[socket.roomId]; return; }
      }
    }
    room.turn=nextAliveTurn(room,room.turn);
    io.to(socket.roomId).emit('turnChanged',{turn:room.turn,players:room.players});
  });

  socket.on('disconnect', () => {
    const room = getRoom(socket.roomId);
    if (room) {
      io.to(socket.roomId).emit('playerDisconnected',{playerIndex:socket.playerIndex,name:room.players[socket.playerIndex]?.name});
      delete rooms[socket.roomId];
    }
  });
});

const PORT = process.env.PORT||3000;
server.listen(PORT, ()=>console.log(`🎮 Postobón Inocuidad Game corriendo en http://localhost:${PORT}`));
