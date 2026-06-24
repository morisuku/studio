// booth data + shared utilities for もりすくスタジオ

const BOOTHS = [
  {
    id: "chinese",
    num: "Booth 01",
    name: "中華ブース",
    subtitle: "Chinoiserie",
    desc: "格子窓・提灯で構成した、かっこいい系の中華テイストブース。チャイナドレス、仙侠・武侠風、和中ミックスの衣装を引き立てる重厚感のある空間です。",
    tags: ["中華", "チャイナ", "提灯", "武侠"],
    features: [
      "格子窓・提灯モチーフの背景",
      "落ち着いた色調で衣装が映える装飾",
      "座り・立ちどちらも撮りやすい奥行き設計",
    ],
    gradient: "linear-gradient(135deg, #FFD3DC 0%, #F7A6B7 52%, #FFE0A8 100%)",
    accent: "#D97A8F",
    image: "assets/booth-chinese.png",
    photos: ["assets/booth-chinese-1.png", "assets/booth-chinese-2.png", "assets/booth-chinese-3.png", "assets/booth-chinese-4.png", "assets/booth-chinese-5.png", "assets/booth-chinese-6.png"],
    ph: "BOOTH 01 / CHINOISERIE",
  },
  {
    id: "classic-pink",
    num: "Booth 02",
    name: "クラシックピンク",
    subtitle: "Classic Pink",
    desc: "白いソファとピンクの壁面で構成した、王道の可愛いブース。姫系・アイドル系・甘め衣装をやわらかく引き立てる、明るい雰囲気の空間です。",
    tags: ["洋館", "姫系", "白ソファ", "ピンク"],
    features: [
      "上品な白いソファ",
      "やわらかいピンクの壁面装飾",
      "全身・寄りどちらも映える背景密度",
    ],
    gradient: "linear-gradient(135deg, #FFD6E8 0%, #FFB8D1 50%, #F5A8C7 100%)",
    accent: "#E6729C",
    image: "assets/booth-classic-pink.png",
    photos: ["assets/booth-classic-pink-1.png", "assets/booth-classic-pink-2.png", "assets/booth-classic-pink-3.png", "assets/booth-classic-pink-4.png", "assets/booth-classic-pink-5.png", "assets/booth-classic-pink-6.png"],
    ph: "BOOTH 02 / CLASSIC PINK",
  },
  {
    id: "neon",
    num: "Booth 03",
    name: "ネオンブース",
    subtitle: "Neon District",
    desc: "ネオンとアメリカンダイナーを組み合わせたポップな夜景ブース。ピンクの丸テーブルを配置し、Y2K、ストリート系、レトロアメリカン系の撮影に合います。",
    tags: ["ネオン", "ダイナー", "Y2K", "レトロ"],
    features: [
      "ピンク・ブルー系のネオン演出",
      "ピンクの丸テーブルを常設",
      "アメリカンダイナー風の世界観",
    ],
    gradient: "linear-gradient(135deg, #2B1A4A 0%, #FF3FA4 50%, #1FC8F5 100%)",
    accent: "#FF3FA4",
    image: "assets/booth-neon.png",
    photos: ["assets/booth-neon-1.png", "assets/booth-neon-2.png", "assets/booth-neon-3.png", "assets/booth-neon-4.png", "assets/booth-neon-5.png", "assets/booth-neon-6.png"],
    ph: "BOOTH 03 / NEON DISTRICT",
  },
  {
    id: "gaming",
    num: "Booth 04",
    name: "ゲーミングブース",
    subtitle: "Gaming Room",
    desc: "白を基調にしたゲーミングスペース。デスク・モニター・チェアを配置し、ストリーマー・配信者キャラ、ゲーム系作品の撮影にぴったりの清潔感ある空間です。",
    tags: ["ゲーミング", "白基調", "配信者", "ストリーマー"],
    features: [
      "白メインのデスク・チェア構成",
      "RGBライティング演出",
      "配信ルーム風のセットアップ",
    ],
    gradient: "linear-gradient(135deg, #0F172A 0%, #0EA5E9 45%, #EF4444 100%)",
    accent: "#38BDF8",
    image: "assets/booth-gaming.png",
    photos: ["assets/booth-gaming-1.png", "assets/booth-gaming-2.png", "assets/booth-gaming-3.png", "assets/booth-gaming-4.png", "assets/booth-gaming-5.png", "assets/booth-gaming-6.png"],
    ph: "BOOTH 04 / GAMING ROOM",
  },
  {
    id: "paper",
    num: "Booth 05",
    name: "カラーペーパーブース",
    subtitle: "Color Paper",
    desc: "ホワイト・パステルピンク・ブルー・イエローの背景紙を備えたシンプルブース。フィギュア台などの小道具もあり、キャラに合わせた撮影や宣材撮影に便利です。",
    tags: ["背景紙", "パステル", "小道具", "宣材"],
    features: [
      "ホワイト・ピンク・ブルー・イエローの背景紙",
      "フィギュア台などの小道具あり",
      "衣装の色を邪魔しないシンプル設計",
    ],
    gradient: "linear-gradient(135deg, #FFD6E8 0%, #D6EAFF 33%, #FFF0B8 66%, #FAFAFA 100%)",
    accent: "#FF8FB8",
    image: "assets/booth-paper.png",
    photos: ["assets/booth-paper-1.png", "assets/booth-paper-2.png", "assets/booth-paper-3.png", "assets/booth-paper-4.png", "assets/booth-paper-5.png", "assets/booth-paper-6.png"],
    ph: "BOOTH 05 / COLOR PAPER",
  },
];

