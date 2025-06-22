if(localStorage.getItem("hScore") == null) localStorage.setItem("hScore", "0");

const gamerules = document.getElementById("gamerules");
const toggle = document.getElementById("toggle");
const reset = document.getElementById('reset');
const position = document.getElementById("position");
const sHealth = document.getElementById("sHealth");
const pHealth = document.getElementById("pHealth");
const Keys = document.getElementById("Keys");
const sCollected = document.getElementById("sCollected");
const sDelivered = document.getElementById("sDelivered");
const hScore = document.getElementById("hScore");

let keysCollected = 0;
let system = 50;
let player = 100;
let decrypted = 0;
let delivered = 0;
let shards = [];
let spawnCounter = 10;
let gridW = 39;
let gridH = 21;
let pSpeed = 5;
let tSpeed = 0.003;
let projectiles = [];
let obstacles = [[], [], [], []];
const bullet_damage = 40;
const coeffRestitution = 0.3;
let dx = 0;
let dy = 0;
let isPaused = true;
let isOver = false;


// canvas setup
const ration = 5/6;
const size_ration = ration / (1 - ration);
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;
const Width = Math.round(window.innerWidth * size_ration);
const Height = Math.round(window.innerHeight * size_ration);
const originX = Width;
const originY = Height;

canvas.width = Width * dpr;
canvas.height = Height * dpr;
canvas.style.width = Width + "px";
canvas.style.height = Height + "px";
ctx.scale(dpr, dpr);

let x = originX/2;
let y = originY/2;
let mouseX = 0;
let mouseY = 0;
let sq_side = Math.min(originX*0.75/gridW, originY*0.75/gridH);
let srt_width = (originX - gridW*sq_side)/gridW;
let srt_height = (originY - gridH*sq_side)/gridH;
let blocks = [];


// Maths functions
function clamp(x, max, min) {
    if (min === undefined) min = x;
    if (max === undefined) max = x;
    return Math.max(min, Math.min(max, x));
}
function sin(x, y) {
    if(x == 0 && y == 0) return 1;
    return (-1*y)/((x**2 + y**2)**0.5);
}
function cos(x, y) {
    if(x == 0 && y == 0) return 1;
    return x/((x**2 + y**2)**0.5);
}




function drawPlayer() {
    if (dx > 0 &&
        obstacles[0].some((val, i) => {
            if (val - x > 0 &&
                val - x <= 12 &&
                obstacles[2][i] < y + 10 &&
                obstacles[3][i] > y - 10) {
                x = val - 12; return true;
            } return false;
        })) {
        dx = 0;
    }
    if (dx < 0 &&
        obstacles[1].some((val, i) => {
            if (x - val > 0 &&
                x - val <= 12 &&
                obstacles[2][i] < y + 10 &&
                obstacles[3][i] > y - 10) {
                x = val + 12; return true;
            } return false;
        })) {
        dx = 0;
    }
    if (dy > 0 &&
        obstacles[2].some((val, i) => {
            if (val - y > 0 &&
                val - y <= 12 &&
                obstacles[0][i] < x + 10 &&
                obstacles[1][i] > x - 10) {
                y = val - 12; return true;
            } return false;
        })) {
        dy = 0;
    }
    if (dy < 0 &&
        obstacles[3].some((val, i) => {
            if (y - val > 0 &&
                y - val <= 12 &&
                obstacles[0][i] < x + 10 &&
                obstacles[1][i] > x - 10) {
                y = val + 12; return true;
            } return false;
        })) {
        dy = 0;
    }
    obstacles = [[], [], [], [], []];
    x = clamp(x+dpr*pSpeed*dx,originX - 12, 12);
    y = clamp(y+dpr*pSpeed*dy,originY - 12, 12);
    
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "darkblue";
    ctx.fill();
    ctx.closePath();

    window.scrollTo(x*ration, y*ration);
}



