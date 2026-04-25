// ═══════════════════════════════════════════════════
//  lobby.js — Lobby screen (between loading & game)
// ═══════════════════════════════════════════════════
window.Lobby = (() => {

  let user = null;
  let saveData = null;
  let lobbyRAF = null;
  let lobbyT = 0;

  // ── Save / Load player data ────────────────────
  const SAVE_KEY = 'rotw_save_v2';
  function loadSave(username) {
    try {
      const all = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      return all[username] || defaultSave();
    } catch(e) { return defaultSave(); }
  }
  function writeSave() {
    if (!user || !saveData) return;
    try {
      const all = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      all[user.username] = saveData;
      localStorage.setItem(SAVE_KEY, JSON.stringify(all));
    } catch(e) {}
  }
  function defaultSave() {
    return {
      score: 0, wins: 0, catches: 0, coins: 120,
      items: [
        { id:'potion',      name:'Potion',       emoji:'🧪', desc:'+30 HP',          qty:3, effect:{hp:30} },
        { id:'superpotion', name:'Super Potion',  emoji:'💊', desc:'+80 HP',          qty:1, effect:{hp:80} },
        { id:'antidote',    name:'Antidote',      emoji:'🩺', desc:'Cures poison',    qty:2, effect:{cure:true} },
        { id:'pokeball',    name:'Capture Ball',  emoji:'🔵', desc:'+20% catch rate', qty:5, effect:{catchBonus:0.2} },
        { id:'greatball',   name:'Great Ball',    emoji:'🔴', desc:'+40% catch rate', qty:2, effect:{catchBonus:0.4} },
      ],
      party: [],
      caughtAnimals: [],
      companionLevel: 1,
      companionXp: 0,
      settings: { musicVol:40, sfxVol:70, speed:3 },
    };
  }

  // ── Shop catalogue ─────────────────────────────
  const SHOP_ITEMS = [
    { id:'potion',      name:'Potion',        emoji:'🧪', desc:'+30 HP',          price:20,  effect:{hp:30} },
    { id:'superpotion', name:'Super Potion',  emoji:'💊', desc:'+80 HP',          price:50,  effect:{hp:80} },
    { id:'maxpotion',   name:'Max Potion',    emoji:'💉', desc:'Full HP restore', price:120, effect:{hp:999} },
    { id:'antidote',    name:'Antidote',      emoji:'🩺', desc:'Cures poison',    price:15,  effect:{cure:true} },
    { id:'elixir',      name:'Elixir',        emoji:'✨', desc:'+50 XP',          price:80,  effect:{xp:50} },
    { id:'pokeball',    name:'Capture Ball',  emoji:'🔵', desc:'+20% catch rate', price:30,  effect:{catchBonus:0.2} },
    { id:'greatball',   name:'Great Ball',    emoji:'🔴', desc:'+40% catch rate', price:70,  effect:{catchBonus:0.4} },
    { id:'ultraball',   name:'Ultra Ball',    emoji:'⚫', desc:'+60% catch rate', price:150, effect:{catchBonus:0.6} },
    { id:'shield',      name:'Shield',        emoji:'🛡️', desc:'-50% battle dmg', price:100, effect:{shield:true} },
    { id:'speedboost',  name:'Speed Boost',   emoji:'💨', desc:'+2 move speed',   price:60,  effect:{speed:2} },
    { id:'xattack',     name:'X-Attack',      emoji:'⚔️', desc:'+20 attack',      price:90,  effect:{atkBonus:20} },
    { id:'revive',      name:'Revive',        emoji:'💫', desc:'Restore fainted', price:200, effect:{revive:true} },
  ];

  // ── Lobby animated background ──────────────────
  function initLobbyBg() {
    const c = document.getElementById('lobby-bg-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    const particles = Array.from({length:80},()=>({
      x:Math.random()*2000,y:Math.random()*1200,
      vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,
      r:Math.random()*3+1,
      h:Math.random()*60+20,
    }));
    function resize(){ c.width=c.offsetWidth; c.height=c.offsetHeight; }
    window.addEventListener('resize',resize); resize();
    function frame(){
      lobbyT+=0.012;
      const W=c.width,H=c.height;
      ctx.clearRect(0,0,W,H);
      // Sky gradient
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#0a1628'); g.addColorStop(0.6,'#1a2a4a'); g.addColorStop(1,'#0a2010');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Stars/fireflies
      particles.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        const alpha=0.3+0.5*Math.sin(lobbyT*2+p.x*.01);
        ctx.globalAlpha=alpha;
        ctx.fillStyle=`hsl(${p.h},80%,70%)`;
        ctx.beginPath(); ctx.arc(p.x%W,p.y%H,p.r,0,Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha=1;
      // Silhouette ground
      ctx.fillStyle='rgba(0,0,0,0.7)';
      ctx.fillRect(0,H*0.8,W,H*0.2);
      for(let x=0;x<W;x+=50+Math.sin(x)*.02*30){
        const h2=40+Math.sin(x*.04)*20;
        ctx.fillRect(x,H*0.8-h2,24,h2);
        ctx.beginPath(); ctx.moveTo(x+12,H*0.8-h2-28); ctx.lineTo(x-8,H*0.8-h2); ctx.lineTo(x+32,H*0.8-h2); ctx.closePath(); ctx.fill();
      }
      lobbyRAF=requestAnimationFrame(frame);
    }
    frame();
  }

  // ── Companion preview canvas ───────────────────
  function drawCompanionPreview(level) {
    const c = document.getElementById('lobby-companion-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    const W=c.width, H=c.height;
    ctx.clearRect(0,0,W,H);
    // Draw companion based on level
    const scale = level >= 30 ? 2.2 : level >= 10 ? 1.5 : 1;
    drawCatSprite(ctx, W/2-12*scale, H/2-14*scale, scale, lobbyT);
  }

  function drawCatSprite(ctx, x, y, scale=1, t=0) {
    const s=scale;
    const br=Math.sin(t*2.2)*0.8*s;
    const tw=Math.sin(t*4)*3;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(x+10*s,y+26*s,10*s,3*s,0,0,Math.PI*2); ctx.fill();
    // Tail
    ctx.fillStyle='#FF8C00';
    ctx.fillRect(x-2*s,y+12*s+tw,5*s,5*s);
    ctx.fillRect(x-5*s,y+8*s+tw*.6,5*s,5*s);
    ctx.fillStyle='#fff'; ctx.fillRect(x-7*s,y+4*s+tw*.3,4*s,4*s);
    // Body
    ctx.fillStyle='#FF8C00'; ctx.fillRect(x+2*s,y+12*s,16*s,11*s+br*.4);
    ctx.fillStyle='#ffaa33'; ctx.fillRect(x+4*s,y+14*s,12*s,7*s);
    // Stripes (level 10+)
    if (scale >= 1.5) {
      ctx.fillStyle='rgba(180,60,0,0.4)';
      ctx.fillRect(x+5*s,y+13*s,2*s,8*s);
      ctx.fillRect(x+11*s,y+13*s,2*s,8*s);
    }
    // Armor (level 30+)
    if (scale >= 2.2) {
      ctx.fillStyle='rgba(80,140,200,0.5)';
      ctx.fillRect(x+2*s,y+12*s,16*s,5*s);
      ctx.fillStyle='#4a8aff';
      ctx.fillRect(x+2*s,y+11*s,16*s,2*s);
    }
    // Head
    ctx.fillStyle='#FF8C00'; ctx.fillRect(x+3*s,y+3*s+br,14*s,11*s);
    ctx.fillRect(x+3*s,y+br,5*s,5*s); ctx.fillRect(x+12*s,y+br,5*s,5*s);
    ctx.fillStyle='#FFB6C1'; ctx.fillRect(x+4*s,y+1*s+br,3*s,3*s); ctx.fillRect(x+13*s,y+1*s+br,3*s,3*s);
    const blH=Math.sin(t*.6)>.94?.15:1;
    ctx.fillStyle='#FFFF00';
    ctx.fillRect(x+5*s,y+6*s+br,3*s,3*s*blH); ctx.fillRect(x+11*s,y+6*s+br,3*s,3*s*blH);
    ctx.fillStyle='#000';
    ctx.fillRect(x+5.5*s,y+6.5*s+br,2*s,2*s*blH); ctx.fillRect(x+11.5*s,y+6.5*s+br,2*s,2*s*blH);
    ctx.fillStyle='#FFB6C1'; ctx.fillRect(x+9*s,y+11*s+br,3*s,2*s);
    // Crown for level 30+
    if (scale >= 2.2) {
      ctx.fillStyle='#f0a500';
      ctx.beginPath(); ctx.moveTo(x+5*s,y+br); ctx.lineTo(x+3*s,y-5*s+br); ctx.lineTo(x+8*s,y-2*s+br); ctx.lineTo(x+10*s,y-6*s+br); ctx.lineTo(x+12*s,y-2*s+br); ctx.lineTo(x+17*s,y-5*s+br); ctx.lineTo(x+15*s,y+br); ctx.closePath(); ctx.fill();
    }
  }

  // ── Companion evolution names ──────────────────
  function companionName(level) {
    if (level >= 30) return 'Leo the Lioncat';
    if (level >= 10) return 'Stripetail';
    return 'Kitten';
  }

  // ── Refresh lobby UI ──────────────────────────
  function refreshLobby() {
    if (!saveData) return;
    document.getElementById('lb-score').textContent  = saveData.score;
    document.getElementById('lb-caught').textContent = saveData.catches;
    document.getElementById('lb-wins').textContent   = saveData.wins;
    document.getElementById('shop-coins').textContent= saveData.coins;
    document.getElementById('lobby-welcome').textContent = `Welcome back, ${user.name}!`;
    const lv = saveData.companionLevel;
    document.getElementById('lobby-comp-name').textContent = companionName(lv);
    document.getElementById('lobby-comp-level').textContent= 'Lv.'+lv;
    drawCompanionPreview(lv);
  }

  // ── Shop ──────────────────────────────────────
  function renderShop() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = SHOP_ITEMS.map(it => `
      <div class="shop-item">
        <div class="shop-emoji">${it.emoji}</div>
        <div class="shop-name">${it.name}</div>
        <div class="shop-desc">${it.desc}</div>
        <div class="shop-price">💰 ${it.price}</div>
        <button class="shop-buy" data-id="${it.id}">Buy</button>
      </div>`).join('');
    grid.querySelectorAll('.shop-buy').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = SHOP_ITEMS.find(i=>i.id===id);
        if (!item || saveData.coins < item.price) {
          Sound.sfx.error(); showLobbyMsg('Not enough coins!','#e74c3c'); return;
        }
        saveData.coins -= item.price;
        const existing = saveData.items.find(i=>i.id===id);
        if (existing) existing.qty++;
        else saveData.items.push({...item, qty:1});
        writeSave();
        document.getElementById('shop-coins').textContent = saveData.coins;
        Sound.sfx.shop();
        showLobbyMsg(`Bought ${item.name}!`, '#2ecc71');
        btn.textContent = '✓ Bought!';
        setTimeout(()=>btn.textContent='Buy',1200);
      });
    });
  }

  function showLobbyMsg(msg, color) {
    let el = document.getElementById('lobby-msg');
    if (!el) { el=document.createElement('div'); el.id='lobby-msg'; el.style.cssText='position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:8px 20px;border-radius:8px;font-weight:700;z-index:999;pointer-events:none;transition:opacity .5s'; document.body.appendChild(el); }
    el.textContent=msg; el.style.background=color; el.style.color='#fff'; el.style.opacity='1';
    clearTimeout(el._t); el._t=setTimeout(()=>el.style.opacity='0',2000);
  }

  // ── Apply settings ─────────────────────────────
  function applySettings() {
    const mv=parseInt(document.getElementById('set-music').value);
    const sv=parseInt(document.getElementById('set-sfx').value);
    const sp=parseInt(document.getElementById('set-speed').value);
    saveData.settings = { musicVol:mv, sfxVol:sv, speed:sp };
    Sound.setMusicVol(mv); Sound.setSfxVol(sv);
    writeSave();
  }

  // ── Init ──────────────────────────────────────
  function show(u) {
    user = u;
    saveData = loadSave(u.username);
    // Apply saved settings
    Sound.setMusicVol(saveData.settings.musicVol);
    Sound.setSfxVol(saveData.settings.sfxVol);
    document.getElementById('set-music').value = saveData.settings.musicVol;
    document.getElementById('set-sfx').value   = saveData.settings.sfxVol;
    document.getElementById('set-speed').value = saveData.settings.speed;

    showScreen('screen-lobby');
    if (lobbyRAF) cancelAnimationFrame(lobbyRAF);
    initLobbyBg();
    refreshLobby();
    renderShop();
    Sound.playBgMusic('lobby');

    // Companion preview animation loop
    function previewLoop() {
      lobbyT += 0.016;
      drawCompanionPreview(saveData.companionLevel);
      lobbyRAF = requestAnimationFrame(previewLoop);
    }
    previewLoop();

    // Settings panel slider
    ['set-music','set-sfx','set-speed'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.addEventListener('input', applySettings);
    });

    document.getElementById('lobby-play').onclick = () => {
      cancelAnimationFrame(lobbyRAF);
      Sound.stopMusic();
      Game.start(user, saveData, writeSave);
    };
    document.getElementById('lobby-settings').onclick = () => {
      document.getElementById('settings-panel').classList.remove('hidden');
    };
    document.getElementById('close-settings').onclick = () => {
      document.getElementById('settings-panel').classList.add('hidden');
    };
    document.getElementById('lobby-shop').onclick = () => {
      document.getElementById('shop-coins').textContent = saveData.coins;
      document.getElementById('shop-panel').classList.remove('hidden');
    };
    document.getElementById('close-shop').onclick = () => {
      document.getElementById('shop-panel').classList.add('hidden');
    };
    document.getElementById('lobby-logout').onclick = () => {
      cancelAnimationFrame(lobbyRAF);
      Sound.stopMusic();
      showScreen('screen-auth');
    };
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s=>{s.classList.add('hidden');s.classList.remove('active');});
    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).classList.add('active');
  }

  function getSaveData() { return saveData; }
  function getCompanionLevel() { return saveData ? saveData.companionLevel : 1; }
  function getCompanionName(level) { return companionName(level||saveData?.companionLevel||1); }

  return { show, getSaveData, getCompanionLevel, getCompanionName, drawCatSprite, writeSave };
})();
