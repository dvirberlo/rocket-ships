/**
 * scripts for the game
 * copyright Dvir Berlowitz 2020
 */

let game,
    grid,
    id;
const canvas = $("#game")[0],
      defColor = "white",
      myColor = "green",
      sendKeys = {"shot":-1},
      message = {"conneted":0, "enter":1, "inGame":2};
const ctx = canvas.getContext("2d");

// -------------------- websocket --------------------  
let ws = new WebSocket("ws://" + window.location.host);

ws.onmessage = connecting;
function connecting(event){
    if(event.data != message.conneted) return false;
    ws.onmessage = enter;
    document.getElementById("nickname").style.display = "inline";
}
function enter(event){
    if(event.data.toString()[0] != message.enter) return false;
    ws.onmessage = inGame;
    document.getElementById("nickname").style.display = "none";
    let par = JSON.parse(event.data.toString().slice(1));
    game = par.game;
    id = par.id;
    grid = canvas.width / (game.rows +1);
}
function inGame(event){
    if(event.data != message.inGame) return false;
    ws.onmessage = playing;
    $("#game").focus();
    document.addEventListener('keydown', sendKey);
    //console.log("start playing");
}
function playing(event){
    let par = JSON.parse(event.data);
    ctx.clearRect(0,0, canvas.width,canvas.height);
    Object.keys(par).forEach((k)=>{
        drawShip(ctx, par[k].position[0] -1, par[k].position[1] -1, par[k].angle, (k == id ? myColor : defColor), grid);
        par[k].shots.forEach((shot)=>{
            drawShot(ctx, shot.position[0] -1, shot.position[1] -1, shot.angle, (k == id ? myColor : defColor), grid);
        });
    });
}

function sendName(e){
    if(event.key === "Enter" && e.value.length > 1) ws.send(e.value);
}
function sendKey(e){
    var key = e.which || e.keyCode || 0;
    // arrows:
    if(key >= 37 && key <= 40)ws.send(key==37?3:key-38);
    // space:
    else if(key === 32)ws.send(sendKeys.shot);
}

// -------------------- draws --------------------
function drawShip(ctx, x, y, angle, color, grid){
    const g = grid/10;
    angle = 90* angle*Math.PI/180 //0-up,1-right,2-down,3-left;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.translate(x*grid+1.5*grid, y*grid+1.5*grid);
    ctx.rotate(angle);
    /**  _ _ _
     *  |_|X|_|
     *  |X|0|X|
     *  |X|_|X|
     */
    //                                                        x   ,   y
    ctx.fillRect(-0.5*grid+g, -1.5*grid+g, grid-g, grid-g);//-0.5 , -1.5
    ctx.fillRect(-1.5*grid+g, -0.5*grid+g, grid-g, grid-g);//-1.5 , -0.5
    ctx.fillRect(-0.5*grid+g, -0.5*grid+g, grid-g, grid-g);//-0.5 , -0.5
    ctx.fillRect(0.5*grid+g, -0.5*grid+g,  grid-g, grid-g);// 0.5 , -0.5
    ctx.fillRect(-1.5*grid+g, 0.5*grid+g,  grid-g, grid-g);//-1.5 ,  0.5
    ctx.fillRect(0.5*grid+g, 0.5*grid+g,   grid-g, grid-g);// 0.5 ,  0.5

    ctx.rotate(-angle);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.closePath();
}
function drawShot(ctx, x, y, angle, color, grid){
    const g = grid/10;
    angle = 90* angle*Math.PI/180 //0-up,1-right,2-down,3-left;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.translate(x*grid+1.5*grid, y*grid+1.5*grid);
    ctx.rotate(angle);

    ctx.fillRect(-0.5*grid+g, -0.5*grid+g, grid-g, grid-g);//-0.5 , -0.5

    ctx.rotate(-angle);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.closePath();
}