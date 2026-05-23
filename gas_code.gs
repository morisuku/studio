const SHEET_NAME = "予約データ";
const OWNER_EMAIL = "info@rikoruto.jp";
const CALENDAR_ID = "9301eee957b644af24cb9caeb26707442243e59eff5d1d51f120bd91437ad815@group.calendar.google.com";
const HOLIDAY_CALENDAR_ID = "ja.japanese#holiday@group.v.calendar.google.com";

// 今日から3ヶ月分の祝日リストを取得
function getHolidays() {
  try {
    const calendar = CalendarApp.getCalendarById(HOLIDAY_CALENDAR_ID);
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 6);
    const events = calendar.getEvents(start, end);
    return events.map(e => {
      const d = e.getStartTime();
      return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
    });
  } catch(err) {
    console.error("祝日取得エラー: " + err.message);
    return [];
  }
}

// ───────── スプレッドシート初期設定 ─────────
// Apps Scriptのエディタから手動で1回だけ実行してください
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  // シートがなければ作成
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // ヘッダーを設定
  const headers = [
    "予約ID", "日付", "開始時刻", "プラン", "人数",
    "お名前", "フリガナ", "年齢", "メールアドレス", "電話番号",
    "メモ", "撮影サービス", "プラン料金", "追加人数料金", "撮影料金", "支払い料金(合計)", "送信日時", "カレンダーイベントID"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダー行のスタイルを整える
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#FF8FB8");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");

  // 列幅を調整
  sheet.setColumnWidth(1, 140);  // 予約ID
  sheet.setColumnWidth(2, 110);  // 日付
  sheet.setColumnWidth(3, 100);  // 開始時刻
  sheet.setColumnWidth(4, 140);  // プラン
  sheet.setColumnWidth(5, 60);   // 人数
  sheet.setColumnWidth(6, 120);  // お名前
  sheet.setColumnWidth(7, 120);  // フリガナ
  sheet.setColumnWidth(8, 60);   // 年齢
  sheet.setColumnWidth(9, 200);  // メールアドレス
  sheet.setColumnWidth(10, 140); // 電話番号
  sheet.setColumnWidth(11, 200); // メモ
  sheet.setColumnWidth(12, 160); // 撮影サービス
  sheet.setColumnWidth(13, 110); // プラン料金
  sheet.setColumnWidth(14, 120); // 追加人数料金
  sheet.setColumnWidth(15, 110); // 撮影料金
  sheet.setColumnWidth(16, 140); // 支払い料金(合計)
  sheet.setColumnWidth(17, 180); // 送信日時
  sheet.setColumnWidth(18, 120); // カレンダーイベントID
  sheet.hideColumns(18);         // カレンダーイベントID列を非表示

  // 1行目を固定
  sheet.setFrozenRows(1);

  Logger.log("セットアップ完了！スプレッドシートの準備ができました。");
}


// プランごとの利用時間（分）
const PLAN_MINUTES = {
  "weekday-3h": 180,
  "weekday-6h": 360,
  "weekend-3h": 180,
  "weekend-6h": 360,
};

const PLAN_BASE_PRICE = {
  "weekday-1slot": 6000,
  "weekday-2slot": 9000,
  "weekend-1slot": 12000,
};

const PLAN_LABEL = {
  "weekday-1slot": "平日1枠（3h）",
  "weekday-2slot": "平日2連枠（6h）",
  "weekend-1slot": "土日祝1枠（5h）",
};

const PLAN_MINUTES = {
  "weekday-1slot": 180,
  "weekday-2slot": 360,
  "weekend-1slot": 300,
};

// 合計料金を計算（5名以上は+¥1,000/人）
function calcPrice(plan, people) {
  const base = PLAN_BASE_PRICE[plan] || 0;
  const extra = Math.max(0, people - 4) * 1000;
  return base + extra;
}