// Block class
class block {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.obstacle = [];
        this.hasTower = true;
        this.color = "#2de030";
        this.dmg = null;
    }

    generate() {
        for(let i = 0; i < 5; i++) {
            let rand1 = Math.random();
            let rand2 = Math.random();
            let size = sq_side * 3/4;
            let position = [rand1 * size + this.x, rand2 * size + this.y, 100, false];
            this.obstacle.push(position);
        }
        let rand3 = Math.random();
        this.obstacle.push([rand3 * 2 * Math.PI, 5]);
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, sq_side, sq_side);
        
        for(let i = 0; i < 5; i++) {
            if(this.obstacle[i][2] > 0) {
                ctx.fillStyle = "#000000";
                ctx.fillRect(this.obstacle[i][0], this.obstacle[i][1], sq_side/4, sq_side/4);

                if (this.color == "#2de030") {
                    obstacles[0].push(this.obstacle[i][0]);
                    obstacles[1].push(this.obstacle[i][0] + sq_side/4);
                    obstacles[2].push(this.obstacle[i][1]);
                    obstacles[3].push(this.obstacle[i][1] + sq_side/4);
                }
            }
        }
        if(!(this.obstacle[5][1] > 0)) this.hasTower = false;
        this.drawTower();
    }
    
    drawTower() {
        if (this.hasTower) {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + sq_side / 2, this.y + sq_side / 2, 6, 0, 2 * Math.PI);
            ctx.fillStyle = "cadetblue";
            ctx.fill();
            ctx.closePath();
            
            ctx.beginPath();
            ctx.moveTo(this.x + sq_side / 2, this.y + sq_side / 2);
            ctx.arc(
                this.x + sq_side / 2,
                this.y + sq_side / 2,
                0.5 * (sq_side + Math.min(srt_height, srt_width)),
                this.obstacle[5][0],
                this.obstacle[5][0] + Math.PI / 3
            );
            ctx.closePath();
            ctx.strokeStyle = "red";
            ctx.stroke();
            ctx.fillStyle = "rgba(207, 12, 12, 0.52)";
            ctx.fill();
            this.obstacle[5][0] += tSpeed;
            if (this.obstacle[5][0] >= 2 * Math.PI) {
                this.obstacle[5][0] -= 2 * Math.PI;
            }
            ctx.beginPath();
        }
    }
}

// Map generation
for(let i = 0; i < gridW; i++) {
    for(let j = 0; j < gridH; j++) {
        let b = new block(i * (sq_side + srt_width) + srt_width / 2, j * (sq_side + srt_height) + srt_height / 2);
        if(i == (gridW - 1) / 2 && j == (gridH - 1) / 2) {
            b.hasTower = false;
            b.color = "#00ffff";
            b.obstacle = [[0, 0, 0, false], [0, 0, 0, false], [0, 0, 0, false], [0, 0, 0, false], [0, 0, 0, false], [0, 0]];
        }
        b.generate();
        blocks.push(b);
    }
}

// Hub at the center of the grid
const centerBlockIndex = Math.floor(gridW * gridH / 2);
const hubX = blocks[centerBlockIndex].x;
const hubY = blocks[centerBlockIndex].y;

let rando;
do {
    rando = Math.floor(Math.random() * blocks.length);
} while (rando === centerBlockIndex);

blocks[rando].color = "#ff69b4";
blocks[rando].hasTower = false;
blocks[rando].obstacle = [[0, 0, 0, false], [0, 0, 0, false], [0, 0, 0, false], [0, 0, 0, false], [0, 0, 0, false], [0, 0]];
let baseX = blocks[rando].x;
let baseY = blocks[rando].y;

// Initial item generation
for(let i = 0; i < 100; i++) {
    spawnItems();
}
setInterval(() => {
    if(!isPaused) {
        spawnItems();
        spawnCounter++;
    }
}, 15e3);

// Animation loop
function animate() {
    if(!isPaused) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        obstacles = [ [], [], [], []];

        // Draw grid lines
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        for (let j = 0; j <= gridH; j++) {
            const yPos = j * (sq_side + srt_height) + srt_height / 2 - srt_height/2;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvas.width, yPos);
            ctx.stroke();
        }       
        for (let i = 0; i <= gridW; i++) {
            const xPos = i * (sq_side + srt_width) + srt_width / 2 - srt_width/2;
            ctx.beginPath();
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, canvas.height);
            ctx.stroke();
        }
        
        drawBlocks();
        drawItems();
        drawPlayer();
        checkBases();
        position.innerHTML = "X : " + Math.trunc((x - originX / 2) / Math.min(srt_height, srt_width)) + "   Y : " + -1 * Math.trunc((y - originY / 2) / Math.min(srt_height, srt_width));
        if(system <= 20) {
            sHealth.style.color = "red";
            warningSound();
        } else {
            sHealth.style.color = "khaki";
        }
        if(player <= 20) {
            pHealth.style.color = "red";
            warningSound();
        } else {
            pHealth.style.color = "khaki";
        }
        Keys.innerHTML = "KEYS ON HAND : " + keysCollected;
        pHealth.innerHTML = "PLAYER HEALTH : " + player;   
        sCollected.innerHTML = "SHARDS DECRYPTED : " + decrypted;
        sHealth.innerHTML = "SYSTEM HEALTH : " + system;
        sDelivered.innerHTML = "SHARDS DELIEVERED : " + delivered;
        hScore.innerHTML = "HIGH SCORE : " + localStorage.getItem("hScore");
        if(system >= 100) gameWon();
        if(system <= 15 || player <= 25) gameLost();
    } 
    requestAnimationFrame(animate);
}


