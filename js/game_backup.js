// game.js — Rise of the Wild (full rewrite)
window.Game = (() => {
  'use strict';
  let canvas,ctx,W=0,H=0,running=false,raf=null;
  let currentUser=null,saveData=null,saveCb=null;
  const TS=32,MAP_COLS=240,MAP_ROWS=20;

  // Day/Night
  let dayT=0.25;
  const DAY_SPEED=0.000023;
  function timeLabel(){const h=Math.floor(dayT*24),m=Math.floor((dayT*24-h)*60);return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');}
  function isNight(){return dayT>0.75||dayT<0.15;}
  function isDawnDusk(){return(dayT>0.15&&dayT<0.28)||(dayT>0.65&&dayT<0.78);}
  function skyBright(){
    if(dayT<0.15) return 0.05+dayT/0.15*0.3;
    if(dayT<0.28) return 0.3+(dayT-0.15)/0.13*0.7;
    if(dayT<0.65) return 1.0;
    if(dayT<0.78) return 1.0-(dayT-0.65)/0.13*0.95;
    return 0.05;
  }

  const BIOMES=[
    {id:'plains',  name:'Plains',         startCol:0,  endCol:30, skyA:'#87ceeb',skyB:'#c8efff',gA:'#4a9a2a',gB:'#3a8a1a',pA:'#c8a850',pB:'#b09040',fog:null},
    {id:'water',   name:'Water Realm',    startCol:30, endCol:60, skyA:'#1a3a6a',skyB:'#2a5aaa',gA:'#1a6aaa',gB:'#0a4a8a',pA:'#1a6aaa',pB:'#1050aa',fog:'rgba(10,30,80,0.18)'},
    {id:'tropical',name:'Tropical Forest',startCol:60, endCol:90, skyA:'#1a6010',skyB:'#6ab820',gA:'#0a5a0a',gB:'#084008',pA:'#a08020',pB:'#887010',fog:'rgba(0,40,0,0.09)'},
    {id:'mountain',name:'Mountain Range', startCol:90, endCol:120,skyA:'#b0a090',skyB:'#e0d8d0',gA:'#6a5a4a',gB:'#4a3a2a',pA:'#8a7a6a',pB:'#6a5a4a',fog:'rgba(200,190,180,0.07)'},
    {id:'snow',    name:'Frozen Tundra',  startCol:120,endCol:150,skyA:'#a0c8e0',skyB:'#e8f4fc',gA:'#c8dce8',gB:'#a8c4d8',pA:'#e0eef8',pB:'#c8dde8',fog:'rgba(200,230,255,0.1)'},
    {id:'savanna', name:'Sunset Savanna', startCol:150,endCol:180,skyA:'#e05a00',skyB:'#f0a840',gA:'#8a6010',gB:'#6a4a08',pA:'#c89030',pB:'#a87020',fog:'rgba(200,80,0,0.06)'},
    {id:'ocean',   name:'Deep Ocean',     startCol:180,endCol:210,skyA:'#050f2a',skyB:'#0a2040',gA:'#040c20',gB:'#020608',pA:'#0a1a3a',pB:'#081028',fog:'rgba(0,5,20,0.25)'},
    {id:'volcanic',name:'Volcanic Peaks', startCol:210,endCol:240,skyA:'#3a0800',skyB:'#7a1800',gA:'#4a0800',gB:'#2a0400',pA:'#7a1a00',pB:'#5a0e00',fog:'rgba(100,10,0,0.12)'},
  ];
  function getBiome(wx){const c=Math.floor(wx/TS);return BIOMES.find(b=>c>=b.startCol&&c<b.endCol)||BIOMES[0];}

  const ADEF={
    plains:  [{n:'Wild Rabbit',e:'🐇',hp:20,xp:8,sc:10,coins:5,cr:0.75,r:'common',atk:4},{n:'Red Fox',e:'🦊',hp:45,xp:18,sc:25,coins:12,cr:0.5,r:'common',atk:10},{n:'White-tail Deer',e:'🦌',hp:60,xp:25,sc:35,coins:18,cr:0.45,r:'uncommon',atk:12},{n:'Gray Wolf',e:'🐺',hp:80,xp:35,sc:50,coins:25,cr:0.35,r:'uncommon',atk:18},{n:'Bison',e:'🦬',hp:120,xp:50,sc:80,coins:40,cr:0.25,r:'rare',atk:25}],
    water:   [{n:'Mallard Duck',e:'🦆',hp:25,xp:10,sc:12,coins:6,cr:0.7,r:'common',atk:5},{n:'Giant Frog',e:'🐸',hp:35,xp:14,sc:18,coins:9,cr:0.6,r:'common',atk:8},{n:'River Otter',e:'🦦',hp:50,xp:22,sc:30,coins:15,cr:0.5,r:'uncommon',atk:12},{n:'Crocodile',e:'🐊',hp:100,xp:45,sc:70,coins:35,cr:0.25,r:'rare',atk:28},{n:'Bull Shark',e:'🦈',hp:130,xp:55,sc:90,coins:45,cr:0.2,r:'rare',atk:35}],
    tropical:[{n:'Scarlet Macaw',e:'🦜',hp:30,xp:12,sc:15,coins:8,cr:0.65,r:'common',atk:6},{n:'Spider Monkey',e:'🐒',hp:45,xp:20,sc:28,coins:14,cr:0.55,r:'common',atk:10},{n:'Capybara',e:'🦫',hp:55,xp:22,sc:30,coins:15,cr:0.6,r:'common',atk:8},{n:'Three-Toe Sloth',e:'🦥',hp:40,xp:18,sc:25,coins:13,cr:0.7,r:'common',atk:5},{n:'Anaconda',e:'🐍',hp:90,xp:40,sc:60,coins:30,cr:0.3,r:'uncommon',atk:22},{n:'Jaguar',e:'🐆',hp:110,xp:48,sc:75,coins:38,cr:0.22,r:'rare',atk:30},{n:'Philippine Eagle',e:'🦅',hp:95,xp:42,sc:68,coins:35,cr:0.2,r:'legendary',atk:27}],
    mountain:[{n:'Mountain Goat',e:'🐐',hp:55,xp:22,sc:30,coins:15,cr:0.55,r:'common',atk:12},{n:'Golden Eagle',e:'🦅',hp:70,xp:30,sc:45,coins:22,cr:0.4,r:'uncommon',atk:18},{n:'Grizzly Bear',e:'🐻',hp:150,xp:65,sc:100,coins:50,cr:0.18,r:'rare',atk:38},{n:'Snow Leopard',e:'🐈',hp:120,xp:52,sc:85,coins:42,cr:0.2,r:'legendary',atk:32}],
    snow:    [{n:'Emperor Penguin',e:'🐧',hp:40,xp:16,sc:22,coins:11,cr:0.65,r:'common',atk:8},{n:'Arctic Fox',e:'🦊',hp:50,xp:20,sc:28,coins:14,cr:0.55,r:'common',atk:10},{n:'Reindeer',e:'🦌',hp:65,xp:28,sc:40,coins:20,cr:0.5,r:'uncommon',atk:15},{n:'Leopard Seal',e:'🦭',hp:75,xp:32,sc:48,coins:24,cr:0.4,r:'uncommon',atk:20},{n:'Polar Bear',e:'🐻‍❄️',hp:160,xp:70,sc:110,coins:55,cr:0.15,r:'legendary',atk:42}],
    savanna: [{n:'Plains Zebra',e:'🦓',hp:70,xp:28,sc:40,coins:20,cr:0.45,r:'common',atk:14},{n:'Giraffe',e:'🦒',hp:90,xp:38,sc:58,coins:29,cr:0.35,r:'uncommon',atk:16},{n:'Spotted Hyena',e:'🐺',hp:80,xp:34,sc:52,coins:26,cr:0.38,r:'uncommon',atk:18},{n:'African Lion',e:'🦁',hp:140,xp:60,sc:95,coins:48,cr:0.2,r:'rare',atk:36},{n:'African Elephant',e:'🐘',hp:200,xp:85,sc:150,coins:75,cr:0.1,r:'legendary',atk:45}],
    ocean:   [{n:'Giant Octopus',e:'🐙',hp:85,xp:36,sc:55,coins:28,cr:0.32,r:'uncommon',atk:22},{n:'Orca',e:'🐬',hp:120,xp:50,sc:80,coins:40,cr:0.25,r:'rare',atk:32},{n:'Blue Whale',e:'🐋',hp:250,xp:100,sc:200,coins:100,cr:0.08,r:'legendary',atk:50}],
    volcanic:[{n:'Vulture',e:'🦅',hp:75,xp:32,sc:48,coins:24,cr:0.4,r:'uncommon',atk:18},{n:'Komodo Dragon',e:'🐉',hp:130,xp:55,sc:90,coins:45,cr:0.2,r:'rare',atk:35},{n:'Phoenix Bird',e:'🔥',hp:180,xp:80,sc:140,coins:70,cr:0.12,r:'legendary',atk:48}],
  };

  const HOUSEDEF=[
    {biome:'plains',  col:12, name:'Village Inn',   heals:true},
    {biome:'water',   col:38, name:'Fisherman Dock'},
    {biome:'tropical',col:68, name:'Jungle Temple'},
    {biome:'mountain',col:98, name:'Ranger Post'},
    {biome:'snow',    col:128,name:'Ice Igloo',     heals:true},
    {biome:'savanna', col:158,name:'Safari Camp'},
    {biome:'ocean',   col:188,name:'Ocean Cave'},
    {biome:'volcanic',col:218,name:'Dragon Lair'},
  ];

  const INTERIOR_ITEMS={
    plains:  ['🛏️ Bed','🍺 Barrels','🗺️ Map','🔥 Hearth','🏹 Weapons'],
    water:   ['⚓ Anchor','🎣 Rods','🦀 Tanks','🪣 Bucket','🔭 Scope'],
    tropical:['🏺 Urns','🔥 Brazier','🗡️ Blades','📜 Scrolls','💎 Gems'],
    mountain:['🔭 Telescope','🧭 Compass','🪵 Log pile','🍲 Stew','🧤 Gear'],
    snow:    ['🧊 Ice shelf','🕯️ Candles','🍲 Hot soup','🧣 Furs','❄️ Crystal'],
    savanna: ['🔭 Scope','🚙 Jeep part','🦁 Trophy','📸 Camera','🥾 Boots'],
    ocean:   ['🪸 Coral','🐠 Tank','💡 Lamp','🔱 Trident','💀 Skulls'],
    volcanic:['🌋 Lava tube','💀 Bones','🗡️ Sword','💎 Ore','🔥 Pit'],
  };

  // Runtime
  let animals=[],houses=[],snowP=[],animT=0;
  let player={},companion={};
  let camX=0,camY=0;
  let score=0,coins=0,fightWins=0,catchCount=0;
  let encounterCooldown=0,inBattle=false,activeAnimal=null;
  let stepSoundTimer=0,party=[];
  let catchBonus=0,atkBonus=0,hasShield=false;

  // Interior
  let inInterior=false,currentHouse=null;
  let iPlayer={x:0,y:0};

  // Battle anim
  let battleCanvas,battleCtx,battleT=0,shakeX=0,flashAlpha=0,flashCol='#fff';
  let pAnim={x:0,y:0,atkT:0},eAnim={x:0,y:0,atkT:0,hitT:0};
  let battlePhase='idle',battleRAFId=null;

  const STARS=Array.from({length:120},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.8+0.3,t:Math.random()*Math.PI*2}));

  function hexToRgb(h){try{return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}catch(e){return[128,128,128];}}
  function blend(a,b,t){try{const[r1,g1,b1]=hexToRgb(a),[r2,g2,b2]=hexToRgb(b);return`rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;}catch(e){return a;}}


  function buildWorld(sd){
    animals=[];houses=[];snowP=[];
    BIOMES.forEach(b=>{
      const defs=ADEF[b.id]||[];if(!defs.length)return;
      const count=8+Math.floor(Math.random()*5);
      for(let i=0;i<count;i++){
        const d=defs[Math.floor(Math.random()*defs.length)];
        const col=b.startCol+1+Math.random()*(b.endCol-b.startCol-2);
        const row=5+Math.random()*8; // spread rows 5-13
        animals.push({...d,uid:b.id+'_'+i,
          wx:col*TS,wy:row*TS,hp:d.hp,maxHp:d.hp,alive:true,
          vx:(Math.random()-.5)*.7,vy:(Math.random()-.5)*.35,
          wanderT:Math.random()*300,
          homeX:(b.startCol+(b.endCol-b.startCol)/2)*TS,
          homeY:row*TS,
          rangeX:(b.endCol-b.startCol-3)*TS/2,
          rangeY:2.5*TS,
          bob:Math.random()*Math.PI*2,
          facing:Math.random()>.5?1:-1,
        });
      }
    });
    const HC={plains:'#c8a060',water:'#6a8aaa',tropical:'#8a6a2a',mountain:'#7a5a3a',snow:'#d8f0ff',savanna:'#c8a050',ocean:'#0a1a3a',volcanic:'#5a1a00'};
    const HR={plains:'#a04020',water:'#3a5a7a',tropical:'#4a3a1a',mountain:'#3a2a1a',snow:'#a0c8e0',savanna:'#8a6020',ocean:'#020818',volcanic:'#3a0a00'};
    const HE={plains:'🏠',water:'⚓',tropical:'🛕',mountain:'🏕️',snow:'🏔️',savanna:'⛺',ocean:'🌊',volcanic:'🌋'};
    HOUSEDEF.forEach(h=>houses.push({...h,wx:h.col*TS,wy:7*TS,color:HC[h.biome],roof:HR[h.biome],emoji:HE[h.biome]}));
    for(let i=0;i<100;i++) snowP.push({wx:(120+Math.random()*30)*TS,wy:Math.random()*MAP_ROWS*TS,r:Math.random()*2+.5,vy:.5+Math.random()*.6,vx:(Math.random()-.5)*.3});
    party=[];
    if(sd?.party) sd.party.forEach(pn=>{const f=sd.caughtAnimals?.find(a=>a.name===pn);if(f)party.push({...f,partyHp:f.hp||50,partyMaxHp:f.hp||50});});
  }

  function resetPlayer(sd){
    const spd=sd?.settings?.speed||3;
    player={wx:5*TS,wy:9*TS,w:24,h:32,hp:100,maxHp:100,xp:0,maxXp:100,speed:spd,facing:'right',stepF:0,moving:false};
    companion={wx:3*TS,wy:9*TS};
  }

  const keys={};
  document.addEventListener('keydown',e=>{
    keys[e.key]=true;
    if(!running)return;
    if(e.key==='i'||e.key==='I')togglePanel('inventory-panel');
    if(e.key==='p'||e.key==='P')togglePanel('party-panel');
    if(e.key===' '){e.preventDefault();checkInteract();}
    if(e.key==='Escape'&&inInterior)exitInterior();
  });
  document.addEventListener('keyup',e=>{keys[e.key]=false;});

  let toastTimer=null;
  function toast(msg,color){
    const el=document.getElementById('toast');if(!el)return;
    el.textContent=msg;el.style.color=color||'#2ecc71';
    el.classList.add('show');clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove('show'),2800);
  }

  function updateHud(){
    const b=getBiome(player.wx);
    document.getElementById('hud-biome').textContent=inInterior?(currentHouse?.name||b.name):b.name;
    document.getElementById('hud-score').textContent=score;
    document.getElementById('hud-coins').textContent=coins;
    document.getElementById('hud-hp-text').textContent=Math.ceil(player.hp);
    document.getElementById('hud-hp-fill').style.width=(player.hp/player.maxHp*100)+'%';
    document.getElementById('hud-xp-text').textContent=Math.floor(player.xp);
    document.getElementById('hud-xp-fill').style.width=(player.xp/player.maxXp*100)+'%';
    if(!inBattle)Sound.playBgMusic(inInterior?'lobby':b.id);
  }

  // INTERIOR
  function enterInterior(h){
    inInterior=true;currentHouse=h;
    iPlayer={x:W/2,y:H*0.65};
    if(h.heals){player.hp=player.maxHp;updateHud();Sound.sfx.heal();toast('✅ HP restored!','#2ecc71');}
    toast('📍 Entered '+h.name+' — ESC to exit','#f0e0a0');Sound.sfx.click();
  }
  function exitInterior(){inInterior=false;currentHouse=null;toast('← Exited','#aaa');}

  function updateInterior(){
    const spd=player.speed||3;
    let dx=0,dy=0;
    if(keys['a']||keys['ArrowLeft'])dx=-spd;
    if(keys['d']||keys['ArrowRight'])dx=spd;
    if(keys['w']||keys['ArrowUp'])dy=-spd;
    if(keys['s']||keys['ArrowDown'])dy=spd;
    iPlayer.x=Math.max(30,Math.min(W-50,iPlayer.x+dx));
    iPlayer.y=Math.max(80,Math.min(H-50,iPlayer.y+dy));
    if(iPlayer.y>H-80&&Math.abs(iPlayer.x-W/2)<50)exitInterior();
  }

  function drawInterior(){
    if(!currentHouse)return;
    const biome=currentHouse.biome;
    const items=INTERIOR_ITEMS[biome]||[];
    const bright=skyBright();
    // Background
    const bgC={plains:'#5a3010',water:'#0a1a3a',tropical:'#0a2a08',mountain:'#2a1a0a',snow:'#1a3a5a',savanna:'#2a1a00',ocean:'#020818',volcanic:'#1a0400'};
    const flC={plains:'#8B6914',water:'#1a3a5a',tropical:'#1a4a10',mountain:'#3a2a18',snow:'#3a6a8a',savanna:'#5a3a10',ocean:'#050d28',volcanic:'#3a0a00'};
    ctx.fillStyle=flC[biome]||'#5a3010';ctx.fillRect(0,0,W,H);
    // Walls
    ctx.fillStyle=bgC[biome]||'#3a1808';
    ctx.fillRect(0,0,W,70);ctx.fillRect(0,0,35,H);ctx.fillRect(W-35,0,35,H);ctx.fillRect(0,H-40,W,40);
    // Floor tiles
    for(let tx=35;tx<W-35;tx+=52){
      for(let ty=70;ty<H-40;ty+=52){
        if(((Math.floor(tx/52)+Math.floor(ty/52))%2===0)){ctx.fillStyle='rgba(0,0,0,0.06)';ctx.fillRect(tx,ty,52,52);}
        ctx.strokeStyle='rgba(0,0,0,0.08)';ctx.lineWidth=0.5;ctx.strokeRect(tx,ty,52,52);
      }
    }
    // Title
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(W/2-120,8,240,30);
    ctx.fillStyle='#ffe0a0';ctx.font='bold 14px sans-serif';ctx.textBaseline='middle';ctx.textAlign='center';
    ctx.fillText(currentHouse.name,W/2,23);ctx.textAlign='left';
    // Items scattered around interior
    items.forEach((item,i)=>{
      const angle=(i/items.length)*Math.PI*2;
      const ix=W/2+Math.cos(angle)*(W*.28);
      const iy=H/2+Math.sin(angle)*(H*.24)-30;
      // Item platform
      ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(ix-22,iy+18,44,16);
      ctx.font='30px serif';ctx.textBaseline='middle';ctx.textAlign='center';
      ctx.fillText(item.split(' ')[0],ix,iy+10);
      ctx.fillStyle='rgba(255,224,160,0.85)';ctx.font='9px sans-serif';ctx.textBaseline='middle';
      ctx.fillText(item.substring(2),ix,iy+27);ctx.textAlign='left';
    });
    // Exit door
    ctx.fillStyle='#8B4513';ctx.fillRect(W/2-22,H-58,44,58);
    ctx.fillStyle='#c8a060';ctx.fillRect(W/2-20,H-56,40,54);
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(W/2-20,H-56,40,54);
    ctx.fillStyle='#f0a500';ctx.beginPath();ctx.arc(W/2+8,H-28,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffee88';ctx.font='bold 9px sans-serif';ctx.textBaseline='middle';ctx.textAlign='center';
    ctx.fillText('EXIT',W/2,H-65);ctx.textAlign='left';
    // Interior description
    const interDesc={plains:'A cozy inn. Hearth glows warmly.',water:'Dockside shack. Smells of fish.',tropical:'Ancient temple. Shadows linger.',mountain:'Ranger cabin. Views of peaks.',snow:'Warm igloo. Safe from blizzards.',savanna:'Safari camp. Distant lion roars.',ocean:'Underwater cave. Bioluminescence glows.',volcanic:'Dragon lair. Heat is intense.'};
    ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(35,H-115,W-70,45);
    ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.textBaseline='middle';
    ctx.fillText(interDesc[biome]||'A mysterious place.',48,H-98);
    ctx.fillStyle='#aaa';ctx.font='10px sans-serif';
    ctx.fillText('Walk to the door at bottom to exit. Press ESC anytime.',48,H-80);
    // Draw player
    drawIPlayer(iPlayer.x,iPlayer.y);
    // Day/night tint
    if(bright<0.99){ctx.globalAlpha=(1-bright)*0.5;ctx.fillStyle=isNight()?'#020510':'#0a0a0a';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
    if(Math.abs(iPlayer.x-W/2)<60&&iPlayer.y>H-100){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(W/2-55,iPlayer.y-35,110,16);ctx.fillStyle='#ffee88';ctx.font='9px sans-serif';ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillText('Walk out to exit',W/2,iPlayer.y-27);ctx.textAlign='left';}
  }

  function drawIPlayer(x,y){
    const br=Math.sin(animT*1.4)*.7;
    const walking=(keys['a']||keys['d']||keys['w']||keys['s']||keys['ArrowLeft']||keys['ArrowRight']||keys['ArrowUp']||keys['ArrowDown']);
    const walk=walking?Math.sin(animT*8)*3:0;
    ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(x+12,y+32,12,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#2a3a8a';ctx.fillRect(x+6,y+20+walk,5,10);ctx.fillRect(x+13,y+20-walk,5,10);
    ctx.fillStyle='#5a3010';ctx.fillRect(x+5,y+29+walk,6,3);ctx.fillRect(x+12,y+29-walk,6,3);
    ctx.fillStyle='#4a80e0';ctx.fillRect(x+5,y+12+br,14,10);
    ctx.fillStyle='#8B4513';ctx.fillRect(x+4,y+21+br,16,2);
    ctx.fillStyle='#F4C18A';ctx.fillRect(x+2,y+13+br,4,9);ctx.fillRect(x+19,y+13+br,4,9);
    ctx.fillRect(x+6,y,12,13);
    ctx.fillStyle='#5a3010';ctx.fillRect(x+5,y-3,14,5);
    const blH=Math.sin(animT*.7)>.95?.1:1;
    ctx.fillStyle='#000';ctx.fillRect(x+7.5,y+4,2.5,2.5*blH);ctx.fillRect(x+13,y+4,2.5,2.5*blH);
    ctx.fillRect(x+9,y+9,1.5,1);ctx.fillRect(x+12,y+9,1.5,1);
  }


  // UPDATE
  function update(){
    animT+=0.016;dayT=(dayT+DAY_SPEED)%1;
    if(inBattle)return;
    if(inInterior){updateInterior();return;}
    if(encounterCooldown>0)encounterCooldown--;
    const spd=player.speed||3;let dx=0,dy=0;
    if(keys['a']||keys['ArrowLeft']){dx=-spd;player.facing='left';}
    if(keys['d']||keys['ArrowRight']){dx=spd;player.facing='right';}
    if(keys['w']||keys['ArrowUp'])dy=-spd;
    if(keys['s']||keys['ArrowDown'])dy=spd;
    player.moving=dx!==0||dy!==0;
    if(player.moving){player.stepF+=0.2;stepSoundTimer--;if(stepSoundTimer<=0){Sound.sfx.step();stepSoundTimer=20;}}
    player.wx=Math.max(0,Math.min(MAP_COLS*TS-player.w,player.wx+dx));
    player.wy=Math.max(4*TS,Math.min(13*TS,player.wy+dy));
    companion.wx+=(player.wx-26-companion.wx)*0.08;
    companion.wy+=(player.wy-companion.wy)*0.08;
    const tx=player.wx-W/2+player.w/2,ty=player.wy-H*0.55;
    camX=Math.max(0,Math.min(MAP_COLS*TS-W,tx));
    camY=Math.max(0,Math.min(MAP_ROWS*TS-H,ty));
    // 2D animal wander
    animals.forEach(a=>{
      if(!a.alive)return;
      a.wanderT--;
      if(a.wanderT<=0){a.vx=(Math.random()-.5)*.8;a.vy=(Math.random()-.5)*.4;a.wanderT=120+Math.random()*280;a.facing=a.vx>0?1:-1;}
      a.wx+=a.vx;a.wy+=a.vy;
      a.wx=Math.max(a.homeX-a.rangeX,Math.min(a.homeX+a.rangeX,a.wx));
      a.wy=Math.max(a.homeY-a.rangeY,Math.min(a.homeY+a.rangeY,a.wy));
    });
    snowP.forEach(p=>{p.wy+=p.vy;p.wx+=p.vx;if(p.wy>MAP_ROWS*TS)p.wy=0;});
    if(encounterCooldown===0){
      for(const a of animals){
        if(!a.alive)continue;
        if(Math.abs(player.wx-a.wx)<TS*1.0&&Math.abs(player.wy-a.wy)<TS*1.0){startBattle(a);break;}
      }
    }
    // House proximity
    houses.forEach(h=>{
      const near=Math.abs(player.wx-h.wx-TS)<TS*1.8&&Math.abs(player.wy-h.wy-TS)<TS*1.8;
      if(near&&!h._hint){h._hint=true;toast('📍 '+h.name+' — Press SPACE','#f0e0a0');}
      if(!near)h._hint=false;
    });
    updateHud();
  }

  function checkInteract(){
    if(inInterior){exitInterior();return;}
    for(const h of houses){
      if(Math.abs(player.wx-h.wx-TS)<TS*1.8&&Math.abs(player.wy-h.wy-TS)<TS*1.8){enterInterior(h);return;}
    }
  }

  // BATTLE SYSTEM
  function startBattle(a){
    inBattle=true;activeAnimal=a;battleT=0;shakeX=0;flashAlpha=0;
    pAnim={x:0,y:0,atkT:0};eAnim={x:0,y:0,atkT:0,hitT:0};
    battlePhase='idle';catchBonus=0;atkBonus=0;hasShield=false;
    sizeBattleCanvas();
    document.getElementById('battle-screen').classList.remove('hidden');
    document.getElementById('be-name').textContent=a.n||a.name;
    document.getElementById('be-hp-text').textContent=a.hp;
    document.getElementById('be-hp-fill').style.width='100%';
    document.getElementById('be-hp-fill').style.background='#2ecc71';
    document.getElementById('bp-name').textContent=currentUser.name.split(' ')[0];
    updateBattleHpBars();
    document.getElementById('battle-log').innerHTML='';
    document.getElementById('battle-actions').classList.remove('hidden');
    document.getElementById('battle-items-menu').classList.add('hidden');
    addBlog(`⚡ A wild <strong>${a.n||a.name}</strong> appeared! [${a.r||a.rarity}]`,'#f0a500');
    Sound.sfx.encounter();Sound.playBgMusic('battle');
    battleRAFLoop();
  }

  function sizeBattleCanvas(){
    battleCanvas=document.getElementById('battle-canvas');
    if(!battleCanvas)return;
    battleCtx=battleCanvas.getContext('2d');
    battleCanvas.width=window.innerWidth;
    battleCanvas.height=window.innerHeight-52;
  }

  function addBlog(msg,color){
    const log=document.getElementById('battle-log');
    const d=document.createElement('div');
    d.innerHTML=msg;d.style.cssText=`color:${color||'#e8eaf0'};font-size:12px;padding:2px 0;border-bottom:1px solid #1e2a3a`;
    log.appendChild(d);log.scrollTop=log.scrollHeight;
  }

  function battleRAFLoop(){
    if(!inBattle)return;
    battleT+=0.02;
    if(flashAlpha>0)flashAlpha=Math.max(0,flashAlpha-0.04);
    if(shakeX!==0){shakeX*=0.78;if(Math.abs(shakeX)<0.1)shakeX=0;}
    pAnim.x*=0.80;pAnim.y*=0.80;
    eAnim.x*=0.80;eAnim.y*=0.80;
    if(eAnim.hitT>0)eAnim.hitT--;
    if(pAnim.atkT>0)pAnim.atkT--;
    if(eAnim.atkT>0)eAnim.atkT--;
    drawBattle();
    battleRAFId=requestAnimationFrame(battleRAFLoop);
  }

  function stopBattle(){cancelAnimationFrame(battleRAFId);battleRAFId=null;}

  function drawBattle(){
    if(!battleCtx||!battleCanvas)return;
    const BW=battleCanvas.width,BH=battleCanvas.height;
    const c=battleCtx,b=getBiome(player.wx),bright=skyBright();
    c.save();
    if(shakeX)c.translate((Math.random()-.5)*shakeX*10,(Math.random()-.5)*shakeX*5);
    // Sky
    const night=1-bright;
    const skyG=c.createLinearGradient(0,0,0,BH*.62);
    skyG.addColorStop(0,blend(b.skyA,'#010408',night));skyG.addColorStop(1,blend(b.skyB,'#050f2a',night));
    c.fillStyle=skyG;c.fillRect(0,0,BW,BH*.62);
    // Stars
    if(night>0.2){STARS.forEach(s=>{const alpha=night*(0.4+0.5*Math.sin(battleT*1.5+s.t));c.globalAlpha=Math.max(0,alpha);c.fillStyle='#fff';c.beginPath();c.arc(s.x*BW,s.y*BH*.55,s.r,0,Math.PI*2);c.fill();});c.globalAlpha=1;}
    // Celestial
    const cAng=dayT*Math.PI*2-Math.PI/2;
    const cX=BW*.5+Math.cos(cAng)*BW*.38,cY=BH*.5-Math.sin(Math.max(0,Math.min(Math.PI,dayT*Math.PI*2)))*BH*.5;
    if(cY>-40&&cY<BH*.62){
      if(isNight()){c.fillStyle=`rgba(220,230,255,${0.7+0.2*Math.sin(battleT*.5)})`;c.beginPath();c.arc(cX,cY,20,0,Math.PI*2);c.fill();}
      else{c.fillStyle=`rgba(255,235,60,${0.7*bright+0.1})`;c.beginPath();c.arc(cX,cY,26,0,Math.PI*2);c.fill();}
    }
    // Ground
    const gY=BH*.62;
    const gG=c.createLinearGradient(0,gY,0,BH);
    gG.addColorStop(0,blend(b.gA,'#020202',1-bright*.85));gG.addColorStop(1,blend(b.gB,'#010101',1-bright*.85));
    c.fillStyle=gG;c.fillRect(0,gY,BW,BH-gY);
    c.fillStyle=blend(b.gB,'#0a0a0a',1-bright*.8);c.fillRect(0,gY,BW,6);
    // Ground detail
    for(let gx=20;gx<BW;gx+=28){c.fillStyle='rgba(0,0,0,0.08)';c.fillRect(gx,gY+4,3,4);c.fillRect(gx+5,gY+2,2,6);}
    // BG trees
    for(let i=0;i<6;i++){const tx=BW*(0.05+i*.18),ty=gY;drawBtree(c,tx,ty,b.id,i,battleT);}
    // Platforms
    c.fillStyle='rgba(0,0,0,0.22)';c.beginPath();c.ellipse(BW*.65+35,gY-8,55,12,0,0,Math.PI*2);c.fill();
    c.fillStyle='rgba(0,0,0,0.18)';c.beginPath();c.ellipse(BW*.18+20,gY-4,32,8,0,0,Math.PI*2);c.fill();
    // Enemy
    const ex=BW*.63+eAnim.x,ey=gY-95+eAnim.y;
    drawBEnemy(c,ex,ey,activeAnimal,battleT,eAnim);
    // Player
    const px2=BW*.16+pAnim.x,py2=gY-60+pAnim.y;
    drawBPlayer(c,px2,py2,battleT,pAnim);
    // Party
    party.slice(0,2).forEach((pm,i)=>{
      const pmx=px2-36*(i+1),pmy=py2+12*(i+1);
      const pb=Math.sin(battleT*2+i*1.5)*3;
      c.font='26px serif';c.textBaseline='bottom';c.fillText(pm.emoji||pm.e,pmx,pmy+38+pb);
      c.fillStyle='#333';c.fillRect(pmx,pmy-4,24,3);c.fillStyle='#2ecc71';c.fillRect(pmx,pmy-4,24*(pm.partyHp/pm.partyMaxHp),3);
    });
    // Attack effects
    drawBattleEffects(c,px2,py2,ex,ey,BW,BH);
    // HP Cards
    drawBCard(c,BW*.54,14,210,52,activeAnimal,true);
    drawBCard(c,14,BH-72,200,52,null,false);
    if(flashAlpha>0){c.globalAlpha=flashAlpha;c.fillStyle=flashCol;c.fillRect(0,0,BW,BH);}
    c.globalAlpha=1;c.restore();
  }

  function drawBCard(c,x,y,w,h,animal,isEnemy){
    c.fillStyle='rgba(7,10,18,0.88)';c.fillRect(x,y,w,h);
    c.strokeStyle=isEnemy?'#e74c3c':'#2ecc71';c.lineWidth=1.5;c.strokeRect(x,y,w,h);
    c.fillStyle='#e8eaf0';c.font='bold 12px sans-serif';c.textBaseline='middle';
    const lbl=isEnemy?(animal?.n||animal?.name||'?')+' ['+(animal?.r||animal?.rarity||'?')+']':currentUser.name.split(' ')[0]+' — HP';
    c.fillText(lbl,x+8,y+14);
    const hp=isEnemy?(animal?animal.hp/animal.maxHp:0):player.hp/player.maxHp;
    const hpMax=isEnemy?animal?.maxHp:player.maxHp,hpCur=isEnemy?Math.ceil(animal?.hp||0):Math.ceil(player.hp);
    c.fillStyle='#1a1a2a';c.fillRect(x+8,y+26,w-16,10);
    c.fillStyle=hp>.5?'#2ecc71':hp>.25?'#f39c12':'#e74c3c';c.fillRect(x+8,y+26,(w-16)*Math.max(0,hp),10);
    c.fillStyle='#aaa';c.font='10px sans-serif';c.fillText(`${hpCur}/${hpMax}`,x+w-50,y+38);
  }

  function drawBtree(c,x,y,bid,idx,t){
    const sw=Math.sin(t*.7+idx*.8)*2;
    if(bid==='water'||bid==='ocean'){
      c.fillStyle=bid==='ocean'?'#6a2aff':'#ff6b6b';
      c.fillRect(x-2,y-22,5,24);c.fillRect(x-9,y-16,4,16);c.fillRect(x+4,y-20,4,20);
      [y-23,y-17,y-21].forEach((cy,i)=>{c.beginPath();c.arc(x+(i-1)*7,cy,4+i,0,Math.PI*2);c.fill();});
    }else if(bid==='snow'){
      c.fillStyle='#5D4037';c.fillRect(x-3,y-16,6,18);c.fillStyle='#388E3C';
      c.beginPath();c.moveTo(x+sw,y-28);c.lineTo(x-11,y-13);c.lineTo(x+11,y-13);c.closePath();c.fill();
      c.fillStyle='rgba(210,235,255,0.6)';c.fillRect(x-9,y-18,18,5);
    }else if(bid==='volcanic'){
      c.strokeStyle='#2a0800';c.lineWidth=4;c.beginPath();c.moveTo(x,y);c.lineTo(x+sw,y-26);c.stroke();
      c.lineWidth=2;c.beginPath();c.moveTo(x+sw,y-18);c.lineTo(x+11,y-10);c.stroke();c.lineWidth=1;
      c.fillStyle=`rgba(255,80,0,${0.4+0.3*Math.sin(t*4+idx)})`;c.beginPath();c.arc(x,y+3,6,0,Math.PI);c.fill();
    }else if(bid==='tropical'){
      c.fillStyle='#6D4C41';c.beginPath();c.moveTo(x-3,y);c.lineTo(x+2+sw,y-38);c.lineTo(x-1+sw,y-38);c.lineTo(x-4,y);c.fill();
      ['#2e7d32','#388e3c','#1b5e20','#43a047'].forEach((col,i)=>{const a=(i/4)*Math.PI*2+sw*.04;c.fillStyle=col;c.save();c.translate(x+sw*.5,y-38);c.rotate(a);c.beginPath();c.ellipse(12,0,14,4,0,0,Math.PI*2);c.fill();c.restore();});
    }else{
      c.fillStyle='#5D4037';c.fillRect(x-3,y-14,6,16);c.fillStyle='#388E3C';
      c.beginPath();c.moveTo(x+sw,y-30);c.lineTo(x-13,y-12);c.lineTo(x+13,y-12);c.closePath();c.fill();
    }
  }

  function drawBEnemy(c,x,y,animal,t,anim){
    if(!animal)return;
    const scale=animal.r==='legendary'?1.4:animal.r==='rare'?1.2:1.0;
    const sz=Math.round(72*scale);
    if(anim.hitT>0){c.save();c.filter=`brightness(${2-anim.hitT/8}) saturate(0.2)`;}
    c.fillStyle='rgba(0,0,0,0.22)';c.beginPath();c.ellipse(x+sz/2,y+sz+8,sz*.45,8,0,0,Math.PI*2);c.fill();
    const bob=Math.sin(t*1.6+animal.bob)*(anim.atkT>0?8:3);
    const bs=1+Math.sin(t*1.4)*.025;
    c.save();c.translate(x+sz/2,y+sz/2+bob);c.scale(bs,bs);
    c.font=`${sz}px serif`;c.textBaseline='middle';c.textAlign='center';c.fillText(animal.emoji||animal.e||'❓',0,0);
    c.restore();
    if(anim.hitT>0)c.restore();
    if(animal.r==='legendary'){const al=0.15+0.1*Math.sin(t*3);c.save();c.globalAlpha=al;const au=c.createRadialGradient(x+sz/2,y+sz/2,0,x+sz/2,y+sz/2,sz*.8);au.addColorStop(0,'#ffee00');au.addColorStop(1,'transparent');c.fillStyle=au;c.beginPath();c.arc(x+sz/2,y+sz/2,sz*.8,0,Math.PI*2);c.fill();c.restore();}
    else if(animal.r==='rare'){c.strokeStyle=`rgba(255,140,0,${0.3+0.2*Math.sin(t*2)})`;c.lineWidth=2;c.strokeRect(x-2,y-2,sz+4,sz+4);c.lineWidth=1;}
    c.textAlign='left';
  }

  function drawBPlayer(c,x,y,t,anim){
    const lean=anim.atkT>0?(1-anim.atkT/18)*14:0;
    const br=Math.sin(t*1.4)*.8;
    c.fillStyle='rgba(0,0,0,0.22)';c.beginPath();c.ellipse(x+14,y+52,14,5,0,0,Math.PI*2);c.fill();
    c.fillStyle='#2a3a8a';c.fillRect(x+7+lean*.3,y+34,6,14);c.fillRect(x+15+lean*.1,y+34,6,14);
    c.fillStyle='#5a3010';c.fillRect(x+6+lean*.3,y+47,8,5);c.fillRect(x+14+lean*.1,y+47,8,5);
    c.fillStyle='#4a80e0';c.fillRect(x+5+lean*.5,y+18+br,18,16);
    c.fillStyle='#8B4513';c.fillRect(x+4+lean*.5,y+33+br,20,3);
    c.fillStyle='#F4C18A';
    if(anim.atkT>0){
      const sa=-(1-anim.atkT/18)*Math.PI*.6;c.save();c.translate(x+24,y+22+br);c.rotate(sa);
      c.fillRect(0,-3,18,5);c.fillStyle='#aaa';c.fillRect(14,-6,3,18);c.fillStyle='#888';c.fillRect(10,-1,11,3);c.restore();
    }else{c.fillRect(x+3,y+19+br,5,14);c.fillRect(x+22,y+19+br,5,14);}
    c.fillRect(x+8+lean*.3,y,14,17);c.fillStyle='#5a3010';c.fillRect(x+7+lean*.3,y-4,16,6);
    const blH=Math.sin(t*.7)>.95?.1:1;
    c.fillStyle='#000';c.fillRect(x+10+lean*.3,y+5,3,3*blH);c.fillRect(x+16+lean*.3,y+5,3,3*blH);
    if(anim.atkT>0){c.fillRect(x+10+lean*.3,y+11,7,2);}else{c.fillRect(x+11+lean*.3,y+12,2,1.5);c.fillRect(x+14+lean*.3,y+12,2,1.5);}
  }

  function drawBattleEffects(c,px,py,ex,ey,BW,BH){
    if(pAnim.atkT>0){
      const prog=1-pAnim.atkT/18;
      const sx=px+30+prog*(ex-px-30),sy=py+20+prog*(ey-py-20);
      c.save();c.globalAlpha=(1-prog)*.9+0.1;
      c.strokeStyle='#fff';c.lineWidth=3;
      c.beginPath();c.moveTo(sx-15,sy-10);c.lineTo(sx+10,sy+15);c.stroke();
      c.beginPath();c.moveTo(sx-5,sy-15);c.lineTo(sx+5,sy+5);c.stroke();
      if(prog>0.7){for(let s=0;s<6;s++){const ang=(s/6)*Math.PI*2+battleT*3,r=12*(prog-.7)/.3;c.fillStyle=s%2?'#fff':'#f0a500';c.beginPath();c.arc(ex+20+Math.cos(ang)*r,ey+20+Math.sin(ang)*r,2.5,0,Math.PI*2);c.fill();}}
      c.restore();
    }
    if(eAnim.atkT>0){
      const prog=1-eAnim.atkT/18;
      c.save();c.globalAlpha=(1-prog)*.8+0.1;
      c.strokeStyle='#e74c3c';c.lineWidth=2.5;
      for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(ex-20-prog*(ex-px-20)*.5+i*8,ey+10-8);c.lineTo(ex-20-prog*(ex-px-20)*.5+i*8+5,ey+10+10);c.stroke();}
      c.restore();
    }
    if(battlePhase==='catch_anim'){
      c.save();c.globalAlpha=0.8;c.fillStyle='#00aaff';
      c.beginPath();c.arc(BW/2+Math.cos(battleT*6)*60,BH*.4+Math.sin(battleT*6)*40,12,0,Math.PI*2);c.fill();
      c.fillStyle='#fff';c.fillRect(BW/2-40,BH*.4-2,80,4);c.restore();
    }
  }


  // Battle actions
  function battleFight(){
    if(!activeAnimal||!inBattle||battlePhase!=='idle')return;
    battlePhase='p_atk';
    pAnim.atkT=18;pAnim.x=30;pAnim.y=-8;
    setTimeout(()=>{
      const dmg=12+Math.floor(Math.random()*18)+(atkBonus||0);
      activeAnimal.hp=Math.max(0,activeAnimal.hp-dmg);
      eAnim.hitT=12;eAnim.y=-12;flashAlpha=0.28;flashCol='#ffaa00';shakeX=0.9;Sound.sfx.hit();
      let pd=0;party.forEach(pm=>{const p2=4+Math.floor(Math.random()*8);activeAnimal.hp=Math.max(0,activeAnimal.hp-p2);pd+=p2;});
      if(pd>0)addBlog(`🐾 Party hits for ${pd}!`,'#88aaff');
      addBlog(`⚔️ You hit for <strong>${dmg}</strong>!`,'#f0a500');
      updateBattleHpBars();
      if(activeAnimal.hp<=0){battlePhase='idle';setTimeout(()=>endBattle('defeated'),700);return;}
      setTimeout(()=>{
        battlePhase='e_atk';eAnim.atkT=18;eAnim.x=-28;eAnim.y=6;
        setTimeout(()=>{
          const edgm=hasShield?Math.floor((activeAnimal.atk||12)*0.5*(0.8+Math.random()*.4)):Math.floor((activeAnimal.atk||12)*(0.8+Math.random()*.4));
          player.hp=Math.max(1,player.hp-edgm);pAnim.y=6;flashAlpha=0.22;flashCol='#ff4444';shakeX=0.6;
          if(party.length>0)party[0].partyHp=Math.max(0,(party[0].partyHp||50)-Math.floor(edgm*.2));
          addBlog(`💢 ${activeAnimal.n||activeAnimal.name} hits back for <strong>${edgm}</strong>!`,'#e74c3c');
          updateBattleHpBars();hasShield=false;atkBonus=0;battlePhase='idle';Sound.sfx.hit();
        },400);
      },350);
    },280);
  }

  function battleItem(){
    if(battlePhase!=='idle')return;
    document.getElementById('battle-actions').classList.add('hidden');
    const grid=document.getElementById('battle-items-grid');
    const items=(saveData.items||[]).filter(i=>i.qty>0);
    grid.innerHTML=items.map(it=>`<button class="bitem" data-id="${it.id}">${it.emoji} ${it.name}<br><small>${it.desc}</small></button>`).join('')||'<p style="color:#aaa;font-size:12px">No items.</p>';
    grid.querySelectorAll('.bitem').forEach(btn=>btn.addEventListener('click',()=>useItem(btn.dataset.id)));
    document.getElementById('battle-items-menu').classList.remove('hidden');
  }

  function useItem(id){
    const item=saveData.items.find(i=>i.id===id);if(!item||item.qty<=0)return;
    item.qty--;const ef=item.effect;
    if(ef.hp){player.hp=Math.min(player.maxHp,player.hp+(ef.hp===999?player.maxHp:ef.hp));addBlog(`💊 ${item.name}! +${ef.hp===999?'Full':ef.hp} HP`,'#2ecc71');Sound.sfx.heal();flashAlpha=0.2;flashCol='#00ff88';}
    if(ef.xp){player.xp+=ef.xp;addBlog(`✨ +${ef.xp} XP!`,'#f0a500');}
    if(ef.catchBonus){catchBonus=(catchBonus||0)+ef.catchBonus;addBlog(`⚡ Catch+${Math.floor(ef.catchBonus*100)}%!`,'#00d4ff');}
    if(ef.shield){hasShield=true;addBlog('🛡️ Shield active!','#88aaff');}
    if(ef.atkBonus){atkBonus=(atkBonus||0)+ef.atkBonus;addBlog(`⚔️ Atk+${ef.atkBonus}!`,'#f39c12');}
    updateBattleHpBars();
    document.getElementById('battle-items-menu').classList.add('hidden');
    document.getElementById('battle-actions').classList.remove('hidden');Sound.sfx.click();
  }

  function battleCatch(){
    if(!activeAnimal||!inBattle||battlePhase!=='idle')return;
    battlePhase='catch_anim';
    const hpR=1-activeAnimal.hp/activeAnimal.maxHp;
    const chance=(activeAnimal.cr||0.4)+hpR*.3+(catchBonus||0);
    flashAlpha=0.35;flashCol='#00aaff';
    addBlog('⚡ Throwing capture ball…','#00d4ff');
    setTimeout(()=>{
      catchBonus=0;
      if(Math.random()<Math.min(0.95,chance)){
        flashAlpha=0.7;flashCol='#00aaff';addBlog(`🎉 <strong>Caught!</strong>`,'#00d4ff');Sound.sfx.catch();
        setTimeout(()=>{battlePhase='idle';endBattle('caught');},800);
      }else{
        const edgm=Math.floor((activeAnimal.atk||12)*.4+Math.random()*6);
        player.hp=Math.max(1,player.hp-edgm);flashAlpha=0.3;flashCol='#ff4444';
        addBlog(`❌ Escaped! Took ${edgm} dmg.`,'#e74c3c');updateBattleHpBars();shakeX=0.6;Sound.sfx.hit();battlePhase='idle';
      }
    },800);
  }

  function battleFlee(){
    if(!activeAnimal||!inBattle||battlePhase!=='idle')return;
    battlePhase='flee';pAnim.x=-40;addBlog('💨 Got away safely!','#aaa');Sound.sfx.flee();
    setTimeout(()=>{player.wx-=80;battlePhase='idle';endBattle('fled');},400);
  }

  function updateBattleHpBars(){
    if(!activeAnimal)return;
    const ehp=activeAnimal.hp/activeAnimal.maxHp;
    document.getElementById('be-hp-fill').style.width=(ehp*100)+'%';
    document.getElementById('be-hp-fill').style.background=ehp>.5?'#2ecc71':ehp>.25?'#f39c12':'#e74c3c';
    document.getElementById('be-hp-text').textContent=Math.ceil(activeAnimal.hp);
    document.getElementById('bp-hp-fill').style.width=(player.hp/player.maxHp*100)+'%';
    document.getElementById('bp-hp-text').textContent=Math.ceil(player.hp);
  }

  function endBattle(outcome){
    stopBattle();document.getElementById('battle-screen').classList.add('hidden');
    inBattle=false;encounterCooldown=200;Sound.playBgMusic(getBiome(player.wx).id);
    if(outcome==='defeated'){
      activeAnimal.alive=false;const pts=activeAnimal.sc||15,ce=activeAnimal.coins||5;
      score+=pts;coins+=ce;player.xp+=activeAnimal.xp||10;fightWins++;
      if(saveData){saveData.score=score;saveData.wins=fightWins;saveData.coins=(saveData.coins||0)+ce;}
      toast(`⚔️ ${activeAnimal.n||activeAnimal.name} defeated! +${pts}pts +${ce}💰`,'#e74c3c');Sound.sfx.defeat();
    }else if(outcome==='caught'){
      activeAnimal.alive=false;const bonus=Math.floor((activeAnimal.sc||20)*1.5),ce=Math.floor((activeAnimal.coins||5)*1.2);
      score+=bonus;coins+=ce;player.xp+=(activeAnimal.xp||12)*1.2;catchCount++;
      const entry={name:activeAnimal.n||activeAnimal.name,emoji:activeAnimal.emoji||activeAnimal.e,rarity:activeAnimal.r||activeAnimal.rarity,hp:activeAnimal.maxHp,cr:activeAnimal.cr,atk:activeAnimal.atk||10};
      if(saveData){if(!saveData.caughtAnimals)saveData.caughtAnimals=[];saveData.caughtAnimals.push(entry);saveData.score=score;saveData.catches=catchCount;saveData.coins=(saveData.coins||0)+ce;}
      toast(`✨ Caught ${activeAnimal.n||activeAnimal.name}! +${bonus}pts +${ce}💰`,'#00d4ff');Sound.sfx.catch();
    }
    if(saveData){saveData.companionXp=(saveData.companionXp||0)+(activeAnimal?.xp||5);if(saveData.companionXp>=saveData.companionLevel*50){saveData.companionLevel++;saveData.companionXp=0;toast(`🐱 Companion Lv.${saveData.companionLevel}!`,'#f0a500');Sound.sfx.levelUp();}}
    if(player.xp>=player.maxXp){player.xp-=player.maxXp;player.maxXp=Math.floor(player.maxXp*1.4);player.maxHp+=15;player.hp=player.maxHp;toast('🌟 LEVEL UP! Max HP +15!','#f0a500');Sound.sfx.levelUp();}
    if(saveCb)saveCb();activeAnimal=null;updateHud();
  }


  // ═══════════════════════════════════════════
  //  WORLD DRAW
  // ═══════════════════════════════════════════
  function draw(){
    if(!canvas||!ctx)return;
    ctx.save();ctx.globalAlpha=1;
    ctx.clearRect(0,0,W,H);
    if(inInterior){
      drawInterior();
    } else {
      drawSky();drawGround();drawDecos();
      drawHouseStructures();drawAnimals();
      drawPartyMembers();drawCompanion();drawPlayer();
      applyNightTint();drawMinimap();
    }
    ctx.restore();
  }

  function applyNightTint(){
    const br=skyBright();
    if(br<0.99){
      ctx.globalAlpha=(1-br)*0.55;
      ctx.fillStyle=br<0.3?'#020510':isDawnDusk()?'#1a0a00':'#0a0a0a';
      ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=1;
    }
  }

  function drawSky(){
    const b=getBiome(camX+W/2);
    const skyH=Math.round(H*.42);
    const br=skyBright(),night=1-br;
    const skyG=ctx.createLinearGradient(0,0,0,skyH);
    skyG.addColorStop(0,blend(b.skyA,'#010408',night));
    skyG.addColorStop(1,blend(b.skyB,'#050f2a',night));
    ctx.fillStyle=skyG;ctx.fillRect(0,0,W,skyH);
    // Stars at night
    if(night>0.2){
      STARS.forEach(s=>{
        const sx=((s.x*MAP_COLS*TS-camX*.05)%W+W)%W;
        const sy=s.y*skyH*.9;
        ctx.globalAlpha=Math.max(0,night*(0.4+0.5*Math.sin(animT*1.5+s.t)));
        ctx.fillStyle='#fff';
        ctx.beginPath();ctx.arc(sx,sy,s.r,0,Math.PI*2);ctx.fill();
      });
      ctx.globalAlpha=1;
    }
    // Sun/moon position based on dayT
    const cAng=dayT*Math.PI*2-Math.PI/2;
    const cX=W*.5+Math.cos(cAng)*W*.38;
    const cY=skyH*.5-Math.sin(Math.max(0,Math.min(Math.PI,dayT*Math.PI*2)))*skyH*.55;
    if(cY>-40&&cY<skyH){
      if(isNight()){
        ctx.fillStyle=`rgba(220,230,255,${0.7+0.2*Math.sin(animT*.5)})`;
        ctx.beginPath();ctx.arc(cX,cY,20,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(180,195,220,0.35)';
        ctx.beginPath();ctx.arc(cX+5,cY-3,5,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(cX-6,cY+4,3,0,Math.PI*2);ctx.fill();
      } else {
        ctx.fillStyle=`rgba(255,235,60,${0.7*br+0.1})`;
        ctx.beginPath();ctx.arc(cX,cY,24,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=`rgba(255,240,80,0.12)`;
        ctx.beginPath();ctx.arc(cX,cY,42,0,Math.PI*2);ctx.fill();
        if(isDawnDusk()){
          for(let r=0;r<8;r++){
            ctx.fillStyle='rgba(255,140,40,0.07)';
            ctx.beginPath();ctx.moveTo(cX,cY);ctx.arc(cX,cY,80,r/8*Math.PI*2,r/8*Math.PI*2+0.15);ctx.lineTo(cX,cY);ctx.fill();
          }
        }
      }
    }
    // Dawn/dusk glow
    if(isDawnDusk()){
      const dColor=dayT<0.3?'rgba(255,140,40,0.28)':'rgba(255,80,20,0.25)';
      const dg=ctx.createLinearGradient(0,skyH*.6,0,skyH);
      dg.addColorStop(0,dColor);dg.addColorStop(1,'transparent');
      ctx.fillStyle=dg;ctx.fillRect(0,skyH*.6,W,skyH*.4);
    }
    // Clouds
    if(br>0.35&&b.id!=='ocean'&&b.id!=='volcanic'){
      ctx.fillStyle=`rgba(255,255,255,${0.58*br})`;
      [[.10,.3,24],[.32,.18,17],[.55,.32,21],[.74,.16,15]].forEach(([fx,fy,r])=>{
        const cx=fx*W+Math.sin(animT*.15+fx*10)*9,cy=fy*skyH;
        ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.arc(cx+r,cy-r*.4,r*.7,0,Math.PI*2);
        ctx.arc(cx+r*2,cy,r*.85,0,Math.PI*2);ctx.fill();
      });
    }
  }

  function drawGround(){
    const skyH=Math.round(H*.42),br=skyBright();
    const sc=Math.max(0,Math.floor(camX/TS)-1);
    const ec=Math.min(MAP_COLS-1,Math.ceil((camX+W)/TS)+1);
    for(let c=sc;c<=ec;c++){
      const b=BIOMES.find(bi=>c>=bi.startCol&&c<bi.endCol)||BIOMES[0];
      const sx=c*TS-camX;
      ctx.fillStyle=c%2===0?blend(b.gA,'#020202',1-br*.9):blend(b.gB,'#010101',1-br*.9);
      ctx.fillRect(sx,skyH,TS,H-skyH);
      const pathY=8*TS-camY+skyH;
      ctx.fillStyle=c%2===0?blend(b.pA,'#111',1-br*.9):blend(b.pB,'#111',1-br*.9);
      ctx.fillRect(sx,pathY,TS,TS*2.5);
      ctx.fillStyle='rgba(0,0,0,0.07)';ctx.fillRect(sx,skyH,TS,5);
    }
    // Biome borders + labels
    BIOMES.forEach(b=>{
      const bx=b.startCol*TS-camX;
      if(bx>-2&&bx<W+2){
        ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=2;
        ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(bx,Math.round(H*.42));ctx.lineTo(bx,H);ctx.stroke();ctx.setLineDash([]);
        if(bx>4&&bx<W-80){
          const lw=b.name.length*7+10;
          ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(bx+4,Math.round(H*.42)+4,lw,18);
          ctx.fillStyle='rgba(255,255,255,0.8)';ctx.font='bold 11px sans-serif';ctx.textBaseline='middle';
          ctx.fillText(b.name,bx+9,Math.round(H*.42)+13);
        }
      }
    });
    // Time display
    const br2=skyBright();
    ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(W-76,Math.round(H*.42)+4,68,19);
    ctx.fillStyle=isNight()?'#aaccff':isDawnDusk()?'#ffaa44':'#fff8dc';
    ctx.font='bold 11px monospace';ctx.textBaseline='middle';
    const ti=isNight()?'🌙':isDawnDusk()?'🌅':'☀️';
    ctx.fillText(`${ti} ${timeLabel()}`,W-72,Math.round(H*.42)+13);
  }

  function drawDecos(){
    const skyH=Math.round(H*.42),br=skyBright();
    const sc=Math.max(0,Math.floor(camX/TS)-2);
    const ec=Math.min(MAP_COLS-1,Math.ceil((camX+W)/TS)+2);
    for(let c=sc;c<=ec;c++){
      const b=BIOMES.find(bi=>c>=bi.startCol&&c<bi.endCol)||BIOMES[0];
      const sx=c*TS-camX;
      const h1=((c*7919*48271)%1000)/1000,h2=((c*1234*99997)%1000)/1000,h3=((c*3571*12345)%1000)/1000;
      // Trees spread across rows 3-8
      if(h1<0.28){
        const worldTY=(3+Math.floor(h3*5))*TS;
        const screenTY=worldTY-camY+skyH;
        if(screenTY>skyH-10&&screenTY<H+10) drawTree(sx+h2*TS,screenTY,b.id,c);
      }
      // Water shimmer + corals
      if(b.id==='water'||b.id==='ocean'){
        for(let row=0;row<5;row++){
          const wy=skyH+row*TS*.65+Math.sin(animT*2+c*.4)*5;
          ctx.fillStyle=b.id==='ocean'?`rgba(4,12,40,${.28+row*.07})`:`rgba(8,50,130,${.18+row*.07})`;
          ctx.fillRect(sx,wy,TS,TS*.5);
        }
        ctx.fillStyle=`rgba(140,200,255,${(.08+.05*Math.sin(animT*3+c))*br})`;
        ctx.fillRect(sx,skyH+Math.sin(animT*2+c*.3)*3,TS,5);
        if(h1<0.22){
          const cwy=(9+h3*2)*TS-camY+skyH;
          if(cwy>skyH&&cwy<H)drawCoral(sx+h2*TS,cwy,b.id==='ocean');
        }
        if(h1<0.08){
          const bwy=(7+h3*4)*TS-camY+skyH;
          const ba=(0.18+0.12*Math.sin(animT*3+c*.7))*br;
          ctx.fillStyle=`rgba(150,200,255,${ba})`;
          ctx.beginPath();ctx.arc(sx+h2*TS,bwy,3,0,Math.PI*2);ctx.fill();
        }
      }
      // Snow cover
      if(b.id==='snow'){ctx.fillStyle=`rgba(210,235,255,${0.45*br+0.05})`;ctx.fillRect(sx,skyH,TS,(H-skyH)*.5);}
      // Lava cracks + pools
      if(b.id==='volcanic'){
        if(h1<0.3){ctx.fillStyle=`rgba(255,50,0,${0.05+0.04*Math.sin(animT*3+c)})`;ctx.fillRect(sx+h2*TS*.6,skyH+h3*(H-skyH)*.65,TS*.3,3);}
        if(h1<0.08){const lx=sx+h2*TS*.5,ly=(10+h3*2)*TS-camY+skyH;if(ly>skyH&&ly<H){ctx.fillStyle=`rgba(255,80,0,${0.48+0.28*Math.sin(animT*4+c)})`;ctx.beginPath();ctx.ellipse(lx,ly,TS*.4,TS*.14,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=`rgba(255,200,0,${0.28+0.18*Math.sin(animT*5+c+1)})`;ctx.beginPath();ctx.ellipse(lx,ly,TS*.2,TS*.08,0,0,Math.PI*2);ctx.fill();}}
      }
      // Mountain rocks
      if(b.id==='mountain'&&h1<0.3){const rwy=(6+h3*5)*TS-camY+skyH;if(rwy>skyH&&rwy<H){ctx.fillStyle='#7a6a5a';ctx.beginPath();ctx.ellipse(sx+h2*TS,rwy,TS*.3,TS*.17,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8a7a6a';ctx.beginPath();ctx.ellipse(sx+h2*TS-5,rwy-4,TS*.14,TS*.09,0,0,Math.PI*2);ctx.fill();}}
      // Tropical flowers
      if(b.id==='tropical'&&h1<0.18){const fwy=(11+h3*2)*TS-camY+skyH;if(fwy>skyH&&fwy<H){['#ff6b6b','#ffb347','#ffd700','#ff69b4'].forEach((col,i)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(sx+h2*TS+i*4,fwy,3,0,Math.PI*2);ctx.fill();});}}
    }
    // Snow particles
    snowP.forEach(p=>{
      const sx=p.wx-camX,sy=p.wy-camY+Math.round(H*.42);
      if(sx>-5&&sx<W+5&&sy>0&&sy<H){
        ctx.globalAlpha=0.6*skyBright()+0.12;ctx.fillStyle='#ddeeff';
        ctx.beginPath();ctx.arc(sx,sy,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      }
    });
    // Biome fog
    const cb=getBiome(camX+W/2);
    if(cb.fog){ctx.fillStyle=cb.fog;ctx.fillRect(0,0,W,H);}
    ctx.globalAlpha=1;
  }

  function drawCoral(x,y,deep){
    const cols=deep?['#6a2aff','#2a8bff','#ff2a8b']:['#ff6b6b','#ff8c00','#ffb347'];
    ctx.fillStyle=cols[0];ctx.fillRect(x-2,y-22,5,24);ctx.fillRect(x-9,y-16,4,16);ctx.fillRect(x+4,y-20,4,20);
    cols.forEach((col,i)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(x+(i-1)*7,y-22+i*2,4+i,0,Math.PI*2);ctx.fill();});
    if(Math.sin(animT*2+x)>0.6){ctx.font='10px serif';ctx.textBaseline='middle';ctx.fillText('🐠',x+14,y-10+Math.sin(animT*3+x)*5);}
  }

  function drawTree(x,y,bid,seed){
    const sw=Math.sin(animT*.8+x*.02)*2.2,br=skyBright();
    if(bid==='snow'){
      ctx.fillStyle='#5D4037';ctx.fillRect(x-3,y-20,6,22);
      ctx.fillStyle=blend('#388E3C','#1a3a1a',1-br*.8);
      [[22,14],[32,10],[42,7]].forEach(([h,w])=>{ctx.beginPath();ctx.moveTo(x+sw*.3,y-h-10);ctx.lineTo(x-w,y-h);ctx.lineTo(x+w,y-h);ctx.closePath();ctx.fill();});
      ctx.fillStyle=`rgba(200,230,255,${0.5*br+0.08})`;[[22,12],[32,8]].forEach(([h,w])=>{ctx.fillRect(x-w+sw*.2,y-h-2,w*2,5);});
    } else if(bid==='tropical'){
      ctx.fillStyle='#6D4C41';ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+2+sw,y-44);ctx.lineTo(x-1+sw,y-44);ctx.lineTo(x-5,y);ctx.fill();
      ['#2e7d32','#388e3c','#43a047','#1b5e20','#4caf50','#66bb6a'].forEach((c2,i)=>{const a=(i/6)*Math.PI*2+sw*.04;ctx.fillStyle=c2;ctx.save();ctx.translate(x+sw*.5,y-44);ctx.rotate(a);ctx.beginPath();ctx.ellipse(13,0,15,4,0,0,Math.PI*2);ctx.fill();ctx.restore();});
      ctx.fillStyle='#c8a050';ctx.beginPath();ctx.arc(x+sw*.4,y-42,3,0,Math.PI*2);ctx.fill();
    } else if(bid==='mountain'){
      ctx.fillStyle='#4a3a28';ctx.fillRect(x-3,y-20,7,22);
      ctx.fillStyle=blend('#2a5a2a','#101a10',1-br*.8);
      [[22,18],[32,14],[42,10]].forEach(([h,w])=>{ctx.beginPath();ctx.moveTo(x+sw*.2,y-h-8);ctx.lineTo(x-w,y-h);ctx.lineTo(x+w,y-h);ctx.closePath();ctx.fill();});
    } else if(bid==='volcanic'){
      ctx.strokeStyle='#2a0800';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+sw,y-36);ctx.stroke();
      ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x+sw,y-24);ctx.lineTo(x+13+sw,y-14);ctx.stroke();ctx.beginPath();ctx.moveTo(x+sw,y-30);ctx.lineTo(x-11+sw,y-20);ctx.stroke();ctx.lineWidth=1;
    } else if(bid==='water'||bid==='ocean'){
      ctx.strokeStyle=bid==='ocean'?'#2a5a2a':'#3a8a2a';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(x,y);for(let i=1;i<=4;i++)ctx.lineTo(x+Math.sin(animT*2+x+i)*8,y-i*9);ctx.stroke();ctx.lineWidth=1;
    } else {
      ctx.fillStyle='#5D4037';ctx.fillRect(x-4,y-20,8,22);
      ctx.fillStyle=blend('#388E3C','#1a3a1a',1-br*.8);ctx.beginPath();ctx.moveTo(x+sw,y-44);ctx.lineTo(x-17,y-18);ctx.lineTo(x+17,y-18);ctx.closePath();ctx.fill();
      ctx.fillStyle=blend('#43A047','#1a4020',1-br*.8);ctx.beginPath();ctx.moveTo(x+sw,y-54);ctx.lineTo(x-12,y-34);ctx.lineTo(x+12,y-34);ctx.closePath();ctx.fill();
    }
  }


  function drawHouseStructures(){
    const skyH=Math.round(H*.42),br=skyBright();
    houses.forEach(h=>{
      const sx=h.wx-camX,sy=h.wy-camY+skyH;
      if(sx<-140||sx>W+140)return;
      ctx.fillStyle='rgba(0,0,0,0.16)';ctx.beginPath();ctx.ellipse(sx+40,sy+116,44,7,0,0,Math.PI*2);ctx.fill();
      const biome=h.biome;
      if(biome==='ocean')drawCave(sx,sy,br);
      else if(biome==='volcanic')drawVolcLair(sx,sy,br);
      else if(biome==='tropical')drawJTemple(sx,sy,br);
      else if(biome==='mountain')drawMPost(sx,sy,br);
      else if(biome==='snow')drawIgloo(sx,sy,br);
      else if(biome==='water')drawDock(sx,sy,br);
      else if(biome==='savanna')drawSafari(sx,sy,br);
      else drawInn(sx,sy,br);
      // Name label
      const nlw=h.name.length*6+10;
      ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(sx+40-nlw/2,sy-14,nlw,14);
      ctx.fillStyle='#ffe0a0';ctx.font='bold 9px sans-serif';ctx.textBaseline='middle';ctx.fillText(h.name,sx+40-nlw/2+4,sy-7);
      // Proximity hint
      if(Math.abs(player.wx-h.wx-TS)<TS*1.8&&Math.abs(player.wy-h.wy-TS)<TS*1.8){
        ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(sx,sy-30,130,14);
        ctx.fillStyle='#ffee88';ctx.font='9px sans-serif';ctx.textBaseline='middle';ctx.fillText('[SPACE] Enter '+h.name,sx+4,sy-23);
      }
    });
  }

  function drawInn(sx,sy,br){
    const wc=blend('#c8a060','#2a1808',1-br*.9),rc=blend('#a04020','#1a0808',1-br*.9);
    ctx.fillStyle='#8B7355';ctx.fillRect(sx+2,sy+112,76,8);
    ctx.fillStyle=wc;ctx.fillRect(sx,sy+40,80,72);
    ctx.strokeStyle='rgba(0,0,0,0.1)';ctx.lineWidth=0.5;for(let px=sx+10;px<sx+80;px+=10){ctx.beginPath();ctx.moveTo(px,sy+40);ctx.lineTo(px,sy+112);ctx.stroke();}
    ctx.fillStyle=rc;ctx.beginPath();ctx.moveTo(sx-6,sy+40);ctx.lineTo(sx+40,sy);ctx.lineTo(sx+86,sy+40);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.12)';for(let r=0;r<4;r++)for(let t=0;t<8-r;t++)ctx.fillRect(sx+t*(80/8-r*1.5)+r*2,sy+r*(40/4),80/8,40/4);
    ctx.fillStyle='#8B7355';ctx.fillRect(sx+60,sy-12,14,18);ctx.fillStyle='#666';ctx.fillRect(sx+58,sy-14,18,4);
    for(let sm=0;sm<3;sm++){ctx.globalAlpha=br*(0.28-sm*.07);ctx.fillStyle='#aaa';ctx.beginPath();ctx.arc(sx+67+Math.sin(animT+sm)*3,sy-18-sm*10,4+sm*2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    ctx.fillStyle=blend('#2a1008','#111',1-br*.8);ctx.fillRect(sx+32,sy+90,16,22);ctx.strokeStyle='#8B4513';ctx.lineWidth=1.5;ctx.strokeRect(sx+32,sy+90,16,22);
    ctx.fillStyle='#f0a500';ctx.beginPath();ctx.arc(sx+44,sy+102,2.5,0,Math.PI*2);ctx.fill();
    const glw=0.18+0.1*Math.sin(animT*3+sx);
    [sx+6,sx+58].forEach(wx2=>{ctx.fillStyle=blend('#a8d4ff','#2a4a60',1-br*.8);ctx.fillRect(wx2,sy+50,16,14);ctx.fillStyle='#6090a8';ctx.fillRect(wx2+8,sy+50,1.5,14);ctx.fillRect(wx2,sy+57,16,1.5);ctx.fillStyle=`rgba(255,200,60,${glw})`;ctx.fillRect(wx2,sy+50,16,14);});
    ctx.fillStyle='#8B4513';ctx.fillRect(sx+24,sy+38,32,12);ctx.fillStyle='#ffe0a0';ctx.font='6px sans-serif';ctx.textBaseline='middle';ctx.fillText('INN & TAVERN',sx+26,sy+44);
    ctx.font='16px serif';ctx.textBaseline='middle';ctx.fillText('🏠',sx+32,sy+18);
  }

  function drawCave(sx,sy,br){
    ctx.fillStyle=blend('#3a4050','#1a1a28',1-br*.7);
    ctx.beginPath();ctx.moveTo(sx,sy+96);ctx.arc(sx+32,sy+48,48,Math.PI*.9,Math.PI*.1,false);ctx.lineTo(sx+80,sy+96);ctx.closePath();ctx.fill();
    ctx.fillStyle=blend('#020818','#050d28',1-br*.5);ctx.beginPath();ctx.ellipse(sx+32,sy+58,26,32,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(0,180,255,${0.18+0.1*Math.sin(animT*2+sx)})`;ctx.beginPath();ctx.ellipse(sx+32,sy+58,22,28,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5a6070';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(sx+i*16,sy+94,5+Math.sin(i)*2,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#ff6b6b';ctx.fillRect(sx-4,sy+32,5,32);ctx.fillRect(sx+76,sy+28,5,36);
    for(let bb=0;bb<4;bb++){ctx.globalAlpha=0.25+0.18*Math.sin(animT*3+bb*1.5);ctx.fillStyle='rgba(150,220,255,0.5)';const bx=sx+16+bb*10,by=sy+58-((animT*30+bb*20)%55);ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    ctx.font='16px serif';ctx.textBaseline='middle';ctx.fillText('🌊',sx+24,sy+14);
  }

  function drawVolcLair(sx,sy,br){
    ctx.fillStyle=blend('#5a1a00','#1a0500',1-br*.5);ctx.fillRect(sx,sy+48,80,48);
    ctx.fillStyle=`rgba(255,60,0,${0.45+0.18*Math.sin(animT*2+sx)})`;ctx.fillRect(sx-5,sy+90,90,12);
    ctx.fillStyle=blend('#3a2010','#0a0400',1-br*.7);ctx.beginPath();ctx.moveTo(sx-4,sy+96);ctx.arc(sx+32,sy+58,38,Math.PI,0);ctx.lineTo(sx+68,sy+96);ctx.closePath();ctx.fill();
    ctx.fillStyle='#0a0000';ctx.beginPath();ctx.ellipse(sx+32,sy+64,21,27,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(255,80,0,${0.18+0.14*Math.sin(animT*3)})`;ctx.beginPath();ctx.ellipse(sx+32,sy+64,16,22,0,0,Math.PI*2);ctx.fill();
    ctx.font='14px serif';ctx.textBaseline='middle';ctx.fillText('💀',sx+25,sy+16);ctx.fillText('🌋',sx+24,sy+32);
    for(let sm=0;sm<3;sm++){ctx.globalAlpha=0.22-sm*.06;ctx.fillStyle='#660000';ctx.beginPath();ctx.arc(sx+32+Math.sin(animT+sm)*6,sy-sm*12,8+sm*4,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  }

  function drawJTemple(sx,sy,br){
    const st=blend('#8a6a2a','#2a1a08',1-br*.8);
    ctx.fillStyle=blend('#5a4a1a','#1a0a00',1-br*.8);ctx.fillRect(sx-6,sy+80,92,16);ctx.fillStyle=st;ctx.fillRect(sx,sy+48,80,32);ctx.fillRect(sx+6,sy+19,68,29);
    ctx.fillStyle=blend('#6a4a1a','#1a0a00',1-br*.8);ctx.beginPath();ctx.moveTo(sx+32,sy+8);ctx.lineTo(sx+6,sy+19);ctx.lineTo(sx+74,sy+19);ctx.closePath();ctx.fill();
    ctx.fillStyle='#1a0800';ctx.fillRect(sx+22,sy+64,20,32);
    ctx.strokeStyle='rgba(0,0,0,0.18)';ctx.lineWidth=0.8;for(let row=sy+19;row<sy+96;row+=10){ctx.beginPath();ctx.moveTo(sx-6,row);ctx.lineTo(sx+86,row);ctx.stroke();}
    const tg=`rgba(255,160,0,${0.38+0.18*Math.sin(animT*3)})`;
    ctx.fillStyle=tg;ctx.beginPath();ctx.arc(sx+14,sy+38,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(sx+60,sy+38,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=`rgba(0,100,0,${0.45*br+0.18})`;ctx.lineWidth=1.5;for(let vn=0;vn<4;vn++){ctx.beginPath();ctx.moveTo(sx+vn*8,sy+19);for(let vs=1;vs<=5;vs++)ctx.lineTo(sx+vn*8+Math.sin(vs*1.2)*6,sy+19+vs*18);ctx.stroke();}
    ctx.font='16px serif';ctx.textBaseline='middle';ctx.fillText('🛕',sx+24,sy+3);
  }

  function drawMPost(sx,sy,br){
    const wd=blend('#7a5a3a','#1a1008',1-br*.85);
    ctx.fillStyle='#5D4037';for(let log=0;log<8;log++){ctx.fillStyle=log%2?'#5D4037':'#6D5040';ctx.fillRect(sx,sy+32+log*8,74,9);}
    ctx.fillStyle=wd;ctx.fillRect(sx,sy+32,74,66);
    ctx.fillStyle=blend('#4a3a2a','#1a1008',1-br*.8);ctx.beginPath();ctx.moveTo(sx-8,sy+32);ctx.lineTo(sx+37,sy+4);ctx.lineTo(sx+82,sy+32);ctx.closePath();ctx.fill();
    ctx.fillStyle=`rgba(220,240,255,${0.65*br+0.08})`;ctx.beginPath();ctx.moveTo(sx-6,sy+32);ctx.lineTo(sx+37,sy+8);ctx.lineTo(sx+80,sy+32);ctx.closePath();ctx.fill();
    ctx.fillStyle='#3a2010';ctx.fillRect(sx+27,sy+68,20,30);
    const glw2=0.18+0.09*Math.sin(animT*3);ctx.fillStyle=`rgba(255,180,80,${glw2})`;ctx.fillRect(sx+8,sy+42,16,14);
    ctx.fillStyle='#5D4037';ctx.fillRect(sx+48,sy-6,12,38);for(let sm=0;sm<2;sm++){ctx.globalAlpha=0.18-sm*.06;ctx.fillStyle='#aaa';ctx.beginPath();ctx.arc(sx+54+Math.sin(animT+sm)*3,sy-8-sm*10,5+sm*3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    ctx.font='16px serif';ctx.textBaseline='middle';ctx.fillText('🏕️',sx+24,sy+12);
  }

  function drawIgloo(sx,sy,br){
    const ic=blend('#d8f0ff','#4a6a88',1-br*.7);
    ctx.fillStyle=ic;ctx.beginPath();ctx.arc(sx+37,sy+80,37,Math.PI,0);ctx.fill();
    ctx.strokeStyle=`rgba(150,200,240,${0.38*br+0.08})`;ctx.lineWidth=0.8;for(let row=0;row<4;row++)for(let bl=0;bl<5;bl++)ctx.strokeRect(sx+bl*18-row*4,sy+80-row*16,16,14);
    ctx.fillStyle=blend('#a0c8e0','#1a3a5a',1-br*.7);ctx.fillRect(sx+25,sy+71,24,10);
    ctx.fillStyle='#050f28';ctx.beginPath();ctx.ellipse(sx+37,sy+78,9,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(220,240,255,${0.75*br+0.08})`;ctx.beginPath();ctx.arc(sx-5,sy+80,15,0,Math.PI);ctx.fill();ctx.beginPath();ctx.arc(sx+74,sy+80,12,0,Math.PI);ctx.fill();
    ctx.fillStyle=`rgba(200,240,255,${0.1+0.05*Math.sin(animT*2)})`;ctx.beginPath();ctx.arc(sx+37,sy+64,29,Math.PI,0);ctx.fill();
    ctx.font='16px serif';ctx.textBaseline='middle';ctx.fillText('🏔️',sx+24,sy+24);
  }

  function drawDock(sx,sy,br){
    const wd=blend('#6a8aaa','#0a1a2a',1-br*.85);
    for(let leg=0;leg<4;leg++){ctx.fillStyle='#4a5a6a';ctx.fillRect(sx+leg*22,sy+80,6,48);}
    ctx.fillStyle=wd;ctx.fillRect(sx-4,sy+64,88,20);
    ctx.strokeStyle='rgba(0,0,0,0.18)';ctx.lineWidth=0.5;for(let pl=sx;pl<sx+84;pl+=12){ctx.beginPath();ctx.moveTo(pl,sy+64);ctx.lineTo(pl,sy+84);ctx.stroke();}
    ctx.fillStyle=wd;ctx.fillRect(sx+8,sy+26,64,40);
    ctx.fillStyle=blend('#3a5a7a','#0a1a2a',1-br*.8);ctx.beginPath();ctx.moveTo(sx+4,sy+26);ctx.lineTo(sx+40,sy+4);ctx.lineTo(sx+78,sy+26);ctx.closePath();ctx.fill();
    const wg=`rgba(100,200,255,${0.18+0.1*Math.sin(animT*2)})`;ctx.fillStyle=wg;ctx.fillRect(sx+12,sy+32,16,12);ctx.fillRect(sx+50,sy+32,14,12);
    ctx.strokeStyle='#666';ctx.lineWidth=2;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(sx+40,sy+80);ctx.lineTo(sx+40,sy+112);ctx.stroke();ctx.setLineDash([]);
    ctx.font='16px serif';ctx.textBaseline='middle';ctx.fillText('⚓',sx+24,sy+10);
  }

  function drawSafari(sx,sy,br){
    const cv=blend('#c8a050','#2a1a00',1-br*.85);
    ctx.strokeStyle=blend('#8B4513','#2a1000',1-br*.8);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx+38,sy+6);ctx.lineTo(sx+38,sy+90);ctx.stroke();
    ctx.fillStyle=cv;ctx.beginPath();ctx.moveTo(sx-5,sy+90);ctx.lineTo(sx+20,sy+13);ctx.lineTo(sx+56,sy+13);ctx.lineTo(sx+85,sy+90);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.1)';ctx.beginPath();ctx.moveTo(sx+20,sy+13);ctx.lineTo(sx+8,sy+90);ctx.lineTo(sx+22,sy+90);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.45)';ctx.beginPath();ctx.moveTo(sx+26,sy+90);ctx.lineTo(sx+38,sy+38);ctx.lineTo(sx+50,sy+90);ctx.closePath();ctx.fill();
    ctx.fillStyle=`rgba(255,80,0,${0.55+0.28*Math.sin(animT*4+sx)})`;ctx.beginPath();ctx.arc(sx+38,sy+105,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(255,200,0,${0.38+0.18*Math.sin(animT*5)})`;ctx.beginPath();ctx.arc(sx+38,sy+103,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=blend('#6a4a10','#1a1000',1-br*.8);ctx.fillRect(sx+56,sy+76,28,14);
    ctx.fillStyle='#333';ctx.beginPath();ctx.arc(sx+62,sy+90,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(sx+78,sy+90,5,0,Math.PI*2);ctx.fill();
    ctx.font='16px serif';ctx.textBaseline='middle';ctx.fillText('⛺',sx+24,sy+0);
  }


  function drawAnimals(){
    const skyH=Math.round(H*.42),br=skyBright();
    animals.forEach(a=>{
      if(!a.alive)return;
      const sx=a.wx-camX,sy=a.wy-camY+skyH;
      if(sx<-80||sx>W+80||sy<skyH-20||sy>H+20)return;
      const bob=Math.sin(animT*1.8+a.bob)*2.5;
      ctx.fillStyle=`rgba(0,0,0,${0.13*br+0.04})`;ctx.beginPath();ctx.ellipse(sx+16,sy+30,16,4,0,0,Math.PI*2);ctx.fill();
      const sz=a.r==='legendary'?38:a.r==='rare'?34:30;
      ctx.save();
      if(a.facing<0){ctx.scale(-1,1);ctx.translate(-sx*2-sz,0);}
      const bs=1+Math.sin(animT*1.6+a.bob)*.025;
      ctx.save();ctx.translate(sx+sz/2,sy+sz/2+bob);ctx.scale(bs,bs);
      ctx.font=`${sz}px serif`;ctx.textBaseline='middle';ctx.textAlign='center';
      ctx.fillText(a.emoji||a.e,0,0);ctx.restore();ctx.restore();
      // Rarity aura
      if(a.r==='legendary'&&br>0.1){ctx.strokeStyle=`rgba(255,238,0,${0.22+0.1*Math.sin(animT*3+a.bob)})`;ctx.lineWidth=2;ctx.strokeRect(sx-2,sy-4,sz+4,sz+6);ctx.lineWidth=1;}
      else if(a.r==='rare'&&br>0.1){ctx.strokeStyle=`rgba(255,140,0,${0.16+0.08*Math.sin(animT*2+a.bob)})`;ctx.lineWidth=1.5;ctx.strokeRect(sx,sy-2,sz,sz+3);ctx.lineWidth=1;}
      // Night glow
      if(isNight()){ctx.fillStyle=`rgba(255,255,180,${0.07+0.04*Math.sin(animT*2+a.bob)})`;ctx.beginPath();ctx.arc(sx+sz/2,sy+sz/2,sz*.7,0,Math.PI*2);ctx.fill();}
      // HP bar
      const bw=36;ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(sx,sy-14,bw,5);
      const hp=a.hp/a.maxHp;ctx.fillStyle=hp>.6?'#2ecc71':hp>.3?'#f39c12':'#e74c3c';ctx.fillRect(sx,sy-14,bw*hp,5);
      // Name tag near player
      if(Math.hypot(player.wx-a.wx,player.wy-a.wy)<TS*4){
        const nm=a.n||a.name,rc={common:'#ccc',uncommon:'#88aaff',rare:'#ffaa44',legendary:'#ffee00'}[a.r||a.rarity]||'#ccc';
        const nlw=nm.length*5+10;ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(sx,sy-26,nlw,11);
        ctx.fillStyle=rc;ctx.font='8px monospace';ctx.textBaseline='middle';ctx.fillText(nm,sx+4,sy-21);
      }
      ctx.globalAlpha=1;ctx.textAlign='left';
    });
  }

  function drawPartyMembers(){
    const skyH=Math.round(H*.42);
    party.forEach((pm,i)=>{
      const offset=(i+1)*30;
      const px2=companion.wx-offset-camX,py2=companion.wy-camY+skyH;
      if(px2<-50||px2>W+50)return;
      const bob2=Math.sin(animT*2.2+i*1.5)*2.5;
      ctx.fillStyle='rgba(0,0,0,0.1)';ctx.beginPath();ctx.ellipse(px2+14,py2+28,12,3.5,0,0,Math.PI*2);ctx.fill();
      ctx.font='24px serif';ctx.textBaseline='bottom';ctx.fillText(pm.emoji||pm.e,px2,py2+26+bob2);
      ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(px2,py2-8,26,4);
      ctx.fillStyle='#2ecc71';ctx.fillRect(px2,py2-8,26*(pm.partyHp/pm.partyMaxHp),4);
      ctx.textAlign='left';
    });
  }

  function drawCompanion(){
    const skyH=Math.round(H*.42);
    const cx=companion.wx-camX,cy=companion.wy-camY+skyH;
    if(cx<-50||cx>W+50)return;
    const lv=saveData?.companionLevel||1;
    const scale=lv>=30?1.8:lv>=10?1.35:1;
    Lobby.drawCatSprite(ctx,cx,cy,scale,animT);
  }

  function drawPlayer(){
    const skyH=Math.round(H*.42);
    const px2=player.wx-camX,py2=player.wy-camY+skyH;
    const br=Math.sin(animT*1.4)*.7,walk=player.moving?Math.sin(player.stepF*2):0;
    ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(px2+12,py2+32,12,4,0,0,Math.PI*2);ctx.fill();
    ctx.save();if(player.facing==='left'){ctx.scale(-1,1);ctx.translate(-px2*2-24,0);}
    ctx.fillStyle='#2a3a8a';ctx.fillRect(px2+6,py2+20+walk*3,5,10);ctx.fillRect(px2+13,py2+20-walk*3,5,10);
    ctx.fillStyle='#5a3010';ctx.fillRect(px2+5,py2+29+walk*3,6,3);ctx.fillRect(px2+12,py2+29-walk*3,6,3);
    ctx.fillStyle='#4a80e0';ctx.fillRect(px2+5,py2+12+br,14,10);
    ctx.fillStyle='#8B4513';ctx.fillRect(px2+4,py2+21+br,16,2);
    ctx.fillStyle='#F4C18A';ctx.fillRect(px2+2,py2+13+br+walk*2.5,4,9);ctx.fillRect(px2+19,py2+13+br-walk*2.5,4,9);
    ctx.fillRect(px2+6,py2,12,13);
    ctx.fillStyle='#5a3010';ctx.fillRect(px2+5,py2-3,14,5);
    const blH=Math.sin(animT*.7)>.95?.1:1;
    ctx.fillStyle='#000';ctx.fillRect(px2+7.5,py2+4,2.5,2.5*blH);ctx.fillRect(px2+13,py2+4,2.5,2.5*blH);
    ctx.fillRect(px2+9,py2+9,1.5,1);ctx.fillRect(px2+12,py2+9,1.5,1);
    ctx.restore();
    const nm=currentUser?currentUser.name.split(' ')[0]:'Hero';
    const nlw=nm.length*6+12;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(px2+12-nlw/2,py2-18,nlw,14);
    ctx.fillStyle='#00d4ff';ctx.font='bold 9px sans-serif';ctx.textBaseline='middle';
    ctx.fillText(nm,px2+12-nlw/2+5,py2-11);
    ctx.fillStyle='#1a0a0a';ctx.fillRect(px2+2,py2-24,22,4);
    ctx.fillStyle='#e74c3c';ctx.fillRect(px2+2,py2-24,22*(player.hp/player.maxHp),4);
    ctx.globalAlpha=1;
  }

  function drawMinimap(){
    const MM=document.getElementById('minimap');if(!MM)return;
    const mW=200,mH=62,br=skyBright();
    MM.width=mW;MM.height=mH;
    const mc=MM.getContext('2d');
    mc.fillStyle='rgba(0,0,0,0.82)';mc.fillRect(0,0,mW,mH);
    BIOMES.forEach(b=>{
      const bx=(b.startCol/MAP_COLS)*mW,bw=((b.endCol-b.startCol)/MAP_COLS)*mW;
      mc.fillStyle=blend(b.gA,'#0a0a0a',1-br*.85);mc.fillRect(bx,0,bw,mH);
      mc.fillStyle='rgba(0,0,0,0.42)';mc.fillRect(bx,0,bw,10);
      mc.fillStyle='rgba(255,255,255,0.62)';mc.font='6px sans-serif';mc.textBaseline='middle';
      if(bw>20)mc.fillText(b.name.substring(0,4),bx+2,5);
    });
    houses.forEach(h=>{const hx=(h.wx/(MAP_COLS*TS))*mW;mc.fillStyle='#f0a500';mc.fillRect(hx-2,mH/2-3,5,6);});
    animals.forEach(a=>{
      if(!a.alive)return;
      const ax=(a.wx/(MAP_COLS*TS))*mW,ay=10+(a.wy/(MAP_ROWS*TS))*(mH-20);
      mc.fillStyle={common:'#aaa',uncommon:'#88f',rare:'#fa4',legendary:'#ff0'}[a.r||a.rarity]||'#aaa';
      mc.fillRect(ax-1,ay-1,2.5,2.5);
    });
    const pdx=(player.wx/(MAP_COLS*TS))*mW,pdy=10+(player.wy/(MAP_ROWS*TS))*(mH-20);
    mc.fillStyle='#00d4ff';mc.beginPath();mc.arc(pdx,pdy,3.5,0,Math.PI*2);mc.fill();
    mc.strokeStyle='#fff';mc.lineWidth=1;mc.beginPath();mc.arc(pdx,pdy,3.5,0,Math.PI*2);mc.stroke();
    mc.strokeStyle='rgba(255,255,255,0.42)';mc.lineWidth=1;
    const vx=(camX/(MAP_COLS*TS))*mW,vy=10+(camY/(MAP_ROWS*TS))*(mH-20);
    mc.strokeRect(vx,vy,(W/(MAP_COLS*TS))*mW,(H/(MAP_ROWS*TS))*(mH-20));
    mc.strokeStyle='#2a3a4a';mc.lineWidth=2;mc.strokeRect(0,0,mW,mH);
    mc.fillStyle='rgba(0,0,0,0.55)';mc.fillRect(0,mH-12,mW,12);
    mc.font='7px monospace';mc.textBaseline='middle';
    mc.fillStyle=isNight()?'#aaccff':'#fff8dc';
    mc.fillText(`${timeLabel()} — ${getBiome(player.wx).name}`,4,mH-6);
    [{c:'#aaa',l:'Com'},{c:'#88f',l:'Unc'},{c:'#fa4',l:'Rare'},{c:'#ff0',l:'Leg'},{c:'#f0a500',l:'Bldg'},{c:'#0df',l:'You'}].forEach((it,i)=>{
      mc.fillStyle=it.c;mc.fillRect(i*33+2,mH-21,5,5);
      mc.fillStyle='rgba(255,255,255,0.6)';mc.fillText(it.l,i*33+9,mH-19);
    });
  }

  // Panels
  function togglePanel(id){
    const p=document.getElementById(id);if(!p)return;
    const was=p.classList.contains('hidden');
    document.querySelectorAll('.side-panel').forEach(el=>el.classList.add('hidden'));
    if(was){p.classList.remove('hidden');refreshPanel(id);}
  }
  function refreshPanel(id){if(id==='inventory-panel')refreshInventory();if(id==='party-panel')refreshParty();}

  function refreshInventory(){
    const counts={};
    (saveData.caughtAnimals||[]).forEach(a=>{if(!counts[a.name])counts[a.name]={count:0,emoji:a.emoji,r:a.rarity||a.r||'common'};counts[a.name].count++;});
    document.getElementById('inv-caught-list').innerHTML=Object.keys(counts).length===0?'<p style="font-size:12px;color:#555;padding:8px 0">No animals yet.</p>':Object.entries(counts).map(([nm,d])=>`<div class="inv-caught-entry"><span class="inv-emoji">${d.emoji}</span><span class="inv-name">${nm}</span><span class="inv-rarity ${d.r}">${d.r}</span><span class="inv-count">×${d.count}</span></div>`).join('');
    document.getElementById('inv-items-list').innerHTML=(saveData.items||[]).filter(i=>i.qty>0).map(it=>`<div class="inv-item-row"><span>${it.emoji} ${it.name}</span><span style="color:#aaa;font-size:11px">${it.desc}</span><span class="inv-count">×${it.qty}</span></div>`).join('')||'<p style="font-size:12px;color:#555">No items.</p>';
    document.getElementById('inv-fights').textContent=fightWins;
    document.getElementById('inv-catches').textContent=catchCount;
    document.getElementById('inv-total-score').textContent=score;
    document.getElementById('inv-coins').textContent=coins;
  }

  function refreshParty(){
    const slots=document.getElementById('party-slots');
    slots.innerHTML='<p style="font-size:11px;color:#6b7a8d;margin-bottom:6px">Active party (max 3):</p>'+(party.length===0?'<p style="font-size:12px;color:#555">No party members.</p>':party.map((p2,i)=>`<div class="party-slot"><span>${p2.emoji||p2.e}</span><span class="party-name">${p2.name||p2.n}</span><span class="party-hp">${Math.ceil(p2.partyHp)}/${p2.partyMaxHp}</span><button class="party-remove" data-i="${i}">✕</button></div>`).join(''));
    slots.querySelectorAll('.party-remove').forEach(btn=>btn.addEventListener('click',()=>{party.splice(parseInt(btn.dataset.i),1);syncPartyToSave();refreshParty();}));
    const avail=document.getElementById('party-available');
    const all=(saveData.caughtAnimals||[]);
    const uniq=[...new Map(all.map(a=>[a.name,a])).values()];
    avail.innerHTML=uniq.map(a=>`<div class="party-avail-row"><span>${a.emoji||a.e} ${a.name||a.n}</span><button class="party-add" data-n="${a.name||a.n}">+ Add</button></div>`).join('')||'<p style="font-size:12px;color:#555">Catch animals first!</p>';
    avail.querySelectorAll('.party-add').forEach(btn=>btn.addEventListener('click',()=>{if(party.length>=3){toast('Party full!','#e74c3c');return;}const nm=btn.dataset.n;if(party.find(p2=>(p2.name||p2.n)===nm)){toast('Already in party!','#f39c12');return;}const def=all.find(a=>(a.name||a.n)===nm);if(def){party.push({...def,partyHp:def.hp||50,partyMaxHp:def.hp||50});syncPartyToSave();refreshParty();Sound.sfx.click();}}));
  }
  function syncPartyToSave(){if(saveData)saveData.party=party.map(p2=>p2.name||p2.n);}

  function initPanelTabs(){
    document.querySelectorAll('.ptab').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const tab=btn.dataset.tab;
        btn.closest('.side-panel').querySelectorAll('.ptab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
        btn.closest('.side-panel').querySelectorAll('.ptab-content').forEach(c=>c.classList.add('hidden'));
        document.getElementById('tab-'+tab).classList.remove('hidden');
      });
    });
  }

  function showScreen(id){document.querySelectorAll('.screen').forEach(s=>{s.classList.add('hidden');s.classList.remove('active');});document.getElementById(id).classList.remove('hidden');document.getElementById(id).classList.add('active');}

  function loop(){if(!running)return;update();draw();raf=requestAnimationFrame(loop);}

  function start(user,sd,saveCallback){
    currentUser=user;saveData=sd;saveCb=saveCallback;
    running=false;if(raf){cancelAnimationFrame(raf);raf=null;}
    if(battleRAFId){cancelAnimationFrame(battleRAFId);battleRAFId=null;}
    showScreen('screen-game');
    canvas=document.getElementById('game-canvas');
    ctx=canvas.getContext('2d');
    function sizeCanvas(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight-52;sizeBattleCanvas();}
    window.removeEventListener('resize',sizeCanvas);window.addEventListener('resize',sizeCanvas);sizeCanvas();
    resetPlayer(sd);
    score=sd.score||0;coins=sd.coins||0;fightWins=sd.wins||0;catchCount=sd.catches||0;
    animT=0;dayT=0.25;encounterCooldown=0;inBattle=false;activeAnimal=null;
    inInterior=false;currentHouse=null;stepSoundTimer=0;
    buildWorld(sd);
    document.getElementById('hud-player-name').textContent=user.name;
    updateHud();initPanelTabs();
    function wire(id,fn){const o=document.getElementById(id);if(!o)return;const n=o.cloneNode(true);o.parentNode.replaceChild(n,o);document.getElementById(id).addEventListener('click',fn);}
    wire('bact-fight',battleFight);wire('bact-item',battleItem);wire('bact-catch',battleCatch);wire('bact-flee',battleFlee);
    wire('battle-items-back',()=>{document.getElementById('battle-items-menu').classList.add('hidden');document.getElementById('battle-actions').classList.remove('hidden');});
    wire('btn-toggle-inv',()=>togglePanel('inventory-panel'));wire('btn-toggle-party',()=>togglePanel('party-panel'));
    wire('btn-close-inv',()=>document.getElementById('inventory-panel').classList.add('hidden'));
    wire('btn-close-party',()=>document.getElementById('party-panel').classList.add('hidden'));
    wire('btn-quit-game',()=>{running=false;cancelAnimationFrame(raf);stopBattle();document.querySelectorAll('.side-panel').forEach(p=>p.classList.add('hidden'));document.getElementById('battle-screen').classList.add('hidden');Sound.stopMusic();if(saveCb)saveCb();Lobby.show(user);});
    Sound.playBgMusic(getBiome(player.wx).id);running=true;loop();
  }

  return { start };
})();
