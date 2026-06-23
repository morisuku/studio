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
            <span>morisuku studio · 2026.7 OPEN<br />香川県高松市一宮町151-1</span>
          </div>
          <h1>
            ときめきを<br />
            <span style={{whiteSpace:"nowrap"}}><em>そのまま</em>、写真に。</span>
            <span className="accent-font">morisuku studio</span>
          </h1>
          <p className="lead">
            パステルピンクの洋館から、ネオンきらめく夜の街、朱色の中華門まで。
            ひとつのスタジオで、5つの世界観を自由に行き来できるコスプレ専用スタジオです。
          </p>
          <div className="hero-ctas">
            <a href="#booths" className="btn btn-outline">ブースを覗く</a>
            <a href="#booking" className="btn btn-primary">予約カレンダーを見る →</a>
          </div>
          <div className="stats">
            <div className="stat"><div className="num">5</div><div className="lbl">個性派ブース</div></div>
            <div className="stat"><div className="num">~8</div><div className="lbl">名まで利用可</div></div>
            <div className="stat"><div className="num">3h<span style={{fontSize:16}}>〜</span></div><div className="lbl">からご利用</div></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card c1 hero-card-photo"><img src="assets/booth-classic-pink.png" alt="クラシックピンクのサンプル" /></div>
          <div className="hero-card c2 hero-card-photo"><img src="assets/booth-neon.png" alt="ネオンブースのサンプル" /></div>
          <div className="hero-card c3 hero-card-photo"><img src="assets/booth-paper.png" alt="カラーペーパーブースのサンプル" /></div>
        </div>
      </div>
    </section>
  );
}