function spawnItems() {
    for (let i = 0; i < 3; i++) {
        let selectedColor;
        const rand = Math.random();
        if(rand <= 0.5) {
            selectedColor = "#ffffff"; 
        } else if(rand <= 0.75) {
            selectedColor = "#ffff00"; 
        } else {
            selectedColor = "#ff0000"; 
        }
        let xi = Math.random() * (gridW * sq_side);
        let yi = Math.random() * (gridH * sq_side);
        shards.push([xi, yi, selectedColor]);
    }
}

function drawItems() {
    for(let shard of shards) {
        if((Math.abs(shard[0] - x - sq_side) < window.innerWidth / 2 || Math.abs(shard[0] - x + 2 * sq_side) < window.innerWidth / 2) && 
           (Math.abs(shard[1] - y - sq_side) < window.innerHeight / 2 || Math.abs(shard[1] + 2 * sq_side - y) < window.innerHeight / 2)) {
            if(((shard[0] - x) ** 2 + (shard[1] - y) ** 2) ** 0.5 <= 15) {
                collectSound();
                if(shard[2] == "#ffffff") {
                    keysCollected += 1;
                } else if(shard[2] == "#ffff00") {
                    keysCollected += 2;
                } else if(shard[2] == "#ff0000") {
                    keysCollected += 3;
                }
                shards = shards.splice(0, shards.indexOf(shard)).concat(shards.splice(shards.indexOf(shard) + 1, shards.length));
            } else {
                ctx.beginPath();
                ctx.arc(shard[0], shard[1], 9, 0, 2 * Math.PI);
                ctx.fillStyle = shard[2];
                ctx.fill();
                ctx.closePath();                
            }
        }
    }
    for(let p of projectiles) p.drawProj();
}


