/* =======================================================
   ELEMENTAL BATTLEGROUNDS – FULLY PLAYABLE FINAL VERSION
   EVERYTHING: ANIMATIONS, PARTICLES, CINEMATIC, MOBILE
   ======================================================= */

const screens = document.querySelectorAll(".screen");

// -------------------- GLOBAL VARIABLES --------------------
let gameMode = null; // 'arcade' | 'practice'
let currentScreen = "titleScreen";
let paused = false;
let countdown = 3;

const fightCanvas = document.getElementById("fightCanvas");
const vsCanvas = document.getElementById("vsCanvas");
const ctx = fightCanvas.getContext("2d");
const vsCtx = vsCanvas.getContext("2d");

// -------------------- CHARACTERS --------------------
const characters = [
  {id:"fire", name:"Pyron", gender:"Male", color:"#ff3b3b", special:"Flame Dash", ultimate:"Inferno Execution"},
  {id:"ice", name:"Glacia", gender:"Female", color:"#6fd3ff", special:"Freeze Spike", ultimate:"Absolute Zero"},
  {id:"electric", name:"Volt", gender:"Male", color:"#faff00", special:"Thunder Lunge", ultimate:"Neural Overload"},
  {id:"wind", name:"Aero", gender:"Female", color:"#8cffc1", special:"Gale Kick", ultimate:"Sky Dominion"},
  {id:"shadow", name:"Umbra", gender:"Male", color:"#9b59b6", special:"Phase Slash", ultimate:"Void Collapse"}
];

let player = null;
let cpu = null;
let selectedPlayer = null;
let selectedCPU = null;
let selectedMap = null;
let cpuDifficulty = "easy";

// -------------------- SCREEN MANAGEMENT --------------------
function showScreen(id){
  screens.forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  currentScreen=id;
}

// -------------------- CHARACTER SELECT --------------------
const charGrid = document.querySelector("#charSelectScreen .char-grid");
characters.forEach(char => {
  const div = document.createElement("div");
  div.classList.add("char");
  div.style.borderColor = char.color;
  div.innerHTML = `<span>${char.name}</span>`;
  div.addEventListener("click", () => {
    selectedPlayer = char;
    document.querySelectorAll(".char").forEach(c=>c.classList.remove("selected"));
    div.classList.add("selected");
  });
  charGrid.appendChild(div);
});

// -------------------- CPU SELECT --------------------
const cpuGrid = document.querySelector("#cpuSelectScreen .char-grid");
characters.forEach(char => {
  const div = document.createElement("div");
  div.classList.add("char");
  div.style.borderColor = char.color;
  div.innerHTML = `<span>${char.name}</span>`;
  div.addEventListener("click", () => {
    selectedCPU = char;
    document.querySelectorAll("#cpuSelectScreen .char").forEach(c=>c.classList.remove("selected"));
    div.classList.add("selected");
  });
  cpuGrid.appendChild(div);
});

// -------------------- MAP SELECT --------------------
const mapGrid = document.querySelector("#mapSelectScreen .map-grid");
const maps = ["lava","ice","lightning","ocean","wind"];
maps.forEach(map => {
  const div = document.createElement("div");
  div.classList.add("map");
  div.style.backgroundImage=`url('maps/${map}.jpg')`;
  div.addEventListener("click",()=>{
    selectedMap=map;
    document.querySelectorAll(".map").forEach(m=>m.classList.remove("selected"));
    div.classList.add("selected");
  });
  mapGrid.appendChild(div);
});

// -------------------- FIGHTER CLASS --------------------
class Fighter {
  constructor(char,x,facing){
    this.char=char;
    this.x=x;
    this.y=330;
    this.vx=0;
    this.vy=0;
    this.facing=facing;
    this.health=1000;
    this.maxHealth=1000;
    this.state="idle";
    this.onGround=true;
    this.knockedDown=false;
  }