const FAQS = [
  { q: "初めてでも利用できますか？", a: "もちろんです。ご予約のお客様の中に初めての方が一名でもいらっしゃる場合、ご入室後に約10分間、ブースの使い方や撮影時の注意点などをご案内いたします（ご利用時間に含まれます）。なお、予約開始時間の10分前からご入室いただけます。" },
  { q: "衣装や小道具の貸し出しはありますか？", a: "現在、一部のウィッグ・小道具・簡易メイク用品のみご用意しております。衣装のレンタルは行っておりませんので、各自ご持参ください。" },
  { q: "予約のキャンセルはできますか？", a: "7日前までのキャンセルは無料です。6〜3日前は50%、2日前〜当日は100%のキャンセル料を申し受けます。無断キャンセルも100%のキャンセル料が発生します。キャンセルご希望の場合はinfo@morisuku-studio.comまでご連絡ください。" },
  { q: "撮影機材の持ち込みは可能ですか？", a: "もちろん可能です。大型の機材をお持ちの場合は、事前にご相談いただけるとスムーズにご案内できます。" },
  { q: "複数ブースを同時間に使用できますか？", a: "ご利用時間内であれば、全ブースを自由にお使いいただけます。他の利用者と重ならないよう、完全貸切制です。" },
  { q: "何名まで利用できますか？", a: "基本料金は6名様まで。7名様は+¥7,000、8名様は+¥8,000の追加料金がかかります。最大8名様までご利用いただけます。推奨は5名様以下です。" },
  { q: "商用利用は可能ですか？", a: "コスプレ・コスチュームを着用した個人撮影に限り、商用利用（Fantia・BOOTH・同人誌掲載・SNS収益化等）を無償で許可しております。投稿の際はスタジオのクレジット（@morisuku_studio）を明記してください。商品撮影・企業PR・お子様の記念撮影など、コスプレ以外の商用撮影は提携カメラマン（映像制作リコルト）によるご利用のみ承っております。" },
  { q: "飲食はできますか？", a: "撮影ブース内での飲食は禁止です。軽食・ドリンク等はスタジオ内の飲食可能エリアにてお願いいたします。ゴミはすべてお持ち帰りください。" },
  { q: "未成年だけで利用できますか？", a: "ご利用グループ内には、必ず1名以上の成人（高校生を除く満18歳以上）の同伴が必要です。当日ご来店される全員が未成年（高校生を含む）の場合は、安全管理の都合上ご利用いただけません。なお、ご予約者ご本人が未成年でも、当日成人の同伴者が1名以上いらっしゃれば問題ございません。また、18歳未満の方は初回利用時に親権者同意書の提出が必須です。" },
  { q: "気をつけることはありますか？", a: "スタジオ内は土足厳禁です（入口でお履き替えください）。また、毛くず散乱防止のためウィッグのカット・整髪は禁止しております。防犯目的で監視カメラを設置しておりますが、更衣室には設置しておりませんのでご安心ください。" },
];

const FLOW = [
  { t: "ご予約", p: "カレンダーから空きを確認し、フォームで日時とブースをお申込みください。" },
  { t: "ご来店", p: "空港通り駅から徒歩8分。駐車場もあります。更衣室・メイクスペース完備。" },
  { t: "お支払い", p: "ご利用当日に現金にてお支払いください。領収書の発行もご相談ください。" },
  { t: "撮影・ご退店", p: "ご利用時間内で自由に撮影。チェックアウト前にブースの簡単な原状復帰をお願いします。" },
];

window.BOOTHS = BOOTHS;
window.FAQS = FAQS;
window.FLOW = FLOW;
