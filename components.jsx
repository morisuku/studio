// Main app for もりすくスタジオ
// Components: Nav, Hero, BoothShowcase, Pricing, Booking (Calendar + Form), Flow, FAQ, Access, SNS, Footer

const { useState, useEffect, useRef, useMemo } = React;

// ───────── Tweaks Defaults ─────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "a",
  "heroLayout": "cards",
  "showSparkles": true,
  "accent": "#FF8FB8"
}/*EDITMODE-END*/;

// ───────── Utilities ─────────
function fmt(n) { return n.toLocaleString("ja-JP"); }
function todayISO() { const d = new Date(); d.setHours(0,0,0,0); return d; }
function addMonths(d, n) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
function sameDay(a, b) { return a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function toISO(d) { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,"0"); const day = String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; }
function fromISO(s) { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); }

// ─ Deterministic availability: most days OK, some few, a handful full
function availability(date) {
  const key = date.getFullYear()*10000 + (date.getMonth()+1)*100 + date.getDate();
  const h = (key * 9301 + 49297) % 233280;
  const r = h / 233280;
  if (r < 0.08) return "full";
  if (r < 0.28) return "few";
  return "ok";
}

// ───────── NAV ─────────
function Nav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#top" className="logo">
          <span className="dot"></span>もりすくスタジオ
        </a>
        <div className="nav-links">
          <a href="#booths">ブース</a>
          <a href="#pricing">料金</a>
          <a href="#flow">ご利用の流れ</a>
          <a href="#faq">FAQ</a>
          <a href="#access">アクセス</a>
          <a href="terms.html">規約</a>
          <a href="#booking" className="nav-cta">ご予約</a>
        </div>
      </div>
    </nav>
  );
}