function drawBlocks() {
    for (let block of blocks) {
        if((Math.abs(block.x - x - sq_side) < window.innerWidth / 2 || Math.abs(block.x - x + 2 * sq_side) < window.innerWidth / 2) && 
           (Math.abs(block.y - y - sq_side) < window.innerHeight / 2 || Math.abs(block.y + 2 * sq_side - y) < window.innerHeight / 2)) {
            block.draw();
            if(block.color == "#ff69b4") {
                ctx.beginPath();
                ctx.arc(block.x + sq_side / 2, block.y + sq_side / 2, 25, 0, 2 * Math.PI);
                ctx.fillStyle = "#ff69b4";
                ctx.fill();
                ctx.closePath();
            }
            if(block.color == "#00ffff") {
                ctx.beginPath();
                ctx.arc(block.x + sq_side / 2, block.y + sq_side / 2, 25, 0, 2 * Math.PI);
                ctx.fillStyle = "#00ffff";
                ctx.fill();
                ctx.closePath();
            }

            for(let p of projectiles) {
                if(block.hasTower && ((block.x + sq_side / 2 - p.xp) ** 2 + (block.y + sq_side / 2 - p.yp) ** 2) ** 0.5 <= 15) {
                    block.hasTower = false;
                    breakObstacleSound();
                    block.obstacle[5][1] = 0;
                    p.vel *= coeffRestitution;
                }

                for(let i = 0; i < 5; i++) {
                    if(block.obstacle[i][2] > 0 && block.color == "#2de030") {
                        let xt = block.obstacle[i][0];
                        let yt = block.obstacle[i][1];
                        if((p.dx < 0 &&
                            Math.abs(p.xp - xt - sq_side / 4) <= p.vel &&
                            p.yp >= yt &&
                            p.yp <= yt + sq_side / 4) || (p.dx > 0 &&
                            Math.abs(xt - p.xp) <= p.vel &&
                            p.yp >= yt &&
                            p.yp <= yt + sq_side / 4
                            )
                        ) {
                            p.dx *= -1;
                            bulletBounceSound();
                            p.vel *= coeffRestitution;
                            block.obstacle[i][2] -= bullet_damage;
                        }

                        if((p.dy < 0 &&
                            Math.abs(p.yp - yt - sq_side / 4) <= p.vel &&
                            p.xp >= xt &&
                            p.xp <= xt + sq_side / 4) || (p.dy > 0 &&
                            Math.abs(yt - p.yp) <= p.vel &&
                            p.xp >= xt &&
                            p.xp <= xt + sq_side / 4)
                        ) {
                            p.dy *= -1;
                            bulletBounceSound();
                            p.vel *= coeffRestitution;
                            block.obstacle[i][2] -= bullet_damage;
                        }
                    }

                    if(block.obstacle[i][2] <= 0 && !block.obstacle[i][3]) {
                        block.obstacle[i][3] = true;
                        breakObstacleSound();
                    }
                }
            }

            if(block.hasTower &&
            ((block.x + sq_side / 2 - x) ** 2 + (block.y + sq_side / 2 - y) ** 2) ** 0.5 <= 0.5 * (sq_side + Math.min(srt_height, srt_width)) &&
            Math.atan2((block.y + sq_side / 2 - y), block.x + sq_side / 2 - x) - block.obstacle[5][0] + Math.PI >= 0 &&
            Math.atan2((block.y + sq_side / 2 - y), block.x + sq_side / 2 - x) - block.obstacle[5][0] + Math.PI <= Math.PI / 3) {
                if(!block.dmg) { block.dmg = setInterval(() => { player--; }, 100); }

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(block.x + sq_side / 2, block.y + sq_side / 2);
                ctx.lineWidth = 4;
                ctx.strokeStyle = "#571be3";
                ctx.stroke();
                ctx.closePath();

                sfx[0].volume = sound;  
                laserSound();
            } else {
                clearInterval(block.dmg);
                if(block.dmg) sfx[0].volume = 0;
                block.dmg = null;
            }
        }
    }
}

// Mouse movement

document.addEventListener("mousemove", (Event)=>{
    const rect = canvas.getBoundingClientRect();
    mouseX = Event.clientX - rect.left;
    mouseY = Event.clientY - rect.top;
});

class projectile {
    constructor() {
        this.xp = x;
        this.yp = y;
        this.vel = 8;
        const dx = mouseX - x;
        const dy = mouseY - y;
        const angle = Math.atan2(dy, dx);
        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);
        this.time = 0;
        this.inter = setInterval(() => {
            this.vel = 8 / (1 + 1.5 * this.time);
            this.time++;
        }, 1000);
    }

    drawProj(){

        if(Math.abs(this.xp - x) < (window.innerWidth+sq_side*0.8)/2
         && Math.abs(this.yp - y) < (window.innerHeight+sq_side*0.8)/2
         && this.vel > 1){
            ctx.beginPath();
            ctx.arc(this.xp, this.yp, 5, 0, 2*Math.PI);
            ctx.fillStyle = "darkblue";
            ctx.fill();
            ctx.closePath();

            this.xp = clamp(this.xp+this.vel*this.dx*dpr, originX-5,5);
            this.yp = clamp(this.yp+this.vel*this.dy*dpr, originY-5,5);
        }
        if(! (this.vel > 1)){ clearInterval(this.inter); this.inter=null;}
    }
}


canvas.addEventListener("click", () => {
    if(!isOver) {
        shootSound();
        let p = new projectile();
        projectiles.push(p);
    }
});




function toggleGame() {
    isPaused = !isPaused;
    if(isPaused) {
        toggle.innerHTML = "RESUME THE MISSION";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        obstacles = [[],[],[],[]];
        gamerules.style.display = "block";
        slidercontrol.style.display = "block";
        reset.style.display = "block";
    } else {
        toggle.innerHTML = "PAUSE THE MISSION";
        gamerules.style.display = "none";
        slidercontrol.style.display = "none";        
        reset.style.display = "block"; 
    }
}