// ───────── BOOTHS ─────────
function BoothShowcase() {
  const [active, setActive] = useState(0);
  const [photoIdx, setPhotoIdx] = useState(0);
  const booth = BOOTHS[active];

  // ブースを切り替えたら写真も1枚目に戻す
  const selectBooth = (i) => {
    setActive(i);
    setPhotoIdx(0);
  };

  // 表示する写真リスト（photos配列を使用。撮影前でもレイアウト確認できるよう常に6枚分）
  const photos = (booth.photos && booth.photos.length > 0)
    ? booth.photos
    : [booth.image, booth.image, booth.image, booth.image, booth.image, booth.image];
  const mainImage = photos[photoIdx] || booth.image;

  return (
    <section id="booths">
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">— Booths —</div>
          <h2>5つの世界観を<br />自由に行き来する</h2>
          <p>どれもフル装飾・小道具付き。<br />5つのブースを自由にお使いいただけます。</p>
        </div>

        <div className="booth-tabs">
          {BOOTHS.map((b, i) => (
            <button key={b.id} className={`booth-tab ${i===active?"active":""}`} onClick={() => selectBooth(i)}>
              {b.name}
            </button>
          ))}
        </div>

        <div className="booth-showcase">
          <div className="booth-visual booth-photo-visual" style={{"--booth-accent": booth.accent}}>
            <img src={mainImage} alt={`${booth.name}のサンプル写真 ${photoIdx+1}`}
                 onError={(e) => { if (e.target.src.indexOf(booth.image) === -1) e.target.src = booth.image; }} />
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

        {/* 選択中ブースのサンプル写真5枚（クリックでメイン画像切替） */}
        <div className="booth-grid-mini">
          {photos.map((p, i) => (
            <div key={i}
                 className={`booth-mini booth-mini-photo ${i===photoIdx?"active":""}`}
                 onClick={() => setPhotoIdx(i)}>
              <img src={p} alt={`${booth.name}のサンプル写真 ${i+1}`}
                   onError={(e) => { if (e.target.src.indexOf(booth.image) === -1) e.target.src = booth.image; }} />
              <span className="booth-mini-label">PHOTO {i+1}</span>
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
          <h2>わかりやすい<br />シンプル料金</h2>
          <p>完全貸切制・基本6名まで。<br />全ブース自由に使い放題。</p>
        </div>

        {/* 平日・休日カード */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",
          gap:24, marginBottom:40, alignItems:"start"
        }}>

          {/* 平日枠 */}
          <div style={{
            background:"#ffffff", borderRadius:20, padding:"28px 24px",
            border:"2px solid #FFD6E8", boxShadow:"0 4px 20px rgba(255,143,184,0.1)",
            display:"flex", flexDirection:"column"
          }}>
            <div style={{textAlign:"center", marginBottom:20}}>
              <div style={{fontSize:22, fontWeight:"900", color:"#D97A8F", letterSpacing:"0.05em"}}>平日枠</div>
              <div style={{fontSize:13, color:"#E6A0B8", fontStyle:"italic", fontFamily:"serif"}}>Weekday</div>
            </div>
            {[
              "09:00-12:00", "12:30-15:30", "16:00-19:00", "19:30-22:30"
            ].map((t,i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:12,
                background:"#FFF5F8", borderRadius:10, padding:"10px 16px",
                marginBottom:8, border:"1px solid #FFE0EC", height:52
              }}>
                <span style={{
                  width:28, height:28, borderRadius:"50%",
                  background:"linear-gradient(135deg,#FF8FB8,#FFB8D1)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, flexShrink:0
                }}>🕐</span>
                <span style={{fontWeight:"bold", color:"#3a3a3a", fontSize:15, letterSpacing:"0.05em"}}>{t}</span>
              </div>
            ))}
            <div style={{
              display:"grid", gridTemplateColumns:"1fr 1fr", gap:0,
              marginTop:8,
              background:"#FFF0F5", borderRadius:12,
              border:"1px solid #FFD6E8", height:80,
              alignItems:"center"
            }}>
              <div style={{textAlign:"center", padding:"0 8px"}}>
                <div style={{fontSize:11, color:"#D97A8F", marginBottom:6}}>1枠</div>
                <div style={{fontSize:26, fontWeight:"900", color:"#FF5C8D"}}>¥6,000</div>
              </div>
              <div style={{textAlign:"center", padding:"0 8px", borderLeft:"1px dashed #FFB8D1"}}>
                <div style={{fontSize:11, color:"#D97A8F", marginBottom:6}}>2連枠</div>
                <div style={{fontSize:26, fontWeight:"900", color:"#FF5C8D"}}>¥11,000</div>
              </div>
            </div>
          </div>

          {/* 休日枠 */}
          <div style={{
            background:"#ffffff", borderRadius:20, padding:"28px 24px",
            border:"2px solid #C8D8F8", boxShadow:"0 4px 20px rgba(100,150,220,0.08)",
            display:"flex", flexDirection:"column"
          }}>
            <div style={{textAlign:"center", marginBottom:20}}>
              <div style={{fontSize:22, fontWeight:"900", color:"#6677BB", letterSpacing:"0.05em"}}>休日枠</div>
              <div style={{fontSize:13, color:"#8899CC", fontStyle:"italic", fontFamily:"serif"}}>Holiday</div>
            </div>
            {/* 平日2枠分の高さ（52px×2 + gap8px = 112px）に揃える */}
            {[
              {t:"09:00-14:00", h:112},
              {t:"14:30-19:30", h:112},
            ].map(({t,h},i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:12,
                background:"#F0F4FF", borderRadius:10, padding:"10px 16px",
                marginBottom:8, border:"1px solid #C8D8F8",
                height:h
              }}>
                <span style={{
                  width:28, height:28, borderRadius:"50%",
                  background:"linear-gradient(135deg,#8899DD,#AABBEE)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, flexShrink:0
                }}>🕐</span>
                <span style={{fontWeight:"bold", color:"#3a3a3a", fontSize:22, letterSpacing:"0.05em"}}>{t}</span>
              </div>
            ))}
            {/* 平日料金枠と同じ高さ（80px）に揃える */}
            <div style={{
              display:"grid", gridTemplateColumns:"1fr",
              marginTop:8, background:"#F0F4FF", borderRadius:12,
              border:"1px solid #C8D8F8", height:80,
              alignItems:"center"
            }}>
              <div style={{textAlign:"center", padding:"0 8px"}}>
                <div style={{fontSize:11, color:"#6677BB", marginBottom:6}}>1枠</div>
                <div style={{fontSize:26, fontWeight:"900", color:"#4455AA"}}>¥14,000</div>
              </div>
            </div>
          </div>
        </div>

        {/* 撮影サービス */}
        <div style={{textAlign:"center", marginBottom:20}}>
          <span style={{fontSize:16, color:"#D97A8F", letterSpacing:"0.1em", fontWeight:"bold"}}>✦ 撮影サービス ✦</span>
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",
          gap:20, marginBottom:24
        }}>
          {/* 写真 */}
          <div style={{
            background:"#ffffff", borderRadius:16, padding:"20px",
            border:"2px solid #FFD6E8", boxShadow:"0 2px 12px rgba(255,143,184,0.1)",
            display:"flex", flexDirection:"column", alignItems:"center"
          }}>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16}}>
              <div style={{
                width:36, height:36, borderRadius:"50%",
                background:"linear-gradient(135deg,#FF8FB8,#FFB8D1)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, flexShrink:0
              }}>📷</div>
              <div style={{fontWeight:"bold", color:"#D97A8F", fontSize:14}}>撮影サービス（写真）</div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:0, width:"100%", marginTop:"auto"}}>
              {[{h:"1h",p:"¥4,000"},{h:"2h",p:"¥7,000"},{h:"3h",p:"¥10,000"}].map((item,k) => (
                <div key={k} style={{
                  textAlign:"center", padding:"8px 4px",
                  borderRight: k < 2 ? "1px dashed #FFD6E8" : "none"
                }}>
                  <div style={{fontSize:11, color:"#D97A8F", marginBottom:4}}>{item.h}</div>
                  <div style={{fontSize:17, fontWeight:"900", color:"#FF5C8D"}}>{item.p}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 動画 */}
          <div style={{
            background:"#ffffff", borderRadius:16, padding:"20px",
            border:"2px solid #C8D8F8", boxShadow:"0 2px 12px rgba(100,150,220,0.08)",
            display:"flex", flexDirection:"column", alignItems:"center"
          }}>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16}}>
              <div style={{
                width:36, height:36, borderRadius:"50%",
                background:"linear-gradient(135deg,#8899DD,#AABBEE)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, flexShrink:0
              }}>🎬</div>
              <div style={{fontWeight:"bold", color:"#6677BB", fontSize:14, whiteSpace:"nowrap"}}>撮影サービス（動画編集込）</div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, width:"100%", marginTop:"auto"}}>
              {[{h:"1h",p:"¥8,000"},{h:"2h",p:"¥12,000"}].map((item,k) => (
                <div key={k} style={{
                  textAlign:"center", padding:"8px 4px",
                  borderRight: k < 1 ? "1px dashed #C8D8F8" : "none"
                }}>
                  <div style={{fontSize:11, color:"#6677BB", marginBottom:4}}>{item.h}</div>
                  <div style={{fontSize:17, fontWeight:"900", color:"#4455AA"}}>{item.p}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{textAlign:"center", fontSize:14, color:"var(--sub)", lineHeight:2}}>
          ※料金はすべて税込価格です。<br />
          7名様 +¥7,000　／　8名様 +¥8,000<br />（最大8名様まで・推奨5名様以下）<br />商用利用は事前にご相談ください。
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
