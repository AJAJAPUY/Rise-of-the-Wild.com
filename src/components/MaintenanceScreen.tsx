import { useEffect, useState, useRef } from 'react';
import { Wrench, Facebook, Shield, Zap, MapPin, Bug, BarChart3 } from 'lucide-react';

// Maintenance end time: 12 hours from page load
const MAINTENANCE_END = new Date(Date.now() + 12 * 60 * 60 * 1000);

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function getTimeLeft(): TimeLeft {
  const distance = MAINTENANCE_END.getTime() - Date.now();
  if (distance <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    total: distance,
    hours: Math.floor(distance / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// Particle component
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function useParticles(count: number) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 4,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.6 + 0.2,
    }))
  );
  return particles;
}

// Flip digit with animation
function FlipDigit({ value, label }: { value: string; label: string }) {
  const [prev, setPrev] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value !== prev) {
      setFlipping(true);
      const t = setTimeout(() => {
        setPrev(value);
        setFlipping(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [value, prev]);

  return (
    <div className="countdown-unit">
      <div className={`flip-card${flipping ? ' flipping' : ''}`}>
        <div className="flip-top">{flipping ? prev : value}</div>
        <div className="flip-bottom">{value}</div>
      </div>
      <span className="unit-label">{label}</span>
    </div>
  );
}

// Progress bar filling over 12h
function ProgressBar() {
  const total = 12 * 60 * 60 * 1000;
  const [pct, setPct] = useState(() => {
    const elapsed = total - getTimeLeft().total;
    return Math.min((elapsed / total) * 100, 100);
  });

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = total - getTimeLeft().total;
      setPct(Math.min((elapsed / total) * 100, 100));
    }, 1000);
    return () => clearInterval(id);
  }, [total]);

  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
        <div className="progress-shimmer" style={{ left: `${pct}%` }} />
      </div>
      <div className="progress-labels">
        <span>Maintenance started</span>
        <span>{pct.toFixed(1)}% complete</span>
        <span>Back online</span>
      </div>
    </div>
  );
}