// 料金表示文字列
function priceLabel(plan, people) {
  const total = calcPrice(plan, people);
  const base = PLAN_BASE_PRICE[plan] || 0;
  const extra = Math.max(0, people - 4) * 1000;
  let label = PLAN_LABEL[plan] + " / ¥" + base.toLocaleString();
  if (extra > 0) {
    label += " + 追加" + (people - 4) + "名 ¥" + extra.toLocaleString();
    label += " = 合計 ¥" + total.toLocaleString();
  }
  return label;
}

const SHOOTING_PRICE = {
  "none": 0,
  "photo-1h": 4000, "video-1h": 8000,
  "photo-2h": 7000, "video-2h": 12000,
  "both-2h": 7000,
  "photo-3h": 10000,
  "both-3h": 10000,
};

const SHOOTING_LABEL = {
  "none": "希望なし",
  "photo-1h": "写真のみ 1h", "video-1h": "動画のみ 1h",
  "photo-2h": "写真のみ 2h", "video-2h": "動画のみ 2h", "both-2h": "写真＋動画 2h",
  "photo-3h": "写真のみ 3h", "video-3h": "動画のみ 3h", "both-3h": "写真＋動画 3h",
};

function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
                    .getSheetByName(SHEET_NAME);

    // カレンダーに予定を追加
    const calendarEventId = addToCalendar(data);
    const planStr = priceLabel(data.plan, parseInt(data.people) || 1);

    sheet.appendRow([
      data.id,
      data.date,
      data.time,
      PLAN_LABEL[data.plan] || data.plan,
      parseInt(data.people) || 1,
      data.name,
      data.kana,
      data.age,
      data.email,
      data.phone,
      data.note || "",
      SHOOTING_LABEL[data.shooting] || "希望なし",
      "¥" + (PLAN_BASE_PRICE[data.plan] || 0).toLocaleString(),
      Math.max(0, (parseInt(data.people)||1) - 4) * 1000 > 0 ? "¥" + (Math.max(0, (parseInt(data.people)||1) - 4) * 1000).toLocaleString() : "なし",
      (SHOOTING_PRICE[data.shooting] || 0) > 0 ? "¥" + (SHOOTING_PRICE[data.shooting]).toLocaleString() : "なし",
      "¥" + ((PLAN_BASE_PRICE[data.plan] || 0) + Math.max(0, (parseInt(data.people)||1) - 4) * 1000 + (SHOOTING_PRICE[data.shooting] || 0)).toLocaleString(),
      data.submittedAt,
      calendarEventId || "",
    ]);

    // オーナーへメール通知
    GmailApp.sendEmail(
      OWNER_EMAIL,
      "【もりすくスタジオ】新規予約が入りました",
      "予約ID: " + data.id + "\n" +
      "日付: " + data.date + "\n" +
      "開始時刻: " + data.time + "\n" +
      "プラン: " + planStr + "\n" +
      "人数: " + data.people + "名\n" +
      "お名前: " + data.name + "（" + data.kana + "）\n" +
      "年齢: " + data.age + "\n" +
      "メール: " + data.email + "\n" +
      "電話: " + data.phone + "\n" +
      "メモ: " + (data.note || "なし") + "\n" +
      "撮影サービス: " + (data.shooting && data.shooting !== "none" ? data.shooting : "希望なし"),
      { name: "もりすくスタジオ" }
    );

    // お客様へ確認メール（HTML）
    const people = parseInt(data.people) || 1;
    const basePrice = PLAN_BASE_PRICE[data.plan] || 0;
    const extraPeople = Math.max(0, people - 4);
    const extraPrice = extraPeople * 1000;
    const shootingPrice = SHOOTING_PRICE[data.shooting] || 0;
    const totalPrice = basePrice + extraPrice + shootingPrice;
    const isMinor = parseInt(data.age) <= 17;
    const CONSENT_FILE_ID = "13hOZQ9FAMZ8R5iok_KkkHyRbx0oED9Om";

    const htmlBody =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><style>:root{color-scheme:light;}body{background-color:#f9f0f4 !important;color:#3a3a3a !important;}*{-webkit-text-size-adjust:100%;}</style></head><body style="margin:0;padding:16px;background-color:#f9f0f4 !important;">' +
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#ffffff !important;color:#3a3a3a !important;border-radius:12px;overflow:hidden;border:2px solid #FFD6E8;">' +
        '<div style="background-color:#FF8FB8 !important;padding:32px;text-align:center;">' +
          '<h1 style="margin:0;font-size:22px;color:#ffffff !important;letter-spacing:0.1em;">もりすくスタジオ</h1>' +
          '<p style="margin:8px 0 0;font-size:13px;color:#ffffff !important;">morisuku studio</p>' +
        '</div>' +
        '<div style="background-color:#ffffff !important;padding:32px;">' +
          '<p style="font-size:15px;color:#3a3a3a !important;">' + data.name + ' 様</p>' +
          '<p style="font-size:15px;color:#3a3a3a !important;line-height:1.8;">ご予約ありがとうございます。<br>以下の内容でご予約を受け付けました。</p>' +

          '<div style="background:#FFF5F8;border-radius:10px;padding:20px;margin:24px 0;">' +
            '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
              '<tr style="border-bottom:1px solid #FFD6E8;">' +
                '<td style="padding:10px 8px;color:#D97A8F;font-weight:bold;width:40%;background:#FFF5F8;">予約ID</td>' +
                '<td style="padding:10px 8px;color:#3a3a3a;background:#FFF5F8;">' + data.id + '</td>' +
              '</tr>' +
              '<tr style="border-bottom:1px solid #FFD6E8;">' +
                '<td style="padding:10px 8px;color:#D97A8F;font-weight:bold;background:#FFF5F8;">日付</td>' +
                '<td style="padding:10px 8px;color:#3a3a3a;background:#FFF5F8;">' + data.date + '</td>' +
              '</tr>' +
              '<tr style="border-bottom:1px solid #FFD6E8;">' +
                '<td style="padding:10px 8px;color:#D97A8F;font-weight:bold;background:#FFF5F8;">開始時刻</td>' +
                '<td style="padding:10px 8px;color:#3a3a3a;background:#FFF5F8;">' + data.time + '</td>' +
              '</tr>' +
              '<tr style="border-bottom:1px solid #FFD6E8;">' +
                '<td style="padding:10px 8px;color:#D97A8F;font-weight:bold;background:#FFF5F8;">プラン</td>' +
                '<td style="padding:10px 8px;color:#3a3a3a;background:#FFF5F8;">' + PLAN_LABEL[data.plan] + ' / ¥' + basePrice.toLocaleString() + '</td>' +
              '</tr>' +
              '<tr style="border-bottom:1px solid #FFD6E8;">' +
                '<td style="padding:10px 8px;color:#D97A8F;font-weight:bold;background:#FFF5F8;">ご利用人数</td>' +
                '<td style="padding:10px 8px;color:#3a3a3a;background:#FFF5F8;">' + people + '名' + (extraPeople > 0 ? '（追加' + extraPeople + '名 +¥' + extraPrice.toLocaleString() + '）' : '') + '</td>' +
              '</tr>' +
              (data.shooting && data.shooting !== "none" ?
              '<tr style="border-bottom:1px solid #FFD6E8;">' +
                '<td style="padding:10px 8px;color:#D97A8F;font-weight:bold;background:#FFF5F8;">撮影サービス</td>' +
                '<td style="padding:10px 8px;color:#3a3a3a;background:#FFF5F8;">' + (SHOOTING_LABEL[data.shooting] || data.shooting) + ' / ¥' + shootingPrice.toLocaleString() + '</td>' +
              '</tr>' : '') +
              '<tr>' +
                '<td style="padding:10px 8px;color:#D97A8F;font-weight:bold;background:#FFF5F8;">合計料金</td>' +
                '<td style="padding:10px 8px;color:#D97A8F;font-weight:bold;font-size:16px;background:#FFF5F8;">¥' + totalPrice.toLocaleString() + '</td>' +
              '</tr>' +
            '</table>' +
          '</div>' +

          '<div style="background:#FFF5F8;border-radius:10px;padding:20px;margin:24px 0;font-size:13px;">' +
            '<p style="margin:0 0 10px;font-weight:bold;color:#D97A8F;">キャンセル規定</p>' +
            '<table style="width:100%;border-collapse:collapse;">' +
              '<tr>' +
                '<td style="padding:8px;font-weight:bold;background:#FFD6E8;color:#3a3a3a;">キャンセル時期</td>' +
                '<td style="padding:8px;font-weight:bold;background:#FFD6E8;color:#3a3a3a;">キャンセル料</td>' +
              '</tr>' +
              '<tr style="border-bottom:1px solid #FFD6E8;">' +
                '<td style="padding:8px;background:#ffffff;color:#3a3a3a;">7日前まで</td>' +
                '<td style="padding:8px;color:#3BA37A;background:#ffffff;">無料</td>' +
              '</tr>' +
              '<tr style="border-bottom:1px solid #FFD6E8;">' +
                '<td style="padding:8px;background:#ffffff;color:#3a3a3a;">6日前〜3日前</td>' +
                '<td style="padding:8px;color:#E09F3E;background:#ffffff;">ご利用料金の 50%</td>' +
              '</tr>' +
              '<tr style="border-bottom:1px solid #FFD6E8;">' +
                '<td style="padding:8px;background:#ffffff;color:#3a3a3a;">2日前〜当日</td>' +
                '<td style="padding:8px;color:#C9304A;background:#ffffff;">ご利用料金の 100%</td>' +
              '</tr>' +
              '<tr>' +
                '<td style="padding:8px;background:#ffffff;color:#3a3a3a;">無断キャンセル</td>' +
                '<td style="padding:8px;color:#C9304A;background:#ffffff;">ご利用料金の 100%</td>' +
              '</tr>' +
            '</table>' +
          '</div>' +

          (isMinor ?
          '<div style="background:#FFF0B8;border-radius:10px;padding:16px;margin:24px 0;font-size:13px;line-height:1.8;border-left:4px solid #E09F3E;">' +
            '<p style="margin:0;font-weight:bold;color:#3a3a3a;">⚠️ 未成年者の方へ（重要）</p>' +
            '<p style="margin:8px 0 0;color:#3a3a3a;">18歳未満の方がご利用の場合、<b>親権者同意書</b>が必要です。<br>' +
            '本メールに添付のPDFを印刷し、親権者に署名・捺印いただいた上で<b>来店時にご持参</b>ください。<br><br>' +
            '同意書をお持ちでない場合、ご利用をお断りする場合がございます。<br><br>' +
            '【コンビニ印刷の方へ】<br>' +
            'セブン-イレブン：netprint<br>' +
            'ファミマ・ローソン：ネットプリント<br>' +
            'にてA4サイズで印刷してください。</p>' +
          '</div>'
          : '') +
            '<p style="margin:0;font-weight:bold;color:#3a3a3a;">キャンセル・変更のご連絡</p>' +
            '<p style="margin:8px 0 0;color:#3a3a3a;">キャンセルや日程変更をご希望の場合は、下記メールアドレスまでご連絡ください。<br>' +
            '<a href="mailto:info@rikoruto.jp" style="color:#D97A8F;font-weight:bold;">info@rikoruto.jp</a></p>' +
          '</div>' +

          '<p style="font-size:13px;color:#888888;line-height:1.8;">ご不明な点がございましたら、お気軽にお問い合わせください。<br>当日のご来店をスタッフ一同、心よりお待ちしております。</p>' +

          '<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #FFD6E8;font-size:12px;color:#aaaaaa;">' +
            '<p style="margin:0;color:#aaaaaa;">もりすくスタジオ｜香川県高松市</p>' +
            '<p style="margin:4px 0 0;"><a href="mailto:info@rikoruto.jp" style="color:#D97A8F;">info@rikoruto.jp</a></p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</body></html>';

    const mailOptions = { name: "もりすくスタジオ", htmlBody: htmlBody };
    if (isMinor) {
      try {
        const file = DriveApp.getFileById(CONSENT_FILE_ID);
        mailOptions.attachments = [file.getAs(MimeType.PDF)];
      } catch(err) {
        console.error("同意書PDF取得エラー: " + err.message);
      }
    }

    GmailApp.sendEmail(
      data.email,
      "【もりすくスタジオ】ご予約を受け付けました",
      data.name + " 様\n\nご予約ありがとうございます。\n\n日付: " + data.date + "\n開始時刻: " + data.time + "\nプラン: " + planStr + "\n人数: " + people + "名\n合計料金: ¥" + totalPrice.toLocaleString() + (isMinor ? "\n\n※未成年者の方は添付の親権者同意書を印刷・記入の上、来店時にご持参ください。" : "") + "\n\nキャンセルの場合はinfo@rikoruto.jpまでご連絡ください。\n\nもりすくスタジオ",
      mailOptions
    );
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addToCalendar(data) {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    const minutes = PLAN_MINUTES[data.plan] || 180;

    // 開始日時を組み立て
    const parts = data.date.split("-");
    const timeParts = data.time.split(":");
    const start = new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
      parseInt(timeParts[0]),
      parseInt(timeParts[1])
    );
    const end = new Date(start.getTime() + minutes * 60 * 1000);

    const shootingPrice2 = SHOOTING_PRICE[data.shooting] || 0;
    const people2 = parseInt(data.people) || 1;
    const basePrice2 = PLAN_BASE_PRICE[data.plan] || 0;
    const extraPrice2 = Math.max(0, people2 - 4) * 1000;
    const totalPrice2 = basePrice2 + extraPrice2 + shootingPrice2;

    // カレンダータイトル：シンプルに「名前様 プラン 人数名 ＋撮影〇h」
    const shootingHour = data.shooting && data.shooting !== "none"
      ? data.shooting.replace(/[^0-9]/g, "") + "h" : "";
    const title = data.name + "様 " + PLAN_LABEL[data.plan] + " " + people2 + "名" +
      (shootingHour ? " ＋撮影" + shootingHour : "");

    const description =
      "予約ID: " + data.id + "\n" +
      "人数: " + people2 + "名\n" +
      "撮影サービス: " + (SHOOTING_LABEL[data.shooting] || "希望なし") + "\n" +
      "メール: " + data.email + "\n" +
      "電話: " + data.phone + "\n" +
      "メモ: " + (data.note || "なし");

    const event = calendar.createEvent(title, start, end, { description });
    return event.getId();
  } catch(err) {
    console.error("カレンダー追加エラー: " + err.message);
    return null;
  }
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
                  .getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({ bookings: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const headers = rows[0];
  const bookings = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // 日付型を文字列に変換
      if (val instanceof Date) {
        const y = val.getFullYear();
        const mo = String(val.getMonth() + 1).padStart(2, "0");
        const d = String(val.getDate()).padStart(2, "0");
        const hh = String(val.getHours()).padStart(2, "0");
        const mm = String(val.getMinutes()).padStart(2, "0");
        // 日付かどうか判定（時刻のみのセルは1899年になる）
        if (y === 1899) {
          val = hh + ":" + mm; // 時刻のみ
        } else if (hh === "00" && mm === "00") {
          val = y + "-" + mo + "-" + d; // 日付のみ
        } else {
          val = y + "-" + mo + "-" + d + " " + hh + ":" + mm;
        }
      }
      obj[h] = val;
    });
    return obj;
  });
  return ContentService
    .createTextOutput(JSON.stringify({ bookings, holidays: getHolidays() }))
    .setMimeType(ContentService.MimeType.JSON);
}
