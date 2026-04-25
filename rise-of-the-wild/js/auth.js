// ═══════════════════════════════════════════════════
//  auth.js — Login / Create Account screen
// ═══════════════════════════════════════════════════

window.Auth = (() => {

  // ── Animated background canvas ─────────────────
  function initBgCanvas() {
    const canvas = document.getElementById('auth-bg-canvas');
    const ctx    = canvas.getContext('2d');
    let t = 0;

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * 1200,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      c: `hsl(${Math.random()*60+20},80%,60%)`,
    }));

    function drawFrame() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Deep gradient bg
      const grad = ctx.createRadialGradient(W*0.5, H*0.6, 0, W*0.5, H*0.5, Math.max(W,H));
      grad.addColorStop(0,   '#0f1a08');
      grad.addColorStop(0.5, '#081020');
      grad.addColorStop(1,   '#030608');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Drifting particles (fireflies)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const alpha = 0.3 + 0.5 * Math.sin(t * 2 + p.x);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x % W, p.y % H, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Silhouette trees at bottom
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      for (let i = 0; i < W; i += 40 + Math.sin(i) * 15) {
        const h = 60 + Math.sin(i * 0.05) * 30;
        ctx.fillRect(i, H - h, 18, h);
        ctx.beginPath();
        ctx.moveTo(i + 9, H - h - 30);
        ctx.lineTo(i - 10, H - h);
        ctx.lineTo(i + 28, H - h);
        ctx.closePath();
        ctx.fill();
      }

      t += 0.016;
      requestAnimationFrame(drawFrame);
    }
    drawFrame();
  }

  // ── Tab switching ───────────────────────────────
  function initTabs() {
    const tabLogin  = document.getElementById('tab-login-btn');
    const tabCreate = document.getElementById('tab-create-btn');
    const formLogin = document.getElementById('login-form');
    const formCreate= document.getElementById('create-form');

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active'); tabCreate.classList.remove('active');
      formLogin.classList.remove('hidden'); formCreate.classList.add('hidden');
      clearMsg();
    });
    tabCreate.addEventListener('click', () => {
      tabCreate.classList.add('active'); tabLogin.classList.remove('active');
      formCreate.classList.remove('hidden'); formLogin.classList.add('hidden');
      clearMsg();
    });
  }

  function setMsg(text, type = 'error') {
    const el = document.getElementById('auth-msg');
    el.textContent = text;
    el.className = `auth-msg ${type}`;
  }
  function clearMsg() { setMsg('', ''); }

  // ── Login handler ───────────────────────────────
  function initLogin() {
    document.getElementById('btn-login').addEventListener('click', () => {
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const result = Accounts.login(username, password);
      if (!result.ok) { setMsg(result.msg, 'error'); return; }
      setMsg(`Welcome, ${result.user.name}! Loading world…`, 'success');
      setTimeout(() => Loading.start(result.user), 600);
    });
    // Enter key
    ['login-username','login-password'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('btn-login').click();
      });
    });
  }

  // ── Create account handler ──────────────────────
  function initCreate() {
    document.getElementById('btn-create').addEventListener('click', () => {
      const result = Accounts.create({
        name:     document.getElementById('create-name').value.trim(),
        age:      parseInt(document.getElementById('create-age').value, 10),
        gender:   document.getElementById('create-gender').value,
        username: document.getElementById('create-username').value.trim(),
        password: document.getElementById('create-password').value,
        confirm:  document.getElementById('create-confirm').value,
      });
      if (!result.ok) { setMsg(result.msg, 'error'); return; }
      setMsg(result.msg + ' You can now log in.', 'success');
      document.getElementById('tab-login-btn').click();
    });
  }

  function init() {
    initBgCanvas();
    initTabs();
    initLogin();
    initCreate();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => Auth.init());
