// Booking (Calendar + Form), Flow, FAQ, Access, SNS, Footer
const { useState: useState2, useEffect: useEffect2, useMemo: useMemo2 } = React;

// ───────── BOOKING: CALENDAR ─────────
function Calendar({ selectedDate, onSelect, bookings }) {
  const [month, setMonth] = useState2(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });
  const [popup, setPopup] = useState2(null);
  const today = utilTodayISO();

  const cells = useMemo2(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startWd = first.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
    const prevDays = new Date(month.getFullYear(), month.getMonth(), 0).getDate();
    const arr = [];
    for (let i = startWd - 1; i >= 0; i--) {
      arr.push({ date: new Date(month.getFullYear(), month.getMonth()-1, prevDays - i), outMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ date: new Date(month.getFullYear(), month.getMonth(), d), outMonth: false });
    }
    while (arr.length % 7 !== 0) {
      const last = arr[arr.length-1].date;
      arr.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate()+1), outMonth: true });
    }
    return arr;
  }, [month]);

  const monthLabel = `${month.getFullYear()}.${String(month.getMonth()+1).padStart(2,"0")}`;

  const bookingsByDate = useMemo2(() => {
    const m = {};
    bookings.forEach(b => {
      if (!m[b.date]) m[b.date] = [];
      m[b.date].push(b);
    });
    return m;
  }, [bookings]);

  useEffect2(() => {
    if (!popup) return;
    const h = (e) => {
      if (!e.target.closest('.cal-popup') && !e.target.closest('.cal-cell')) setPopup(null);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [popup]);

  const handleCellClick = (e, c, isPast, iso) => {
    if (isPast || c.outMonth) return;
    const dayBookings = bookingsByDate[iso] || [];
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.closest('.calendar').getBoundingClientRect();
    setPopup({
      date: c.date,
      iso,
      items: dayBookings,
      x: rect.left - containerRect.left + rect.width/2,
      y: rect.bottom - containerRect.top + 8,
    });
    onSelect(c.date);
  };

  // 予約数に基づく空き状況（1日最大3枠想定）
  const availByBookings = (iso) => {
    const count = (bookingsByDate[iso] || []).length;
    if (count >= 3) return "full";
    if (count >= 2) return "few";
    return "ok";
  };

  return (
    <div className="calendar" style={{position:'relative'}}>
      <div className="cal-head">
        <h3>{monthLabel}</h3>
        <div className="cal-nav">
          <button onClick={() => { setPopup(null); setMonth(utilAddMonths(month, -1)); }}>‹</button>
          <button onClick={() => { setPopup(null); setMonth(utilAddMonths(month, 1)); }}>›</button>
        </div>
      </div>
      <div className="cal-grid">
        {["日","月","火","水","木","金","土"].map(w => <div key={w} className="cal-wd">{w}</div>)}
        {cells.map((c, i) => {
          const isPast = c.date < today;
          const iso = utilToISO(c.date);
          const av = availByBookings(iso);
          const isSel = selectedDate && utilSameDay(c.date, selectedDate);
          const hasBooking = !!bookingsByDate[iso];
          const classes = ["cal-cell"];
          if (c.outMonth) classes.push("out-month");
          else classes.push("in-month");
          if (isPast) classes.push("past");
          if (isSel) classes.push("selected");
          if (hasBooking) classes.push("has-booking");
          return (
            <div key={i} className={classes.join(" ")}
                 onClick={(e) => handleCellClick(e, c, isPast, iso)}>
              <span className="day-num">{c.date.getDate()}</span>
              {!c.outMonth && !isPast && (
                <span className={`avail ${av}`}>{av==="ok"?"○":av==="few"?"△":"×"}</span>
              )}
              {hasBooking && <span className="booking-dot" aria-hidden="true"></span>}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span><span className="sym" style={{color:"#3BA37A"}}>○</span> 空きあり</span>
        <span><span className="sym" style={{color:"#E09F3E"}}>△</span> 残りわずか</span>
        <span><span className="sym" style={{color:"var(--china)"}}>×</span> 満席</span>
        <span><span className="sym" style={{background:"#FF8FB8", display:"inline-block", width:12, height:12, borderRadius:3}}></span> ご予約済</span>
      </div>

      {popup && (
        <div className="cal-popup" style={{ left: popup.x, top: popup.y }}
             onClick={(e) => e.stopPropagation()}>
          <button className="cal-popup-close" onClick={() => setPopup(null)} aria-label="close">×</button>
          <div className="cal-popup-date">
            {popup.date.getFullYear()}年{popup.date.getMonth()+1}月{popup.date.getDate()}日
            （{["日","月","火","水","木","金","土"][popup.date.getDay()]}）
          </div>
          {popup.items.length === 0 ? (
            <div className="cal-popup-empty">
              <div className="cal-popup-empty-mark">○</div>
              <div>この日の予約はまだありません</div>
              <div className="cal-popup-hint">右のフォームから予約できます</div>
            </div>
          ) : (
            <>
              <div className="cal-popup-count">{popup.items.length}件のご予約</div>
              <ul className="cal-popup-list">
                {popup.items.map(b => (
                  <li key={b.id}>
                    <span className="cal-popup-time">{b.time}</span>
                    <span className="cal-popup-name">{b.plan === "weekday-3h" ? "平日3h" : b.plan === "weekday-6h" ? "平日6h" : b.plan === "weekday-6h-off" ? "平日割6h" : b.plan === "weekend-3h" ? "土日祝3h" : "土日祝6h"}予約</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// 空き状況（予約送信前の簡易チェック用）
function availByDate(date) {
  return "ok";
}

// ───────── BOOKING: FORM ─────────
function BookingForm({ selectedDate, onBooked, bookings }) {
  const [name, setName] = useState2("");
  const [email, setEmail] = useState2("");
  const [phone, setPhone] = useState2("");
  const [people, setPeople] = useState2(2);
  const [plan, setPlan] = useState2("weekday-3h");
  const [time, setTime] = useState2("10:00");
  const [note, setNote] = useState2("");
  const [kana, setKana] = useState2("");
  const [age, setAge] = useState2("");
  const [agreed, setAgreed] = useState2(false);

  const av = selectedDate ? availByDate(selectedDate) : null;
  const bookedTimes = selectedDate
    ? (bookings || []).filter(b => b.date === utilToISO(selectedDate)).map(b => b.time)
    : [];
  const allTimes = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];
  const canSubmit = selectedDate && av !== "full" && name && kana && age && people && email && phone && agreed && !bookedTimes.includes(time);

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const booking = {
      id: "B-" + Date.now().toString(36).toUpperCase(),
      date: utilToISO(selectedDate),
      time, plan, people,
      name, kana, age,
      email, phone, note,
      submittedAt: new Date().toISOString(),
    };
    onBooked(booking);
    setName(""); setKana(""); setAge("");
    setEmail(""); setPhone(""); setNote(""); setAgreed(false);
  };

  return (
    <div className="booking-form">
      <h3>ご予約フォーム</h3>
      <p className="sub">
        {selectedDate
          ? <>選択中: <b>{selectedDate.getFullYear()}年{selectedDate.getMonth()+1}月{selectedDate.getDate()}日（{["日","月","火","水","木","金","土"][selectedDate.getDay()]}）</b></>
          : "← カレンダーから日付を選んでください"}
      </p>

      <form onSubmit={submit}>
        <div className="form-grid-2">
          <div className="form-row">
            <label>開始時刻 <span className="req">*</span></label>
            <select value={time} onChange={e=>setTime(e.target.value)}>
              {allTimes.map(t => (
                <option key={t} value={t} disabled={bookedTimes.includes(t)}>
                  {t}{bookedTimes.includes(t) ? " (予約済)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>プラン <span className="req">*</span></label>
            <select value={plan} onChange={e=>setPlan(e.target.value)}>
              <option value="weekday-3h">平日 3h / ¥7,000</option>
              <option value="weekday-6h">平日 6h / ¥13,000</option>
              <option value="weekday-6h-off">平日割 6h / ¥10,000</option>
              <option value="weekend-3h">土日祝 3h / ¥8,500</option>
              <option value="weekend-6h">土日祝 6h / ¥16,000</option>
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-row">
            <label>お名前 <span className="req">*</span></label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="山田 花子" />
          </div>
          <div className="form-row">
            <label>フリガナ <span className="req">*</span></label>
            <input type="text" value={kana} onChange={e=>setKana(e.target.value)} placeholder="ヤマダ ハナコ" />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-row">
            <label>年齢 <span className="req">*</span></label>
            <input type="text" value={age} onChange={e=>setAge(e.target.value)} placeholder="22" />
          </div>
          <div className="form-row">
            <label>ご利用人数 <span className="req">*</span></label>
            <select value={people} onChange={e=>setPeople(+e.target.value)}>
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}名{n>=5?` (+¥${(n-4)*1000})`:""}</option>)}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-row">
            <label>メールアドレス <span className="req">*</span></label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-row">
            <label>電話番号 <span className="req">*</span></label>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="090-0000-0000" />
          </div>
        </div>

        <div className="form-row">
          <label>ご要望・メッセージ</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="撮影サービスを希望、機材持ち込みあり、など" />
        </div>

        <div className="terms-check">
          <label>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
            />
            <span>
              <a href="terms.html" target="_blank" rel="noopener noreferrer">利用規約・キャンセル規定</a>を確認しました。
            </span>
          </label>
          <p>ご予約前に、利用時間・更衣・靴養生・動画撮影・未成年利用・キャンセル料について必ずご確認ください。</p>
        </div>

        <button className="submit-btn" type="submit" disabled={!canSubmit}>
          この内容で予約する →
        </button>
      </form>
    </div>
  );
}

function Booking() {
  const [selectedDate, setSelectedDate] = useState2(null);
  const [bookings, setBookings] = useState2(() => {
    try { return JSON.parse(localStorage.getItem("moriscu_bookings") || "[]"); } catch { return []; }
  });
  const [toast, setToast] = useState2(null);

  const onBooked = (b) => {
    const next = [...bookings, b];
    setBookings(next);
    localStorage.setItem("moriscu_bookings", JSON.stringify(next));
    setToast(b);
    setSelectedDate(null);
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <section id="booking">
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">— Booking —</div>
          <h2>ご予約</h2>
          <p>カレンダーから日付を選んで、フォームに必要事項をご記入ください。</p>
        </div>
        <div className="booking-layout">
          <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} bookings={bookings} />
          <BookingForm selectedDate={selectedDate} onBooked={onBooked} bookings={bookings} />
        </div>
      </div>

      <div className={`toast ${toast?"show":""}`}>
        <span className="check">✓</span>
        {toast && <span>予約を受付しました ({toast.id})</span>}
      </div>
    </section>
  );
}

// ───────── FLOW ─────────
function Flow() {
  return (
    <section id="flow">
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">— How it works —</div>
          <h2>ご利用の流れ</h2>
        </div>
        <div className="flow-grid">
          {FLOW.map((f, i) => (
            <div key={i} className="flow-step">
              <h4>{f.t}</h4>
              <p>{f.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────── FAQ ─────────
function FAQ() {
  const [open, setOpen] = useState2(0);
  return (
    <section id="faq">
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">— FAQ —</div>
          <h2>よくあるご質問</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className={`faq-item ${open===i?"open":""}`}>
              <button className="faq-q" onClick={() => setOpen(open===i?-1:i)}>
                <span><span className="q-mark">Q.</span>{f.q}</span>
                <span className="q-toggle">+</span>
              </button>
              <div className="faq-a">
                <div className="inner">{f.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────── ACCESS ─────────
function Access() {
  return (
    <section id="access">
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">— Access —</div>
          <h2>アクセス</h2>
        </div>
        <div className="access-grid">
          <div className="access-map">
            <div className="pin"></div>
            <div className="placeholder-label">※ Google Map 埋め込み予定</div>
          </div>
          <div className="access-details">
            <h3>もりすくスタジオ</h3>
            <div className="studio-sub">morisuku studio</div>
            <div className="access-table">
              <div className="access-row"><span className="k">ADDRESS</span><span>香川県高松市<br />（詳細はご予約確定後にご案内）</span></div>
              <div className="access-row"><span className="k">ACCESS</span><span>空港通り駅 徒歩8分／駐車場あり</span></div>
              <div className="access-row"><span className="k">HOURS</span><span>9:00 – 22:00（完全予約制）</span></div>
              <div className="access-row"><span className="k">OPEN</span><span>2026年7月 オープン予定</span></div>
              <div className="access-row"><span className="k">CONTACT</span><span>info@rikoruto.jp</span></div>
            </div>
            <a href="#booking" className="btn btn-pink">今すぐ予約する →</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────── SNS ─────────
function SNS() {
  const colors = [
    "linear-gradient(135deg, #FFD6E8, #FFB8D1)",
    "linear-gradient(135deg, #D6EAFF, #A8CCF5)",
    "linear-gradient(135deg, #2B1A4A, #FF3FA4)",
    "linear-gradient(135deg, #8B1A28, #C9304A)",
    "linear-gradient(135deg, #3D2A3B, #2B2030)",
    "linear-gradient(135deg, #FFF0B8, #FFD96B)",
    "linear-gradient(135deg, #FFB8D1, #FFF0B8)",
    "linear-gradient(135deg, #A8CCF5, #C9A8E0)",
    "linear-gradient(135deg, #FFD6E8, #D6EAFF)",
    "linear-gradient(135deg, #C9304A, #E6A84A)",
    "linear-gradient(135deg, #2B2030, #C9A8E0)",
    "linear-gradient(135deg, #FFB8D1, #FF3FA4)",
  ];
  return (
    <section id="sns">
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">— Gallery · SNS —</div>
          <h2>#もりすくスタジオ</h2>
          <p>Instagram・X で最新の撮影事例を発信中です。</p>
        </div>
        <div style={{display:"flex", gap:14, justifyContent:"center", marginBottom: 12}}>
          <a href="#" className="btn btn-outline" style={{fontSize:13}}>Instagram @morisuku_studio</a>
          <a href="#" className="btn btn-outline" style={{fontSize:13}}>X @morisuku_studio</a>
        </div>
        <div className="sns-grid">
          {colors.map((bg, i) => (
            <div key={i} className="sns-cell" style={{background: bg}}>
              <div className="ph">PHOTO #{String(i+1).padStart(2,"0")}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────── FOOTER ─────────
function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div>
          <div className="footer-logo">もりすくスタジオ</div>
          <div className="footer-tag">香川県・高松市のコスプレ専用スタジオ。<br />2026年7月オープン予定。</div>
          <div style={{marginTop: 20, fontSize: 11, opacity: 0.6}}>
            利用規約 · プライバシーポリシー · 特定商取引法に基づく表記
          </div>
        </div>
        <div className="footer-col">
          <h5>BOOTHS</h5>
          <ul>
            {BOOTHS.map(b => <li key={b.id}><a href="#booths">{b.name}</a></li>)}
          </ul>
        </div>
        <div className="footer-col">
          <h5>MENU</h5>
          <ul>
            <li><a href="#pricing">料金・プラン</a></li>
            <li><a href="#flow">ご利用の流れ</a></li>
            <li><a href="#faq">よくある質問</a></li>
            <li><a href="#access">アクセス</a></li>
            <li><a href="#booking">ご予約</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>CONTACT</h5>
          <ul>
            <li>info@rikoruto.jp</li>
            <li>Instagram @morisuku_studio</li>
            <li>X @morisuku_studio</li>
          </ul>
        </div>
      </div>
      <div className="footer-copy">
        <span>© 2026 morisuku studio. All rights reserved.</span>
        <span>Kagawa, Japan</span>
      </div>
    </footer>
  );
}

window.Booking = Booking;
window.Flow = Flow;
window.FAQ = FAQ;
window.Access = Access;
window.SNS = SNS;
window.Footer = Footer;
