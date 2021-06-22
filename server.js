'use strict';

const { dirname } = require("path");
const { setPriority } = require("os");

const express  = require("express"),
      path = require("path"),
      SocketServer = require("ws").Server,
      PORT = process.env.PORT || 5000;

const server = express()
    .use(express.static(path.join(__dirname, "public")))
    .set("views", path.join(__dirname, "views"))
    .set("view engine", "ejs")
    .get("/", (req, res)=> res.render("index"))
    .get("/game", (req, res)=> res.render("game"))
    .listen(PORT, ()=>console.log(`Liseting on ${PORT}`));

process.on("exit", (code)=>console.log(`About to exit with code ${code}`));


// ---------------------------------------- the game ----------------------------------------
const status = {"unnamed":0, "named":1, "inGame":2},
      message = {"conneted":0, "enter":1, "inGame":2},
      game = {"rows":30, "lines":30, "speed":1000},
      inputKeys = {"shot":-1},
      angle = {"min":0, "max":3, "step":1, "up":0, "right":1, "down":2, "left":3},
      maxMsg = 50,
      idLength = 4,
      shotRange = 5,
      maxShots = 5;
const gameS = JSON.stringify(game);

let data = {},
enter = {},
draw = "";

// -------------------- websocket --------------------
const wss = new SocketServer({server});
wss.on("connection", (ws, req, client)=>{
    //on connection
    ws.id = getId();
    ws.status = status.unnamed;
    ws.send(message.conneted);

    ws.on("message", (msg)=>{
        msg = msg.toString();
        if(msg.length > maxMsg){
            ws.terminate();
            console.log(`Socket ${ws.id} was terminated: message too long`);
            return false;
        }
        //angle set NEXT
        if(ws.status === status.inGame) gameInput(msg, ws.id);
        //name set and enter game NEXT
        else if(ws.status === status.unnamed && validName(msg)){
            enter[ws.id] = {"name": msg};

            ws.status = status.named;
            ws.send(message.enter +`{"game":${gameS}, "id":"${ws.id}"}`);
        }
    });
    ws.on("close", ()=>{
        //NEXT
        if(ws.status === status.inGame) delete data[ws.id];
        else if(ws.status === status.named) delete enter[ws.id];
    });
});

function getId(len = idLength){
    let r;
    do{
        r = Math.floor((1 + Math.random()) * 0x10 ** len).toString(16).substring(1);
    }while(typeof data[r] !== "undefined")
    return r;
}
function gameInput(msg, id){
    //NEXT
    if(isNaN(msg)) return false;
    msg = Number(msg);
    if(msg === inputKeys.shot) return newShot(id);
    else if(msg >= angle.min && msg <= angle.max && Number.isInteger(msg)) return data[id].angle = msg;
}
function newShot(id){
    if(data[id].shots.length >= maxShots) return false;
    data[id].shots.push({
        "position": [data[id].position[0] + Math.round(Math.sin(Math.PI/180 * data[id].angle*90))*2, data[id].position[1] - Math.round(Math.cos(Math.PI/180 * data[id].angle*90))*2],
        "angle": data[id].angle,
        "time": 0
    });
}
function validName(msg){
    //NEXT
    if(msg.length > 1) return true;
    return false;
}


// -------------------- game loop --------------------
// START 
const interval = setInterval(gameLoop, game.speed);

function gameLoop(){
    //NEXT
    wss.clients.forEach((ws)=>{
        if(ws.isAlive === false) return ws.terminate();
        if(ws.status === status.inGame){
            //move inGmae(data[]) ship
            //TODO collision
            //NEXT
            step(ws.id);
            manageShots(ws.id);
        }
        else if(ws.status === status.named){
            //enter named(enter[]) ship
            data[ws.id] = {"name":enter[ws.id].name};
            delete enter[ws.id];
            //NEXT getRandom*Empty*Position
            data[ws.id].position = getRandomPosition();
            data[ws.id].angle = getRandomAngle();
            data[ws.id].shots = [];
            ws.status = status.inGame;
            ws.send(message.inGame);           
        }
    });
    draw = JSON.stringify(data);
    wss.clients.forEach((ws)=>{if(ws.status === status.inGame) ws.send(draw);});
}

function step(id){
    data[id].position[0] += Math.round(Math.sin(Math.PI/180 * data[id].angle*90));
    //(y direction in canvas is down):
    data[id].position[1] -= Math.round(Math.cos(Math.PI/180 * data[id].angle*90));

    if(data[id].position[0] === 0) data[id].position[0] += 1;
    else if(data[id].position[0] === game.rows) data[id].position[0] -= 1;
    if(data[id].position[1] === 0) data[id].position[1] += 1;
    else if(data[id].position[1] === game.lines) data[id].position[1] -= 1;
}
function manageShots(id){
    data[id].shots.forEach((shot, k)=>{
        if(shot.time + 1 > shotRange) return data[id].shots.splice(k, 1);
        shot.position[0] += Math.round(Math.sin(Math.PI/180 * shot.angle*90));
        //(y direction in canvas is down):
        shot.position[1] -= Math.round(Math.cos(Math.PI/180 * shot.angle*90));
        shot.time += 1;
    });
}

function getRandomPosition(){
    return [getRandom(1, game.rows-1), getRandom(1, game.lines-1)];
}
function getRandomAngle(){
    return getRandom(angle.min, angle.max);
}
function getRandom(min, max){
    return Math.floor(Math.random() * (max - min + 1) + min);
}






/* NEXT
function getRandomEmptyPosition(){
    let x, y;
    do{
        x = getRandom(0, game.rows);
        y = getRandom(0, game.lines);
    }while(!isEmpty(x, y));
    return {"x":x, "y":y};
}
function isEmpty(x, y){
    //NEXT TODO
}*/