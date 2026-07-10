// Booking (Calendar + Form), Flow, FAQ, Access, SNS, Footer
const { useState: useState2, useEffect: useEffect2, useMemo: useMemo2 } = React;

// ───────── 予約設定 ─────────
// 予約受付開始日（この日より前は予約不可）。
const BOOKING_START_ISO = "2026-08-01";
// プレオープン特典（無料撮影サービス）の対象期間。この期間の予約だけ無料撮影の選択肢を表示。
// ※現在は無効（過去日を設定して特典を非表示にしている）。再度使う場合は対象期間を設定する。
const PREOPEN_START_ISO = "2000-01-01";
const PREOPEN_END_ISO   = "2000-01-01";
const SELECTABLE_BOOTHS = [
  { id:"chinese", label:"中華ブース" },
  { id:"pink", label:"ピンクブース" },
  { id:"gaming", label:"ゲーミングブース" },
  { id:"neon", label:"ネオンブース" },
];
const isPrivatePlan = (plan) => String(plan || "").startsWith("private-");
const isSharedPlan = (plan) => String(plan || "").startsWith("shared-");
const occupiedSlotTimes = (booking) => {
  const times = [booking.time];
  if (String(booking.plan || "").endsWith("weekday-2slot")) {
    const weekday = ["09:00", "12:30", "16:00", "19:30"];
    const index = weekday.indexOf(booking.time);
    if (index >= 0 && index + 1 < weekday.length) times.push(weekday[index + 1]);
  }
  return times;
};
const bookingTimeRange = (booking) => {
  const weekdayEnd = { "09:00":"12:00", "12:30":"15:30", "16:00":"19:00", "19:30":"22:30" };
  const weekdayDoubleEnd = { "09:00":"15:00", "12:30":"18:30", "16:00":"22:00" };
  const weekendEnd = { "09:00":"14:00", "14:30":"19:30" };
  const plan = String(booking.plan || "");
  const end = plan.endsWith("weekday-2slot")
    ? weekdayDoubleEnd[booking.time]
    : plan.endsWith("weekend-1slot")
      ? weekendEnd[booking.time]
      : weekdayEnd[booking.time];
  return end ? `${booking.time}-${end}` : booking.time;
};
const bookingBoothNames = (booking) => (booking.booths || []).map(id => {
  const booth = SELECTABLE_BOOTHS.find(item => item.id === id);
  return booth ? booth.label.replace("ブース", "") : id;
}).join("/");
const planDurationMinutes = (plan) => String(plan || "").endsWith("weekday-2slot") ? 360
  : String(plan || "").endsWith("weekend-1slot") ? 300 : 180;
const timeToMinutes = (time) => {
  const [hour, minute] = String(time || "0:0").split(":").map(Number);
  return hour * 60 + minute;
};
const bookingOverlaps = (booking, candidateTime, candidatePlan) => {
  const firstStart = timeToMinutes(booking.time);
  const firstEnd = firstStart + planDurationMinutes(booking.plan);
  const secondStart = timeToMinutes(candidateTime);
  const secondEnd = secondStart + planDurationMinutes(candidatePlan);
  return firstStart < secondEnd && secondStart < firstEnd;
};

