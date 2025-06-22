const mute = document.getElementById("mute");
const slider = document.getElementById("slider");
const volume = document.getElementById("volume");
const slidercontrol = document.getElementById("slidercontrol");
const mutestatus = document.getElementById('mutestatus');
const GL = document.getElementById("GL");
const GW = document.getElementById("GW");
const GLHS = document.getElementById("GLHS");
const GLYS = document.getElementById("GLYS");
const GWHS = document.getElementById("GWHS");
const GWYS = document.getElementById("GWYS");
const gameScreen = document.getElementById("gameScreen");


let rgenTimer = null;

//Music system
let isMuted = localStorage.getItem("muted") === 'true';
let sound =0.5;
let sfx = [
    new Audio("sound/laser.wav"),
    new Audio("sound/bulletbounce.wav"),
    new Audio("sound/shoot.wav"),
    new Audio("sound/breakobstacle.wav"),
    new Audio("sound/collect.wav"),
    new Audio("sound/deliver.wav"),
    new Audio("sound/warning.wav")
];

sfx.forEach(audio => {
    audio.load();
    audio.volume = sound;
});

function updateAudioVolumes() {
    const audioVolume = isMuted ? 0 : sound;
    sfx.forEach(t => {
        t.volume = audioVolume;
        if (isMuted) {
            t.pause();
            t.currentTime = 0;
        }
    });
}

function updateMuteIcon() {
    mute.innerHTML = isMuted ? "🔇" : "🔊";
    mutestatus.innerHTML = isMuted ? "Muted :" : "Unmuted :";
    mute.classList.toggle("muted", isMuted);
}

function initializeAudio() {
    updateMuteIcon();
    slider.value = sound * 100;
    volume.innerHTML = "Volume: " + Math.trunc(sound * 100);
    updateAudioVolumes();
}

mute.addEventListener("click", () => {
    isMuted = !isMuted;
    localStorage.setItem("muted", isMuted);
    updateMuteIcon();
    updateAudioVolumes();
});

slider.addEventListener("input", (e) => {
    sound = e.target.value / 100;
    localStorage.setItem("volume", sound);
    volume.innerHTML = "Volume: " + Math.trunc(sound * 100);
    updateAudioVolumes();
});

initializeAudio();

function shootSound() {
    if(isMuted) return;
    sfx[2].currentTime = 0;
    sfx[2].play();
}
function bulletBounceSound() {
    if(isMuted) return;
    sfx[1].currentTime = 0;
    sfx[1].play();
}
function breakObstacleSound() {
    if(isMuted) return;
    sfx[3].currentTime = 0;
    sfx[3].play();
}
function laserSound() {
    if(isMuted) return;
    sfx[0].currentTime = 0;
    sfx[0].play();
}
function collectSound() {
    if(isMuted) return;
    sfx[4].currentTime = 0;
    sfx[4].play();
}
function deliverSound() {
    if(isMuted) return;
    sfx[5].currentTime = 0;
    sfx[5].play();
}
function warningSound() {
    if(isMuted) return;
    sfx[6].currentTime = 0;
    sfx[6].play();
}



// Controls
let key = new Set([]);
document.addEventListener("keydown", (Event) => { 
    if(Event.key === "F11") {
        Event.preventDefault();
        return false;
}
    key.add(Event.key.toLowerCase());
    updatePlayerMovement();
});

document.addEventListener("keyup", (Event) => {
    key.delete(Event.key.toLowerCase());
    updatePlayerMovement();
});

function updatePlayerMovement() {
    if(!isOver) {
        dx = 0;
        dy = 0;

        if(key.has("w") || key.has("arrowup")) dy = -1;
        if(key.has("s") || key.has("arrowdown")) dy = 1;
        if(key.has("a") || key.has("arrowleft")) dx = -1;
        if(key.has("d") || key.has("arrowright")) dx = 1;
        if(key.has("p")) toggleGame();
        if(key.has("r")) {
            localStorage.removeItem("muted");
            location.reload();
        }
        if(key.has("f")) toggleFullscreen();
        if(key.has("m")) toggleMute();
        
        if(dx != 0 && dy != 0) {
            dx *= 0.7071;  
            dy *= 0.7071;
        }
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();  
    }
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem("muted", isMuted);
    
    if(isMuted) {
        mute.textContent = "🔇";
        mutestatus.textContent = "Muted:";
        sfx.forEach(sound => sound.volume = 0);
    } else {
        mute.textContent = "🔊";
        mutestatus.textContent = "Unmuted:";
        sfx.forEach(sound => sound.volume = sound);
    }
}

