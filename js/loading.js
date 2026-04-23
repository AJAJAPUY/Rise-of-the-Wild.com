// loading.js — Loading screen, routes to Lobby
window.Loading = (() => {
  let dinoT=0, dinoRAF=null;

  function showScreen(id){
    document.querySelectorAll('.screen').forEach(s=>{s.classList.add('hidden');s.classList.remove('active');});
    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).classList.add('active');
  }

  function drawDino(ctx,W,H,t){
    ctx.clearRect(0,0,W,H);
    const px=7,bounce=Math.sin(t*1.8)*2.2,sq=1-Math.max(0,bounce)*0.12;
    const bx=W*0.3+Math.sin(t*1.5)*6,by=H*0.38-bounce*px*1.6;
    ctx.fillStyle='#2a8a2a'; ctx.fillRect(0,by+12*px*sq,W,px*2);
    const swingT=Math.sin(t*2.8)*1.6;
    ctx.fillStyle='#FF8C00';
    for(let i=0;i<5;i++) ctx.fillRect(bx-i*2*px,by+4*px+swingT*px*0.5*(1-i/5),px*Math.max(1,2-i*0.3),px);
    ctx.fillStyle='#FF8C00';
    for(let i=0;i<10;i++) for(let j=0;j<6;j++) ctx.fillRect(bx+i*px,by+j*px*sq,px,px);
    ctx.fillStyle='#CC6600';
    for(let i=1;i<9;i++) ctx.fillRect(bx+i*px,by+5*px*sq,px,px);
    for(let leg=0;leg<2;leg++){
      const lx=bx+(1+leg*4)*px,ly=by+6*px;
      ctx.fillStyle='#FF8C00';
      for(let j=0;j<5;j++) ctx.fillRect(lx,ly+j*px,px*2,px);
      ctx.fillStyle='#CC6600'; ctx.fillRect(lx-px*0.5,ly+5*px,px*3,px);
    }
    ctx.fillStyle='#FF6600';
    for(let k=0;k<5;k++){const sw=Math.max(0,Math.sin(t*1.8+k*0.3));for(let h=0;h<=sw;h++) ctx.fillRect(bx+(2+k)*px,by-(h+1)*px,px,px);}
    ctx.fillStyle='#FF8C00';
    for(let j=0;j<3;j++) ctx.fillRect(bx+8*px+(j%2)*px,by-(j+1)*px,px*2,px);
    const hx=bx+9*px,hy=by-5*px;
    ctx.fillStyle='#FF8C00';
    for(let i=0;i<5;i++) for(let j=0;j<4;j++) ctx.fillRect(hx+i*px,hy+j*px,px,px);
    ctx.fillStyle='#CC6600';
    for(let j=0;j<2;j++) ctx.fillRect(hx+4*px,hy+j*px,px,px);
    ctx.fillStyle='#220000'; ctx.fillRect(hx+4*px,hy+px,px,px*2);
    ctx.fillStyle='#FFF'; ctx.fillRect(hx+4*px,hy+px,px*.45,px*.35); ctx.fillRect(hx+4.5*px,hy+2.7*px,px*.45,px*.35);
    const eyeOpen=(Math.sin(t*2)+1)*.5;
    ctx.fillStyle='#FFFF00'; ctx.fillRect(hx+px,hy-px*.5,px*.7,px*.7*Math.max(0.15,eyeOpen));
    ctx.fillStyle='#000'; ctx.fillRect(hx+px+px*.2+Math.sin(t*1.5)*px*.15,hy-px*.35,px*.35,px*.35);
  }

  function animateDino(){
    const c=document.getElementById('loading-dino-canvas');
    const ctx=c.getContext('2d');
    dinoT+=0.016; drawDino(ctx,c.width,c.height,dinoT);
    dinoRAF=requestAnimationFrame(animateDino);
  }

  const TIPS=['Walk near animals to encounter them!','Rare animals give more XP and coins!','Visit the Shop in the Lobby for potions!','Use items during battle for advantage!','Catch animals to grow your Party!','Level up your companion for evolution!','Lv.10: Stripetail. Lv.30: Leo the Lioncat!','The Philippine Eagle is legendary — good luck!','Inn and Igloo restore full HP free!','Press I for Bag, P for Party!'];
  let tipIdx=0;

  function start(user){
    showScreen('screen-loading');
    Sound.resume();
    dinoT=0; animateDino();
    const bar=document.getElementById('loading-bar-fill');
    const pct=document.getElementById('loading-pct');
    const tip=document.getElementById('loading-tip');
    let progress=0;
    tip.textContent='Initializing world…';
    const tipInt=setInterval(()=>{tipIdx=(tipIdx+1)%TIPS.length;tip.textContent=TIPS[tipIdx];},800);
    const interval=setInterval(()=>{
      progress+=Math.random()*15+5;
      if(progress>99) progress=99;
      bar.style.width=progress+'%';
      pct.textContent=Math.floor(progress)+'%';
    },180);
    setTimeout(()=>{
      clearInterval(interval); clearInterval(tipInt);
      bar.style.width='100%'; pct.textContent='100%';
      tip.textContent='Entering the wild…';
      setTimeout(()=>{ cancelAnimationFrame(dinoRAF); Lobby.show(user); },500);
    },3000);
  }

  return { start };
})();
