// ═══════════════════════════════════════════════════
//  sound.js — Web Audio procedural sound engine
//  No files needed — everything generated in code
// ═══════════════════════════════════════════════════
window.Sound = (() => {
  let ctx = null;
  let musicVol = 0.4, sfxVol = 0.7;
  let musicNode = null, musicGain = null;
  let enabled = true;

  function init() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { enabled = false; }
  }

  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  function setMusicVol(v) { musicVol = v/100; if (musicGain) musicGain.gain.value = musicVol; }
  function setSfxVol(v)   { sfxVol   = v/100; }

  // ── Generic tone ──────────────────────────────
  function tone(freq, type, duration, vol, startTime, dest) {
    if (!ctx || !enabled) return;
    const g = ctx.createGain();
    const o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol * sfxVol, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    o.connect(g); g.connect(dest || ctx.destination);
    o.start(startTime); o.stop(startTime + duration + 0.01);
  }

  function noise(duration, vol, startTime) {
    if (!ctx || !enabled) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * sfxVol, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    src.connect(g); g.connect(ctx.destination);
    src.start(startTime); src.stop(startTime + duration + 0.01);
  }

  // ── SFX ───────────────────────────────────────
  const sfx = {
    click() {
      if (!ctx) return; resume();
      const t = ctx.currentTime;
      tone(800, 'square', 0.06, 0.3, t);
      tone(1200,'square', 0.04, 0.2, t+0.03);
    },
    hover() {
      if (!ctx) return; resume();
      tone(600,'sine',0.04,0.1,ctx.currentTime);
    },
    step() {
      if (!ctx) return; resume();
      const t = ctx.currentTime;
      noise(0.05, 0.15, t);
      tone(120,'sine',0.06,0.2,t);
    },
    hit() {
      if (!ctx) return; resume();
      const t = ctx.currentTime;
      noise(0.1, 0.5, t);
      tone(180,'sawtooth',0.12,0.4,t);
      tone(100,'sine',0.18,0.3,t+0.05);
    },
    catch() {
      if (!ctx) return; resume();
      const t = ctx.currentTime;
      [440,554,659,880].forEach((f,i) => tone(f,'sine',0.15,0.3,t+i*0.1));
    },
    flee() {
      if (!ctx) return; resume();
      const t = ctx.currentTime;
      [400,300,200].forEach((f,i) => tone(f,'sawtooth',0.1,0.3,t+i*0.08));
    },
    levelUp() {
      if (!ctx) return; resume();
      const t = ctx.currentTime;
      [262,330,392,523,659,784,1047].forEach((f,i)=>tone(f,'sine',0.2,0.4,t+i*0.08));
    },
    defeat() {
      if (!ctx) return; resume();
      const t = ctx.currentTime;
      [400,350,300,200].forEach((f,i)=>tone(f,'sawtooth',0.18,0.4,t+i*0.1));
    },
    encounter() {
      if (!ctx) return; resume();
      const t = ctx.currentTime;
      noise(0.08,0.6,t);
      [220,277,330].forEach((f,i)=>tone(f,'square',0.2,0.5,t+i*0.05));
    },
    heal() {
      if (!ctx) return; resume();
      const t = ctx.currentTime;
      [523,659,784,1047].forEach((f,i)=>tone(f,'sine',0.15,0.3,t+i*0.07));
    },
    shop() {
      if (!ctx) return; resume();
      const t = ctx.currentTime;
      [330,415,523].forEach((f,i)=>tone(f,'sine',0.12,0.25,t+i*0.06));
    },
    error() {
      if (!ctx) return; resume();
      const t = ctx.currentTime;
      [150,120].forEach((f,i)=>tone(f,'sawtooth',0.15,0.4,t+i*0.1));
    },
  };

  // ── Background music per biome (procedural) ───
  let bgInterval = null;
  let currentBiome = '';

  const MUSIC_THEMES = {
    plains:   { notes:[262,294,330,349,392,440,494,523], tempo:0.5, type:'sine',   vol:0.06 },
    water:    { notes:[196,220,262,294,330],              tempo:0.7, type:'sine',   vol:0.05 },
    tropical: { notes:[294,330,370,415,494,554],          tempo:0.35,type:'triangle',vol:0.07},
    mountain: { notes:[220,247,262,294,330],              tempo:0.65,type:'sine',   vol:0.05 },
    snow:     { notes:[330,370,415,440,494,523],          tempo:0.8, type:'sine',   vol:0.04 },
    savanna:  { notes:[196,220,262,294,349,392],          tempo:0.42,type:'triangle',vol:0.06},
    ocean:    { notes:[130,147,165,175,196],              tempo:0.9, type:'sine',   vol:0.04 },
    volcanic: { notes:[146,165,175,196,220],              tempo:0.3, type:'sawtooth',vol:0.04},
    lobby:    { notes:[330,415,523,622,784,523,415,330],  tempo:0.55,type:'sine',   vol:0.06 },
    battle:   { notes:[220,247,262,196,220,175,196,220],  tempo:0.25,type:'square', vol:0.05 },
  };

  let bgNoteIdx = 0;
  function playBgMusic(biome) {
    if (!ctx || !enabled) return;
    resume();
    if (biome === currentBiome) return;
    stopMusic();
    currentBiome = biome;
    const theme = MUSIC_THEMES[biome] || MUSIC_THEMES.plains;

    musicGain = ctx.createGain();
    musicGain.gain.value = musicVol * theme.vol * 3;
    musicGain.connect(ctx.destination);

    bgNoteIdx = 0;
    function playNext() {
      if (!enabled || currentBiome !== biome) return;
      const freq = theme.notes[bgNoteIdx % theme.notes.length];
      bgNoteIdx++;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime;
      o.type = theme.type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + theme.tempo * 0.9);
      o.connect(g); g.connect(musicGain);
      o.start(t); o.stop(t + theme.tempo);
      bgInterval = setTimeout(playNext, theme.tempo * 1000);
    }
    playNext();
  }

  function stopMusic() {
    clearTimeout(bgInterval);
    bgInterval = null;
    currentBiome = '';
    if (musicGain) { try { musicGain.disconnect(); } catch(e){} musicGain = null; }
  }

  // Attach click sounds to all buttons
  document.addEventListener('click', e => {
    if (e.target.matches('button, .auth-tab, .lobby-btn, .enc-btn, .bact, .ptab'))
      sfx.click();
  });
  document.addEventListener('mouseover', e => {
    if (e.target.matches('button, .lobby-btn')) sfx.hover();
  });

  return { init, resume, sfx, playBgMusic, stopMusic, setMusicVol, setSfxVol };
})();

document.addEventListener('DOMContentLoaded', () => Sound.init());