export default function MaintenanceScreen() {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${pad(m)} ${ampm}`;
  });
  const particles = useParticles(40);
  const iconRef = useRef<HTMLDivElement>(null);
  const done = time.total <= 0;

  useEffect(() => {
    const id = setInterval(() => {
      setTime(getTimeLeft());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      setLastUpdated(`${h12}:${pad(m)} ${ampm}`);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const features = [
    { icon: <MapPin size={14} />, label: 'New Biome', desc: 'Discover the Volcanic Peaks' },
    { icon: <Zap size={14} />, label: '5 Rare Animals', desc: 'Phoenix, Vulture, Dragon Lizard & more' },
    { icon: <BarChart3 size={14} />, label: 'Performance Boost', desc: '40% faster load times' },
    { icon: <Bug size={14} />, label: 'Bug Fixes', desc: 'Fixed encounter system issues' },
    { icon: <Shield size={14} />, label: 'Balance Update', desc: 'Rebalanced creature stats' },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold: #f0a500;
          --gold-dim: rgba(240,165,0,0.18);
          --cyan: #00d4ff;
          --cyan-dim: rgba(0,212,255,0.12);
          --green: #2ecc71;
          --orange: #e67e22;
          --bg-deep: #080a10;
          --bg-mid: #0f1420;
          --panel: rgba(18,24,38,0.92);
          --border: rgba(240,165,0,0.35);
          --text: #c8d8e8;
          --muted: #5a6a7a;
        }

        html, body { height: 100%; overflow: hidden; }

        .maintenance-root {
          position: fixed; inset: 0;
          background: radial-gradient(ellipse at 30% 20%, #0d1829 0%, #080a10 60%);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Segoe UI', system-ui, sans-serif;
          overflow: hidden;
        }

        /* ── Starfield ── */
        .stars {
          position: absolute; inset: 0; pointer-events: none;
        }
        .star {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          animation: twinkle var(--dur) var(--delay) ease-in-out infinite;
        }
        @keyframes twinkle {
          0%,100% { opacity: var(--op); transform: scale(1); }
          50% { opacity: calc(var(--op) * 0.2); transform: scale(0.6); }
        }

        /* ── Floating orbs ── */
        .orb {
          position: absolute; border-radius: 50%; filter: blur(60px);
          pointer-events: none; animation: drift var(--dur2) var(--delay2) ease-in-out infinite alternate;
        }
        .orb-1 { width: 400px; height: 400px; background: rgba(240,165,0,0.06); top:-100px; left:-100px; --dur2:12s; --delay2:0s; }
        .orb-2 { width: 300px; height: 300px; background: rgba(0,212,255,0.07); bottom:-80px; right:-80px; --dur2:9s; --delay2:-3s; }
        .orb-3 { width: 200px; height: 200px; background: rgba(46,204,113,0.05); top:50%; left:50%; --dur2:15s; --delay2:-6s; }
        @keyframes drift { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.1); } }

        /* ── Scroll wrapper ── */
        .scroll-wrapper {
          position: relative; z-index: 10;
          width: 100%; max-height: 100vh; overflow-y: auto;
          display: flex; align-items: flex-start; justify-content: center;
          padding: 24px 16px;
          scrollbar-width: thin; scrollbar-color: var(--gold) transparent;
        }
        .scroll-wrapper::-webkit-scrollbar { width: 4px; }
        .scroll-wrapper::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }

        /* ── Card ── */
        .card {
          width: 100%; max-width: 580px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: clamp(24px, 5vw, 48px);
          text-align: center;
          backdrop-filter: blur(20px);
          box-shadow:
            0 0 0 1px rgba(240,165,0,0.1),
            0 0 40px rgba(240,165,0,0.15),
            0 0 80px rgba(0,212,255,0.08),
            inset 0 1px 0 rgba(255,255,255,0.05);
          animation: card-in 0.8s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes card-in {
          from { opacity:0; transform: translateY(32px) scale(0.97); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }

        /* corner accents */
        .card::before, .card::after {
          content:''; position:absolute; width:18px; height:18px;
          border-color: var(--gold); border-style: solid;
        }
        .card { position: relative; }
        .card::before { top:12px; left:12px; border-width:2px 0 0 2px; border-radius:4px 0 0 0; }
        .card::after  { bottom:12px; right:12px; border-width:0 2px 2px 0; border-radius:0 0 4px 0; }

        /* ── Icon ── */
        .icon-wrap {
          display: inline-flex; align-items: center; justify-content: center;
          width: clamp(72px,14vw,96px); height: clamp(72px,14vw,96px);
          background: radial-gradient(circle, rgba(240,165,0,0.2) 0%, transparent 70%);
          border: 2px solid rgba(240,165,0,0.4);
          border-radius: 50%; margin-bottom: 20px;
          animation: icon-float 3s ease-in-out infinite;
          color: var(--gold);
        }
        @keyframes icon-float {
          0%,100% { transform: translateY(0) rotate(0deg); box-shadow: 0 8px 24px rgba(240,165,0,0.25); }
          50%      { transform: translateY(-10px) rotate(8deg); box-shadow: 0 20px 40px rgba(240,165,0,0.4); }
        }

        /* ── Title ── */
        .title {
          font-size: clamp(22px,6vw,36px);
          font-weight: 800; letter-spacing: 4px; text-transform: uppercase;
          color: var(--gold);
          text-shadow: 0 0 20px rgba(240,165,0,0.6);
          margin-bottom: 6px;
          animation: glow-pulse 2s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%,100% { text-shadow: 0 0 20px rgba(240,165,0,0.5); }
          50%      { text-shadow: 0 0 35px rgba(240,165,0,0.9), 0 0 60px rgba(240,165,0,0.3); }
        }
        .subtitle {
          font-size: clamp(10px,2.5vw,13px);
          color: var(--cyan); letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 24px; font-weight: 600;
        }

        /* ── Message ── */
        .message {
          font-size: clamp(12px,2.5vw,14px);
          color: var(--text); line-height: 1.75;
          background: rgba(0,212,255,0.04);
          border-left: 3px solid var(--cyan);
          padding: 14px 16px; border-radius: 6px;
          text-align: left; margin-bottom: 20px;
        }

        /* ── Countdown ── */
        .countdown-wrap {
          display: flex; align-items: flex-end; justify-content: center;
          gap: clamp(6px,2vw,16px);
          margin: 24px 0;
        }
        .countdown-unit { display: flex; flex-direction: column; align-items: center; gap: 6px; }

        .flip-card {
          position: relative;
          width: clamp(54px, 14vw, 80px);
          height: clamp(64px, 16vw, 96px);
          background: linear-gradient(180deg, #1a2538 0%, #111825 50%, #0d141f 100%);
          border: 1.5px solid rgba(240,165,0,0.5);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .flip-card::after {
          content: '';
          position: absolute; left: 0; right: 0; top: 50%;
          height: 1px; background: rgba(0,0,0,0.6);
          z-index: 3;
        }
        .flip-top, .flip-bottom {
          position: absolute; width: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: clamp(24px, 7vw, 42px);
          font-weight: 800; color: var(--gold);
          font-family: 'Courier New', monospace;
          text-shadow: 0 0 12px rgba(240,165,0,0.7);
        }
        .flip-top { top: 0; height: 50%; align-items: flex-end; padding-bottom: 2px; background: rgba(255,255,255,0.02); }
        .flip-bottom { bottom: 0; height: 50%; align-items: flex-start; padding-top: 2px; }

        .flip-card.flipping .flip-top {
          animation: flip-down 0.3s ease-in both;
          transform-origin: bottom center;
        }
        @keyframes flip-down {
          0%   { transform: rotateX(0deg); }
          100% { transform: rotateX(-90deg); }
        }

        .unit-label {
          font-size: clamp(9px, 2vw, 11px);
          color: var(--muted); letter-spacing: 1.5px; text-transform: uppercase;
          font-weight: 600;
        }

        .colon {
          font-size: clamp(28px, 8vw, 48px);
          color: rgba(240,165,0,0.5); font-weight: 800;
          margin-bottom: 22px;
          animation: colon-blink 1s step-end infinite;
        }
        @keyframes colon-blink { 0%,100%{opacity:1} 50%{opacity:0.15} }

        /* ── Progress ── */
        .progress-wrap { margin: 4px 0 24px; }
        .progress-track {
          height: 6px; background: rgba(255,255,255,0.06);
          border-radius: 999px; overflow: visible; position: relative; margin-bottom: 8px;
        }
        .progress-fill {
          height: 100%; background: linear-gradient(90deg, var(--cyan), var(--gold));
          border-radius: 999px; transition: width 1s linear;
          box-shadow: 0 0 10px rgba(0,212,255,0.5);
        }
        .progress-shimmer {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 8px; height: 8px; border-radius: 50%;
          background: #fff; box-shadow: 0 0 8px 3px rgba(0,212,255,0.8);
          margin-left: -4px;
          animation: shimmer-pulse 1s ease-in-out infinite;
        }
        @keyframes shimmer-pulse {
          0%,100% { transform: translateY(-50%) scale(1); }
          50%      { transform: translateY(-50%) scale(1.6); }
        }
        .progress-labels {
          display: flex; justify-content: space-between;
          font-size: clamp(9px,2vw,11px); color: var(--muted); letter-spacing: 0.5px;
        }

        /* ── Status boxes ── */
        .status-box {
          padding: 12px 16px; border-radius: 8px; font-size: clamp(11px,2.5vw,13px);
          font-weight: 600; margin: 12px 0;
          display: flex; align-items: center; gap: 10px;
        }
        .status-green {
          background: rgba(46,204,113,0.08); border: 1.5px solid rgba(46,204,113,0.35);
          color: var(--green);
        }
        .status-orange {
          background: rgba(230,126,34,0.08); border: 1.5px solid rgba(230,126,34,0.35);
          color: var(--orange);
        }
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .dot-green { background: var(--green); box-shadow: 0 0 6px var(--green); animation: dot-pulse 1.5s ease-in-out infinite; }
        .dot-orange { background: var(--orange); box-shadow: 0 0 6px var(--orange); }
        @keyframes dot-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* ── Features ── */
        .features-list {
          text-align: left; margin: 20px 0;
          background: rgba(0,212,255,0.03);
          border: 1px solid rgba(0,212,255,0.1);
          border-radius: 8px; padding: 16px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .feature-item {
          display: flex; align-items: center; gap: 12px;
          font-size: clamp(11px,2.5vw,13px); color: var(--text);
          padding: 8px 10px; border-radius: 6px;
          background: rgba(255,255,255,0.02);
          transition: background 0.2s, transform 0.2s;
          animation: feature-in 0.5s both;
        }
        .feature-item:nth-child(1){animation-delay:0.1s}
        .feature-item:nth-child(2){animation-delay:0.2s}
        .feature-item:nth-child(3){animation-delay:0.3s}
        .feature-item:nth-child(4){animation-delay:0.4s}
        .feature-item:nth-child(5){animation-delay:0.5s}
        @keyframes feature-in {
          from { opacity:0; transform: translateX(-12px); }
          to   { opacity:1; transform: translateX(0); }
        }
        .feature-item:hover { background: rgba(0,212,255,0.07); transform: translateX(4px); }
        .feature-icon {
          width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
          background: rgba(240,165,0,0.12); border: 1px solid rgba(240,165,0,0.3);
          display: flex; align-items: center; justify-content: center; color: var(--gold);
        }
        .feature-label { font-weight: 700; color: var(--cyan); margin-right: 4px; }

        /* ── Done state ── */
        .done-badge {
          display: inline-block; background: linear-gradient(135deg,#2ecc71,#27ae60);
          color:#fff; font-weight:800; font-size:12px; letter-spacing:2px;
          padding:6px 18px; border-radius:999px; text-transform:uppercase;
          box-shadow: 0 0 20px rgba(46,204,113,0.5);
          animation: done-pop 0.5s cubic-bezier(0.16,1,0.3,1) both;
          margin-bottom: 16px;
        }
        @keyframes done-pop { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }

        /* ── Footer ── */
        .footer {
          font-size: clamp(10px,2vw,12px); color: var(--muted);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 16px; margin-top: 20px;
          display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;
        }
        .footer a {
          color: var(--cyan); text-decoration: none; font-weight: 600;
          display: inline-flex; align-items: center; gap: 4px;
          transition: color 0.2s;
        }
        .footer a:hover { color: var(--gold); }

        /* ── Section heading ── */
        .section-heading {
          font-size: clamp(9px,2vw,11px); letter-spacing: 2.5px; text-transform: uppercase;
          color: var(--muted); margin-bottom: 10px; margin-top: 8px; font-weight: 600;
        }

        /* ── Scanning line ── */
        .scan-line {
          position: absolute; left:0; right:0; height:1px;
          background: linear-gradient(90deg,transparent,rgba(0,212,255,0.4),transparent);
          pointer-events:none; z-index:20;
          animation: scan 4s linear infinite;
        }
        @keyframes scan { from{top:0} to{top:100%} }

        /* ── Responsive tweaks ── */
        @media (max-width: 400px) {
          .colon { margin-bottom: 16px; }
          .countdown-wrap { gap: 4px; }
        }
        @media (min-width: 1024px) {
          .card { padding: 52px; }
        }
      `}</style>

      <div className="maintenance-root">
        {/* Stars */}
        <div className="stars">
          {particles.map(p => (
            <div
              key={p.id}
              className="star"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                '--op': p.opacity,
                '--dur': `${p.duration}s`,
                '--delay': `${-p.delay}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Ambient orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* Scrollable area */}
        <div className="scroll-wrapper">
          <div className="card">
            {/* Scanning line */}
            <div className="scan-line" />

            {/* Icon */}
            <div>
              <div className="icon-wrap" ref={iconRef}>
                <Wrench size={36} strokeWidth={1.8} />
              </div>
            </div>

            <h1 className="title">MAINTENANCE</h1>
            <p className="subtitle">The Wild is Being Tamed</p>

            <div className="message">
              <strong style={{ color: '#f0a500' }}>Rise of the Wild</strong> is currently undergoing scheduled maintenance. Our team of rangers is working hard to deliver new adventures. We'll be back before you know it!
            </div>

            {/* Status */}
            <div className="status-box status-green">
              <div className="status-dot dot-green" />
              System Status: Maintenance in progress — Expected downtime ~12 hours
            </div>

            {/* Countdown */}
            <p className="section-heading">Time Remaining</p>

            {done ? (
              <div className="done-badge">Back Online</div>
            ) : (
              <>
                <div className="countdown-wrap">
                  <FlipDigit value={pad(time.hours)} label="Hours" />
                  <div className="colon">:</div>
                  <FlipDigit value={pad(time.minutes)} label="Mins" />
                  <div className="colon">:</div>
                  <FlipDigit value={pad(time.seconds)} label="Secs" />
                </div>

                <ProgressBar />
              </>
            )}

            {/* Features */}
            <p className="section-heading">What's Coming</p>
            <div className="features-list">
              {features.map((f, i) => (
                <div key={i} className="feature-item">
                  <div className="feature-icon">{f.icon}</div>
                  <span>
                    <span className="feature-label">{f.label}:</span>
                    {f.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* Warning */}
            <div className="status-box status-orange">
              <div className="status-dot dot-orange" />
              All progress is safe. Your collection and inventory will be preserved.
            </div>

            {/* Footer */}
            <div className="footer">
              <span>Follow</span>
              <a href="https://www.facebook.com/jaredpanilan10" target="_blank" rel="noopener noreferrer">
                <Facebook size={13} /> Facebook
              </a>
              <span>for real-time updates</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
