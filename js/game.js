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

  function hexToRgb(h){
    try{
      // Expand 3-digit hex to 6-digit: #abc -> #aabbcc
      if(h.length===4) h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
      return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
    }catch(e){return[128,128,128];}
  }
  function blend(a,b,t){
    try{
      t=Math.max(0,Math.min(1,t||0));
      const[r1,g1,b1]=hexToRgb(a),[r2,g2,b2]=hexToRgb(b);
      const r=Math.round(r1+(r2-r1)*t),g=Math.round(g1+(g2-g1)*t),bv=Math.round(b1+(b2-b1)*t);
      if(isNaN(r)||isNaN(g)||isNaN(bv)) return a;
      return`rgb(${r},${g},${bv})`;
    }catch(e){return a;}
  }


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
    if(night>0.2){STARS.forEach(s=>{const alpha=night*(0.4+0.5*Math.sin(battleT*1.5+s.t));c.globalAlpha=Math.max(0,alpha);c.fillStyle='#fff';c.beginPath();c.arc(s.x*BW,s.y*BH*.55,s.r,0,Math.PI*2);c.fill();});c.globalAlpha=1;}
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
    for(let gx=20;gx<BW;gx+=28){c.fillStyle='rgba(0,0,0,0.08)';c.fillRect(gx,gY+4,3,4);c.fillRect(gx+5,gY+2,2,6);}
    for(let i=0;i<6;i++){const tx=BW*(0.05+i*.18),ty=gY;drawBtree(c,tx,ty,b.id,i,battleT);}

    // Platform shadows
    c.fillStyle='rgba(0,0,0,0.22)';c.beginPath();c.ellipse(BW*.65+35,gY-8,55,12,0,0,Math.PI*2);c.fill();
    c.fillStyle='rgba(0,0,0,0.18)';c.beginPath();c.ellipse(BW*.18+30,gY-4,45,10,0,0,Math.PI*2);c.fill();

    // Enemy (right side)
    const ex=BW*.63+eAnim.x, ey=gY-95+eAnim.y;
    drawBEnemy(c,ex,ey,activeAnimal,battleT,eAnim);

    // ── LEFT SIDE: companion is the fighter ──
    const lv=saveData?.companionLevel||1;
    const catScale=lv>=30?1.8:lv>=10?1.35:1.0;
    const catSz=Math.round(70*catScale);
    // Companion position — lunge toward enemy during attack
    const catX=BW*.14+pAnim.x+(pAnim.atkT>0?(1-pAnim.atkT/18)*BW*.18:0);
    const catY=gY-catSz-pAnim.y;

    // Companion cat shadow
    c.fillStyle='rgba(0,0,0,0.2)';
    c.beginPath();c.ellipse(catX+catSz*.45,catY+catSz+6,catSz*.4,7,0,0,Math.PI*2);c.fill();

    // Draw companion cat sprite using Lobby.drawCatSprite
    if(typeof Lobby!=='undefined'&&Lobby.drawCatSprite){
      Lobby.drawCatSprite(c,catX,catY,catScale*(catSz/24),battleT);
    } else {
      // Fallback: draw simple cat shape
      c.fillStyle='#FF8C00';
      c.beginPath();c.ellipse(catX+catSz*.4,catY+catSz*.5,catSz*.25,catSz*.2,0,0,Math.PI*2);c.fill();
      c.beginPath();c.arc(catX+catSz*.65,catY+catSz*.3,catSz*.18,0,Math.PI*2);c.fill();
    }

    // Companion name + HP bar
    const compName=lv>=30?'Leo':lv>=10?'Stripetail':'Kitten';
    const cnW=compName.length*6+12;
    c.fillStyle='rgba(0,0,0,0.7)';c.fillRect(catX+catSz*.2-cnW/2,catY-20,cnW,14);
    c.fillStyle='#FF8C00';c.font='bold 8px sans-serif';c.textBaseline='middle';
    c.fillText(compName,catX+catSz*.2-cnW/2+4,catY-13);
    c.fillStyle='#1a0a00';c.fillRect(catX,catY-28,catSz*.8,5);
    const catHpPct=Math.max(0,(saveData?.companionXp||0)/(saveData?.companionLevel||1)/50);
    c.fillStyle='#FF8C00';c.fillRect(catX,catY-28,catSz*.8*Math.min(1,0.5+catHpPct*.5),5);

    // Player stands back (smaller, behind companion)
    const backPX=BW*.04,backPY=gY-50;
    drawBPlayerSmall(c,backPX,backPY,battleT);

    // Additional party animals behind companion
    party.slice(0,2).forEach((pm,i)=>{
      const pmx=catX-50*(i+1),pmy=catY+catSz*.3+15*(i+1);
      const pbs=0.7+i*.1;
      const pb=Math.sin(battleT*2+i*1.5)*2;
      // Draw canvas party sprite
      try{drawAnimalSprite(c,pm.name||pm.n,pmx,pmy+pb,32*pbs,battleT+(pm.bob||0),1);}catch(e){}
      c.fillStyle='rgba(0,0,0,0.5)';c.fillRect(pmx,pmy-8,26,4);
      c.fillStyle='#2ecc71';c.fillRect(pmx,pmy-8,26*(pm.partyHp/pm.partyMaxHp),4);
    });

    // Attack effects — from companion to enemy
    drawBattleEffects(c,catX+catSz*.5,catY+catSz*.4,ex,ey,BW,BH);

    // HP Cards
    drawBCard(c,BW*.54,14,210,52,activeAnimal,true);
    // Left card shows companion
    drawBCompanionCard(c,14,BH-72,200,52);

    if(flashAlpha>0){c.globalAlpha=flashAlpha;c.fillStyle=flashCol;c.fillRect(0,0,BW,BH);}
    c.globalAlpha=1;c.lineWidth=1;c.restore();
  }

  // Small player silhouette standing behind in battle
  function drawBPlayerSmall(c,x,y,t){
    const s=0.7;
    const br2=Math.sin(t*1.4)*.5;
    c.globalAlpha=0.7;
    c.fillStyle='rgba(0,0,0,0.15)';c.beginPath();c.ellipse(x+10*s,y+34*s,8*s,3*s,0,0,Math.PI*2);c.fill();
    c.fillStyle='#2a3a8a';c.fillRect(x+5*s,y+20*s,4*s,10*s);c.fillRect(x+11*s,y+20*s,4*s,10*s);
    c.fillStyle='#5a3010';c.fillRect(x+4*s,y+29*s,5*s,3*s);c.fillRect(x+11*s,y+29*s,5*s,3*s);
    c.fillStyle='#4a80e0';c.fillRect(x+4*s,y+11*s+br2,13*s,10*s);
    c.fillStyle='#F4C18A';c.fillRect(x+2*s,y+12*s+br2,3*s,8*s);c.fillRect(x+16*s,y+12*s+br2,3*s,8*s);
    c.fillRect(x+5*s,y,10*s,12*s);
    c.fillStyle='#5a3010';c.fillRect(x+4*s,y-2*s,12*s,4*s);
    c.fillStyle='#000';c.fillRect(x+7*s,y+3*s,2*s,2*s);c.fillRect(x+11*s,y+3*s,2*s,2*s);
    c.globalAlpha=1;
  }

  // Companion HP card for battle UI
  function drawBCompanionCard(c,x,y,w,h){
    const lv=saveData?.companionLevel||1;
    const compName=lv>=30?'Leo the Lioncat':lv>=10?'Stripetail':'Kitten';
    c.fillStyle='rgba(7,10,18,0.88)';c.fillRect(x,y,w,h);
    c.strokeStyle='#FF8C00';c.lineWidth=1.5;c.strokeRect(x,y,w,h);c.lineWidth=1;
    c.fillStyle='#FF8C00';c.font='bold 12px sans-serif';c.textBaseline='middle';
    c.fillText(compName+' Lv.'+lv,x+8,y+14);
    const xpPct=Math.min(1,(saveData?.companionXp||0)/((saveData?.companionLevel||1)*50));
    c.fillStyle='#1a1a2a';c.fillRect(x+8,y+26,w-16,10);
    c.fillStyle='#FF8C00';c.fillRect(x+8,y+26,(w-16)*xpPct,10);
    c.fillStyle='#aaa';c.font='10px sans-serif';c.fillText('XP: '+(saveData?.companionXp||0),x+w-60,y+38);
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
    const scale=animal.r==='legendary'?1.45:animal.r==='rare'?1.22:1.0;
    const sz=Math.round(80*scale);
    if(anim.hitT>0){c.save();c.filter=`brightness(${2.2-anim.hitT/7}) saturate(0.15) contrast(1.5)`;}
    // Shadow
    c.fillStyle='rgba(0,0,0,0.22)';c.beginPath();c.ellipse(x+sz*.45,y+sz+10,sz*.45,9,0,0,Math.PI*2);c.fill();
    // Draw canvas sprite (larger, for battle)
    const idleX=x+anim.x+(anim.atkT>0?(1-anim.atkT/18)*(-sz*.3):0);
    const idleY=y+anim.y;
    drawAnimalSprite(c,animal.n||animal.name,idleX,idleY,sz,t+(animal.bob||0),anim.atkT>0?-1:1);
    if(anim.hitT>0){c.restore();}
    // Rarity aura
    if(animal.r==='legendary'){
      const al=0.14+0.1*Math.sin(t*3);c.save();c.globalAlpha=al;
      const au=c.createRadialGradient(x+sz*.5,y+sz*.5,0,x+sz*.5,y+sz*.5,sz*.8);
      au.addColorStop(0,'#ffee00');au.addColorStop(1,'transparent');
      c.fillStyle=au;c.beginPath();c.arc(x+sz*.5,y+sz*.5,sz*.8,0,Math.PI*2);c.fill();c.restore();
    } else if(animal.r==='rare'){
      c.strokeStyle=`rgba(255,140,0,${0.28+0.18*Math.sin(t*2)})`;c.lineWidth=2.5;
      c.beginPath();c.arc(x+sz*.5,y+sz*.4,sz*.55,0,Math.PI*2);c.stroke();c.lineWidth=1;
    }
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
    // Always reset critical state before drawing
    ctx.globalAlpha=1;
    ctx.globalCompositeOperation='source-over';
    ctx.setLineDash([]);
    ctx.lineWidth=1;
    ctx.textAlign='left';
    ctx.textBaseline='alphabetic';
    ctx.clearRect(0,0,W,H);

    if(inInterior){
      ctx.save();
      try{ drawInterior(); }catch(e){ console.warn('drawInterior error:',e); }
      ctx.restore();
    } else {
      // Each phase is fully isolated so one crash cannot corrupt the rest
      ctx.save();try{ drawSky(); }catch(e){ console.warn('sky err',e); }ctx.restore();
      ctx.globalAlpha=1;ctx.setLineDash([]);ctx.lineWidth=1;
      ctx.save();try{ drawGround(); }catch(e){ console.warn('ground err',e); }ctx.restore();
      ctx.globalAlpha=1;ctx.setLineDash([]);ctx.lineWidth=1;
      ctx.save();try{ drawDecos(); }catch(e){ console.warn('decos err',e); }ctx.restore();
      ctx.globalAlpha=1;ctx.setLineDash([]);ctx.lineWidth=1;
      ctx.save();try{ drawHouseStructures(); }catch(e){ console.warn('houses err',e); }ctx.restore();
      ctx.globalAlpha=1;ctx.setLineDash([]);ctx.lineWidth=1;
      ctx.save();try{ drawAnimals(); }catch(e){ console.warn('animals err',e); }ctx.restore();
      ctx.globalAlpha=1;ctx.setLineDash([]);ctx.lineWidth=1;
      ctx.save();try{ drawPartyMembers(); }catch(e){ console.warn('party err',e); }ctx.restore();
      ctx.globalAlpha=1;ctx.setLineDash([]);ctx.lineWidth=1;
      ctx.save();try{ drawCompanion(); }catch(e){ console.warn('companion err',e); }ctx.restore();
      ctx.globalAlpha=1;ctx.setLineDash([]);ctx.lineWidth=1;
      ctx.save();try{ drawPlayer(); }catch(e){ console.warn('player err',e); }ctx.restore();
      ctx.globalAlpha=1;ctx.setLineDash([]);ctx.lineWidth=1;
      ctx.save();try{ applyNightTint(); }catch(e){ console.warn('tint err',e); }ctx.restore();
      ctx.globalAlpha=1;
      try{ drawMinimap(); }catch(e){ console.warn('minimap err',e); }
    }
    // Final safety reset
    ctx.globalAlpha=1;
    ctx.setLineDash([]);
    ctx.lineWidth=1;
    ctx.textAlign='left';
    ctx.textBaseline='alphabetic';
  }

  function applyNightTint(){
    const br=skyBright();
    if(br>=1.0)return;
    ctx.save();
    const night=1-br;
    if(isNight()){
      ctx.globalAlpha=night*0.62;
      ctx.fillStyle='#010510';ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=night*0.12;
      ctx.fillStyle='#2030a0';ctx.fillRect(0,0,W,H);
    } else if(isDawnDusk()){
      const isDawn=dayT<0.3;
      ctx.globalAlpha=0.14;
      ctx.fillStyle=isDawn?'#f06018':'#e04010';ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=(1-br)*0.35;
      ctx.fillStyle='#05020a';ctx.fillRect(0,0,W,H);
    } else {
      ctx.globalAlpha=(1-br)*0.18;
      ctx.fillStyle='#020508';ctx.fillRect(0,0,W,H);
    }
    ctx.restore();
  }

  function drawSky(){
    const b=getBiome(camX+W/2);
    const skyH=Math.round(H*.42);
    const br=skyBright(),night=1-br;
    const dp=dayT; // 0-1 full day

    // ── Atmospheric sky gradient (multi-stop realistic) ──
    const skyG=ctx.createLinearGradient(0,0,0,skyH);
    if(isNight()){
      skyG.addColorStop(0,'#000308');
      skyG.addColorStop(0.4,blend('#010508','#02081a',0.5));
      skyG.addColorStop(1,'#020a14');
    } else if(isDawnDusk()){
      const isDawn=dp<0.3;
      if(isDawn){
        skyG.addColorStop(0,'#0a0818');
        skyG.addColorStop(0.35,'#1a0828');
        skyG.addColorStop(0.65,'#7a2808');
        skyG.addColorStop(0.85,'#d86018');
        skyG.addColorStop(1,'#f0a050');
      } else {
        skyG.addColorStop(0,'#0a0510');
        skyG.addColorStop(0.3,'#3a0818');
        skyG.addColorStop(0.6,'#a03010');
        skyG.addColorStop(0.85,'#e07828');
        skyG.addColorStop(1,'#f0b050');
      }
    } else {
      // Daytime — biome-based atmospheric scattering
      const topColor=blend(b.skyA,'#2a6aaa',0.2);
      const midColor=blend(b.skyB,'#6aaadd',0.15);
      skyG.addColorStop(0,topColor);
      skyG.addColorStop(0.4,blend(topColor,midColor,0.5));
      skyG.addColorStop(0.75,midColor);
      skyG.addColorStop(1,blend(midColor,'#d8eef8',0.4));
    }
    ctx.fillStyle=skyG;ctx.fillRect(0,0,W,skyH);

    // ── Milky Way band (deep night only) ──
    if(night>0.7){
      ctx.save();
      const mwG=ctx.createLinearGradient(0,0,W,skyH);
      mwG.addColorStop(0,'rgba(80,60,100,0)');
      mwG.addColorStop(0.3,`rgba(80,70,120,${(night-0.7)*0.18})`);
      mwG.addColorStop(0.7,`rgba(60,50,90,${(night-0.7)*0.12})`);
      mwG.addColorStop(1,'rgba(80,60,100,0)');
      ctx.fillStyle=mwG;
      ctx.save();ctx.translate(W*0.5,skyH*0.4);ctx.rotate(-0.25);
      ctx.fillRect(-W*.7,-skyH*.3,W*1.4,skyH*.6);ctx.restore();
      ctx.restore();
    }

    // ── Stars (procedurally twinkling) ──
    if(night>0.15){
      ctx.save();
      STARS.forEach(s=>{
        const screenX=((s.x*MAP_COLS*TS-camX*.05)%W+W)%W;
        const screenY=s.y*skyH*.88;
        const twinkle=0.35+0.55*Math.abs(Math.sin(animT*1.5+s.t));
        ctx.globalAlpha=Math.max(0,night*twinkle*(s.r>1.2?1:0.7));
        const starColors=['#ffffff','#ffe8c0','#c8d8ff','#ffeeaa'];
        ctx.fillStyle=starColors[Math.floor(s.t*starColors.length)%starColors.length];
        ctx.beginPath();ctx.arc(screenX,screenY,s.r*(0.8+0.2*Math.sin(animT*2+s.t)),0,Math.PI*2);ctx.fill();
      });
      ctx.restore();
    }

    // ── Sun / Moon position along arc ──
    const celestialAngle=dp*Math.PI*2-Math.PI*0.5;
    const cX=W*0.5+Math.cos(celestialAngle)*W*0.4;
    const cY=skyH*0.52-Math.sin(Math.max(0.01,Math.min(Math.PI*0.99,dp*Math.PI*2)))*skyH*0.58;

    if(cY>-60&&cY<skyH+20){
      if(isNight()){
        // Moon with glow halo
        ctx.save();
        const moonG=ctx.createRadialGradient(cX,cY,0,cX,cY,38);
        moonG.addColorStop(0,`rgba(180,190,220,${0.12+0.06*Math.sin(animT*.3)})`);
        moonG.addColorStop(1,'rgba(180,190,220,0)');
        ctx.fillStyle=moonG;ctx.beginPath();ctx.arc(cX,cY,38,0,Math.PI*2);ctx.fill();
        // Moon body
        ctx.fillStyle=blend('#e8edf8','#a0a8c0',0.1);ctx.beginPath();ctx.arc(cX,cY,20,0,Math.PI*2);ctx.fill();
        // Moon craters
        ctx.fillStyle='rgba(150,160,185,0.5)';ctx.beginPath();ctx.arc(cX+5,cY-4,5.5,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(150,160,185,0.4)';ctx.beginPath();ctx.arc(cX-6,cY+5,3.5,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(150,160,185,0.35)';ctx.beginPath();ctx.arc(cX+2,cY+7,2.5,0,Math.PI*2);ctx.fill();
        ctx.restore();
      } else {
        // Sun with corona and rays
        ctx.save();
        const sunBrightness=Math.min(1,br*1.2);
        // Outer corona gradient
        const sunG=ctx.createRadialGradient(cX,cY,0,cX,cY,80);
        sunG.addColorStop(0,`rgba(255,250,200,${0.18*sunBrightness})`);
        sunG.addColorStop(0.4,`rgba(255,230,100,${0.1*sunBrightness})`);
        sunG.addColorStop(1,'rgba(255,200,50,0)');
        ctx.fillStyle=sunG;ctx.beginPath();ctx.arc(cX,cY,80,0,Math.PI*2);ctx.fill();
        // Sun disk
        ctx.fillStyle=blend('#fff8e0',isDawnDusk()?'#ff9840':'#ffffc0',isDawnDusk()?0.7:0.1);
        ctx.beginPath();ctx.arc(cX,cY,isDawnDusk()?30:24,0,Math.PI*2);ctx.fill();
        // Inner bright core
        ctx.fillStyle=`rgba(255,255,240,${0.85*sunBrightness})`;ctx.beginPath();ctx.arc(cX,cY,isDawnDusk()?22:16,0,Math.PI*2);ctx.fill();
        // Sun rays at dawn/dusk
        if(isDawnDusk()){
          for(let r=0;r<16;r++){
            const ra=r/16*Math.PI*2,rl=40+Math.sin(animT*2+r)*10;
            ctx.strokeStyle=`rgba(255,160,60,${0.06+Math.sin(animT*1.5+r)*.03})`;
            ctx.lineWidth=1.5;
            ctx.beginPath();ctx.moveTo(cX+Math.cos(ra)*28,cY+Math.sin(ra)*28);ctx.lineTo(cX+Math.cos(ra)*(28+rl),cY+Math.sin(ra)*(28+rl));ctx.stroke();
          }
          ctx.lineWidth=1;
        }
        ctx.restore();
      }
    }

    // ── Atmospheric horizon glow ──
    if(isDawnDusk()){
      const isDawn2=dp<0.3;
      const hColors=isDawn2?['rgba(220,80,20,0.22)','rgba(240,160,50,0.18)','rgba(200,60,10,0.1)']:['rgba(200,50,10,0.22)','rgba(220,120,30,0.18)','rgba(180,40,5,0.1)'];
      hColors.forEach((col,i)=>{
        const hg=ctx.createLinearGradient(0,skyH*(0.5+i*.12),0,skyH);
        hg.addColorStop(0,col);hg.addColorStop(1,'transparent');
        ctx.fillStyle=hg;ctx.fillRect(0,skyH*(0.5+i*.12),W,skyH*(0.5-i*.12));
      });
    }

    // ── Clouds (volumetric soft shape) ──
    if(br>0.3&&b.id!=='ocean'&&b.id!=='volcanic'){
      const cloudAlpha=Math.min(0.9,br*0.75);
      const cTint=isDawnDusk()?(dp<0.3?[255,200,140]:[255,180,100]):[255,255,255];
      const clouds=[
        {x:.08,y:.24,r:28,spd:.12},
        {x:.30,y:.16,r:20,spd:.09},
        {x:.52,y:.28,r:25,spd:.14},
        {x:.72,y:.14,r:18,spd:.08},
        {x:.86,y:.22,r:22,spd:.11},
      ];
      clouds.forEach(cl=>{
        const cx2=cl.x*W+Math.sin(animT*cl.spd+cl.x*20)*12;
        const cy2=cl.y*skyH;
        const r2=Math.max(4,cl.r*br); // guard: never allow radius < 4
        ctx.fillStyle=`rgba(${cTint[0]},${cTint[1]},${cTint[2]},${cloudAlpha})`;
        // Each puff is a separate path
        [[0,0,1],[r2*.9,-r2*.3,.75],[r2*1.8,0,.85],[r2*.45,-r2*.55,.65],[r2*1.35,-r2*.45,.6]].forEach(([ox,oy,fr])=>{
          ctx.beginPath();ctx.arc(cx2+ox,cy2+oy,Math.max(3,r2*fr),0,Math.PI*2);ctx.fill();
        });
        // Shadow underside
        const sr=Math.max(4,r2*1.6),sh=Math.max(2,r2*.28);
        ctx.fillStyle=`rgba(${Math.round(cTint[0]*.82)},${Math.round(cTint[1]*.82)},${Math.round(cTint[2]*.8)},${cloudAlpha*.55})`;
        ctx.beginPath();ctx.ellipse(cx2+r2*.9,cy2+r2*.35,sr,sh,0,0,Math.PI*2);ctx.fill();
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
      ctx.fillStyle=c%2===0?blend(b.pA,'#111111',1-br*.9):blend(b.pB,'#111111',1-br*.9);
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
    const ti=isNight()?'[N]':isDawnDusk()?'[~]':'[D]';
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
        ctx.save();
        ctx.globalAlpha=0.6*skyBright()+0.12;
        ctx.fillStyle='#ddeeff';
        ctx.beginPath();ctx.arc(sx,sy,p.r,0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
    });
    // Biome fog
    const cb=getBiome(camX+W/2);
    if(cb.fog){
      ctx.save();
      ctx.fillStyle=cb.fog;ctx.fillRect(0,0,W,H);
      ctx.restore();
    }
    ctx.globalAlpha=1;
  }

  function drawCoral(x,y,deep){
    const cols=deep?['#6a2aff','#2a8bff','#ff2a8b']:['#ff6b6b','#ff8c00','#ffb347'];
    ctx.fillStyle=cols[0];ctx.fillRect(x-2,y-22,5,24);ctx.fillRect(x-9,y-16,4,16);ctx.fillRect(x+4,y-20,4,20);
    cols.forEach((col,i)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(x+(i-1)*7,y-22+i*2,4+i,0,Math.PI*2);ctx.fill();});
    // Draw a small fish in canvas instead of emoji
    if(Math.sin(animT*2+x)>0.6){
      const fx=x+14+Math.sin(animT*2+x)*8,fy=y-10+Math.sin(animT*3+x)*5;
      const fc=deep?blend('#ff8c00','#882800',0.5):blend('#ff6040','#881820',0.5);
      ctx.fillStyle=fc;ctx.beginPath();ctx.ellipse(fx,fy,6,3.5,Math.sin(animT+x)*.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=blend('#ffdd80','#887830',0.5);ctx.beginPath();ctx.ellipse(fx+1,fy,3,2,Math.sin(animT+x)*.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=fc;ctx.beginPath();ctx.moveTo(fx-5,fy);ctx.lineTo(fx-9,fy-3);ctx.lineTo(fx-9,fy+3);ctx.closePath();ctx.fill();
      ctx.fillStyle='#1a1010';ctx.beginPath();ctx.arc(fx+4,fy-0.5,1.2,0,Math.PI*2);ctx.fill();
    }
  }

  function drawTree(x,y,bid,seed){
    ctx.save();
    try{
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
      ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x+sw,y-24);ctx.lineTo(x+13+sw,y-14);ctx.stroke();ctx.beginPath();ctx.moveTo(x+sw,y-30);ctx.lineTo(x-11+sw,y-20);ctx.stroke();
    } else if(bid==='water'||bid==='ocean'){
      ctx.strokeStyle=bid==='ocean'?'#2a5a2a':'#3a8a2a';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(x,y);for(let i=1;i<=4;i++)ctx.lineTo(x+Math.sin(animT*2+x+i)*8,y-i*9);ctx.stroke();
    } else {
      ctx.fillStyle='#5D4037';ctx.fillRect(x-4,y-20,8,22);
      ctx.fillStyle=blend('#388E3C','#1a3a1a',1-br*.8);ctx.beginPath();ctx.moveTo(x+sw,y-44);ctx.lineTo(x-17,y-18);ctx.lineTo(x+17,y-18);ctx.closePath();ctx.fill();
      ctx.fillStyle=blend('#43A047','#1a4020',1-br*.8);ctx.beginPath();ctx.moveTo(x+sw,y-54);ctx.lineTo(x-12,y-34);ctx.lineTo(x+12,y-34);ctx.closePath();ctx.fill();
    }
    }catch(e){}
    ctx.lineWidth=1;
    ctx.restore();
  }


  function drawHouseStructures(){
    const skyH=Math.round(H*.42),br=skyBright();
    houses.forEach(h=>{
      const sx=h.wx-camX,sy=h.wy-camY+skyH;
      if(sx<-140||sx>W+140)return;
      ctx.fillStyle='rgba(0,0,0,0.16)';ctx.beginPath();ctx.ellipse(sx+40,sy+116,44,7,0,0,Math.PI*2);ctx.fill();
      const biome=h.biome;
      ctx.save();
      try{
        if(biome==='ocean')drawCave(sx,sy,br);
        else if(biome==='volcanic')drawVolcLair(sx,sy,br);
        else if(biome==='tropical')drawJTemple(sx,sy,br);
        else if(biome==='mountain')drawMPost(sx,sy,br);
        else if(biome==='snow')drawIgloo(sx,sy,br);
        else if(biome==='water')drawDock(sx,sy,br);
        else if(biome==='savanna')drawSafari(sx,sy,br);
        else drawInn(sx,sy,br);
      }catch(e){ console.warn('house draw err',e); }
      ctx.lineWidth=1; ctx.setLineDash([]); ctx.globalAlpha=1;
      ctx.restore();
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
    // Stone foundation
    ctx.fillStyle=blend('#8B7355','#2a1a08',1-br*.85);ctx.fillRect(sx+2,sy+112,76,8);
    // Walls with plank texture
    ctx.fillStyle=wc;ctx.fillRect(sx,sy+40,80,72);
    ctx.strokeStyle='rgba(0,0,0,0.1)';ctx.lineWidth=0.5;for(let px2=sx+10;px2<sx+80;px2+=10){ctx.beginPath();ctx.moveTo(px2,sy+40);ctx.lineTo(px2,sy+112);ctx.stroke();}
    // Horizontal beam lines
    ctx.strokeStyle='rgba(0,0,0,0.08)';for(let hl=sy+52;hl<sy+112;hl+=18){ctx.beginPath();ctx.moveTo(sx,hl);ctx.lineTo(sx+80,hl);ctx.stroke();}
    // Roof
    ctx.fillStyle=rc;ctx.beginPath();ctx.moveTo(sx-6,sy+40);ctx.lineTo(sx+40,sy);ctx.lineTo(sx+86,sy+40);ctx.closePath();ctx.fill();
    // Roof shingle rows
    ctx.fillStyle='rgba(0,0,0,0.1)';for(let r=0;r<5;r++)for(let ti=0;ti<7-r;ti++)ctx.fillRect(sx+ti*(80/7-r*1.2)+r*3,sy+r*(40/5),80/7,40/5);
    // Chimney with stonework
    ctx.fillStyle=blend('#8B7355','#2a1a08',1-br*.85);ctx.fillRect(sx+60,sy-14,14,20);
    ctx.fillStyle=blend('#666666','#222222',1-br*.8);ctx.fillRect(sx+58,sy-16,18,5);
    // Chimney stones
    ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=0.6;for(let cs=0;cs<3;cs++)ctx.strokeRect(sx+60,sy-14+cs*6,7,6);ctx.lineWidth=0.5;
    // Smoke puffs
    for(let sm=0;sm<3;sm++){ctx.globalAlpha=br*(0.28-sm*.08);ctx.fillStyle=blend('#d0d0d0','#888888',1-br*.5);ctx.beginPath();ctx.arc(sx+67+Math.sin(animT+sm)*3,sy-20-sm*12,4+sm*3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    // Door with arch
    ctx.fillStyle=blend('#1a0a04','#080402',1-br*.8);ctx.beginPath();ctx.moveTo(sx+32,sy+90);ctx.lineTo(sx+32,sy+112);ctx.lineTo(sx+48,sy+112);ctx.lineTo(sx+48,sy+90);ctx.arc(sx+40,sy+90,8,0,Math.PI,true);ctx.closePath();ctx.fill();
    ctx.strokeStyle=blend('#8B4513','#3a1a08',1-br*.8);ctx.lineWidth=2;ctx.stroke();ctx.lineWidth=1;
    // Door knob
    ctx.fillStyle=blend('#f0a500','#7a5000',1-br*.7);ctx.beginPath();ctx.arc(sx+45,sy+102,3,0,Math.PI*2);ctx.fill();
    // Windows with frames
    const glw=0.18+0.1*Math.sin(animT*3+sx);
    [sx+6,sx+58].forEach(wx2=>{
      ctx.fillStyle=blend('#1a2030','#080810',1-br*.5);ctx.fillRect(wx2,sy+50,16,14);
      ctx.strokeStyle=blend('#8B4513','#3a1a08',1-br*.8);ctx.lineWidth=1.5;ctx.strokeRect(wx2,sy+50,16,14);ctx.lineWidth=1;
      ctx.fillStyle=blend('#a8d4ff','#2a4a60',1-br*.8);ctx.fillRect(wx2+1,sy+51,7,6);ctx.fillRect(wx2+8,sy+51,7,6);ctx.fillRect(wx2+1,sy+58,7,5);ctx.fillRect(wx2+8,sy+58,7,5);
      ctx.fillStyle=`rgba(255,200,60,${glw})`;ctx.fillRect(wx2+1,sy+51,14,12);
    });
    // Hanging sign (painted, no emoji)
    ctx.fillStyle=blend('#8B4513','#2a1008',1-br*.8);ctx.fillRect(sx+24,sy+36,32,14);ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1;ctx.strokeRect(sx+24,sy+36,32,14);
    ctx.fillStyle=blend('#f0e0a0','#b09040',1-br*.7);ctx.font='bold 6px sans-serif';ctx.textBaseline='middle';ctx.fillText('INN & TAVERN',sx+26,sy+43);
    // Lantern by door
    const lantern=0.6+0.3*Math.sin(animT*4+sx);
    ctx.fillStyle=blend('#c8a020','#5a4800',1-br*.7);ctx.fillRect(sx+40-3,sy+72,6,8);
    ctx.fillStyle=`rgba(255,200,60,${lantern*br*.8+0.1})`;ctx.beginPath();ctx.arc(sx+40,sy+76,5,0,Math.PI*2);ctx.fill();
  }

  function drawCave(sx,sy,br){
    ctx.fillStyle=blend('#3a4050','#1a1a28',1-br*.7);
    ctx.beginPath();ctx.moveTo(sx,sy+96);ctx.arc(sx+32,sy+48,48,Math.PI*.9,Math.PI*.1,false);ctx.lineTo(sx+80,sy+96);ctx.closePath();ctx.fill();
    ctx.fillStyle=blend('#020818','#050d28',1-br*.5);ctx.beginPath();ctx.ellipse(sx+32,sy+58,26,32,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(0,180,255,${0.18+0.1*Math.sin(animT*2+sx)})`;ctx.beginPath();ctx.ellipse(sx+32,sy+58,22,28,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5a6070';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(sx+i*16,sy+94,5+Math.sin(i)*2,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#ff6b6b';ctx.fillRect(sx-4,sy+32,5,32);ctx.fillRect(sx+76,sy+28,5,36);
    for(let bb=0;bb<4;bb++){ctx.globalAlpha=0.25+0.18*Math.sin(animT*3+bb*1.5);ctx.fillStyle='rgba(150,220,255,0.5)';const bx=sx+16+bb*10,by=sy+58-((animT*30+bb*20)%55);ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    ctx.font='16px serif';ctx.textBaseline='middle';ctx.fillText('~',sx+24,sy+14);
    // Bioluminescent sign text
    ctx.fillStyle=`rgba(0,200,255,${0.5+0.3*Math.sin(animT*2)})`;ctx.font='bold 8px sans-serif';ctx.fillText('OCEAN CAVE',sx+4,sy+8);
  }

  function drawVolcLair(sx,sy,br){
    ctx.fillStyle=blend('#5a1a00','#1a0500',1-br*.5);ctx.fillRect(sx,sy+48,80,48);
    ctx.fillStyle=`rgba(255,60,0,${0.45+0.18*Math.sin(animT*2+sx)})`;ctx.fillRect(sx-5,sy+90,90,12);
    ctx.fillStyle=blend('#3a2010','#0a0400',1-br*.7);ctx.beginPath();ctx.moveTo(sx-4,sy+96);ctx.arc(sx+32,sy+58,38,Math.PI,0);ctx.lineTo(sx+68,sy+96);ctx.closePath();ctx.fill();
    ctx.fillStyle='#0a0000';ctx.beginPath();ctx.ellipse(sx+32,sy+64,21,27,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(255,80,0,${0.18+0.14*Math.sin(animT*3)})`;ctx.beginPath();ctx.ellipse(sx+32,sy+64,16,22,0,0,Math.PI*2);ctx.fill();
    // Stone skull decoration (canvas drawn)
    ctx.fillStyle=blend('#c8c0b0','#505048',1-br*.7);ctx.beginPath();ctx.arc(sx+32,sy+16,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.beginPath();ctx.ellipse(sx+29,sy+15,2.5,2,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(sx+35,sy+15,2.5,2,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.6)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx+32,sy+19,4,0.2,Math.PI-.2);ctx.stroke();ctx.lineWidth=1;
    // Lava label
    ctx.fillStyle=`rgba(255,120,0,${0.6+0.3*Math.sin(animT*3)})`;ctx.font='bold 7px sans-serif';ctx.textBaseline='middle';ctx.fillText('DRAGON LAIR',sx+6,sy+8);
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
    // Temple name carved in stone
    ctx.fillStyle=blend('#f0e0a0','#9a8040',1-br*.6);ctx.font='bold 7px sans-serif';ctx.textBaseline='middle';ctx.fillText('JUNGLE TEMPLE',sx+2,sy+3);
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
    ctx.fillStyle=blend('#f0e0a0','#a09040',1-br*.6);ctx.font='bold 7px sans-serif';ctx.textBaseline='middle';ctx.fillText('RANGER POST',sx+4,sy+12);
  }

  function drawIgloo(sx,sy,br){
    const ic=blend('#d8f0ff','#4a6a88',1-br*.7);
    ctx.fillStyle=ic;ctx.beginPath();ctx.arc(sx+37,sy+80,37,Math.PI,0);ctx.fill();
    ctx.strokeStyle=`rgba(150,200,240,${0.38*br+0.08})`;ctx.lineWidth=0.8;for(let row=0;row<4;row++)for(let bl=0;bl<5;bl++)ctx.strokeRect(sx+bl*18-row*4,sy+80-row*16,16,14);
    ctx.fillStyle=blend('#a0c8e0','#1a3a5a',1-br*.7);ctx.fillRect(sx+25,sy+71,24,10);
    ctx.fillStyle='#050f28';ctx.beginPath();ctx.ellipse(sx+37,sy+78,9,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(220,240,255,${0.75*br+0.08})`;ctx.beginPath();ctx.arc(sx-5,sy+80,15,0,Math.PI);ctx.fill();ctx.beginPath();ctx.arc(sx+74,sy+80,12,0,Math.PI);ctx.fill();
    ctx.fillStyle=`rgba(200,240,255,${0.1+0.05*Math.sin(animT*2)})`;ctx.beginPath();ctx.arc(sx+37,sy+64,29,Math.PI,0);ctx.fill();
    ctx.fillStyle=blend('#e0f0ff','#a0c0e0',1-br*.5);ctx.font='bold 7px sans-serif';ctx.textBaseline='middle';ctx.fillText('ICE IGLOO',sx+6,sy+24);
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
    // Anchor symbol painted on hut
    ctx.strokeStyle=blend('#c0c0c8','#606068',1-br*.7);ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx+40,sy+16,5,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(sx+40,sy+11);ctx.lineTo(sx+40,sy+22);ctx.stroke();ctx.beginPath();ctx.moveTo(sx+35,sy+13);ctx.lineTo(sx+45,sy+13);ctx.stroke();ctx.beginPath();ctx.moveTo(sx+35,sy+22);ctx.quadraticCurveTo(sx+40,sy+26,sx+45,sy+22);ctx.stroke();ctx.lineWidth=1;
    ctx.fillStyle=blend('#e0e8f0','#909898',1-br*.6);ctx.font='bold 7px sans-serif';ctx.textBaseline='middle';ctx.fillText('FISH DOCK',sx+8,sy+10);
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
    ctx.fillStyle=blend('#f0e0a0','#b09040',1-br*.7);ctx.font='bold 7px sans-serif';ctx.textBaseline='middle';ctx.fillText('SAFARI CAMP',sx+4,sy+0);
  }


  // ── Canvas animal sprite library ─────────────────
  // Each function draws a realistic pixel-art animal at (x,y) with size s, time t, facing dir
  function drawAnimalSprite(c2,animalId,x,y,s,t,facing){
    if(!c2||s<=0)return;
    c2.save();
    try{
    if(facing<0){c2.translate(x+s,0);c2.scale(-1,1);x=0;}
    const br=skyBright(),bob=Math.sin(t*1.8)*1.5*s/40,breath=Math.sin(t*1.4)*0.5;
    const id=animalId;
    if(id==='Wild Rabbit'||id==='rabbit'){
      // Body
      c2.fillStyle=blend('#c8c0b0','#6a5a4a',1-br*.9);
      c2.beginPath();c2.ellipse(x+s*.45,y+s*.55+bob,s*.25,s*.2,0,0,Math.PI*2);c2.fill();
      // Head
      c2.beginPath();c2.ellipse(x+s*.72,y+s*.38+bob,s*.18,s*.16,-.2,0,Math.PI*2);c2.fill();
      // Ears (long)
      c2.fillStyle=blend('#c8c0b0','#6a5a4a',1-br*.9);
      c2.beginPath();c2.ellipse(x+s*.68,y+s*.15+bob,s*.04,s*.16,-0.1,0,Math.PI*2);c2.fill();
      c2.beginPath();c2.ellipse(x+s*.78,y+s*.13+bob,s*.04,s*.17,0.15,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,180,180,0.5)';
      c2.beginPath();c2.ellipse(x+s*.68,y+s*.14+bob,s*.02,s*.11,-0.1,0,Math.PI*2);c2.fill();
      // Eye
      c2.fillStyle='#1a0a0a';c2.beginPath();c2.arc(x+s*.78,y+s*.34+bob,s*.03,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.8)';c2.beginPath();c2.arc(x+s*.795,y+s*.325+bob,s*.01,0,Math.PI*2);c2.fill();
      // Nose
      c2.fillStyle='#ff9999';c2.beginPath();c2.arc(x+s*.88,y+s*.4+bob,s*.025,0,Math.PI*2);c2.fill();
      // Legs
      const legSwing=Math.sin(t*6)*s*.06*(facing!==0?0.8:0.2);
      c2.fillStyle=blend('#b8b0a0','#5a4a3a',1-br*.9);
      c2.fillRect(x+s*.3,y+s*.68+bob,s*.08,s*.2+legSwing);c2.fillRect(x+s*.42,y+s*.68+bob,s*.08,s*.2-legSwing);
      c2.fillRect(x+s*.58,y+s*.65+bob,s*.08,s*.22+legSwing);c2.fillRect(x+s*.7,y+s*.65+bob,s*.08,s*.22-legSwing);
      // Tail
      c2.fillStyle='#fff';c2.beginPath();c2.arc(x+s*.22,y+s*.5+bob,s*.07,0,Math.PI*2);c2.fill();
    } else if(id==='Red Fox'||id==='fox'){
      // Body
      c2.fillStyle=blend('#c84820','#5a1a08',1-br*.9);
      c2.beginPath();c2.ellipse(x+s*.42,y+s*.55+bob,s*.28,s*.18+breath*.5,0,0,Math.PI*2);c2.fill();
      // Belly
      c2.fillStyle=blend('#f0d0a0','#7a5a30',1-br*.8);c2.beginPath();c2.ellipse(x+s*.42,y+s*.6+bob,s*.14,s*.1,0,0,Math.PI*2);c2.fill();
      // Head
      c2.fillStyle=blend('#c84820','#5a1a08',1-br*.9);c2.beginPath();c2.ellipse(x+s*.74,y+s*.4+bob,s*.2,s*.17,-.15,0,Math.PI*2);c2.fill();
      // Snout
      c2.fillStyle=blend('#e06030','#6a2810',1-br*.85);c2.beginPath();c2.ellipse(x+s*.9,y+s*.44+bob,s*.1,s*.07,0.1,0,Math.PI*2);c2.fill();
      // Ears
      c2.fillStyle=blend('#c84820','#5a1a08',1-br*.9);c2.beginPath();c2.moveTo(x+s*.68,y+s*.28+bob);c2.lineTo(x+s*.62,y+s*.1+bob);c2.lineTo(x+s*.76,y+s*.25+bob);c2.fill();
      c2.beginPath();c2.moveTo(x+s*.8,y+s*.26+bob);c2.lineTo(x+s*.78,y+s*.09+bob);c2.lineTo(x+s*.88,y+s*.24+bob);c2.fill();
      c2.fillStyle='#3a1008';c2.beginPath();c2.moveTo(x+s*.685,y+s*.26+bob);c2.lineTo(x+s*.65,y+s*.14+bob);c2.lineTo(x+s*.74,y+s*.25+bob);c2.fill();
      // Eye
      c2.fillStyle='#2a1a00';c2.beginPath();c2.arc(x+s*.82,y+s*.38+bob,s*.03,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,200,0,0.6)';c2.beginPath();c2.arc(x+s*.82,y+s*.38+bob,s*.025,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a0a00';c2.beginPath();c2.arc(x+s*.822,y+s*.38+bob,s*.015,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.7)';c2.beginPath();c2.arc(x+s*.83,y+s*.375+bob,s*.006,0,Math.PI*2);c2.fill();
      // Nose
      c2.fillStyle='#1a0a0a';c2.beginPath();c2.arc(x+s*.965,y+s*.43+bob,s*.025,0,Math.PI*2);c2.fill();
      // Legs
      const ls=Math.sin(t*6)*s*.05;
      c2.fillStyle=blend('#c84820','#5a1a08',1-br*.9);
      c2.fillRect(x+s*.28,y+s*.66+bob,s*.07,s*.22+ls);c2.fillRect(x+s*.38,y+s*.66+bob,s*.07,s*.22-ls);
      c2.fillRect(x+s*.56,y+s*.64+bob,s*.07,s*.24+ls);c2.fillRect(x+s*.66,y+s*.64+bob,s*.07,s*.24-ls);
      // Tail (bushy)
      c2.fillStyle=blend('#c84820','#5a1a08',1-br*.9);c2.beginPath();c2.ellipse(x+s*.12,y+s*.5+bob+Math.sin(t*2)*s*.04,s*.16,s*.1,-.5,0,Math.PI*2);c2.fill();
      c2.fillStyle='#f0f0f0';c2.beginPath();c2.ellipse(x+s*.06,y+s*.52+bob+Math.sin(t*2)*s*.04,s*.08,s*.06,-.5,0,Math.PI*2);c2.fill();
    } else if(id==='Gray Wolf'||id==='wolf'||id==='Spotted Hyena'){
      // Body - larger than fox
      const wCol=id==='Spotted Hyena'?blend('#b8a060','#5a4a20',1-br*.9):blend('#888880','#3a3a38',1-br*.9);
      c2.fillStyle=wCol;c2.beginPath();c2.ellipse(x+s*.42,y+s*.52+bob,s*.3,s*.22+breath*.5,-.05,0,Math.PI*2);c2.fill();
      // Belly lighter
      c2.fillStyle=blend('#c8c0a0','#6a6050',1-br*.8);c2.beginPath();c2.ellipse(x+s*.4,y+s*.62+bob,s*.15,s*.1,0,0,Math.PI*2);c2.fill();
      // Head
      c2.fillStyle=wCol;c2.beginPath();c2.ellipse(x+s*.76,y+s*.38+bob,s*.22,s*.18,-.1,0,Math.PI*2);c2.fill();
      // Snout
      c2.fillStyle=blend('#9a9890','#4a4840',1-br*.85);c2.beginPath();c2.ellipse(x+s*.93,y+s*.44+bob,s*.1,s*.07,0.1,0,Math.PI*2);c2.fill();
      // Ears
      c2.fillStyle=wCol;c2.beginPath();c2.moveTo(x+s*.7,y+s*.26+bob);c2.lineTo(x+s*.66,y+s*.1+bob);c2.lineTo(x+s*.78,y+s*.24+bob);c2.fill();
      c2.beginPath();c2.moveTo(x+s*.82,y+s*.25+bob);c2.lineTo(x+s*.8,y+s*.09+bob);c2.lineTo(x+s*.9,y+s*.24+bob);c2.fill();
      // Eye - amber
      c2.fillStyle='#8B6000';c2.beginPath();c2.arc(x+s*.84,y+s*.37+bob,s*.035,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a0a00';c2.beginPath();c2.arc(x+s*.84,y+s*.37+bob,s*.02,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.7)';c2.beginPath();c2.arc(x+s*.85,y+s*.363+bob,s*.007,0,Math.PI*2);c2.fill();
      // Spots for hyena
      if(id==='Spotted Hyena'){c2.fillStyle='rgba(80,60,10,0.35)';for(let sp=0;sp<5;sp++){c2.beginPath();c2.arc(x+s*(.25+sp*.1),y+s*(.5+Math.sin(sp)*0.08)+bob,s*.04,0,Math.PI*2);c2.fill();}}
      c2.fillStyle='#1a1010';c2.beginPath();c2.arc(x+s*.99,y+s*.43+bob,s*.025,0,Math.PI*2);c2.fill();
      const ls2=Math.sin(t*5)*s*.06;
      c2.fillStyle=wCol;c2.fillRect(x+s*.26,y+s*.67+bob,s*.08,s*.24+ls2);c2.fillRect(x+s*.37,y+s*.67+bob,s*.08,s*.24-ls2);c2.fillRect(x+s*.58,y+s*.65+bob,s*.08,s*.25+ls2);c2.fillRect(x+s*.68,y+s*.65+bob,s*.08,s*.25-ls2);
      // Tail
      c2.strokeStyle=wCol;c2.lineWidth=s*.06;c2.beginPath();c2.moveTo(x+s*.14,y+s*.5+bob);c2.quadraticCurveTo(x,y+s*.3+bob+Math.sin(t*2)*s*.05,x+s*.04,y+s*.4+bob);c2.stroke();c2.lineWidth=1;
    } else if(id==='Bison'||id==='bison'){
      // Massive, dark brown
      c2.fillStyle=blend('#5a3a18','#1a0a00',1-br*.9);
      c2.beginPath();c2.ellipse(x+s*.42,y+s*.5+bob,s*.35,s*.28+breath,-.05,0,Math.PI*2);c2.fill();
      // Hump
      c2.beginPath();c2.ellipse(x+s*.58,y+s*.3+bob,s*.18,s*.14,-.3,0,Math.PI*2);c2.fill();
      // Head (large, drooping)
      c2.beginPath();c2.ellipse(x+s*.78,y+s*.5+bob,s*.2,s*.22,.2,0,Math.PI*2);c2.fill();
      // Beard
      c2.fillStyle=blend('#3a2010','#0a0500',1-br*.8);c2.beginPath();c2.ellipse(x+s*.82,y+s*.66+bob,s*.06,s*.1,.1,0,Math.PI*2);c2.fill();
      // Horns
      c2.strokeStyle=blend('#c8a050','#5a4010',1-br*.85);c2.lineWidth=s*.04;
      c2.beginPath();c2.moveTo(x+s*.7,y+s*.32+bob);c2.quadraticCurveTo(x+s*.58,y+s*.15+bob,x+s*.66,y+s*.22+bob);c2.stroke();
      c2.beginPath();c2.moveTo(x+s*.84,y+s*.32+bob);c2.quadraticCurveTo(x+s*.96,y+s*.16+bob,x+s*.88,y+s*.23+bob);c2.stroke();
      c2.lineWidth=1;
      // Eye
      c2.fillStyle='#2a1a00';c2.beginPath();c2.arc(x+s*.88,y+s*.46+bob,s*.03,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.6)';c2.beginPath();c2.arc(x+s*.89,y+s*.455+bob,s*.01,0,Math.PI*2);c2.fill();
      // Fur texture
      c2.strokeStyle='rgba(0,0,0,0.12)';c2.lineWidth=0.8;
      for(let f=0;f<6;f++){c2.beginPath();c2.moveTo(x+s*(.3+f*.05),y+s*.28+bob);c2.lineTo(x+s*(.32+f*.05),y+s*.38+bob);c2.stroke();}
      c2.lineWidth=1;
      // Legs (thick)
      c2.fillStyle=blend('#5a3a18','#1a0a00',1-br*.9);
      const lb=Math.sin(t*4)*s*.04;
      [.2,.32,.52,.64].forEach((lx,i)=>{c2.fillRect(x+s*lx,y+s*.7+bob,s*.1,(i%2?s*.22-lb:s*.22+lb));});
      // Hooves
      c2.fillStyle='#1a1008';[.2,.32,.52,.64].forEach(lx=>{c2.fillRect(x+s*lx,y+s*.88+bob,s*.1,s*.04);});
    } else if(id==='Mallard Duck'||id==='duck'){
      // Body round
      c2.fillStyle=blend('#8a7a50','#3a3020',1-br*.8);
      c2.beginPath();c2.ellipse(x+s*.45,y+s*.58+bob,s*.25,s*.18,0.1,0,Math.PI*2);c2.fill();
      // Wing detail
      c2.fillStyle=blend('#7a6a40','#2a2010',1-br*.8);c2.beginPath();c2.ellipse(x+s*.42,y+s*.56+bob,s*.22,s*.14,.15,0,Math.PI*2);c2.fill();
      c2.strokeStyle=blend('#5a5030','#1a1800',1-br*.8);c2.lineWidth=0.5;for(let f=0;f<4;f++){c2.beginPath();c2.moveTo(x+s*(.28+f*.06),y+s*.56+bob);c2.lineTo(x+s*(.3+f*.06),y+s*.66+bob);c2.stroke();}
      // Green head (male)
      c2.fillStyle=blend('#1a6a28','#082210',1-br*.8);c2.beginPath();c2.ellipse(x+s*.76,y+s*.4+bob,s*.16,s*.14,-.1,0,Math.PI*2);c2.fill();
      // White collar
      c2.strokeStyle='rgba(255,255,255,0.8)';c2.lineWidth=s*.025;c2.beginPath();c2.arc(x+s*.72,y+s*.5+bob,s*.1,0,Math.PI*2);c2.stroke();c2.lineWidth=1;
      // Bill
      c2.fillStyle=blend('#f0c030','#8a6010',1-br*.8);c2.beginPath();c2.ellipse(x+s*.9,y+s*.43+bob,s*.1,s*.045,.1,0,Math.PI*2);c2.fill();
      // Eye
      c2.fillStyle='#1a1a1a';c2.beginPath();c2.arc(x+s*.81,y+s*.38+bob,s*.025,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.7)';c2.beginPath();c2.arc(x+s*.82,y+s*.375+bob,s*.008,0,Math.PI*2);c2.fill();
      // Feet
      c2.fillStyle=blend('#e09020','#7a4010',1-br*.8);c2.fillRect(x+s*.38,y+s*.74+bob,s*.14,s*.04);c2.fillRect(x+s*.54,y+s*.74+bob,s*.13,s*.04);
    } else if(id==='Crocodile'||id==='croc'){
      const cCol=blend('#4a6a28','#1a2a08',1-br*.9);
      // Body long & low
      c2.fillStyle=cCol;c2.beginPath();c2.ellipse(x+s*.4,y+s*.62+bob,s*.38,s*.14+breath*.3,0,0,Math.PI*2);c2.fill();
      // Tail
      c2.beginPath();c2.moveTo(x+s*.05,y+s*.62+bob);c2.quadraticCurveTo(x,y+s*.68+bob,x+s*.18,y+s*.66+bob);c2.fill();
      // Head
      c2.beginPath();c2.ellipse(x+s*.82,y+s*.58+bob,s*.2,s*.1,0.05,0,Math.PI*2);c2.fill();
      // Snout / jaw
      c2.fillStyle=blend('#3a5818','#0a1a04',1-br*.9);c2.beginPath();c2.moveTo(x+s*.64,y+s*.6+bob);c2.lineTo(x+s*.98,y+s*.56+bob);c2.lineTo(x+s*.98,y+s*.62+bob);c2.lineTo(x+s*.64,y+s*.64+bob);c2.closePath();c2.fill();
      // Teeth
      c2.fillStyle='rgba(240,230,200,0.9)';for(let t2=0;t2<5;t2++){c2.fillRect(x+s*(.68+t2*.06),y+s*.56+bob,s*.025,s*.04);}
      // Scales
      c2.fillStyle='rgba(0,0,0,0.15)';for(let sc=0;sc<7;sc++){c2.beginPath();c2.arc(x+s*(.16+sc*.1),y+s*.57+bob,s*.04,0,Math.PI*2);c2.fill();}
      // Eye on top
      c2.fillStyle='#d4a000';c2.beginPath();c2.ellipse(x+s*.75,y+s*.52+bob,s*.04,s*.025,0,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a1000';c2.beginPath();c2.ellipse(x+s*.75,y+s*.52+bob,s*.02,s*.02,0,0,Math.PI*2);c2.fill();
      // Legs
      c2.fillStyle=cCol;
      [[.22,.68,.14,.12],[.34,.68,.14,.12],[.52,.66,.14,.12],[.62,.66,.14,.12]].forEach(([lx,ly,lw,lh])=>{c2.fillRect(x+s*lx,y+s*ly+bob,s*lw,s*lh);});
    } else if(id==='Bull Shark'||id==='shark'){
      const sCol=blend('#6a7a8a','#2a3040',1-br*.9);
      // Body streamlined
      c2.fillStyle=sCol;c2.beginPath();c2.moveTo(x+s*.05,y+s*.55+bob);c2.bezierCurveTo(x+s*.2,y+s*.38+bob,x+s*.7,y+s*.38+bob,x+s*.95,y+s*.55+bob);c2.bezierCurveTo(x+s*.7,y+s*.72+bob,x+s*.2,y+s*.72+bob,x+s*.05,y+s*.55+bob);c2.fill();
      // Belly
      c2.fillStyle=blend('#d0d8e0','#8090a0',1-br*.7);c2.beginPath();c2.moveTo(x+s*.2,y+s*.55+bob);c2.bezierCurveTo(x+s*.3,y+s*.48+bob,x+s*.6,y+s*.48+bob,x+s*.78,y+s*.55+bob);c2.bezierCurveTo(x+s*.6,y+s*.62+bob,x+s*.3,y+s*.62+bob,x+s*.2,y+s*.55+bob);c2.fill();
      // Dorsal fin
      c2.fillStyle=sCol;c2.beginPath();c2.moveTo(x+s*.42,y+s*.4+bob);c2.lineTo(x+s*.48,y+s*.18+bob);c2.lineTo(x+s*.56,y+s*.4+bob);c2.closePath();c2.fill();
      // Pectoral fins
      c2.beginPath();c2.moveTo(x+s*.32,y+s*.54+bob);c2.lineTo(x+s*.22,y+s*.7+bob);c2.lineTo(x+s*.42,y+s*.6+bob);c2.closePath();c2.fill();
      // Tail fin
      c2.beginPath();c2.moveTo(x+s*.07,y+s*.55+bob);c2.lineTo(x+s*.01,y+s*.38+bob);c2.lineTo(x+s*.14,y+s*.52+bob);c2.closePath();c2.fill();
      c2.beginPath();c2.moveTo(x+s*.07,y+s*.55+bob);c2.lineTo(x+s*.01,y+s*.72+bob);c2.lineTo(x+s*.14,y+s*.58+bob);c2.closePath();c2.fill();
      // Eye
      c2.fillStyle='#1a1a1a';c2.beginPath();c2.arc(x+s*.82,y+s*.5+bob,s*.03,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.5)';c2.beginPath();c2.arc(x+s*.825,y+s*.495+bob,s*.01,0,Math.PI*2);c2.fill();
      // Gills
      c2.strokeStyle='rgba(0,0,0,0.2)';c2.lineWidth=0.8;for(let g=0;g<3;g++){c2.beginPath();c2.arc(x+s*(.68+g*.04),y+s*.52+bob,s*.06,-.4,.4);c2.stroke();}
      c2.lineWidth=1;
      // Teeth hint
      c2.fillStyle='rgba(240,230,200,0.7)';for(let t2=0;t2<3;t2++)c2.fillRect(x+s*(.9+t2*.022),y+s*.5+bob,s*.015,s*.035);
    } else if(id==='Spider Monkey'||id==='Capybara'||id==='monkey'||id==='capybara'){
      const isMonkey=id.includes('Monkey')||id==='monkey';
      const mCol=isMonkey?blend('#6a4a28','#2a1808',1-br*.9):blend('#8a7a58','#3a2a18',1-br*.9);
      c2.fillStyle=mCol;c2.beginPath();c2.ellipse(x+s*.44,y+s*.53+bob,s*.26,s*.2+breath*.4,0,0,Math.PI*2);c2.fill();
      // Head
      c2.beginPath();c2.ellipse(x+s*.74,y+s*.38+bob,s*.18,s*.18,0,0,Math.PI*2);c2.fill();
      if(isMonkey){
        // Face lighter
        c2.fillStyle=blend('#c8a878','#7a5838',1-br*.7);c2.beginPath();c2.ellipse(x+s*.78,y+s*.42+bob,s*.1,s*.1,0,0,Math.PI*2);c2.fill();
        // Long arms
        c2.strokeStyle=mCol;c2.lineWidth=s*.07;
        c2.beginPath();c2.moveTo(x+s*.6,y+s*.44+bob);c2.quadraticCurveTo(x+s*.45,y+s*.26+bob,x+s*.32,y+s*.22+bob);c2.stroke();
        c2.beginPath();c2.moveTo(x+s*.6,y+s*.44+bob);c2.quadraticCurveTo(x+s*.75,y+s*.26+bob,x+s*.88,y+s*.24+bob);c2.stroke();
        c2.lineWidth=1;
        // Tail curling
        c2.strokeStyle=mCol;c2.lineWidth=s*.06;
        c2.beginPath();c2.moveTo(x+s*.2,y+s*.52+bob);c2.bezierCurveTo(x+s*.04,y+s*.62+bob,x,y+s*.3+bob,x+s*.1,y+s*.18+bob);c2.stroke();c2.lineWidth=1;
      } else {
        // Capybara: big and round, like a barrel
        c2.fillStyle=blend('#9a8a68','#4a3828',1-br*.8);
        c2.beginPath();c2.ellipse(x+s*.4,y+s*.55+bob,s*.3,s*.22+breath*.5,0,0,Math.PI*2);c2.fill();
        c2.fillStyle=mCol;c2.beginPath();c2.ellipse(x+s*.72,y+s*.5+bob,s*.2,s*.19,0.1,0,Math.PI*2);c2.fill();
        // Big flat nose
        c2.fillStyle=blend('#7a6a48','#3a2a18',1-br*.8);c2.beginPath();c2.ellipse(x+s*.87,y+s*.52+bob,s*.1,s*.08,0.1,0,Math.PI*2);c2.fill();
      }
      c2.fillStyle='#1a1a10';c2.beginPath();c2.arc(x+s*.8,y+s*.36+bob,s*.03,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.6)';c2.beginPath();c2.arc(x+s*.81,y+s*.355+bob,s*.01,0,Math.PI*2);c2.fill();
      // Legs
      c2.fillStyle=mCol;const lb2=Math.sin(t*5)*s*.04;
      [.28,.4,.56,.68].forEach((lx,i)=>{c2.fillRect(x+s*lx,y+s*.68+bob,s*.08,s*.22+(i%2?-lb2:lb2));});
    } else if(id==='Jaguar'||id==='jaguar'){
      const jCol=blend('#c8a020','#5a3808',1-br*.9);
      c2.fillStyle=jCol;c2.beginPath();c2.ellipse(x+s*.44,y+s*.5+bob,s*.3,s*.2+breath*.5,-.05,0,Math.PI*2);c2.fill();
      // Spots rosettes
      c2.fillStyle='rgba(50,20,0,0.45)';
      [[.22,.46,.06],[.36,.42,.07],[.52,.44,.06],[.44,.58,.07],[.3,.6,.055],[.58,.56,.06]].forEach(([rx,ry,rr])=>{c2.beginPath();c2.arc(x+s*rx,y+s*ry+bob,s*rr,0,Math.PI*2);c2.fill();});
      // Head
      c2.fillStyle=jCol;c2.beginPath();c2.ellipse(x+s*.76,y+s*.38+bob,s*.2,s*.18,-.1,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(50,20,0,0.35)';c2.beginPath();c2.arc(x+s*.72,y+s*.36+bob,s*.05,0,Math.PI*2);c2.fill();c2.beginPath();c2.arc(x+s*.84,y+s*.35+bob,s*.05,0,Math.PI*2);c2.fill();
      // Snout
      c2.fillStyle=blend('#d8b840','#6a5010',1-br*.8);c2.beginPath();c2.ellipse(x+s*.9,y+s*.44+bob,s*.1,s*.07,.1,0,Math.PI*2);c2.fill();
      // Ears
      c2.fillStyle=jCol;c2.beginPath();c2.moveTo(x+s*.7,y+s*.26+bob);c2.lineTo(x+s*.66,y+s*.12+bob);c2.lineTo(x+s*.78,y+s*.26+bob);c2.fill();
      c2.beginPath();c2.moveTo(x+s*.82,y+s*.25+bob);c2.lineTo(x+s*.8,y+s*.11+bob);c2.lineTo(x+s*.9,y+s*.25+bob);c2.fill();
      // Eye - green
      c2.fillStyle='#3a7a20';c2.beginPath();c2.arc(x+s*.83,y+s*.37+bob,s*.033,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a0a00';c2.beginPath();c2.arc(x+s*.83,y+s*.37+bob,s*.018,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.7)';c2.beginPath();c2.arc(x+s*.838,y+s*.365+bob,s*.007,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a0000';c2.beginPath();c2.arc(x+s*.975,y+s*.43+bob,s*.025,0,Math.PI*2);c2.fill();
      const ls3=Math.sin(t*6)*s*.06;
      c2.fillStyle=jCol;[.26,.38,.58,.7].forEach((lx,i)=>{c2.fillRect(x+s*lx,y+s*.65+bob,s*.08,s*.24+(i%2?-ls3:ls3));});
      // Tail
      c2.strokeStyle=jCol;c2.lineWidth=s*.06;c2.beginPath();c2.moveTo(x+s*.15,y+s*.5+bob);c2.quadraticCurveTo(x+s*.02,y+s*.35+bob+Math.sin(t*2)*s*.05,x+s*.08,y+s*.28+bob);c2.stroke();c2.lineWidth=1;
    } else if(id==='Philippine Eagle'||id==='Golden Eagle'||id==='Andean Condor'||id==='eagle'||id==='Vulture'){
      const isEagle=!id.includes('Vulture');
      const fCol=isEagle?blend('#8a6a28','#3a2808',1-br*.9):blend('#3a3028','#0a0a08',1-br*.9);
      // Body
      c2.fillStyle=fCol;c2.beginPath();c2.ellipse(x+s*.44,y+s*.54+bob,s*.26,s*.18+breath*.3,.05,0,Math.PI*2);c2.fill();
      // Wings spread
      const wingBeat=Math.sin(t*3)*s*.08;
      c2.fillStyle=fCol;
      c2.beginPath();c2.moveTo(x+s*.3,y+s*.5+bob);c2.lineTo(x+s*.06,y+s*.35+bob+wingBeat);c2.lineTo(x+s*.14,y+s*.55+bob);c2.closePath();c2.fill();
      c2.beginPath();c2.moveTo(x+s*.58,y+s*.5+bob);c2.lineTo(x+s*.94,y+s*.35+bob+wingBeat);c2.lineTo(x+s*.86,y+s*.55+bob);c2.closePath();c2.fill();
      // Wing feather detail
      c2.strokeStyle='rgba(0,0,0,0.2)';c2.lineWidth=0.7;
      for(let f=0;f<5;f++){c2.beginPath();c2.moveTo(x+s*(.18+f*.03),y+s*.44+bob+wingBeat*.5);c2.lineTo(x+s*(.09+f*.025),y+s*.5+bob+wingBeat*.5);c2.stroke();}
      for(let f=0;f<5;f++){c2.beginPath();c2.moveTo(x+s*(.7+f*.03),y+s*.44+bob+wingBeat*.5);c2.lineTo(x+s*(.78+f*.03),y+s*.5+bob+wingBeat*.5);c2.stroke();}
      c2.lineWidth=1;
      // Head
      c2.fillStyle=isEagle?blend('#f0e8c8','#8a7848',1-br*.7):blend('#2a2820','#0a0808',1-br*.7);
      c2.beginPath();c2.ellipse(x+s*.74,y+s*.38+bob,s*.16,s*.15,-.1,0,Math.PI*2);c2.fill();
      // Crest (Philippine eagle)
      if(id.includes('Philippine')){
        c2.fillStyle=blend('#d0c888','#7a7038',1-br*.7);for(let cr=0;cr<5;cr++){c2.beginPath();c2.moveTo(x+s*(.7+cr*.04),y+s*.3+bob);c2.lineTo(x+s*(.68+cr*.04),y+s*.14+bob);c2.lineTo(x+s*(.74+cr*.04),y+s*.28+bob);c2.fill();}
      }
      // Beak
      c2.fillStyle=blend('#d0a820','#6a5010',1-br*.8);c2.beginPath();c2.moveTo(x+s*.84,y+s*.38+bob);c2.lineTo(x+s*.96,y+s*.42+bob);c2.lineTo(x+s*.84,y+s*.47+bob);c2.closePath();c2.fill();
      // Eye
      c2.fillStyle='#c8a000';c2.beginPath();c2.arc(x+s*.8,y+s*.36+bob,s*.032,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a1000';c2.beginPath();c2.arc(x+s*.8,y+s*.36+bob,s*.018,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.7)';c2.beginPath();c2.arc(x+s*.808,y+s*.355+bob,s*.007,0,Math.PI*2);c2.fill();
      // Talons
      c2.fillStyle=blend('#c8a020','#6a5010',1-br*.8);c2.fillRect(x+s*.38,y+s*.7+bob,s*.1,s*.06);c2.fillRect(x+s*.52,y+s*.7+bob,s*.1,s*.06);
    } else if(id==='Mountain Goat'||id==='Reindeer'||id==='deer'||id==='goat'){
      const isDeer=id.includes('Deer')||id==='deer'||id.includes('Reindeer');
      const gCol=isDeer?blend('#b08050','#504020',1-br*.9):blend('#d0c8b0','#706850',1-br*.9);
      c2.fillStyle=gCol;c2.beginPath();c2.ellipse(x+s*.42,y+s*.5+bob,s*.28,s*.2+breath*.4,-.05,0,Math.PI*2);c2.fill();
      // Head
      c2.beginPath();c2.ellipse(x+s*.76,y+s*.38+bob,s*.16,s*.18,-.15,0,Math.PI*2);c2.fill();
      // Neck
      c2.beginPath();c2.moveTo(x+s*.62,y+s*.38+bob);c2.lineTo(x+s*.64,y+s*.56+bob);c2.lineTo(x+s*.76,y+s*.52+bob);c2.lineTo(x+s*.74,y+s*.32+bob);c2.closePath();c2.fill();
      // Antlers (deer/reindeer)
      if(isDeer){
        c2.strokeStyle=blend('#a07840','#4a3010',1-br*.8);c2.lineWidth=s*.03;
        c2.beginPath();c2.moveTo(x+s*.7,y+s*.26+bob);c2.lineTo(x+s*.62,y+s*.08+bob);c2.stroke();
        c2.beginPath();c2.moveTo(x+s*.64,y+s*.15+bob);c2.lineTo(x+s*.56,y+s*.1+bob);c2.stroke();
        c2.beginPath();c2.moveTo(x+s*.82,y+s*.24+bob);c2.lineTo(x+s*.9,y+s*.08+bob);c2.stroke();
        c2.beginPath();c2.moveTo(x+s*.88,y+s*.14+bob);c2.lineTo(x+s*.96,y+s*.11+bob);c2.stroke();
        c2.lineWidth=1;
      } else {
        // Goat horns curving back
        c2.strokeStyle=blend('#b09060','#5a4020',1-br*.8);c2.lineWidth=s*.03;
        c2.beginPath();c2.moveTo(x+s*.72,y+s*.24+bob);c2.quadraticCurveTo(x+s*.64,y+s*.06+bob,x+s*.78,y+s*.16+bob);c2.stroke();c2.lineWidth=1;
      }
      // Eye
      c2.fillStyle='#2a1a08';c2.beginPath();c2.arc(x+s*.82,y+s*.35+bob,s*.03,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.6)';c2.beginPath();c2.arc(x+s*.83,y+s*.345+bob,s*.01,0,Math.PI*2);c2.fill();
      // Snout
      c2.fillStyle=blend('#c0a870','#604820',1-br*.75);c2.beginPath();c2.ellipse(x+s*.9,y+s*.43+bob,s*.08,s*.06,.1,0,Math.PI*2);c2.fill();
      c2.fillStyle='#2a1008';c2.beginPath();c2.arc(x+s*.96,y+s*.42+bob,s*.022,0,Math.PI*2);c2.fill();
      // Legs
      const ld=Math.sin(t*5)*s*.05;
      c2.fillStyle=gCol;[.24,.36,.56,.68].forEach((lx,i)=>{c2.fillRect(x+s*lx,y+s*.66+bob,s*.07,s*.26+(i%2?-ld:ld));});
      // Hooves
      c2.fillStyle='#2a1a08';[.24,.36,.56,.68].forEach(lx=>{c2.fillRect(x+s*lx+s*.005,y+s*.88+bob,s*.065,s*.045);});
    } else if(id==='Grizzly Bear'||id==='Polar Bear'||id==='bear'){
      const isP=id.includes('Polar');
      const bCol=isP?blend('#f0f0e8','#b0b0a8',1-br*.6):blend('#6a4818','#1a0e04',1-br*.9);
      c2.fillStyle=bCol;c2.beginPath();c2.ellipse(x+s*.42,y+s*.52+bob,s*.32,s*.26+breath*.6,0,0,Math.PI*2);c2.fill();
      // Hump (grizzly)
      if(!isP){c2.beginPath();c2.ellipse(x+s*.54,y+s*.32+bob,s*.16,s*.12,-.3,0,Math.PI*2);c2.fill();}
      // Head large
      c2.beginPath();c2.ellipse(x+s*.76,y+s*.42+bob,s*.2,s*.21,0,0,Math.PI*2);c2.fill();
      // Ears round
      c2.beginPath();c2.arc(x+s*.7,y+s*.28+bob,s*.07,0,Math.PI*2);c2.fill();
      c2.beginPath();c2.arc(x+s*.84,y+s*.27+bob,s*.07,0,Math.PI*2);c2.fill();
      c2.fillStyle=isP?blend('#d8d8d0','#9898a0',1-br*.6):blend('#3a2808','#0a0602',1-br*.9);
      c2.beginPath();c2.arc(x+s*.7,y+s*.28+bob,s*.04,0,Math.PI*2);c2.fill();
      c2.beginPath();c2.arc(x+s*.84,y+s*.27+bob,s*.04,0,Math.PI*2);c2.fill();
      // Snout
      c2.fillStyle=isP?blend('#e8e8e0','#a8a8a8',1-br*.6):blend('#8a6028','#3a2008',1-br*.8);
      c2.beginPath();c2.ellipse(x+s*.93,y+s*.48+bob,s*.1,s*.09,.15,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a1010';c2.beginPath();c2.arc(x+s*.99,y+s*.46+bob,s*.03,0,Math.PI*2);c2.fill();
      // Eyes
      c2.fillStyle='#1a1010';c2.beginPath();c2.arc(x+s*.8,y+s*.4+bob,s*.033,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.6)';c2.beginPath();c2.arc(x+s*.81,y+s*.394+bob,s*.01,0,Math.PI*2);c2.fill();
      // Fur texture
      c2.strokeStyle=isP?'rgba(200,200,190,0.15)':'rgba(0,0,0,0.1)';c2.lineWidth=0.7;
      for(let f=0;f<6;f++){c2.beginPath();c2.moveTo(x+s*(.2+f*.06),y+s*.38+bob);c2.lineTo(x+s*(.22+f*.06),y+s*.5+bob);c2.stroke();}c2.lineWidth=1;
      // Legs stubby
      const lb3=Math.sin(t*4)*s*.04;
      c2.fillStyle=bCol;[.18,.3,.54,.66].forEach((lx,i)=>{c2.fillRect(x+s*lx,y+s*.7+bob,s*.12,s*.2+(i%2?-lb3:lb3));});
      // Claws
      c2.fillStyle=isP?blend('#d0d0c8','#909090',1-br*.6):'#2a1a08';
      for(let cl=0;cl<3;cl++){c2.fillRect(x+s*(.18+cl*.025),y+s*.88+bob,s*.018,s*.04);c2.fillRect(x+s*(.54+cl*.025),y+s*.88+bob,s*.018,s*.04);}
    } else if(id==='Emperor Penguin'||id==='penguin'){
      // Black body
      c2.fillStyle=blend('#1a1a18','#080808',1-br*.7);
      c2.beginPath();c2.ellipse(x+s*.46,y+s*.52+bob,s*.22,s*.3+breath*.3,0,0,Math.PI*2);c2.fill();
      // White belly
      c2.fillStyle=blend('#f0f0e8','#b0b0a8',1-br*.6);
      c2.beginPath();c2.ellipse(x+s*.44,y+s*.56+bob,s*.12,s*.22,0,0,Math.PI*2);c2.fill();
      // Yellow chest patch
      c2.fillStyle=blend('#e8d040','#907820',1-br*.7);c2.beginPath();c2.ellipse(x+s*.44,y+s*.4+bob,s*.08,s*.06,.1,0,Math.PI*2);c2.fill();
      // Head
      c2.fillStyle=blend('#1a1a18','#080808',1-br*.7);c2.beginPath();c2.arc(x+s*.48,y+s*.26+bob,s*.16,0,Math.PI*2);c2.fill();
      // White face patch
      c2.fillStyle=blend('#f0f0e8','#b0b0a8',1-br*.6);c2.beginPath();c2.ellipse(x+s*.5,y+s*.28+bob,s*.08,s*.1,.05,0,Math.PI*2);c2.fill();
      // Orange beak
      c2.fillStyle=blend('#e08820','#905010',1-br*.7);c2.beginPath();c2.moveTo(x+s*.56,y+s*.26+bob);c2.lineTo(x+s*.68,y+s*.3+bob);c2.lineTo(x+s*.56,y+s*.34+bob);c2.closePath();c2.fill();
      // Eye
      c2.fillStyle='#1a1a18';c2.beginPath();c2.arc(x+s*.58,y+s*.24+bob,s*.025,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.7)';c2.beginPath();c2.arc(x+s*.59,y+s*.236+bob,s*.008,0,Math.PI*2);c2.fill();
      // Flippers
      c2.fillStyle=blend('#1a1a18','#080808',1-br*.7);
      c2.beginPath();c2.ellipse(x+s*.28,y+s*.5+bob+Math.sin(t*2)*s*.04,s*.07,s*.18,-.4,0,Math.PI*2);c2.fill();
      c2.beginPath();c2.ellipse(x+s*.64,y+s*.5+bob-Math.sin(t*2)*s*.04,s*.07,s*.18,.4,0,Math.PI*2);c2.fill();
      // Feet orange
      c2.fillStyle=blend('#e08820','#905010',1-br*.7);c2.fillRect(x+s*.36,y+s*.78+bob,s*.14,s*.05);c2.fillRect(x+s*.54,y+s*.78+bob,s*.12,s*.05);
    } else if(id==='Plains Zebra'||id==='zebra'){
      c2.fillStyle=blend('#f0f0e8','#b0b0a0',1-br*.8);
      c2.beginPath();c2.ellipse(x+s*.42,y+s*.5+bob,s*.28,s*.2+breath*.4,-.05,0,Math.PI*2);c2.fill();
      // Stripes
      c2.fillStyle=blend('#1a1a10','#080808',1-br*.7);
      [[.2,.36,.04,.22],[.3,.38,.045,.2],[.42,.4,.045,.2],[.54,.4,.04,.18],[.64,.42,.04,.16],[.72,.44,.035,.14]].forEach(([bx,by,bw,bh])=>{
        c2.save();c2.rotate(-.1);c2.fillRect(x+s*bx-2,y+s*by+bob,s*bw,s*bh);c2.restore();
      });
      // Head
      c2.fillStyle=blend('#f0f0e8','#b0b0a0',1-br*.8);c2.beginPath();c2.ellipse(x+s*.76,y+s*.38+bob,s*.16,s*.18,-.1,0,Math.PI*2);c2.fill();
      c2.fillStyle=blend('#e0e0d8','#a0a098',1-br*.75);c2.beginPath();c2.ellipse(x+s*.89,y+s*.44+bob,s*.08,s*.06,.1,0,Math.PI*2);c2.fill();
      // Stripe on head
      c2.fillStyle=blend('#1a1a10','#080808',1-br*.7);c2.fillRect(x+s*.7,y+s*.3+bob,s*.04,s*.18);c2.fillRect(x+s*.8,y+s*.28+bob,s*.04,s*.2);
      // Mane
      c2.fillStyle='#1a1a10';for(let m=0;m<5;m++){c2.fillRect(x+s*(.52+m*.04),y+s*.3+bob,s*.025,s*.08+Math.sin(t+m)*.5);}
      // Eye
      c2.fillStyle='#1a1a10';c2.beginPath();c2.arc(x+s*.82,y+s*.35+bob,s*.03,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.6)';c2.beginPath();c2.arc(x+s*.83,y+s*.345+bob,s*.009,0,Math.PI*2);c2.fill();
      // Ears
      c2.fillStyle=blend('#f0f0e8','#b0b0a0',1-br*.8);c2.beginPath();c2.moveTo(x+s*.72,y+s*.27+bob);c2.lineTo(x+s*.68,y+s*.13+bob);c2.lineTo(x+s*.78,y+s*.26+bob);c2.fill();
      // Legs with stripes
      const lz=Math.sin(t*5)*s*.05;
      c2.fillStyle=blend('#f0f0e8','#b0b0a0',1-br*.8);[.24,.36,.56,.68].forEach((lx,i)=>{c2.fillRect(x+s*lx,y+s*.66+bob,s*.07,s*.25+(i%2?-lz:lz));});
      c2.fillStyle=blend('#1a1a10','#080808',1-br*.7);[.24,.36,.56,.68].forEach((lx,i)=>{for(let st=0;st<3;st++)c2.fillRect(x+s*lx,y+s*(.68+st*.07)+bob,s*.07,s*.02);});
    } else if(id==='Giraffe'||id==='giraffe'){
      const gCol2=blend('#e8b840','#7a5010',1-br*.85);
      // Long neck
      c2.fillStyle=gCol2;c2.beginPath();c2.moveTo(x+s*.56,y+s*.28+bob);c2.lineTo(x+s*.62,y+s*.8+bob);c2.lineTo(x+s*.72,y+s*.8+bob);c2.lineTo(x+s*.68,y+s*.26+bob);c2.closePath();c2.fill();
      // Body
      c2.beginPath();c2.ellipse(x+s*.38,y+s*.72+bob,s*.28,s*.2+breath*.4,-.1,0,Math.PI*2);c2.fill();
      // Patches
      c2.fillStyle=blend('#a05818','#4a1808',1-br*.85);
      [[.38,.58,.08],[.28,.64,.07],[.48,.66,.075],[.36,.78,.065],[.52,.76,.07],[.26,.76,.06],[.6,.62,.07]].forEach(([px,py,pr])=>{c2.beginPath();c2.arc(x+s*px,y+s*py+bob,s*pr,0,Math.PI*2);c2.fill();});
      // Head small
      c2.fillStyle=gCol2;c2.beginPath();c2.ellipse(x+s*.68,y+s*.2+bob,s*.12,s*.1,-.2,0,Math.PI*2);c2.fill();
      // Ossicones (horns)
      c2.fillStyle=blend('#c09030','#604810',1-br*.8);c2.fillRect(x+s*.63,y+s*.1+bob,s*.03,s*.1);c2.fillRect(x+s*.72,y+s*.09+bob,s*.03,s*.12);
      c2.beginPath();c2.arc(x+s*.635,y+s*.1+bob,s*.025,0,Math.PI*2);c2.fill();c2.beginPath();c2.arc(x+s*.725,y+s*.09+bob,s*.025,0,Math.PI*2);c2.fill();
      // Eye
      c2.fillStyle='#1a1008';c2.beginPath();c2.arc(x+s*.73,y+s*.19+bob,s*.025,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.6)';c2.beginPath();c2.arc(x+s*.738,y+s*.186+bob,s*.008,0,Math.PI*2);c2.fill();
      // Ears
      c2.fillStyle=gCol2;c2.beginPath();c2.ellipse(x+s*.62,y+s*.17+bob,s*.04,s*.07,-.3,0,Math.PI*2);c2.fill();
      // Long legs
      const lg=Math.sin(t*4)*s*.05;
      c2.fillStyle=gCol2;[.14,.26,.48,.6].forEach((lx,i)=>{c2.fillRect(x+s*lx,y+s*.84+bob,s*.07,s*.38+(i%2?-lg:lg));});
      c2.fillStyle='#2a1808';[.14,.26,.48,.6].forEach(lx=>{c2.fillRect(x+s*lx+s*.01,y+s*.98+bob,s*.055,s*.04);});
    } else if(id==='African Lion'||id==='lion'){
      const lCol=blend('#d4a040','#6a4810',1-br*.9);
      c2.fillStyle=lCol;c2.beginPath();c2.ellipse(x+s*.42,y+s*.5+bob,s*.3,s*.22+breath*.5,-.05,0,Math.PI*2);c2.fill();
      // Head large
      c2.beginPath();c2.arc(x+s*.74,y+s*.42+bob,s*.24,0,Math.PI*2);c2.fill();
      // Mane (male lion — dark brown rings)
      c2.fillStyle=blend('#3a1808','#0a0400',1-br*.8);
      for(let m=0;m<12;m++){const ma=m/12*Math.PI*2,mr=s*.26+Math.sin(m)*s*.03;c2.beginPath();c2.ellipse(x+s*.74+Math.cos(ma)*mr,y+s*.42+bob+Math.sin(ma)*mr,s*.06,s*.04,ma,0,Math.PI*2);c2.fill();}
      c2.fillStyle=lCol;c2.beginPath();c2.arc(x+s*.74,y+s*.42+bob,s*.19,0,Math.PI*2);c2.fill();
      // Face
      c2.fillStyle=blend('#e8b850','#7a5818',1-br*.8);c2.beginPath();c2.arc(x+s*.76,y+s*.44+bob,s*.14,0,Math.PI*2);c2.fill();
      // Snout
      c2.fillStyle=blend('#f0c878','#906838',1-br*.75);c2.beginPath();c2.ellipse(x+s*.9,y+s*.48+bob,s*.1,s*.07,.1,0,Math.PI*2);c2.fill();
      c2.fillStyle='#2a1010';c2.beginPath();c2.arc(x+s*.97,y+s*.46+bob,s*.025,0,Math.PI*2);c2.fill();
      // Eyes amber
      c2.fillStyle='#c88000';c2.beginPath();c2.arc(x+s*.8,y+s*.39+bob,s*.035,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a0a00';c2.beginPath();c2.arc(x+s*.8,y+s*.39+bob,s*.02,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.7)';c2.beginPath();c2.arc(x+s*.808,y+s*.385+bob,s*.007,0,Math.PI*2);c2.fill();
      const ll=Math.sin(t*5)*s*.06;
      c2.fillStyle=lCol;[.22,.34,.58,.7].forEach((lx,i)=>{c2.fillRect(x+s*lx,y+s*.66+bob,s*.09,s*.24+(i%2?-ll:ll));});
      // Tail with tuft
      c2.strokeStyle=lCol;c2.lineWidth=s*.06;c2.beginPath();c2.moveTo(x+s*.14,y+s*.5+bob);c2.quadraticCurveTo(x+s*.02,y+s*.32+bob+Math.sin(t*1.5)*s*.05,x+s*.06,y+s*.24+bob);c2.stroke();c2.lineWidth=1;
      c2.fillStyle=blend('#3a1808','#0a0400',1-br*.8);c2.beginPath();c2.arc(x+s*.07,y+s*.24+bob,s*.06,0,Math.PI*2);c2.fill();
    } else if(id==='African Elephant'||id==='elephant'){
      const eCol=blend('#8a7a6a','#3a2a1a',1-br*.9);
      c2.fillStyle=eCol;c2.beginPath();c2.ellipse(x+s*.4,y+s*.52+bob,s*.34,s*.28+breath*.7,-.05,0,Math.PI*2);c2.fill();
      // Head large
      c2.beginPath();c2.ellipse(x+s*.75,y+s*.44+bob,s*.24,s*.26,.05,0,Math.PI*2);c2.fill();
      // Ears (huge fan)
      c2.fillStyle=blend('#7a6a58','#2a1a0a',1-br*.85);
      c2.beginPath();c2.ellipse(x+s*.62,y+s*.42+bob,s*.14,s*.26,-.3,0,Math.PI*2);c2.fill();
      c2.beginPath();c2.ellipse(x+s*.88,y+s*.4+bob,s*.14,s*.26,.3,0,Math.PI*2);c2.fill();
      // Trunk curling
      c2.strokeStyle=eCol;c2.lineWidth=s*.09;
      c2.beginPath();c2.moveTo(x+s*.82,y+s*.56+bob);c2.quadraticCurveTo(x+s*.94,y+s*.76+bob+Math.sin(t*.8)*s*.04,x+s*.86,y+s*.82+bob);c2.stroke();c2.lineWidth=1;
      // Tusks
      c2.strokeStyle=blend('#f0e8c0','#9090a0',1-br*.6);c2.lineWidth=s*.025;
      c2.beginPath();c2.moveTo(x+s*.76,y+s*.6+bob);c2.quadraticCurveTo(x+s*.94,y+s*.7+bob,x+s*.98,y+s*.64+bob);c2.stroke();c2.lineWidth=1;
      // Eye
      c2.fillStyle='#1a1010';c2.beginPath();c2.arc(x+s*.82,y+s*.4+bob,s*.03,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.5)';c2.beginPath();c2.arc(x+s*.828,y+s*.396+bob,s*.01,0,Math.PI*2);c2.fill();
      // Legs very thick
      const le=Math.sin(t*3.5)*s*.04;
      c2.fillStyle=eCol;[.12,.24,.52,.64].forEach((lx,i)=>{c2.fillRect(x+s*lx,y+s*.72+bob,s*.14,s*.26+(i%2?-le:le));});
      // Wrinkles
      c2.strokeStyle='rgba(0,0,0,0.1)';c2.lineWidth=0.6;for(let wr=0;wr<4;wr++){c2.beginPath();c2.arc(x+s*(.44+wr*.06),y+s*.5+bob,s*.1,-.5,.5);c2.stroke();}c2.lineWidth=1;
    } else if(id==='Giant Octopus'||id==='octopus'){
      const oCol=blend('#8a3a6a','#3a0a28',1-br*.9);
      c2.fillStyle=oCol;c2.beginPath();c2.arc(x+s*.5,y+s*.38+bob,s*.22,0,Math.PI*2);c2.fill();
      // Mantle
      c2.beginPath();c2.ellipse(x+s*.5,y+s*.28+bob,s*.18,s*.22,0,0,Math.PI*2);c2.fill();
      // 8 tentacles
      for(let tn=0;tn<8;tn++){
        const ta=tn/8*Math.PI*2+(t*.5);
        const tr=s*.24,curl=Math.sin(t*2+tn)*s*.08;
        c2.strokeStyle=oCol;c2.lineWidth=s*.07*(1-tn/12);
        c2.beginPath();c2.moveTo(x+s*.5+Math.cos(ta)*tr,y+s*.48+bob+Math.sin(ta)*tr*.6);
        c2.quadraticCurveTo(x+s*.5+Math.cos(ta+.4)*tr*1.6+curl,y+s*.48+bob+Math.sin(ta+.4)*tr+curl,x+s*.5+Math.cos(ta+.8)*tr*2.2,y+s*.52+bob+Math.sin(ta+.8)*tr*1.4);
        c2.stroke();
        // Suckers
        c2.fillStyle='rgba(255,220,220,0.5)';c2.beginPath();c2.arc(x+s*.5+Math.cos(ta+.5)*tr*1.4,y+s*.48+bob+Math.sin(ta+.5)*tr*.9,s*.018,0,Math.PI*2);c2.fill();
      }
      c2.lineWidth=1;
      // Eyes
      c2.fillStyle='#f0e800';c2.beginPath();c2.arc(x+s*.42,y+s*.36+bob,s*.05,0,Math.PI*2);c2.fill();c2.beginPath();c2.arc(x+s*.58,y+s*.36+bob,s*.05,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a1010';c2.beginPath();c2.arc(x+s*.42,y+s*.36+bob,s*.03,0,Math.PI*2);c2.fill();c2.beginPath();c2.arc(x+s*.58,y+s*.36+bob,s*.03,0,Math.PI*2);c2.fill();
      // Spots
      c2.fillStyle='rgba(180,100,160,0.4)';for(let sp=0;sp<6;sp++){c2.beginPath();c2.arc(x+s*(.36+Math.cos(sp)*0.2),y+s*(.3+Math.sin(sp)*0.14)+bob,s*.035,0,Math.PI*2);c2.fill();}
    } else if(id==='Komodo Dragon'||id==='komodo'){
      const kCol=blend('#5a6030','#1a1a08',1-br*.9);
      c2.fillStyle=kCol;c2.beginPath();c2.ellipse(x+s*.4,y+s*.6+bob,s*.34,s*.12+breath*.3,0,0,Math.PI*2);c2.fill();
      // Long tail
      c2.beginPath();c2.moveTo(x+s*.08,y+s*.62+bob);c2.quadraticCurveTo(x,y+s*.68+bob+Math.sin(t*1.2)*s*.04,x+s*.06,y+s*.72+bob);c2.fill();
      // Head
      c2.beginPath();c2.ellipse(x+s*.82,y+s*.56+bob,s*.2,s*.09,.05,0,Math.PI*2);c2.fill();
      // Scales texture
      c2.fillStyle='rgba(0,0,0,0.15)';for(let sc=0;sc<8;sc++){c2.beginPath();c2.arc(x+s*(.14+sc*.09),y+s*.58+bob,s*.03,0,Math.PI*2);c2.fill();}
      // Eye
      c2.fillStyle='#d4a000';c2.beginPath();c2.ellipse(x+s*.9,y+s*.52+bob,s*.04,s*.025,0,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a1000';c2.beginPath();c2.ellipse(x+s*.9,y+s*.52+bob,s*.025,s*.018,0,0,Math.PI*2);c2.fill();
      // Tongue forked
      c2.strokeStyle='#e02020';c2.lineWidth=s*.02;c2.beginPath();c2.moveTo(x+s*.98,y+s*.56+bob);c2.lineTo(x+s*1.04,y+s*.54+bob+Math.sin(t*8)*s*.015);c2.stroke();c2.beginPath();c2.moveTo(x+s*.98,y+s*.56+bob);c2.lineTo(x+s*1.04,y+s*.58+bob-Math.sin(t*8)*s*.015);c2.stroke();c2.lineWidth=1;
      // Legs short
      const lk=Math.sin(t*5)*s*.04;c2.fillStyle=kCol;
      [[.18,.68,.1,.12],[.3,.68,.1,.12],[.56,.66,.1,.12],[.66,.66,.1,.12]].forEach(([lx,ly,lw,lh],i)=>{c2.fillRect(x+s*lx,y+s*ly+bob,s*lw,s*lh+(i%2?-lk:lk));});
    } else if(id==='Phoenix Bird'){
      // Fiery mythical bird
      const flicker=Math.sin(t*4)*0.3;
      c2.fillStyle=blend('#e84800','#7a0800',1-br*.8);c2.beginPath();c2.ellipse(x+s*.44,y+s*.52+bob,s*.24,s*.18+breath*.3,.05,0,Math.PI*2);c2.fill();
      // Flame wings
      c2.fillStyle=`rgba(255,${140+Math.floor(flicker*80)},0,0.9)`;
      c2.beginPath();c2.moveTo(x+s*.32,y+s*.5+bob);c2.bezierCurveTo(x+s*.12,y+s*.2+bob+Math.sin(t*3)*s*.06,x,y+s*.4+bob,x+s*.08,y+s*.62+bob);c2.closePath();c2.fill();
      c2.beginPath();c2.moveTo(x+s*.56,y+s*.5+bob);c2.bezierCurveTo(x+s*.78,y+s*.2+bob+Math.sin(t*3+1)*s*.06,x+s*.9,y+s*.4+bob,x+s*.82,y+s*.62+bob);c2.closePath();c2.fill();
      // Inner wing glow
      c2.fillStyle=`rgba(255,220,80,${0.6+flicker*.3})`;
      c2.beginPath();c2.moveTo(x+s*.34,y+s*.5+bob);c2.bezierCurveTo(x+s*.18,y+s*.28+bob,x+s*.12,y+s*.42+bob,x+s*.2,y+s*.6+bob);c2.closePath();c2.fill();
      c2.beginPath();c2.moveTo(x+s*.54,y+s*.5+bob);c2.bezierCurveTo(x+s*.7,y+s*.28+bob,x+s*.76,y+s*.42+bob,x+s*.68,y+s*.6+bob);c2.closePath();c2.fill();
      // Head
      c2.fillStyle=blend('#ff6800','#8a2000',1-br*.8);c2.beginPath();c2.arc(x+s*.72,y+s*.36+bob,s*.16,0,Math.PI*2);c2.fill();
      // Crest flames
      c2.fillStyle='#ffe040';for(let cr=0;cr<5;cr++){c2.beginPath();c2.moveTo(x+s*(.66+cr*.04),y+s*.28+bob);c2.lineTo(x+s*(.64+cr*.04),y+s*(.1+Math.sin(t*4+cr)*.05)+bob);c2.lineTo(x+s*(.72+cr*.04),y+s*.26+bob);c2.fill();}
      // Beak golden
      c2.fillStyle=blend('#f0c820','#806010',1-br*.8);c2.beginPath();c2.moveTo(x+s*.82,y+s*.35+bob);c2.lineTo(x+s*.96,y+s*.39+bob);c2.lineTo(x+s*.82,y+s*.43+bob);c2.closePath();c2.fill();
      // Eye glowing
      c2.fillStyle='#ffe000';c2.beginPath();c2.arc(x+s*.78,y+s*.34+bob,s*.04,0,Math.PI*2);c2.fill();
      c2.fillStyle='#ff2000';c2.beginPath();c2.arc(x+s*.78,y+s*.34+bob,s*.022,0,Math.PI*2);c2.fill();
      // Tail feathers (flame)
      for(let tf=0;tf<5;tf++){
        const ta2=tf/5*.6-.3;
        c2.fillStyle=`rgba(255,${80+tf*30},0,${0.8-tf*.1})`;
        c2.beginPath();c2.moveTo(x+s*.22,y+s*.56+bob);c2.quadraticCurveTo(x+s*(.1+tf*.04),y+s*(.7+tf*.04)+bob+Math.sin(t*3+tf)*s*.04,x+s*(.08+tf*.03),y+s*(.85+tf*.02)+bob);c2.lineTo(x+s*(.16+tf*.04),y+s*.86+bob);c2.closePath();c2.fill();
      }
    } else if(id==='Blue Whale'||id==='Orca'||id==='whale'||id==='orca'){
      const isOrca=id==='Orca'||id==='orca';
      const wCol=isOrca?blend('#1a1a18','#060606',1-br*.8):blend('#4a7aaa','#1a3a5a',1-br*.85);
      // Massive body
      c2.fillStyle=wCol;c2.beginPath();c2.moveTo(x+s*.04,y+s*.52+bob);c2.bezierCurveTo(x+s*.2,y+s*.32+bob,x+s*.7,y+s*.32+bob,x+s*.96,y+s*.52+bob);c2.bezierCurveTo(x+s*.7,y+s*.72+bob,x+s*.2,y+s*.72+bob,x+s*.04,y+s*.52+bob);c2.fill();
      // Belly
      c2.fillStyle=isOrca?blend('#f0f0e8','#b0b0a0',1-br*.65):blend('#8abae0','#4070a0',1-br*.7);
      c2.beginPath();c2.moveTo(x+s*.2,y+s*.52+bob);c2.bezierCurveTo(x+s*.32,y+s*.42+bob,x+s*.62,y+s*.42+bob,x+s*.8,y+s*.52+bob);c2.bezierCurveTo(x+s*.62,y+s*.62+bob,x+s*.32,y+s*.62+bob,x+s*.2,y+s*.52+bob);c2.fill();
      // Orca patch
      if(isOrca){c2.fillStyle=blend('#f0f0e8','#b0b0a0',1-br*.65);c2.beginPath();c2.ellipse(x+s*.52,y+s*.36+bob,s*.1,s*.08,0,0,Math.PI*2);c2.fill();}
      // Dorsal fin
      c2.fillStyle=wCol;c2.beginPath();c2.moveTo(x+s*.48,y+s*.34+bob);c2.lineTo(x+s*.52,y+s*.12+bob);c2.lineTo(x+s*.58,y+s*.34+bob);c2.closePath();c2.fill();
      // Flukes tail
      c2.beginPath();c2.moveTo(x+s*.08,y+s*.52+bob);c2.lineTo(x+s*.01,y+s*.36+bob);c2.lineTo(x+s*.14,y+s*.48+bob);c2.fill();
      c2.beginPath();c2.moveTo(x+s*.08,y+s*.52+bob);c2.lineTo(x+s*.01,y+s*.68+bob);c2.lineTo(x+s*.14,y+s*.56+bob);c2.fill();
      // Pec fin
      c2.beginPath();c2.moveTo(x+s*.36,y+s*.54+bob);c2.lineTo(x+s*.22,y+s*.72+bob);c2.lineTo(x+s*.44,y+s*.6+bob);c2.fill();
      // Eye
      c2.fillStyle=isOrca?'#fff':'#f0e8c0';c2.beginPath();c2.arc(x+s*.82,y+s*.46+bob,s*.04,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a1010';c2.beginPath();c2.arc(x+s*.82,y+s*.46+bob,s*.025,0,Math.PI*2);c2.fill();
      // Baleen / mouth hint
      c2.strokeStyle='rgba(0,0,0,0.2)';c2.lineWidth=0.5;c2.beginPath();c2.arc(x+s*.9,y+s*.52+bob,s*.12,Math.PI*.6,Math.PI*.9);c2.stroke();c2.lineWidth=1;
    } else if(id==='Scarlet Macaw'||id==='Toucan'||id==='macaw'||id==='toucan'){
      const isM=id.includes('Macaw')||id==='macaw';
      // Body
      c2.fillStyle=isM?blend('#d02020','#680808',1-br*.9):blend('#2a2a18','#080808',1-br*.8);
      c2.beginPath();c2.ellipse(x+s*.46,y+s*.54+bob,s*.22,s*.18+breath*.3,0.1,0,Math.PI*2);c2.fill();
      // Wing
      c2.fillStyle=isM?blend('#c83020','#600808',1-br*.9):blend('#1a1a10','#060608',1-br*.8);
      c2.beginPath();c2.ellipse(x+s*.42,y+s*.52+bob,s*.2,s*.14,.15,0,Math.PI*2);c2.fill();
      // Wing detail (macaw: blue/yellow; toucan: white+yellow)
      if(isM){
        c2.fillStyle=blend('#2040d0','#081068',1-br*.8);c2.beginPath();c2.ellipse(x+s*.32,y+s*.5+bob,s*.12,s*.08,.2,0,Math.PI*2);c2.fill();
        c2.fillStyle=blend('#e0c020','#706008',1-br*.8);c2.beginPath();c2.ellipse(x+s*.22,y+s*.52+bob,s*.1,s*.07,.25,0,Math.PI*2);c2.fill();
      } else {
        c2.fillStyle='rgba(255,255,255,0.8)';c2.beginPath();c2.ellipse(x+s*.46,y+s*.54+bob,s*.14,s*.12,0.1,0,Math.PI*2);c2.fill();
      }
      // Head
      c2.fillStyle=isM?blend('#d02020','#680808',1-br*.9):blend('#2a2a18','#080808',1-br*.8);
      c2.beginPath();c2.arc(x+s*.74,y+s*.36+bob,s*.16,0,Math.PI*2);c2.fill();
      // Face patch (macaw white; toucan yellow)
      c2.fillStyle=isM?'rgba(255,255,255,0.9)':blend('#e0c020','#706008',1-br*.75);
      c2.beginPath();c2.ellipse(x+s*.8,y+s*.38+bob,s*.1,s*.09,0,0,Math.PI*2);c2.fill();
      // Beak (toucan huge, macaw curved)
      c2.fillStyle=isM?blend('#d0a020','#686008',1-br*.8):blend('#e8c020','#806010',1-br*.75);
      if(isM){c2.beginPath();c2.moveTo(x+s*.84,y+s*.35+bob);c2.quadraticCurveTo(x+s*.98,y+s*.36+bob,x+s*.92,y+s*.44+bob);c2.lineTo(x+s*.84,y+s*.42+bob);c2.closePath();c2.fill();}
      else{c2.beginPath();c2.moveTo(x+s*.86,y+s*.33+bob);c2.lineTo(x+s*1.08,y+s*.42+bob);c2.lineTo(x+s*.86,y+s*.46+bob);c2.closePath();c2.fill();c2.fillStyle=blend('#e03010','#701008',1-br*.8);c2.beginPath();c2.moveTo(x+s*.86,y+s*.46+bob);c2.lineTo(x+s*1.06,y+s*.48+bob);c2.lineTo(x+s*.86,y+s*.5+bob);c2.closePath();c2.fill();}
      // Eye
      c2.fillStyle='#1a1a0a';c2.beginPath();c2.arc(x+s*.8,y+s*.34+bob,s*.03,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.7)';c2.beginPath();c2.arc(x+s*.808,y+s*.335+bob,s*.01,0,Math.PI*2);c2.fill();
      // Tail feathers (macaw long)
      if(isM){c2.fillStyle=blend('#2040d0','#081068',1-br*.8);c2.beginPath();c2.moveTo(x+s*.26,y+s*.62+bob);c2.lineTo(x+s*.08,y+s*.82+bob+Math.sin(t*2)*s*.03);c2.lineTo(x+s*.2,y+s*.82+bob);c2.fill();c2.fillStyle=blend('#e0c020','#706008',1-br*.8);c2.beginPath();c2.moveTo(x+s*.28,y+s*.62+bob);c2.lineTo(x+s*.12,y+s*.84+bob+Math.sin(t*2+.5)*s*.03);c2.lineTo(x+s*.22,y+s*.84+bob);c2.fill();}
      // Feet
      c2.fillStyle=blend('#9a8848','#4a3818',1-br*.7);c2.fillRect(x+s*.42,y+s*.7+bob,s*.1,s*.05);c2.fillRect(x+s*.54,y+s*.7+bob,s*.1,s*.05);
    } else if(id==='Three-Toe Sloth'||id==='sloth'){
      const slCol=blend('#8a7858','#3a2818',1-br*.8);
      c2.fillStyle=slCol;c2.beginPath();c2.ellipse(x+s*.46,y+s*.4+bob,s*.26,s*.22+breath*.4,-.1,0,Math.PI*2);c2.fill();
      // Hanging arms (long)
      c2.strokeStyle=slCol;c2.lineWidth=s*.1;
      c2.beginPath();c2.moveTo(x+s*.32,y+s*.38+bob);c2.lineTo(x+s*.18,y+s*.18+bob);c2.lineTo(x+s*.08,y+s*.28+bob);c2.stroke();
      c2.beginPath();c2.moveTo(x+s*.6,y+s*.38+bob);c2.lineTo(x+s*.74,y+s*.18+bob);c2.lineTo(x+s*.84,y+s*.28+bob);c2.stroke();
      c2.lineWidth=1;
      // Claws
      c2.fillStyle='#2a1808';c2.fillRect(x+s*.04,y+s*.26+bob,s*.06,s*.04);c2.fillRect(x+s*.82,y+s*.26+bob,s*.06,s*.04);
      // Head round, tiny
      c2.fillStyle=slCol;c2.beginPath();c2.arc(x+s*.68,y+s*.3+bob,s*.14,0,Math.PI*2);c2.fill();
      // Face mask
      c2.fillStyle=blend('#7a6848','#2a1808',1-br*.75);c2.beginPath();c2.ellipse(x+s*.72,y+s*.32+bob,s*.09,s*.08,0,0,Math.PI*2);c2.fill();
      // Small eyes
      c2.fillStyle='#1a1010';c2.beginPath();c2.arc(x+s*.68,y+s*.3+bob,s*.025,0,Math.PI*2);c2.fill();c2.beginPath();c2.arc(x+s*.78,y+s*.29+bob,s*.025,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.5)';c2.beginPath();c2.arc(x+s*.688,y+s*.296+bob,s*.008,0,Math.PI*2);c2.fill();
      // Nose
      c2.fillStyle='#1a1010';c2.beginPath();c2.ellipse(x+s*.78,y+s*.34+bob,s*.04,s*.03,0,0,Math.PI*2);c2.fill();
      // Fur texture lines
      c2.strokeStyle='rgba(0,0,0,0.1)';c2.lineWidth=0.5;for(let f=0;f<5;f++){c2.beginPath();c2.moveTo(x+s*(.28+f*.06),y+s*.3+bob);c2.lineTo(x+s*(.3+f*.06),y+s*.44+bob);c2.stroke();}c2.lineWidth=1;
    } else if(id==='Anaconda'||id==='anaconda'){
      const aCol=blend('#4a6a28','#1a2808',1-br*.9);
      const coilOffset=Math.sin(t*.8)*s*.03;
      // Coiled body
      c2.fillStyle=aCol;c2.beginPath();c2.ellipse(x+s*.42,y+s*.58+bob,s*.32,s*.22,0,0,Math.PI*2);c2.fill();
      // Pattern scales
      c2.fillStyle=blend('#3a5818','#0a1808',1-br*.9);for(let sc=0;sc<8;sc++){c2.beginPath();c2.ellipse(x+s*(.16+sc*.08),y+s*.56+bob,s*.04,s*.06,.3,0,Math.PI*2);c2.fill();}
      // Yellow belly stripe
      c2.fillStyle=blend('#d0c840','#686010',1-br*.8);c2.beginPath();c2.ellipse(x+s*.4,y+s*.62+bob,s*.28,s*.06,0,0,Math.PI*2);c2.fill();
      // Head
      c2.fillStyle=aCol;c2.beginPath();c2.ellipse(x+s*.76,y+s*.44+bob,s*.16,s*.1,.2,0,Math.PI*2);c2.fill();
      // Scales on head
      c2.strokeStyle='rgba(0,0,0,0.15)';c2.lineWidth=0.5;for(let hs=0;hs<4;hs++){c2.beginPath();c2.arc(x+s*(.66+hs*.06),y+s*.42+bob,s*.04,0,Math.PI);c2.stroke();}c2.lineWidth=1;
      // Eye with slit pupil
      c2.fillStyle='#d4a000';c2.beginPath();c2.ellipse(x+s*.86,y+s*.41+bob,s*.04,s*.03,0,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a1000';c2.beginPath();c2.ellipse(x+s*.86,y+s*.41+bob,s*.012,s*.024,0,0,Math.PI*2);c2.fill();
      // Tongue
      c2.strokeStyle='#e02020';c2.lineWidth=s*.015;c2.beginPath();c2.moveTo(x+s*.9,y+s*.45+bob);c2.lineTo(x+s*.96,y+s*.43+bob+Math.sin(t*8)*s*.01);c2.stroke();c2.beginPath();c2.moveTo(x+s*.9,y+s*.45+bob);c2.lineTo(x+s*.96,y+s*.47+bob-Math.sin(t*8)*s*.01);c2.stroke();c2.lineWidth=1;
    } else if(id==='Arctic Fox'||id==='Leopard Seal'||id==='River Otter'){
      const isOtter=id.includes('Otter'),isSeal=id.includes('Seal');
      const aFCol=isSeal?blend('#6a6a68','#2a2a28',1-br*.8):isOtter?blend('#6a4020','#2a1008',1-br*.8):blend('#f0f0e8','#b0b0a0',1-br*.7);
      c2.fillStyle=aFCol;c2.beginPath();c2.ellipse(x+s*.44,y+s*.52+bob,s*.28,s*.2+breath*.4,isSeal?-.1:0,0,Math.PI*2);c2.fill();
      // Head
      c2.beginPath();c2.ellipse(x+s*.76,y+s*.4+bob,s*.18,s*.18,-.1,0,Math.PI*2);c2.fill();
      if(isSeal){
        // Whiskers
        c2.strokeStyle='rgba(255,255,255,0.6)';c2.lineWidth=0.7;for(let w=0;w<4;w++){c2.beginPath();c2.moveTo(x+s*.88,y+s*.42+bob);c2.lineTo(x+s*(.96+w*.06),y+s*(.38+w*.02)+bob);c2.stroke();}c2.lineWidth=1;
        // Flippers
        c2.fillStyle=aFCol;c2.beginPath();c2.ellipse(x+s*.22,y+s*.64+bob,s*.1,s*.2,-.5,0,Math.PI*2);c2.fill();c2.beginPath();c2.ellipse(x+s*.36,y+s*.8+bob,s*.18,s*.06,.2,0,Math.PI*2);c2.fill();
        // Spots
        c2.fillStyle='rgba(50,50,48,0.35)';for(let sp=0;sp<6;sp++){c2.beginPath();c2.arc(x+s*(.2+sp*.1),y+s*.52+bob,s*.03,0,Math.PI*2);c2.fill();}
      } else {
        // Bushy tail
        c2.fillStyle=aFCol;c2.beginPath();c2.ellipse(x+s*.14,y+s*.5+bob+Math.sin(t*2)*s*.03,s*.14,s*.09,-.4,0,Math.PI*2);c2.fill();
        if(!isOtter){c2.fillStyle='rgba(255,255,255,0.9)';c2.beginPath();c2.ellipse(x+s*.08,y+s*.52+bob,s*.07,s*.05,-.4,0,Math.PI*2);c2.fill();}
        // Legs
        const al=Math.sin(t*6)*s*.05;c2.fillStyle=aFCol;[.28,.4,.6,.72].forEach((lx,i)=>{c2.fillRect(x+s*lx,y+s*.68+bob,s*.07,s*.2+(i%2?-al:al));});
      }
      // Snout
      c2.fillStyle=blend(isSeal?'#d0d0c8':isOtter?'#8a6030':aFCol,'#606058',1-br*.7);c2.beginPath();c2.ellipse(x+s*.9,y+s*.44+bob,s*.09,s*.065,.1,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a1010';c2.beginPath();c2.arc(x+s*.96,y+s*.43+bob,s*.02,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a1010';c2.beginPath();c2.arc(x+s*.82,y+s*.37+bob,s*.03,0,Math.PI*2);c2.fill();c2.fillStyle='rgba(255,255,255,0.6)';c2.beginPath();c2.arc(x+s*.828,y+s*.366+bob,s*.01,0,Math.PI*2);c2.fill();
    } else if(id==='Snow Leopard'){
      const slC=blend('#d8d0b8','#888070',1-br*.7);
      c2.fillStyle=slC;c2.beginPath();c2.ellipse(x+s*.42,y+s*.5+bob,s*.28,s*.2+breath*.4,-.05,0,Math.PI*2);c2.fill();
      // Rosette spots
      c2.fillStyle='rgba(60,50,40,0.4)';[[.22,.44,.07],[.36,.4,.075],[.5,.42,.07],[.2,.58,.065],[.38,.58,.07],[.54,.56,.065],[.66,.44,.06]].forEach(([px,py,pr])=>{c2.beginPath();c2.arc(x+s*px,y+s*py+bob,s*pr,0,Math.PI*2);c2.fill();c2.fillStyle='rgba(40,30,20,0.25)';c2.beginPath();c2.arc(x+s*px,y+s*py+bob,s*pr*.5,0,Math.PI*2);c2.fill();c2.fillStyle='rgba(60,50,40,0.4)';});
      // Head
      c2.fillStyle=slC;c2.beginPath();c2.ellipse(x+s*.74,y+s*.37+bob,s*.2,s*.18,-.1,0,Math.PI*2);c2.fill();
      // Whiskers
      c2.strokeStyle='rgba(255,255,255,0.7)';c2.lineWidth=0.6;for(let w=0;w<3;w++){c2.beginPath();c2.moveTo(x+s*.88,y+s*.42+bob);c2.lineTo(x+s*(.98+w*.04),y+s*(.38+w*.02)+bob);c2.stroke();}c2.lineWidth=1;
      c2.fillStyle='#3a78a0';c2.beginPath();c2.arc(x+s*.82,y+s*.36+bob,s*.034,0,Math.PI*2);c2.fill();c2.fillStyle='#1a1010';c2.beginPath();c2.arc(x+s*.82,y+s*.36+bob,s*.019,0,Math.PI*2);c2.fill();c2.fillStyle='rgba(255,255,255,0.7)';c2.beginPath();c2.arc(x+s*.828,y+s*.355+bob,s*.007,0,Math.PI*2);c2.fill();
      c2.fillStyle='#2a1a10';c2.beginPath();c2.arc(x+s*.98,y+s*.43+bob,s*.022,0,Math.PI*2);c2.fill();
      // Fluffy tail
      c2.strokeStyle=slC;c2.lineWidth=s*.1;c2.beginPath();c2.moveTo(x+s*.14,y+s*.5+bob);c2.bezierCurveTo(x+s*.02,y+s*.28+bob+Math.sin(t*1.5)*s*.05,x+s*.18,y+s*.12+bob,x+s*.28,y+s*.2+bob);c2.stroke();c2.lineWidth=1;
      const sl=Math.sin(t*6)*s*.06;c2.fillStyle=slC;[.24,.36,.58,.7].forEach((lx,i)=>{c2.fillRect(x+s*lx,y+s*.64+bob,s*.08,s*.26+(i%2?-sl:sl));});
    } else {
      // Generic fallback — simple colored blob animal
      c2.fillStyle=blend('#8a7a5a','#3a2a1a',1-br*.8);c2.beginPath();c2.ellipse(x+s*.46,y+s*.52+bob,s*.28,s*.2+breath*.3,0,0,Math.PI*2);c2.fill();
      c2.beginPath();c2.ellipse(x+s*.76,y+s*.38+bob,s*.16,s*.16,0,0,Math.PI*2);c2.fill();
      c2.fillStyle='#1a1010';c2.beginPath();c2.arc(x+s*.82,y+s*.35+bob,s*.03,0,Math.PI*2);c2.fill();
      c2.fillStyle='rgba(255,255,255,0.6)';c2.beginPath();c2.arc(x+s*.83,y+s*.345+bob,s*.01,0,Math.PI*2);c2.fill();
    }
    }catch(e){ /* sprite draw error — skip silently */ }
    c2.lineWidth=1;
    c2.globalAlpha=1;
    c2.setLineDash([]);
    c2.restore();
  }

  function drawAnimals(){
    const skyH=Math.round(H*.42),br=skyBright();
    animals.forEach(a=>{
      if(!a.alive)return;
      const sx=a.wx-camX,sy=a.wy-camY+skyH;
      if(sx<-80||sx>W+80||sy<skyH-20||sy>H+20)return;
      try{
      const s=a.r==='legendary'?52:a.r==='rare'?46:40;
      // Shadow
      ctx.fillStyle=`rgba(0,0,0,${0.14*br+0.04})`;ctx.beginPath();ctx.ellipse(sx+s*.45,sy+s*.9,Math.max(1,s*.3),Math.max(1,s*.06),0,0,Math.PI*2);ctx.fill();
      // Draw canvas animal sprite
      drawAnimalSprite(ctx,a.n||a.name,sx,sy,s,animT+a.bob,a.facing);
      // Rarity aura
      if(a.r==='legendary'&&br>0.1){
        const g=ctx.createRadialGradient(sx+s*.5,sy+s*.5,0,sx+s*.5,sy+s*.5,s*.7);
        g.addColorStop(0,`rgba(255,238,0,${0.14+0.08*Math.sin(animT*3+a.bob)})`);
        g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.5,s*.7,0,Math.PI*2);ctx.fill();
      } else if(a.r==='rare'&&br>0.1){
        ctx.strokeStyle=`rgba(255,140,0,${0.18+0.08*Math.sin(animT*2+a.bob)})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.4,s*.5,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1;
      }
      // Night glow
      if(isNight()){ctx.fillStyle=`rgba(255,255,200,${0.06+0.03*Math.sin(animT*2+a.bob)})`;ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.4,s*.6,0,Math.PI*2);ctx.fill();}
      // HP bar
      ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(sx,sy-14,40,5);
      const hp=a.hp/a.maxHp;ctx.fillStyle=hp>.6?'#2ecc71':hp>.3?'#f39c12':'#e74c3c';ctx.fillRect(sx,sy-14,40*hp,5);
      // Name tag near player
      if(Math.hypot(player.wx-a.wx,player.wy-a.wy)<TS*5){
        const nm=a.n||a.name;const rc={common:'#ccc',uncommon:'#88aaff',rare:'#ffaa44',legendary:'#ffee00'}[a.r||a.rarity]||'#ccc';
        const nlw=nm.length*5+10;ctx.fillStyle='rgba(0,0,0,0.72)';ctx.fillRect(sx,sy-26,nlw,11);
        ctx.fillStyle=rc;ctx.font='8px monospace';ctx.textBaseline='middle';ctx.fillText(nm,sx+4,sy-21);
      }
      ctx.globalAlpha=1;ctx.lineWidth=1;ctx.textAlign='left';
      }catch(e){ ctx.globalAlpha=1;ctx.lineWidth=1;ctx.setLineDash([]);ctx.textAlign='left'; }
    });
  }

  function drawPartyMembers(){
    const skyH=Math.round(H*.42);
    party.forEach((pm,i)=>{
      const offset=(i+1)*36;
      const px2=companion.wx-offset-camX,py2=companion.wy-camY+skyH;
      if(px2<-60||px2>W+60)return;
      const bob2=Math.sin(animT*2.2+i*1.5)*2.5;
      const sz=28;
      // Shadow
      ctx.fillStyle='rgba(0,0,0,0.12)';
      ctx.beginPath();ctx.ellipse(px2+sz*.4,py2+sz*.95,sz*.28,sz*.06,0,0,Math.PI*2);ctx.fill();
      // Canvas sprite — no emoji
      try{
        drawAnimalSprite(ctx,pm.name||pm.n,px2,py2+bob2,sz,animT+(pm.bob||i*0.7),(pm.facing||1));
      }catch(e){
        ctx.fillStyle='#FF8C00';ctx.fillRect(px2,py2+bob2,sz,sz*.8);
        ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.textBaseline='middle';ctx.textAlign='center';
        ctx.fillText((pm.name||pm.n||'?')[0],px2+sz/2,py2+bob2+sz*.4);ctx.textAlign='left';
      }
      // HP bar
      ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(px2,py2-8,sz,4);
      ctx.fillStyle='#2ecc71';ctx.fillRect(px2,py2-8,sz*(pm.partyHp/pm.partyMaxHp),4);
      ctx.globalAlpha=1;ctx.textAlign='left';
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
    const px2=player.wx-camX, py2=player.wy-camY+skyH;
    // Scale factor: player is 1.6x bigger than before
    const SC=1.6;
    const br=Math.sin(animT*1.4)*SC*.7, walk=player.moving?Math.sin(player.stepF*2):0;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.22)';
    ctx.beginPath();ctx.ellipse(px2+12*SC,py2+32*SC,12*SC,4*SC,0,0,Math.PI*2);ctx.fill();
    ctx.save();
    if(player.facing==='left'){ctx.scale(-1,1);ctx.translate(-px2*2-24*SC,0);}
    // Legs
    ctx.fillStyle='#2a3a8a';
    ctx.fillRect(px2+6*SC,py2+20*SC+walk*3,5*SC,12*SC);
    ctx.fillRect(px2+13*SC,py2+20*SC-walk*3,5*SC,12*SC);
    // Boots
    ctx.fillStyle='#5a3010';
    ctx.fillRect(px2+5*SC,py2+31*SC+walk*3,7*SC,4*SC);
    ctx.fillRect(px2+12*SC,py2+31*SC-walk*3,7*SC,4*SC);
    // Tunic/body
    ctx.fillStyle='#4a80e0';
    ctx.fillRect(px2+4*SC,py2+12*SC+br,17*SC,13*SC);
    // Belt
    ctx.fillStyle='#8B4513';
    ctx.fillRect(px2+3*SC,py2+24*SC+br,20*SC,2.5*SC);
    // Arms
    ctx.fillStyle='#F4C18A';
    if(pAnim&&pAnim.atkT>0&&inBattle){
      const sa=-(1-pAnim.atkT/18)*Math.PI*.6;
      ctx.save();ctx.translate(px2+24*SC,py2+18*SC+br);ctx.rotate(sa);
      ctx.fillRect(0,-3*SC,18*SC,5*SC);
      ctx.fillStyle='#aaa';ctx.fillRect(14*SC,-6*SC,3*SC,20*SC);
      ctx.fillStyle='#888888';ctx.fillRect(10*SC,-1*SC,12*SC,3*SC);
      ctx.restore();
    } else {
      ctx.fillRect(px2+2*SC,py2+13*SC+br+walk*2.5,4*SC,11*SC);
      ctx.fillRect(px2+20*SC,py2+13*SC+br-walk*2.5,4*SC,11*SC);
    }
    // Head (taller)
    ctx.fillRect(px2+6*SC,py2,13*SC,16*SC);
    // Hair
    ctx.fillStyle='#5a3010';
    ctx.fillRect(px2+5*SC,py2-3*SC,15*SC,6*SC);
    // Eyes + blink
    const blH=Math.sin(animT*.7)>.95?.1:1;
    ctx.fillStyle='#000';
    ctx.fillRect(px2+7.5*SC,py2+4*SC,2.5*SC,3*SC*blH);
    ctx.fillRect(px2+13*SC,py2+4*SC,2.5*SC,3*SC*blH);
    // Smile
    ctx.fillRect(px2+9*SC,py2+11*SC,2*SC,1.2*SC);
    ctx.fillRect(px2+12.5*SC,py2+11*SC,2*SC,1.2*SC);
    // Eye shine
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.fillRect(px2+8*SC,py2+4*SC,1*SC,1.2*SC);
    ctx.fillRect(px2+13.5*SC,py2+4*SC,1*SC,1.2*SC);
    ctx.restore();
    // Name tag
    const nm=currentUser?currentUser.name.split(' ')[0]:'Hero';
    const nlw=nm.length*6+14;
    ctx.fillStyle='rgba(0,0,0,0.75)';
    ctx.fillRect(px2+12*SC-nlw/2,py2-22,nlw,15);
    ctx.fillStyle='#00d4ff';ctx.font='bold 9px sans-serif';ctx.textBaseline='middle';
    ctx.fillText(nm,px2+12*SC-nlw/2+5,py2-14);
    // HP bar
    ctx.fillStyle='#1a0a0a';ctx.fillRect(px2+2,py2-28,26,5);
    ctx.fillStyle='#e74c3c';ctx.fillRect(px2+2,py2-28,26*(player.hp/player.maxHp),5);
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
    (saveData.caughtAnimals||[]).forEach(a=>{
      if(!counts[a.name])counts[a.name]={count:0,name:a.name,rarity:a.rarity||a.r||'common'};
      counts[a.name].count++;
    });
    const cl=document.getElementById('inv-caught-list');
    if(Object.keys(counts).length===0){
      cl.innerHTML='<p style="font-size:12px;color:#555;padding:8px 0">No animals yet.</p>';
    } else {
      cl.innerHTML=Object.entries(counts).map(([nm,d])=>`
        <div class="inv-caught-entry" style="display:flex;align-items:center;gap:8px;padding:5px 6px;background:rgba(255,255,255,0.03);border-radius:6px;margin-bottom:4px">
          <canvas class="inv-animal-canvas" data-name="${nm}" width="40" height="32" style="image-rendering:pixelated;border-radius:4px;background:rgba(0,0,0,0.3);flex-shrink:0"></canvas>
          <span class="inv-name" style="flex:1;font-size:12px;font-weight:600">${nm}</span>
          <span class="inv-rarity ${d.rarity}" style="font-size:9px;padding:2px 5px;border-radius:4px;font-weight:700">${d.rarity}</span>
          <span class="inv-count" style="font-size:11px;padding:2px 7px;border-radius:10px;background:#f0a500;color:#000;font-weight:700">×${d.count}</span>
        </div>`).join('');
      // Draw canvas sprites for each caught animal after DOM insertion
      requestAnimationFrame(()=>{
        cl.querySelectorAll('.inv-animal-canvas').forEach(cvs=>{
          const name=cvs.dataset.name;
          const c2=cvs.getContext('2d');
          c2.clearRect(0,0,40,32);
          try{ drawAnimalSprite(c2,name,0,0,40,animT,1); }catch(e){}
        });
      });
    }
    const il=document.getElementById('inv-items-list');
    il.innerHTML=(saveData.items||[]).filter(i=>i.qty>0).map(it=>`
      <div class="inv-item-row" style="display:flex;align-items:center;gap:6px;padding:5px 6px;background:rgba(255,255,255,0.03);border-radius:6px;margin-bottom:4px;font-size:12px;justify-content:space-between">
        <span>${it.emoji} ${it.name}</span>
        <span style="color:#aaa;font-size:11px">${it.desc}</span>
        <span class="inv-count" style="font-size:11px;padding:2px 7px;border-radius:10px;background:#f0a500;color:#000;font-weight:700">×${it.qty}</span>
      </div>`).join('')||'<p style="font-size:12px;color:#555">No items.</p>';
    document.getElementById('inv-fights').textContent=fightWins;
    document.getElementById('inv-catches').textContent=catchCount;
    document.getElementById('inv-total-score').textContent=score;
    document.getElementById('inv-coins').textContent=coins;
  }

  function refreshParty(){
    const slots=document.getElementById('party-slots');
    // Build active party slots with canvas sprites (no emoji)
    const slotHTML='<p style="font-size:11px;color:#6b7a8d;margin-bottom:6px">Active party (max 3):</p>'+(
      party.length===0
        ?'<p style="font-size:12px;color:#555">No party members.</p>'
        :party.map((p2,i)=>`
          <div class="party-slot" style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:rgba(255,255,255,0.04);border-radius:8px;margin-bottom:6px">
            <canvas class="party-slot-canvas" data-name="${p2.name||p2.n}" data-idx="${i}" width="36" height="28"
              style="image-rendering:pixelated;border-radius:4px;background:rgba(0,0,0,0.35);flex-shrink:0"></canvas>
            <span class="party-name" style="flex:1;font-size:13px;font-weight:600">${p2.name||p2.n}</span>
            <span class="party-hp" style="font-size:10px;color:#2ecc71">${Math.ceil(p2.partyHp)}/${p2.partyMaxHp}</span>
            <button class="party-remove" data-i="${i}"
              style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:14px;padding:0 4px">✕</button>
          </div>`).join('')
    );
    slots.innerHTML=slotHTML;
    // Draw canvas sprites for active slots
    requestAnimationFrame(()=>{
      slots.querySelectorAll('.party-slot-canvas').forEach(cvs=>{
        const name=cvs.dataset.name;
        const c2=cvs.getContext('2d');
        c2.clearRect(0,0,36,28);
        try{ drawAnimalSprite(c2,name,0,0,36,animT,1); }catch(e){}
      });
    });
    slots.querySelectorAll('.party-remove').forEach(btn=>{
      btn.addEventListener('click',()=>{
        party.splice(parseInt(btn.dataset.i),1);
        syncPartyToSave();refreshParty();
      });
    });

    // Available animals — canvas sprites (already done, keep same)
    const avail=document.getElementById('party-available');
    const all=(saveData.caughtAnimals||[]);
    const uniq=[...new Map(all.map(a=>[a.name||a.n,a])).values()];
    avail.innerHTML=uniq.map(a=>`
      <div class="party-avail-row" style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1e2a3a;gap:6px">
        <canvas class="party-avail-canvas" data-name="${a.name||a.n}" width="32" height="26"
          style="image-rendering:pixelated;background:rgba(0,0,0,0.3);border-radius:3px;flex-shrink:0"></canvas>
        <span style="flex:1;font-size:12px">${a.name||a.n}</span>
        <button class="party-add" data-n="${a.name||a.n}"
          style="padding:3px 8px;background:rgba(0,212,255,.15);border:1px solid #00d4ff;border-radius:5px;color:#00d4ff;cursor:pointer;font-size:11px">+ Add</button>
      </div>`).join('')||'<p style="font-size:12px;color:#555">Catch animals first!</p>';
    // Draw canvas sprites for available list
    requestAnimationFrame(()=>{
      avail.querySelectorAll('.party-avail-canvas').forEach(cvs=>{
        const name=cvs.dataset.name;
        const c2=cvs.getContext('2d');
        c2.clearRect(0,0,32,26);
        try{ drawAnimalSprite(c2,name,0,0,32,animT,1); }catch(e){}
      });
    });
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

    // ── Canvas sizing — accounts for HUD (52px) + mobile bar (150px on touch) ──
    function getMobileBarH(){
      const mc=document.getElementById('mobile-controls');
      if(!mc||mc.style.display==='none'||getComputedStyle(mc).display==='none') return 0;
      return mc.offsetHeight||150;
    }
    function sizeCanvas(){
      const barH=getMobileBarH();
      W=canvas.width=window.innerWidth;
      H=canvas.height=window.innerHeight-52-barH;
      sizeBattleCanvas();
    }
    window.removeEventListener('resize',sizeCanvas);
    window.addEventListener('resize',sizeCanvas);
    sizeCanvas();

    resetPlayer(sd);
    score=sd.score||0;coins=sd.coins||0;fightWins=sd.wins||0;catchCount=sd.catches||0;
    animT=0;dayT=0.25;encounterCooldown=0;inBattle=false;activeAnimal=null;
    inInterior=false;currentHouse=null;stepSoundTimer=0;
    buildWorld(sd);
    document.getElementById('hud-player-name').textContent=user.name;
    updateHud();initPanelTabs();

    function wire(id,fn){
      const o=document.getElementById(id);if(!o)return;
      const n=o.cloneNode(true);o.parentNode.replaceChild(n,o);
      document.getElementById(id).addEventListener('click',fn);
    }
    wire('bact-fight',battleFight);wire('bact-item',battleItem);
    wire('bact-catch',battleCatch);wire('bact-flee',battleFlee);
    wire('battle-items-back',()=>{
      document.getElementById('battle-items-menu').classList.add('hidden');
      document.getElementById('battle-actions').classList.remove('hidden');
    });
    wire('btn-toggle-inv',()=>togglePanel('inventory-panel'));
    wire('btn-toggle-party',()=>togglePanel('party-panel'));
    wire('btn-close-inv',()=>document.getElementById('inventory-panel').classList.add('hidden'));
    wire('btn-close-party',()=>document.getElementById('party-panel').classList.add('hidden'));
    wire('btn-quit-game',()=>{
      running=false;cancelAnimationFrame(raf);stopBattle();
      document.querySelectorAll('.side-panel').forEach(p=>p.classList.add('hidden'));
      document.getElementById('battle-screen').classList.add('hidden');
      // Hide mobile controls when leaving game
      const mc=document.getElementById('mobile-controls');
      if(mc) mc.style.display='none';
      Sound.stopMusic();if(saveCb)saveCb();Lobby.show(user);
    });

    Sound.playBgMusic(getBiome(player.wx).id);

    // ══════════════════════════════════════════
    //  MOBILE CONTROLS — fully self-contained
    // ══════════════════════════════════════════
    function initMobileControls(){
      // Detect touch device
      const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
      const isNarrow=window.innerWidth<=820;
      const mc=document.getElementById('mobile-controls');
      if(!mc) return;

      // Show controls on touch or narrow screens
      if(isTouch||isNarrow){
        mc.style.display='flex';
        // Re-size canvas now that bar is visible
        setTimeout(sizeCanvas,50);
      } else {
        mc.style.display='none';
      }

      // ── D-pad buttons ──
      const dirMap={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
      // Use event delegation to avoid duplicate listeners on re-entry
      mc.querySelectorAll('.dpad-btn').forEach(btn=>{
        const key=dirMap[btn.dataset.dir];
        if(!key) return;
        // Remove old listeners by cloning
        const fresh=btn.cloneNode(true);
        btn.parentNode.replaceChild(fresh,btn);
        fresh.addEventListener('touchstart',e=>{
          e.preventDefault();e.stopPropagation();
          keys[key]=true;fresh.classList.add('pressed');
        },{passive:false});
        fresh.addEventListener('touchend',e=>{
          e.preventDefault();
          keys[key]=false;fresh.classList.remove('pressed');
        },{passive:false});
        fresh.addEventListener('touchcancel',e=>{
          keys[key]=false;fresh.classList.remove('pressed');
        });
        // Mouse fallback for desktop testing
        fresh.addEventListener('mousedown',e=>{e.preventDefault();keys[key]=true;fresh.classList.add('pressed');});
        fresh.addEventListener('mouseup',()=>{keys[key]=false;fresh.classList.remove('pressed');});
        fresh.addEventListener('mouseleave',()=>{keys[key]=false;fresh.classList.remove('pressed');});
      });

      // ── Action buttons ──
      function wireAction(id,fn){
        const old=document.getElementById(id);if(!old)return;
        const fresh=old.cloneNode(true);old.parentNode.replaceChild(fresh,old);
        fresh.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();fn();Sound.sfx.click();},{passive:false});
        fresh.addEventListener('click',fn);
      }
      wireAction('mbtn-interact',()=>{
        if(inBattle){
          // In battle: Enter = Fight shortcut
          if(battlePhase==='idle') battleFight();
        } else {
          checkInteract();
        }
      });
      wireAction('mbtn-bag',  ()=>togglePanel('inventory-panel'));
      wireAction('mbtn-party',()=>togglePanel('party-panel'));

      // ── Battle action buttons — touch-friendly wiring ──
      ['bact-fight','bact-item','bact-catch','bact-flee'].forEach(id=>{
        const el=document.getElementById(id);
        if(!el) return;
        el.addEventListener('touchstart',e=>{
          e.preventDefault();e.stopPropagation();
          el.click();
        },{passive:false});
      });

      // ── Canvas swipe gesture (virtual joystick) ──
      // Only used when d-pad is visible but player swipes on the map area
      let touchId=null,touchStartX=0,touchStartY=0;
      function onTouchStart(e){
        // Ignore touches that land on any button
        if(e.target.closest('button,.side-panel,#battle-ui,#mobile-controls')) return;
        if(touchId!==null) return;
        e.preventDefault();
        const t2=e.changedTouches[0];
        touchId=t2.identifier;touchStartX=t2.clientX;touchStartY=t2.clientY;
      }
      function onTouchMove(e){
        if(touchId===null) return;
        e.preventDefault();
        let tch=null;
        for(let i=0;i<e.changedTouches.length;i++){
          if(e.changedTouches[i].identifier===touchId){tch=e.changedTouches[i];break;}
        }
        if(!tch) return;
        const dx=tch.clientX-touchStartX,dy=tch.clientY-touchStartY;
        const dead=20;
        keys['ArrowLeft'] =dx<-dead;keys['ArrowRight']=dx>dead;
        keys['ArrowUp']   =dy<-dead;keys['ArrowDown'] =dy>dead;
      }
      function onTouchEnd(e){
        for(let i=0;i<e.changedTouches.length;i++){
          if(e.changedTouches[i].identifier===touchId){
            touchId=null;
            keys['ArrowLeft']=keys['ArrowRight']=keys['ArrowUp']=keys['ArrowDown']=false;
            break;
          }
        }
      }
      // Attach to document so swipe anywhere on game area works
      document.removeEventListener('touchstart',onTouchStart);
      document.removeEventListener('touchmove',onTouchMove);
      document.removeEventListener('touchend',onTouchEnd);
      document.addEventListener('touchstart',onTouchStart,{passive:false});
      document.addEventListener('touchmove',onTouchMove,{passive:false});
      document.addEventListener('touchend',onTouchEnd,{passive:false});

      // ── Hide controls when not on game screen ──
      // (handled by btn-quit-game wire above)
    }

    initMobileControls();

    // Re-check on orientation change
    window.addEventListener('orientationchange',()=>{
      setTimeout(()=>{sizeCanvas();initMobileControls();},300);
    });

    running=true;loop();
  }

  return { start };
})();