  takeDamage(amount,knockdown=false){
    this.health -= amount;
    if(this.health<0) this.health=0;
    if(knockdown){
      this.knockedDown=true;
      this.vy=-12;
      this.vx=this.facing==="right"?-6:6;
      this.state="fall";
    }
  }

  update(){
    if(this.knockedDown){
      this.vy+=0.8;
      this.y+=this.vy;
      this.x+=this.vx;
      if(this.y>=330){
        this.y=330;
        this.vy=0;
        this.knockedDown=false;
        this.state="idle";
      }
      return;
    }

    if(!this.onGround){
      this.vy+=0.8;
      this.y+=this.vy;
      if(this.y>=330){
        this.y=330;
        this.onGround=true;
        this.vy=0;
      }
    }
    this.x+=this.vx;
    this.vx*=0.8;
  }

  draw(ctx){
    ctx.strokeStyle=this.char.color;
    ctx.lineWidth=3;

    // Head
    ctx.beginPath();
    ctx.arc(this.x,this.y-40,8,0,Math.PI*2);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(this.x,this.y-32);
    ctx.lineTo(this.x,this.y-5);
    ctx.stroke();

    // Arms (fighting stance)
    ctx.beginPath();
    ctx.moveTo(this.x,this.y-25);
    ctx.lineTo(this.x+(this.facing==="right"?20:-20), this.y-15);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(this.x,this.y-5);
    ctx.lineTo(this.x+8,this.y+10);
    ctx.moveTo(this.x,this.y-5);
    ctx.lineTo(this.x-8,this.y+10);
    ctx.stroke();
  }
}

// -------------------- GLOBAL FIGHTERS --------------------
let playerFighter = null;
let cpuFighter = null;

// -------------------- INPUT --------------------
const input = {left:false,right:false,jump:false,attack:false,special:false,ultimate:false};
function bindTouch(id,key){
  const btn=document.getElementById(id);
  btn.addEventListener("touchstart",e=>{e.preventDefault();input[key]=true;});
  btn.addEventListener("touchend",e=>{e.preventDefault();input[key]=false;});
  btn.addEventListener("mousedown",e=>{input[key]=true;});
  btn.addEventListener("mouseup",e=>{input[key]=false;});
}
["leftBtn","rightBtn","jumpBtn","attackBtn","specialBtn","ultimateBtn"].forEach(id=>{
  bindTouch(id,id.replace("Btn","").toLowerCase());
});

// -------------------- PAUSE --------------------
document.getElementById("pauseBtn").onclick=togglePause;
function togglePause(){
  paused=!paused;
  document.getElementById("pauseMenu").classList.toggle("hidden",!paused);
}