// central hub and base station working
function checkBases() {
    if(x >= hubX + 12 && x <= hubX + sq_side - 12 && y >= hubY + 12 && y <= hubY + sq_side - 12) {
        while(keysCollected >= 5) {
            deliverSound();
            keysCollected -= 5;
            spawnCounter--;
            decrypted++;
        }
        if(!rgenTimer) { rgenTimer = setInterval(() => { player = Math.min(player + 1, 100); }, 1000); }
    } else if(x >= baseX + 12 && x <= baseX + sq_side - 12 && y >= baseY + 12 && y <= baseY + sq_side - 12 && decrypted > 0) {
        deliverSound();
        system = clamp(system + decrypted * 10, 100);
        delivered += decrypted;
        decrypted = 0;
        if(parseInt(localStorage.getItem("hScore")) < delivered) localStorage.setItem("hScore", delivered);
        if(!rgenTimer) { rgenTimer = setInterval(() => { player = clamp(player + 1, 100); }, 1000); }
    } else {
        if(rgenTimer) {
            clearInterval(rgenTimer);
            rgenTimer = null;
        }
    }
}

setInterval(() => { system--; }, 5e3);

// game ending functions

function gameLost() {
    isPaused = true;
    isOver = true;
    sfx.forEach(t => t.volume = 0);

    // Show base station
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let block of blocks) {
        if((Math.abs(block.x - baseX - sq_side) < window.innerWidth / 2 || Math.abs(block.x - baseX + 2 * sq_side) < window.innerWidth / 2) && 
        (Math.abs(block.y - baseY - sq_side) < window.innerHeight / 2 || Math.abs(block.y + 2 * sq_side - baseY) < window.innerHeight / 2)) {
            block.draw();
            if(block.color == "#ff69b4") {
                ctx.beginPath();
                ctx.arc(block.x + sq_side / 2, block.y + sq_side / 2, 25, 0, 2 * Math.PI);
                ctx.fillStyle = "#ff69b4";
                ctx.fill();
                ctx.closePath();
            }
        }
    }
    window.scrollTo((baseX+sq_side/2)*ration, (baseY+sq_side/2)*ration);
    
    setTimeout(() => {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        gameScreen.style.opacity = '0';
        
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container pulse-text failure-text';
        messageContainer.id = 'failureMessage';
        messageContainer.textContent = 'MISSION FAILED';
        document.body.appendChild(messageContainer);
        
        messageContainer.addEventListener('animationend', () => {
            if (messageContainer && messageContainer.parentNode) {
                messageContainer.parentNode.removeChild(messageContainer);
            }
            
            const typingContainer = document.createElement('div');
            typingContainer.className = 'message-container typing-text';
            typingContainer.id = 'typingMessage';
            typingContainer.textContent = 'ACCESSING DATA...';
            document.body.appendChild(typingContainer);
            
            typingContainer.addEventListener('animationend', (event) => {
                if (event.animationName === 'typing') {
                    if (typingContainer && typingContainer.parentNode) {
                        typingContainer.parentNode.removeChild(typingContainer);
                    }
                    // Show game over screen
                    GLHS.innerHTML = "HIGH SCORE: " + localStorage.getItem("hScore");
                    GLYS.innerHTML = "YOUR SCORE: " + delivered;
                    GL.style.display = "flex";
                    gameScreen.style.display = "none";
                }
            });
        });
    }, 1000);
}

function gameWon() {
    isPaused = true;
    isOver = true;
    sfx.forEach(t => t.volume = 0);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    gameScreen.style.opacity = '0';

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container pulse-text success-text';
    messageContainer.id = 'successMessage';
    messageContainer.textContent = 'MISSION SUCCESSFUL';
    document.body.appendChild(messageContainer);
    
    messageContainer.addEventListener('animationend', () => {
        if (messageContainer && messageContainer.parentNode) {
            messageContainer.parentNode.removeChild(messageContainer);
        }
        
        const typingContainer = document.createElement('div');
        typingContainer.className = 'message-container typing-text';
        typingContainer.id = 'typingMessage';
        typingContainer.textContent = 'ACCESSING DATA...';
        document.body.appendChild(typingContainer);
        
        typingContainer.addEventListener('animationend', (event) => {
            if (event.animationName === 'typing') {
                if (typingContainer && typingContainer.parentNode) {
                    typingContainer.parentNode.removeChild(typingContainer);
                }
                
                // Show game won screen
                GWHS.innerHTML = "HIGH SCORE: " + localStorage.getItem("hScore");
                GWYS.innerHTML = "YOUR SCORE: " + delivered;
                GW.style.display = "flex";
                gameScreen.style.display = "none";
            }
        });
    });
}

animate();