// ───────── HERO ─────────
function Hero({ showSparkles }) {
  return (
    <section className="hero" id="top">
      <div className="hero-inner">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span>morisuku studio · 2026.7 OPEN — 香川県高松市</span>
          </div>
          <h1>
            ときめきを<br />
            <span style={{whiteSpace:"nowrap"}}><em>そのまま</em>、写真に。</span>
            <span className="accent-font">morisuku studio</span>
          </h1>
          <p className="lead">
            パステルピンクの洋館から、ネオンきらめく夜の街、朱色の中華門まで。
            ひとつのスタジオで、6つの世界観を自由に行き来できるコスプレ専用スタジオです。
          </p>
          <div className="hero-ctas">
            <a href="#booking" className="btn btn-primary">予約カレンダーを見る →</a>
            <a href="#booths" className="btn btn-outline">ブースを覗く</a>
          </div>
          <div className="stats">
            <div className="stat"><div className="num">6</div><div className="lbl">個性派ブース</div></div>
            <div className="stat"><div className="num">~8</div><div className="lbl">名まで利用可</div></div>
            <div className="stat"><div className="num">3h<span style={{fontSize:16}}>〜</span></div><div className="lbl">からご利用</div></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card c1 hero-card-photo"><img src="assets/booth-classic-pink.png" alt="クラシックピンクのサンプル" /></div>
          <div className="hero-card c2 hero-card-photo"><img src="assets/booth-neon.png" alt="ネオンブースのサンプル" /></div>
          <div className="hero-card c3 hero-card-photo"><img src="assets/booth-paper.png" alt="カラーペーパーブースのサンプル" /></div>
          {showSparkles && (
            <>
              <div className="sparkle" style={{top:"5%", left:"-5%", fontSize:28}}>✦</div>
              <div className="sparkle" style={{top:"60%", right:"-5%", fontSize:24, animationDelay:"1s"}}>✧</div>
              <div className="sparkle" style={{bottom:"0%", left:"30%", fontSize:20, animationDelay:"2s"}}>✦</div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ───────── BOOTHS ─────────
function BoothShowcase() {
  const [active, setActive] = useState(0);
  const booth = BOOTHS[active];

  return (
    <section id="booths">
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">— Booths —</div>
          <h2>6つの世界観を、<br />自由に行き来する。</h2>
          <p>どれもフル装飾・小道具付き。4時間のご利用でも、全ブースを回れます。</p>
        </div>

        <div className="booth-tabs">
          {BOOTHS.map((b, i) => (
            <button key={b.id} className={`booth-tab ${i===active?"active":""}`} onClick={() => setActive(i)}>
              {b.name}
            </button>
          ))}
        </div>

        <div className="booth-showcase">
          <div className="booth-visual booth-photo-visual" style={{"--booth-accent": booth.accent}}>
            <img src={booth.image} alt={`${booth.name}のサンプル写真`} />
          </div>
          <div className="booth-info">
            <h3>
              <span className="num">{booth.num} · {booth.subtitle}</span>
              {booth.name}
            </h3>
            <p className="desc">{booth.desc}</p>
            <div className="booth-tags">
              {booth.tags.map(t => <span key={t} className="booth-tag">#{t}</span>)}
            </div>
            <ul className="booth-features">
              {booth.features.map((f,i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        </div>

        <div className="booth-grid-mini">
          {BOOTHS.map((b, i) => (
            <div key={b.id}
                 className={`booth-mini booth-mini-photo ${i===active?"active":""}`}
                 onClick={() => setActive(i)}>
              <img src={b.image} alt={`${b.name}のサムネイル`} />
              <span className="booth-mini-label">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────── PRICING ─────────
function Pricing() {
  return (
    <section id="pricing">
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">— Pricing —</div>
          <h2>わかりやすい、<br />シンプル料金。</h2>
          <p>完全貸切制・基本4名まで・全ブース自由に使い放題。</p>
        </div>

        <div className="pricing-grid">
          <div className="price-card featured">
            <span className="tag">WEEKDAY / 平日</span>
            <h3>平日プラン</h3>
            <div className="price-rows">
              <div className="price-row"><span className="dur">3時間</span><span className="amt">¥7,000</span></div>
              <div className="price-row"><span className="dur">6時間</span><span className="amt">¥13,000</span></div>
              <div className="price-row"><span className="dur"><b>平日割 6時間</b><br /><small>※限定枠</small></span><span className="amt">¥10,000</span></div>
            </div>
            <div className="price-note">平日のご利用がお得！毎月限定枠でさらに ¥3,000 OFF。</div>
          </div>

          <div className="price-card">
            <span className="tag" style={{background:"#4A7DC7"}}>WEEKEND / 土日祝</span>
            <h3>土日祝プラン</h3>
            <div className="price-rows">
              <div className="price-row"><span className="dur">3時間</span><span className="amt">¥8,500</span></div>
              <div className="price-row"><span className="dur">6時間</span><span className="amt">¥16,000</span></div>
              <div className="price-row"><span className="dur">延長 30分</span><span className="amt">¥2,000</span></div>
            </div>
            <div className="price-note">土日祝は予約が埋まりやすいので、お早めに。</div>
          </div>
        </div>

        <div className="addons">
          <div className="addon-item">
            <div className="addon-lbl">撮影サービス 1h</div>
            <div className="addon-val">¥7,000</div>
          </div>
          <div className="addon-item">
            <div className="addon-lbl">撮影サービス 2h</div>
            <div className="addon-val">¥13,000</div>
          </div>
          <div className="addon-item">
            <div className="addon-lbl">撮影サービス 3h</div>
            <div className="addon-val">¥18,000</div>
          </div>
          <div className="addon-item">
            <div className="addon-lbl">5名様〜 / 1名</div>
            <div className="addon-val">+¥1,000</div>
          </div>
        </div>

        <div style={{marginTop:20, fontSize:12, color:"var(--sub)", textAlign:"center"}}>
          平日延長 30分 ¥1,500／土日祝延長 30分 ¥2,000 ／ 最大8名様まで ／ 商用利用は事前にご相談ください。
        </div>
      </div>
    </section>
  );
}

window.Nav = Nav;
window.Hero = Hero;
window.BoothShowcase = BoothShowcase;
window.Pricing = Pricing;
window.TWEAK_DEFAULTS = TWEAK_DEFAULTS;
window.utilFmt = fmt;
window.utilAvailability = availability;
window.utilAddMonths = addMonths;
window.utilSameDay = sameDay;
window.utilToISO = toISO;
window.utilFromISO = fromISO;
window.utilTodayISO = todayISO;