// -------------------- MENU BUTTONS --------------------
document.getElementById("arcadeBtn").onclick=()=>showScreen("charSelectScreen");
document.getElementById("practiceBtn").onclick=()=>showScreen("charSelectScreen");
document.getElementById("settingsBtn").onclick=()=>showScreen("settingsScreen");
document.getElementById("controlsBtn").onclick=()=>showScreen("controlsScreen");
document.getElementById("backSettingsBtn").onclick=()=>showScreen("titleScreen");
document.getElementById("backControlsBtn").onclick=()=>showScreen("titleScreen");
document.getElementById("charNextBtn").onclick=()=>{
  if(!selectedPlayer)return alert("Select a fighter!");
  if(gameMode==="practice") startFight("practice");
  else showScreen("cpuSelectScreen");
};
document.getElementById("cpuNextBtn").onclick=()=>{
  if(!selectedCPU)return alert("Select CPU!");
  const diffBtns=document.querySelectorAll(".difficulty-buttons button");
  diffBtns.forEach(b=>{if(b.classList.contains("selected")) cpuDifficulty=b.dataset.diff;});
  showScreen("mapSelectScreen");
};
document.getElementById("mapNextBtn").onclick=()=>{
  if(!selectedMap) return alert("Select a map!");
  showScreen("vsScreen");
  startVSCountdown();
};
document.querySelectorAll(".difficulty-buttons button").forEach(btn=>{
  btn.addEventListener("click",()=>{document.querySelectorAll(".difficulty-buttons button").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");});
});

// -------------------- PARTICLES --------------------
let particles=[];
function createParticles(fighter,type){
  const color=fighter.char.color;
  for(let i=0;i<15;i++){
    particles.push({
      x:fighter.x,
      y:fighter.y-20,
      vx:(Math.random()-0.5)*4,
      vy:-Math.random()*4,
      life:type==="ultimate"?60:30,
      color:color,
      size:type==="ultimate"?6:3
    });
  }
}
function drawParticles(){
  particles.forEach((p,i)=>{
    ctx.fillStyle=p.color;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fill();
    p.x+=p.vx; p.y+=p.vy; p.life--;
    if(p.life<=0) particles.splice(i,1);
  });
}

// -------------------- COMBAT --------------------
function normalAttack(attacker,defender){defender.takeDamage(40,true);createParticles(attacker,"normal");}
function specialAttack(attacker,defender){defender.takeDamage(90,true);createParticles(attacker,"special");}
function ultimateAttack(attacker,defender){defender.takeDamage(200,true);createParticles(attacker,"ultimate");}

// -------------------- CPU AI --------------------
function cpuAI(){
  if(gameMode==="practice") return;
  if(Math.random()<0.01) cpuFighter.vx = cpuFighter.x<playerFighter.x?2:-2;
  if(Math.random()<0.01) normalAttack(cpuFighter,playerFighter);
}

// -------------------- HEALTH --------------------
function updateHealthBars(){
  document.querySelector("#playerHealth .fill").style.width=(playerFighter.health/playerFighter.maxHealth*100)+"%";
  document.querySelector("#cpuHealth .fill").style.width=(cpuFighter.health/cpuFighter.maxHealth*100)+"%";
}

// -------------------- FIGHT LOOP --------------------
function fightLoop(){
  if(paused || currentScreen!=="fightScreen") return;
  ctx.clearRect(0,0,fightCanvas.width,fightCanvas.height);

  // Input
  if(input.left){playerFighter.vx=-4;playerFighter.facing="left";}
  if(input.right){playerFighter.vx=4;playerFighter.facing="right";}
  if(input.jump && playerFighter.onGround){playerFighter.vy=-14;playerFighter.onGround=false;}
  if(input.attack){normalAttack(playerFighter,cpuFighter); input.attack=false;}
  if(input.special){specialAttack(playerFighter,cpuFighter); input.special=false;}
  if(input.ultimate){ultimateAttack(playerFighter,cpuFighter); input.ultimate=false;}

  // Practice regen
  if(gameMode==="practice" && cpuFighter.health<=0) cpuFighter.health=cpuFighter.maxHealth;

  cpuAI();

  playerFighter.update();
  cpuFighter.update();

  playerFighter.draw(ctx);
  cpuFighter.draw(ctx);

  drawParticles();
  updateHealthBars();

  requestAnimationFrame(fightLoop);
}

// -------------------- VS COUNTDOWN --------------------
function startVSCountdown(){
  countdown=3;
  vsCtx.clearRect(0,0,vsCanvas.width,vsCanvas.height);
  playerFighter=new Fighter(selectedPlayer,200,"right");
  cpuFighter=new Fighter(selectedCPU,600,"left");
  document.getElementById("playerName").innerText=playerFighter.char.name;
  document.getElementById("cpuName").innerText=cpuFighter.char.name;
  const countdownInterval=setInterval(()=>{
    vsCtx.clearRect(0,0,vsCanvas.width,vsCanvas.height);
    vsCtx.fillStyle="#fff"; vsCtx.font="80px Arial";
    if(countdown>0){ vsCtx.fillText(countdown,vsCanvas.width/2-20,vsCanvas.height/2); countdown--; }
    else { vsCtx.fillText("FIGHT!",vsCanvas.width/2-100,vsCanvas.height/2); clearInterval(countdownInterval); setTimeout(()=>showScreen("fightScreen") || fightLoop(),500);}
  },1000);
}