// ───────── BOOKING: CALENDAR ─────────
function Calendar({ selectedDate, onSelect, bookings, holidays, closedDays }) {
  const [month, setMonth] = useState2(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });
  const [popup, setPopup] = useState2(null);
  const today = utilTodayISO();               // Dateオブジェクト（既存処理用に残す）
  const todayStr = utilToISO(today);          // yyyy-MM-dd 文字列（日付比較用）

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

  // 新制度では同時間帯最大2組。貸切予約がある日は満席扱い。
  const availByBookings = (iso) => {
    const items = bookingsByDate[iso] || [];
    if (!items.length) return "ok";
    const d = new Date(iso + "T00:00:00");
    const weekend = [0, 6].includes(d.getDay()) || (holidays || []).includes(iso);
    const slots = weekend ? ["09:00", "14:30"] : ["09:00", "12:30", "16:00", "19:30"];
    const allBlocked = slots.every(slot => {
      const inSlot = items.filter(b => occupiedSlotTimes(b).includes(slot));
      return inSlot.some(b => isPrivatePlan(b.plan) || (!isPrivatePlan(b.plan) && !isSharedPlan(b.plan))) || inSlot.length >= 2;
    });
    if (allBlocked) return "full";
    if (items.length) return "few";
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
          const iso = utilToISO(c.date);
          const isClosed = (closedDays || []).includes(iso);
          // 今日より前、予約受付開始日より前、または休業日は予約不可
          const isPast = (iso < todayStr) || (iso < BOOKING_START_ISO) || isClosed;
          const av = isClosed ? "full" : availByBookings(iso);
          const isSel = selectedDate && utilSameDay(c.date, selectedDate);
          const hasBooking = !!bookingsByDate[iso];
          const isHoliday = (holidays || []).includes(iso);
          const classes = ["cal-cell"];
          if (c.outMonth) classes.push("out-month");
          else classes.push("in-month");
          if (isPast) classes.push("past");
          if (isClosed) classes.push("closed");
          if (isSel) classes.push("selected");
          if (hasBooking) classes.push("has-booking");
          if (isHoliday) classes.push("holiday");
          return (
            <div key={i} className={classes.join(" ")}
                 onClick={(e) => handleCellClick(e, c, isPast, iso)}>
              <span className="day-num">{c.date.getDate()}</span>
              {!c.outMonth && (isClosed || (iso >= todayStr && iso >= BOOKING_START_ISO)) && (
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
        <div className="cal-popup"
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
              <div className="cal-popup-hint">下のフォームから予約できます</div>
            </div>
          ) : (
            <>
              <div className="cal-popup-count">{popup.items.length}件のご予約</div>
              <ul className="cal-popup-list">
                {popup.items.map(b => (
                  <li key={b.id}>
                    <span className="cal-popup-time">{bookingTimeRange(b)}</span>
                    {isPrivatePlan(b.plan) ? (
                      <span className="cal-popup-name cal-popup-private">全ブース 予約済（完全貸切）</span>
                    ) : isSharedPlan(b.plan) ? (
                      <span className="cal-popup-reservation">
                        <span className="cal-popup-booth-chip">{bookingBoothNames(b) || "ブース情報なし"}</span>
                        <span className="cal-popup-name">予約済</span>
                      </span>
                    ) : (
                      <span className="cal-popup-name">予約済み</span>
                    )}
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
function BookingForm({ selectedDate, onBooked, bookings, holidays }) {
  const [name, setName] = useState2("");
  const [email, setEmail] = useState2("");
  const [phone, setPhone] = useState2("");
  const [people, setPeople] = useState2(2);
  const [plan, setPlan] = useState2("shared-weekday-1slot");
  const [time, setTime] = useState2("10:00");
  const [note, setNote] = useState2("");
  const [kana, setKana] = useState2("");
  const [age, setAge] = useState2("");
  const [shooting, setShooting] = useState2("none");
  const [booths, setBooths] = useState2([]);
  const [agreed, setAgreed] = useState2(false);

  const av = selectedDate ? availByDate(selectedDate) : null;

  const planHours = {
    "shared-weekday-1slot": 3, "shared-weekday-2slot": 6, "shared-weekend-1slot": 5,
    "private-weekday-1slot": 3, "private-weekday-2slot": 6, "private-weekend-1slot": 5,
  };

  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

  // その日の予約済みを取得
  const dayBookings = selectedDate
    ? (bookings || []).filter(b => b.date === utilToISO(selectedDate))
    : [];

  // 選択日が土日または祝日かどうか判定（先に定義）
  const selectedISO = selectedDate ? utilToISO(selectedDate) : "";
  // プレオープン特典期間（無料撮影サービス対象）かどうか
  const isPreopen = selectedISO >= PREOPEN_START_ISO && selectedISO <= PREOPEN_END_ISO;
  const isWeekend = selectedDate
    ? [0, 6].includes(selectedDate.getDay()) || (holidays || []).includes(selectedISO)
    : false;

  // 平日：09:00 / 12:30 / 16:00 / 19:30の4択
  // 土日祝：09:00 / 14:30の2択
  const WEEKDAY_SLOTS = ["09:00", "12:30", "16:00", "19:30"];

  // 予約が占有する全スロットを集計
  // 平日2連枠(weekday-2slot)は開始スロット＋次のスロットの2つを占有する
  const bookedTimes = new Set();
  dayBookings.forEach(b => occupiedSlotTimes(b).forEach(t => bookedTimes.add(t)));

  const bookingsAt = (slotTime) => dayBookings.filter(b => occupiedSlotTimes(b).includes(slotTime));
  const slotBlockedForPlan = (slotTime, candidatePlan) => {
    const items = bookingsAt(slotTime);
    if (isPrivatePlan(candidatePlan)) return items.length > 0;
    return items.some(b => isPrivatePlan(b.plan) || (!isPrivatePlan(b.plan) && !isSharedPlan(b.plan))) || items.length >= 2;
  };

  // 2連枠は「次のスロットも空いている」場合のみ可能
  const canDouble = (t, candidatePlan = plan) => {
    const idx = WEEKDAY_SLOTS.indexOf(t);
    if (idx === -1 || idx + 1 >= WEEKDAY_SLOTS.length) return false; // 19:30は次がない
    return !slotBlockedForPlan(t, candidatePlan) && !slotBlockedForPlan(WEEKDAY_SLOTS[idx + 1], candidatePlan);
  };

  const SLOTS = isWeekend
    ? [
        { time: "09:00", allow6h: false, disabled: slotBlockedForPlan("09:00", plan) },
        { time: "14:30", allow6h: false, disabled: slotBlockedForPlan("14:30", plan) },
      ]
    : [
        { time: "09:00", allow6h: canDouble("09:00"), disabled: slotBlockedForPlan("09:00", plan) },
        { time: "12:30", allow6h: canDouble("12:30"), disabled: slotBlockedForPlan("12:30", plan) },
        { time: "16:00", allow6h: canDouble("16:00"), disabled: slotBlockedForPlan("16:00", plan) },
        { time: "19:30", allow6h: false, disabled: slotBlockedForPlan("19:30", plan) },
      ];

  // 選択中の枠情報
  const currentSlot = SLOTS.find(s => s.time === time) || SLOTS[0];
  const isLateStart = currentSlot ? !currentSlot.allow6h : false;

  // 2連枠不可の枠を選んでいるのに2連枠プランなら1枠に切替
  React.useEffect(() => {
    if (!SLOTS.find(s => s.time === time)) {
      setTime(SLOTS[0]?.time || "09:00");
    }
  }, [time, isWeekend, dayBookings.length]);

  // 日付変更時にプランを自動切替
  React.useEffect(() => {
    if (!selectedDate) return;
    const prefix = isPrivatePlan(plan) ? "private" : "shared";
    if (isWeekend && plan.includes("weekday")) {
      setPlan(prefix + "-weekend-1slot");
    } else if (!isWeekend && plan.includes("weekend")) {
      setPlan(prefix + "-weekday-1slot");
    }
    // プレオープン期間外の日で無料撮影が選ばれていたら解除
    if (!isPreopen && shooting === "free-photo-3h") {
      setShooting("none");
    }
  }, [selectedDate]);

  React.useEffect(() => {
    if (people > 4 && !isPrivatePlan(plan)) {
      setPlan(isWeekend ? "private-weekend-1slot" : "private-weekday-1slot");
      setBooths([]);
    }
  }, [people]);

  const reservedBooths = new Set(dayBookings
    .filter(b => bookingOverlaps(b, time, plan))
    .flatMap(b => b.booths || []));
  const toggleBooth = (boothId) => {
    if (reservedBooths.has(boothId)) return;
    setBooths(current => current.includes(boothId)
      ? current.filter(id => id !== boothId)
      : current.length < 2 ? [...current, boothId] : current);
  };

  const canSubmit = selectedDate && name && kana && age && people && email && phone && agreed
    && (isPrivatePlan(plan) || (booths.length >= 1 && booths.length <= 2))
    && SLOTS.find(s => s.time === time) && !SLOTS.find(s => s.time === time)?.disabled
    && (!plan.endsWith("weekday-2slot") || currentSlot?.allow6h);

  const changePlan = (nextPlan) => {
    setPlan(nextPlan);
    if (nextPlan.endsWith("weekday-2slot")) {
      const availableStart = WEEKDAY_SLOTS.find(t => canDouble(t, nextPlan));
      if (availableStart) setTime(availableStart);
    }
    if (isPrivatePlan(nextPlan)) setBooths([]);
  };

  const [submitting, setSubmitting] = useState2(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    const booking = {
      id: "B-" + Date.now().toString(36).toUpperCase(),
      date: utilToISO(selectedDate),
      time, plan, people,
      name, kana, age,
      email, phone, note, shooting, booths,
      submittedAt: new Date().toISOString(),
    };
    setSubmitting(true);
    try {
      const res = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(booking),
      });
      const result = await res.json();
      if (result.status === "ok") {
        onBooked(booking);
        setName(""); setKana(""); setAge("");
        setEmail(""); setPhone(""); setNote(""); setShooting("none"); setBooths([]); setAgreed(false);
        if (result.warning) alert(result.warning);
      } else {
        alert("送信に失敗しました: " + (result.message || "不明なエラー"));
      }
    } catch(err) {
      alert("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
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
              {SLOTS.map(slot => (
                <option key={slot.time} value={slot.time} disabled={slot.disabled}>
                  {slot.time}{slot.disabled ? " (予約済)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>プラン <span className="req">*</span></label>
            <select value={plan} onChange={e=>changePlan(e.target.value)}>
              {!isWeekend && people <= 4 && <option value="shared-weekday-1slot">2ブース確保・平日3h / ¥7,000</option>}
              {!isWeekend && time !== "19:30" && people <= 4 && <option value="shared-weekday-2slot">2ブース確保・平日6h / ¥12,000</option>}
              {isWeekend && people <= 4 && <option value="shared-weekend-1slot">2ブース確保・休日5h / ¥14,000</option>}
              {!isWeekend && <option value="private-weekday-1slot">完全貸切・平日3h / ¥12,000</option>}
              {!isWeekend && time !== "19:30" && <option value="private-weekday-2slot">完全貸切・平日6h / ¥20,000</option>}
              {isWeekend && <option value="private-weekend-1slot">完全貸切・休日5h / ¥24,000</option>}
            </select>
          </div>
        </div>

        {isSharedPlan(plan) && (
          <div className="form-row">
            <label>確保するブース <span className="req">*</span></label>
            <div className="booth-checkbox-grid">
              {SELECTABLE_BOOTHS.map(booth => {
                const unavailable = reservedBooths.has(booth.id);
                return (
                  <label key={booth.id} className={`booth-checkbox ${unavailable ? "disabled" : ""}`}>
                    <input type="checkbox" checked={booths.includes(booth.id)} disabled={unavailable}
                      onChange={() => toggleBooth(booth.id)} />
                    <span>{booth.label}{unavailable ? "（予約済）" : ""}</span>
                  </label>
                );
              })}
            </div>
            <p className="form-help">1〜2ブースを選択してください。選択したブースは予約時間中、他グループと共用しません。背景紙ブースは共用です。</p>
          </div>
        )}

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
            <input type="text" value={age} onChange={e=>setAge(e.target.value.replace(/[^0-9]/g, ""))} placeholder="22" inputMode="numeric" />
          </div>
          <div className="form-row">
            <label>ご利用人数 <span className="req">*</span></label>
            <select value={people} onChange={e=>setPeople(+e.target.value)}>
              <option value={1}>1名</option>
              <option value={2}>2名</option>
              <option value={3}>3名</option>
              <option value={4}>4名</option>
              <option value={5}>5名</option>
              <option value={6}>6名</option>
              <option value={7}>7名</option>
              <option value={8}>8名</option>
            </select>
            <p className="form-help">カメラマン、アシスタント、見学者、付き添いを含む全員の人数です。5名以上は完全貸切になります。</p>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-row">
            <label>メールアドレス <span className="req">*</span></label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-row">
            <label>電話番号 <span className="req">*</span></label>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/[^0-9-]/g, ""))} placeholder="090-0000-0000" inputMode="numeric" />
          </div>
        </div>

        <div className="form-row">
          <label>撮影サービス</label>
          <select value={shooting} onChange={e => setShooting(e.target.value)}>
            <option value="none">希望しない</option>
            {isPreopen && <option value="free-photo-3h">無料撮影サービス（写真3h）/ ¥0</option>}
            <option value="photo-1h">写真 1h / ¥4,000</option>
            <option value="photo-2h">写真 2h / ¥7,000</option>
            <option value="photo-3h">写真 3h / ¥10,000</option>
            <option value="video-1h">動画（編集込）1h / ¥8,000</option>
            <option value="video-2h">動画（編集込）2h / ¥12,000</option>
          </select>
          {isPreopen && (
            <p style={{fontSize:12, color:"var(--pink-deep)", marginTop:6, fontWeight:"bold"}}>
              ※各日先着1組様限定。2組目以降のお申込みは通常料金でのご案内となります。
            </p>
          )}
          {shooting !== "none" && (
            <p style={{fontSize:12, color:"var(--sub)", marginTop:6}}>
              ※撮影サービスの時間はスタジオご利用時間とは別途となります
            </p>
          )}
        </div>

        <div className="form-row">
          <label>ご要望・メッセージ</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="撮影サービスを希望、商用利用、など" />
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

        <button className="submit-btn" type="submit" disabled={!canSubmit || submitting}>
          {submitting ? "送信中..." : "この内容で予約する →"}
        </button>
      </form>
    </div>
  );
}

const GAS_URL = "https://script.google.com/macros/s/AKfycbwMgqOZ9UPToOs1cxnccF73u9d9Xo7uJNuxOzGQPVH99kQUGSO99ySV4zrFwZNqomM8Nw/exec";
window.GAS_URL = GAS_URL;

function Booking() {
  const [selectedDate, setSelectedDate] = useState2(null);
  const [bookings, setBookings] = useState2([]);
  const [holidays, setHolidays] = useState2([]);
  const [closedDays, setClosedDays] = useState2([]);
  const [loading, setLoading] = useState2(true);
  const [toast, setToast] = useState2(null);

  // GASから予約データを取得
  const fetchBookings = async () => {
    try {
      const res = await fetch(GAS_URL + "?t=" + Date.now());
      const data = await res.json();
      if (data.bookings) {
        // スプレッドシートのヘッダー名をJSのキーに変換
        const mapped = data.bookings.map(b => {
          // 時刻を09:00形式に正規化（スプレッドシートが9:00:00で返す場合に対応）
          let rawTime = String(b["開始時刻"] || "");
          if (rawTime.includes(":")) {
            const parts = rawTime.split(":");
            rawTime = String(parts[0]).padStart(2, "0") + ":" + String(parts[1]).padStart(2, "0");
          }
          return {
            id: b["予約ID"],
            date: String(b["日付"]).slice(0, 10), // 日付も念のため正規化
            time: rawTime,
            plan: b["プランコード"] || b["プラン"],
            booths: String(b["選択ブース"] || "").split(",").map(v => v.trim()).filter(Boolean),
            people: b["人数"],
            name: b["お名前"],
            kana: b["フリガナ"],
            age: b["年齢"],
            email: b["メールアドレス"],
            phone: b["電話番号"],
            note: b["メモ"],
            submittedAt: b["送信日時"],
          };
        });
        setBookings(mapped);
      }
      if (data.holidays) {
        setHolidays(data.holidays);
      }
      if (data.closedDays) {
        setClosedDays(data.closedDays);
      }
    } catch(err) {
      console.error("予約データの取得に失敗しました", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect2(() => {
    fetchBookings();
  }, []);

  const onBooked = (b) => {
    setBookings(prev => [...prev, b]);
    setToast(b);
    setSelectedDate(null);
    setTimeout(() => setToast(null), 5000);
    // 5秒後に最新データを再取得
    setTimeout(() => fetchBookings(), 5000);
  };

  return (
    <section id="booking">
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">— Booking —</div>
          <h2>ご予約</h2>
          <p>カレンダーから日付を選んで、<br />フォームに必要事項をご記入ください。</p>
        </div>
        {loading ? (
          <div style={{textAlign:"center", padding:"40px", opacity:0.5}}>予約状況を読み込み中...</div>
        ) : (
          <div className="booking-layout">
            <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} bookings={bookings} holidays={holidays} closedDays={closedDays} />
            <BookingForm selectedDate={selectedDate} onBooked={onBooked} bookings={bookings} holidays={holidays} />
          </div>
        )}
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
            <iframe
              src="https://maps.google.com/maps?q=香川県高松市一宮町151-1&output=embed&hl=ja"
              width="100%" height="100%" style={{border:0, borderRadius:16}} allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div className="access-details">
            <h3>もりすくスタジオ</h3>
            <div className="studio-sub">morisuku studio</div>
            <div className="access-table">
              <div className="access-row"><span className="k">ADDRESS</span><span>〒761-8084<br />香川県高松市一宮町151-1</span></div>
              <div className="access-row"><span className="k">ACCESS</span><span>琴電空港通駅から徒歩7分<br />駐車場8台あり</span></div>
              <div className="access-row"><span className="k">HOURS</span><span>09:00 – 22:30（完全予約制）</span></div>
              <div className="access-row"><span className="k">OPEN</span><span>2026年7月 オープン予定</span></div>
              <div className="access-row"><span className="k">CONTACT</span><span>info@morisuku-studio.com</span></div>
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
          <a href="https://www.instagram.com/morisuku_studio/" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{fontSize:13}}>Instagram @morisuku_studio</a>
          <a href="https://x.com/morisuku_studio" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{fontSize:13}}>X @morisuku_studio</a>
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
          <div className="footer-tag">〒761-8084 香川県高松市一宮町151-1<br />2026年7月オープン予定。</div>
          <div style={{marginTop: 20, fontSize: 11, opacity: 0.6}}>
            <a href="privacy.html" style={{color:"inherit"}}>プライバシーポリシー</a>
            {" · "}
            <a href="tokutei.html" style={{color:"inherit"}}>特定商取引法に基づく表記</a>
            {" · "}
            <a href="terms.html" style={{color:"inherit"}}>利用規約</a>
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
            <li><a href="mailto:info@morisuku-studio.com" style={{color:"inherit"}}>info@morisuku-studio.com</a></li>
            <li><a href="https://www.instagram.com/morisuku_studio/" target="_blank" rel="noopener noreferrer" style={{color:"inherit"}}>Instagram @morisuku_studio</a></li>
            <li><a href="https://x.com/morisuku_studio" target="_blank" rel="noopener noreferrer" style={{color:"inherit"}}>X @morisuku_studio</a></li>
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
