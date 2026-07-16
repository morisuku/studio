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
          <img className="brand-logo" src="assets/Logo_square512.png" alt="" />
          <span>もりすくスタジオ</span>
        </a>
        <div className="nav-links">
          <a href="#booths">ブース</a>
          <a href="#pricing">料金</a>
          <a href="#flow">ご利用の流れ</a>
          <a href="#faq">FAQ</a>
          <a href="#access">アクセス</a>
          <a href="terms.html" className="nav-terms">規約</a>
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
            <span>morisuku studio · 2026.8 OPEN<br />香川県高松市一宮町151-1</span>
          </div>
          <h1>
            ときめきを<br />
            <span style={{whiteSpace:"nowrap"}}><em>そのまま</em>、写真に。</span>
          </h1>
          <p className="lead">
            クラシックな可愛いピンクブースから、ネオンきらめくアメリカンダイナーブース、そして朱色の中華部屋まで。
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
  const thumbRailRef = useRef(null);
  const thumbDraggingRef = useRef(false);
  const thumbDragLastXRef = useRef(0);
  const thumbDragDistanceRef = useRef(0);
  const thumbPressedIndexRef = useRef(null);
  const booth = BOOTHS[active];

  // スワイプ検出用
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // ブースを切り替えたら写真も1枚目に戻す
  const selectBooth = (i) => {
    setActive(i);
    setPhotoIdx(0);
    if (thumbRailRef.current) thumbRailRef.current.scrollLeft = 0;
  };

  // 表示する写真リスト（photos配列を使用。撮影前でもレイアウト確認できるよう常に6枚分）
  const photos = ((booth.photos && booth.photos.length > 0)
    ? booth.photos
    : [booth.image, booth.image, booth.image, booth.image, booth.image, booth.image]).slice(0, 12);
  const mainImage = photos[photoIdx] || booth.image;

  // 写真切替時にスマホのスクロール位置が先頭へ戻らないよう保持する
  const changePhoto = (nextIndex) => {
    const scrollY = window.scrollY;
    setPhotoIdx(nextIndex);
    requestAnimationFrame(() => window.scrollTo({ top: scrollY, left: 0, behavior: "auto" }));
  };
  const nextPhoto = () => changePhoto((photoIdx + 1) % photos.length);
  const prevPhoto = () => changePhoto((photoIdx - 1 + photos.length) % photos.length);
  useEffect(() => {
    const rail = thumbRailRef.current;
    if (!rail || photos.length < 2) return;
    const normalizeLoop = () => {
      const firstSet = rail.querySelector(".booth-thumb-set");
      const setWidth = firstSet ? firstSet.getBoundingClientRect().width : 0;
      if (!setWidth) return;
      if (rail.scrollLeft >= setWidth * 2) rail.scrollLeft -= setWidth;
      if (rail.scrollLeft <= 0) rail.scrollLeft += setWidth;
    };
    const initialize = () => {
      const firstSet = rail.querySelector(".booth-thumb-set");
      const setWidth = firstSet ? firstSet.getBoundingClientRect().width : 0;
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      if (setWidth && maxScroll > 2) rail.scrollLeft = Math.min(setWidth, maxScroll - 1);
    };
    initialize();
    const timer = setInterval(() => {
      if (thumbDraggingRef.current) return;
      rail.scrollLeft += 1;
      normalizeLoop();
    }, 30);
    return () => clearInterval(timer);
  }, [active, photos.length]);

  const startThumbDrag = (e) => {
    const rail = thumbRailRef.current;
    if (!rail) return;
    thumbDraggingRef.current = true;
    thumbDragDistanceRef.current = 0;
    thumbDragLastXRef.current = e.clientX;
    const pressed = e.target.closest?.(".booth-mini[data-photo-index]");
    thumbPressedIndexRef.current = pressed ? Number(pressed.dataset.photoIndex) : null;
    rail.setPointerCapture?.(e.pointerId);
  };
  const moveThumbDrag = (e) => {
    const rail = thumbRailRef.current;
    if (!rail || !thumbDraggingRef.current) return;
    const delta = e.clientX - thumbDragLastXRef.current;
    thumbDragLastXRef.current = e.clientX;
    thumbDragDistanceRef.current += Math.abs(delta);
    rail.scrollLeft -= delta;
    const firstSet = rail.querySelector(".booth-thumb-set");
    const setWidth = firstSet ? firstSet.getBoundingClientRect().width : 0;
    if (setWidth && rail.scrollLeft >= setWidth * 2) rail.scrollLeft -= setWidth;
    if (setWidth && rail.scrollLeft <= 0) rail.scrollLeft += setWidth;
  };
  const endThumbDrag = (e) => {
    const index = thumbPressedIndexRef.current;
    if (e.type === "pointerup" && thumbDragDistanceRef.current <= 12 && Number.isInteger(index)) {
      changePhoto(index);
    }
    thumbPressedIndexRef.current = null;
    thumbDraggingRef.current = false;
    try { thumbRailRef.current?.releasePointerCapture?.(e.pointerId); } catch (_) {}
  };

  // タッチイベント（スワイプ）
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; touchEndX.current = e.touches[0].clientX; };
  const onTouchMove  = (e) => { touchEndX.current = e.touches[0].clientX; };
  const onTouchEnd   = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {         // 40px以上の移動でスワイプと判定
      if (diff > 0) nextPhoto();       // 左へスワイプ → 次
      else prevPhoto();                // 右へスワイプ → 前
    }
  };

  return (
    <section id="booths">
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">— Booths —</div>
          <h2>5つの世界観を<br />自由に行き来する</h2>
          <p>どれもフル装飾・小道具付き。<br />2ブース確保プランでは選択したブースを、完全貸切プランでは全ブースをご利用いただけます。</p>
        </div>

        <div className="booth-tabs">
          {BOOTHS.map((b, i) => (
            <button key={b.id} className={`booth-tab ${i===active?"active":""}`} onClick={() => selectBooth(i)}>
              {b.name}
            </button>
          ))}
        </div>

        <div className="booth-showcase">
          <div className="booth-media-column">
            <div className="booth-visual booth-photo-visual" style={{"--booth-accent": booth.accent}}
                 onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
              <img src={mainImage} alt={`${booth.name}のサンプル写真 ${photoIdx+1}`} decoding="async"
                   onError={(e) => { if (e.target.src.indexOf(booth.image) === -1) e.target.src = booth.image; }} />
              <button className="booth-arrow booth-arrow-prev" onClick={prevPhoto} aria-label="前の写真">‹</button>
              <button className="booth-arrow booth-arrow-next" onClick={nextPhoto} aria-label="次の写真">›</button>
              <div className="booth-dots">
                {photos.map((_, i) => (
                  <span key={i}
                        className={`booth-dot ${i===photoIdx?"active":""}`}
                        onClick={() => changePhoto(i)}></span>
                ))}
              </div>
            </div>

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

          {/* 最大12枚・1列・無限ループのサムネイル */}
          <div className="booth-thumb-carousel">
            <div className="booth-grid-mini" ref={thumbRailRef}
                 onPointerDown={startThumbDrag} onPointerMove={moveThumbDrag}
                 onPointerUp={endThumbDrag} onPointerCancel={endThumbDrag}>
              {[0, 1, 2].map(copy => (
                <div className="booth-thumb-set" key={copy}>
                  {photos.map((p, i) => (
                    <div key={`${copy}-${i}`}
                         data-photo-index={i}
                         className={`booth-mini booth-mini-photo ${i===photoIdx?"active":""}`}
                    >
                      <img src={p} alt={copy === 1 ? `${booth.name}のサンプル写真 ${i+1}` : ""} draggable="false" loading="lazy" decoding="async"
                           onError={(e) => { if (e.target.src.indexOf(booth.image) === -1) e.target.src = booth.image; }} />
                      <span className="booth-mini-label">PHOTO {i+1}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="booth-care-note">
          <strong>装飾・壁面の取り扱いについて</strong>
          <p>装飾や壁面は大変繊細なため、触れる・もたれる・寄りかかる行為は原則禁止です。動かしてよい物、座ったり乗ったりできる物は、当日スタッフからご案内します。判断に迷う場合は、撮影前にその都度お気軽にスタッフへお声がけください。</p>
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
          <h2>選べる2つの<br />スタジオ利用プラン</h2>
          <p>もりすくスタジオでは、撮影内容や利用人数に合わせて選べる2つのプランをご用意しています。<br />
          少人数で利用する場合は、4つのコンセプトブースからお好きな2ブースを確保できる<br className="mobile-br" />「2ブース確保プラン」。<br />
          全ブースを自由に利用したい場合や、5名以上で利用する場合は「完全貸切プラン」を<br className="mobile-br" />ご利用ください。</p>
        </div>

        <div className="pricing-plan-grid">
          <article className="pricing-plan-card shared">
            <div className="pricing-plan-badge">同時間帯 最大2組</div>
            <h3>2ブース確保プラン</h3>
            <p>中華・ピンク・ゲーミング・ネオンの4ブースから、予約時に1〜2ブースを選択。確保したブースは予約時間中、そのグループ専用です。</p>
            <div className="pricing-price-list">
              <div><span>平日3時間</span><b>¥7,000</b></div>
              <div><span>平日6時間</span><b>¥12,000</b></div>
              <div><span>休日5時間</span><b>¥14,000</b></div>
            </div>
            <p className="pricing-people">1〜4名／1グループあたり</p>
          </article>
          <article className="pricing-plan-card private">
            <div className="pricing-plan-badge">全ブース使用可能</div>
            <h3>完全貸切プラン</h3>
            <p>スタジオ全体を1グループで貸し切り。背景紙を含む全5ブースを自由に利用でき、<span className="mobile-nowrap">他グループとの同時利用はありません。</span></p>
            <div className="pricing-price-list">
              <div><span>平日貸切3時間</span><b>¥12,000</b></div>
              <div><span>平日貸切6時間</span><b>¥20,000</b></div>
              <div><span>休日貸切5時間</span><b>¥24,000</b></div>
            </div>
            <p className="pricing-people">1〜8名／5名以上はこちら</p>
          </article>
        </div>

        <div className="booth-use-example" aria-label="2ブース確保プランの利用例">
          <h3>2ブース確保プランの利用例</h3>
          <div className="booth-example-flow">
            <div><b>A組</b><span>中華＋ピンク</span></div>
            <span className="booth-example-arrow">→</span>
            <div><b>B組</b><span>ゲーミング＋ネオン</span></div>
            <span className="booth-example-arrow">→</span>
            <div className="paper-shared"><b>A組・B組</b><span>背景紙ブースは共用</span></div>
          </div>
          <p>背景紙ブースは共用です。他グループの利用希望がある場合は、1回30分を目安に交代をお願いいたします。他に利用希望がない場合は、<span className="mobile-nowrap">続けてご利用いただけます。</span></p>
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
          2ブース確保プランは同時間帯最大2組です。予約したブースを他グループと共用することはありません。<br />
          人数にはコスプレイヤー、カメラマン、アシスタント、見学者、付き添いをすべて含みます。<br />
          5名以上は完全貸切プランをご利用ください（最大8名）。商用利用は事前にご相談ください。
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
