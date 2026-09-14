import type { Candidate, UserProfile } from "../types";

export const userProfileJa: UserProfile = {
  name: "Hải Nam",
  age: 28,
  city: "ハノイ",
  intent: "真剣な交際、2〜3年以内に結婚",
  dealBreakers: ["タバコを吸わないこと", "動物が好きなこと"],
  weights: [
    { key: "long_term_goals", label: "長期的な目標と将来の計画", value: 90 },
    { key: "core_values", label: "価値観と core な道徳観", value: 85 },
    { key: "communication", label: "コミュニケーションと感情のバランス", value: 80 },
    { key: "lifestyle_habits", label: "ライフスタイルと生活習慣", value: 70 },
    { key: "interests", label: "趣味・娯楽と共通の活動", value: 60 },
  ],
};

export const candidatesJa: Candidate[] = [
  {
    id: "cand_01",
    name: "マイ リン",
    age: 26,
    job: "プロダクトデザイナー",
    location: "ホーチミン市",
    distanceKm: 4,
    bio: "街並みを眺めながらのモーニングコーヒーと、週末の陶芸ワークショップが好き。人の話をよく聞き、個人の空間を尊重しながら、一緒に成長できる人を探しています。",
    tags: ["🌱 禁煙", "🎨 アート・陶芸", "☕ スペシャルティコーヒー", "📚 自己啓発の読書"],
    gradient: "radial-gradient(circle at 50% 35%, #ec4899 0%, #312e81 60%, #0f172a 100%)",
    overallCompatibility: 81,
    dataCompleteness: 74,
    confidenceLabel: "信頼度：まずまず（24問のアンケートとBioに基づく、金銭感覚のデータ不足）",
    matchLabel: "高い適合度",
    matchBadgeTone: "match",
    aiQuickSummary: {
      positive: "美的センス、健康的なライフスタイル、個人の境界線を尊重する姿勢。",
      question: "仕事が忙しいときの時間のバランス。",
    },
    compareRows: [
      { label: "交際の目的", userValue: "真剣な交際、2〜3年以内に結婚", targetValue: "長期的に付き合いながら共に成長したい" },
      { label: "境界線・譲れない条件", userValue: "禁煙、動物好き", targetValue: "タバコを吸わない、犬猫が好き" },
      { label: "生活リズム・週末の過ごし方", userValue: "モーニングコーヒー、ランニング、休息", targetValue: "陶芸、カフェで読書、ワークショップ" },
      { label: "将来の計画・定住先", userValue: "ホーチミン市に定住予定", targetValue: "まだ明言なし（要確認）", needsConfirmation: true },
    ],
    radarAxes: [
      { key: "long_term_goals", label: "長期的な目標", value: 85 },
      { key: "core_values", label: "価値観", value: 90 },
      { key: "communication", label: "コミュニケーション", value: 80 },
      { key: "lifestyle_habits", label: "ライフスタイル・習慣", value: 85 },
      { key: "interests", label: "趣味・娯楽", value: 75 },
      { key: "finances", label: "金銭感覚・現実性", value: 65 },
      { key: "future_plans", label: "将来の計画", value: 70 },
    ],
    checklist: {
      matched: [
        { title: "健康的なライフスタイル", detail: "二人とも禁煙で、日中の活動を好む。", sourceEvidence: "プロフィールのアンケート", tag: "一致度100%" },
        { title: "個人の境界線", detail: "互いに個人の空間を尊重し、自分の情熱を育むことを大切にしている。", sourceEvidence: "Bioとアンケート回答の分析", tag: "一致度90%" },
      ],
      needsCheck: [
        { title: "結婚・家族の時期計画", detail: "あなたは2〜3年以内の結婚を希望していますが、リンさんは具体的な時期に触れていません。", sourceEvidence: "プロフィール未記入項目", tag: "データ不足" },
        { title: "お金の使い方のスタイル", detail: "節約志向か経験重視かについての情報がまだありません。", sourceEvidence: "デート先の選び方から感じ取るべき点", tag: "要観察" },
      ],
      potentialFriction: [
        { title: "仕事による時間的プレッシャー", detail: "リンさんは現在スタートアップの忙しい時期にあり、毎日のメッセージのやり取りが難しい可能性があります。", sourceEvidence: '自己紹介文「スタートアップでラストスパート中」', tag: "注意" },
      ],
    },
    icebreakers: [
      "こんにちは、リンさん。プロフィールで手作り陶芸のことに触れていましたね。週末はよくワークショップに行くんですか？おすすめの場所があれば教えてください。",
      "僕もミニマルなデザインが好きなんです。プロダクトデザインの道を選んだきっかけは何ですか？",
    ],
    probingQuestions: [
      "仕事が立て込んでいるとき、ストレス解消はどうしていますか？一人になりたい派ですか、それとも誰かと話したい派ですか？",
      "3〜5年後の家庭生活について、具体的にイメージしていますか？",
      "あなたにとって、個人のプライバシーを尊重するとは具体的にどういうことですか？",
    ],
    chatHistory: [
      {
        id: "m1",
        sender: "agent",
        text: "こんにちは、ハイ・ナムさん！あなたの重要な8つの条件をもとに、<strong>マイ リン</strong>さんとの相性をざっと分析しました。<br/><br/>🎉 <strong>いい点：</strong>お二人とも適度な内向型で、健康的なライフスタイル（禁煙）を好み、自分のキャリアを大切にしながらも真剣な関係を築きたいと考えています。",
        recommendation: {
          title: "会話の始め方（アイスブレイク）の提案",
          items: [
            "「こんにちは、リンさん。プロフィールで手作り陶芸のことに触れていましたね。週末はよくワークショップに行くんですか？おすすめの場所があれば教えてください。」",
            "「僕もミニマルなデザインが好きなんです。プロダクトデザインの道を選んだきっかけは何ですか？」",
          ],
        },
      },
      {
        id: "m2",
        sender: "user",
        text: "リンさんに何か大きな相違点、デールブレーカーになりそうなものはありますか？",
      },
      {
        id: "m3",
        sender: "agent",
        text: 'ライフスタイルや価値観の面で深刻な対立の兆候は見られません。ただし、<strong>2つ確認しておきたい点</strong>があります：<br/><br/>1. <strong>時間のバランス：</strong>リンさんは急成長中のスタートアップで働いており、残業や土曜出勤があるかもしれません。<br/>2. <strong>結婚の計画：</strong>あなたは2〜3年以内の安定を望んでいますが、リンさんのプロフィールはまだ「長期的に付き合いながら、縁次第」という段階です。',
        recommendation: {
          title: "最初の2回のデートで聞くべき深い質問3つ",
          items: [
            "「仕事が立て込んでいるとき、ストレス解消はどうしていますか？一人になりたい派ですか、それとも誰かと話したい派ですか？」",
            "「3〜5年後の家庭生活について、具体的にイメージしていますか？」",
            "「あなたにとって、個人のプライバシーを尊重するとは具体的にどういうことですか？」",
          ],
        },
      },
    ],
    stage: "chatting",
    stageLabel: "メッセージ交換中",
    savedLabel: "2時間前に更新",
    notes: [
      { id: "n1", timeLabel: "昨日 21:30 · あなたが記録", author: "user", text: "リンさんはとても丁寧に返信してくれて、今週土曜の午後にタオディエンでの陶芸ワークショップに行くことに同意してくれました。" },
      { id: "n2", timeLabel: "3日前 · 初回分析", author: "system", text: "アートの趣味と健康的なライフスタイルで一致。直接会って長期的な将来の計画を確認する必要あり。" },
    ],
    nextDatePlan: {
      title: "陶芸ワークショップ＆タオディエンでのカフェ",
      detail: "時間：土曜午後15:00。クリエイティブな空間で面接のようなプレッシャーが少なく、二人とも自然に心を開きやすい。",
    },
  },
  {
    id: "cand_02",
    name: "トゥアン アイン",
    age: 29,
    job: "研修医",
    location: "ハノイ",
    distanceKm: 8,
    bio: "夜勤で忙しい仕事ですが、家にいるときは料理と長距離ランニングが好きです。自立していて自分の世界を持ち、安定した関係を望む人を探しています。",
    tags: ["🏃 マラソン", "🍳 料理", "🐱 猫を1匹飼っている"],
    gradient: "radial-gradient(circle at 50% 35%, #06b6d4 0%, #1e1b4b 60%, #0b0e17 100%)",
    overallCompatibility: 72,
    dataCompleteness: 68,
    confidenceLabel: "信頼度：普通（プロフィールの18問に基づく）",
    matchLabel: "生活リズムの違い",
    matchBadgeTone: "check",
    aiQuickSummary: {
      positive: "責任感が強く、長期的な関係を志向している。",
      question: "シフト制の勤務のため、あなたが柔軟に時間を合わせる必要があるかもしれません。",
    },
    compareRows: [
      { label: "交際の目的", userValue: "真剣な交際、2〜3年以内に結婚", targetValue: "長期的な安定を求めている" },
      { label: "境界線・譲れない条件", userValue: "禁煙、動物好き", targetValue: "タバコを吸わない、猫を飼っている" },
      { label: "生活リズム・週末の過ごし方", userValue: "モーニングコーヒー、ランニング、休息", targetValue: "夜勤、料理、長距離ランニング" },
      { label: "将来の計画・定住先", userValue: "ホーチミン市に定住予定", targetValue: "まだ明言なし（要確認）", needsConfirmation: true },
    ],
    radarAxes: [
      { key: "long_term_goals", label: "長期的な目標", value: 78 },
      { key: "core_values", label: "価値観", value: 75 },
      { key: "communication", label: "コミュニケーション", value: 65 },
      { key: "lifestyle_habits", label: "ライフスタイル・習慣", value: 55 },
      { key: "interests", label: "趣味・娯楽", value: 70 },
      { key: "finances", label: "金銭感覚・現実性", value: 72 },
      { key: "future_plans", label: "将来の計画", value: 68 },
    ],
    checklist: {
      matched: [
        { title: "真剣な交際志向", detail: "二人とも長期的で安定した関係を求めている。", sourceEvidence: "プロフィールのアンケート", tag: "一致度85%" },
      ],
      needsCheck: [
        { title: "昼夜の生活リズム", detail: "トゥアン アインさんの夜勤スケジュールは、あなたの日中の生活リズムとずれる可能性があります。", sourceEvidence: "Bio：忙しい夜勤", tag: "要観察" },
      ],
      potentialFriction: [
        { title: "お互いのための時間", detail: "シフト制の勤務により、デートの計画が立てにくくなる可能性があります。", sourceEvidence: "Bioと研修医という職業の特性", tag: "注意" },
      ],
    },
    icebreakers: [
      "研修医って当直が多くて大変そうですが、それでも長距離ランニングの習慣を続けているんですね。何かコツがあるんですか？",
    ],
    probingQuestions: [
      "夜勤は週のどの曜日に多いですか？",
      "プレッシャーの大きい仕事とプライベートのバランスをどう取っていますか？",
    ],
    chatHistory: [
      {
        id: "m1",
        sender: "agent",
        text: "こんにちは、ハイ・ナムさん！あなたと<strong>トゥアン アイン</strong>さんとのクイック分析です。最も注意すべき点は、研修医という仕事の特性による生活リズムの違いです。",
      },
    ],
    stage: "met-once",
    stageLabel: "1回目のカフェデート済み",
    savedLabel: "2日前に更新",
    notes: [
      { id: "n1", timeLabel: "2日前 · 初回分析", author: "system", text: "真剣な交際志向で一致。定期的に会う時間を調整できるか、引き続き観察が必要。" },
    ],
    nextDatePlan: {
      title: "病院近くの週末モーニングカフェ",
      detail: "トゥアン アインさんの当直スケジュールに合わせて柔軟な時間帯を選び、二人とも頭が冴えている午前中を優先。",
    },
  },
  {
    id: "cand_03",
    name: "ミン チャウ",
    age: 27,
    job: "コンテンツストラテジスト",
    location: "ハノイ",
    distanceKm: 3,
    bio: "アコースティック音楽、秋のキャンプ、心理学についての深い会話が好き。持続可能な関係は尊重と誠実さから始まると信じています。",
    tags: ["⛺ キャンプ", "🎸 アコースティック", "🧘 マインドフルネス"],
    gradient: "radial-gradient(circle at 50% 35%, #8b5cf6 0%, #1e1b4b 60%, #0a0d14 100%)",
    overallCompatibility: 84,
    dataCompleteness: 82,
    confidenceLabel: "信頼度：高い（28問のアンケートと詳細なBioに基づく）",
    matchLabel: "価値観が似ている",
    matchBadgeTone: "match",
    aiQuickSummary: {
      positive: "感情表現豊かなコミュニケーションスタイル、週末のアウトドアの趣味。",
      question: "今後3年間の個人的な資金計画。",
    },
    compareRows: [
      { label: "交際の目的", userValue: "真剣な交際、2〜3年以内に結婚", targetValue: "誠実で持続可能な関係を築きたい" },
      { label: "境界線・譲れない条件", userValue: "禁煙、動物好き", targetValue: "タバコを吸わない" },
      { label: "生活リズム・週末の過ごし方", userValue: "モーニングコーヒー、ランニング、休息", targetValue: "キャンプ、アコースティック音楽鑑賞" },
      { label: "将来の計画・定住先", userValue: "ホーチミン市に定住予定", targetValue: "他の場所への長期定住も検討中", needsConfirmation: true },
    ],
    radarAxes: [
      { key: "long_term_goals", label: "長期的な目標", value: 80 },
      { key: "core_values", label: "価値観", value: 92 },
      { key: "communication", label: "コミュニケーション", value: 90 },
      { key: "lifestyle_habits", label: "ライフスタイル・習慣", value: 82 },
      { key: "interests", label: "趣味・娯楽", value: 88 },
      { key: "finances", label: "金銭感覚・現実性", value: 60 },
      { key: "future_plans", label: "将来の計画", value: 62 },
    ],
    checklist: {
      matched: [
        { title: "オープンな感情表現", detail: "二人とも深く誠実な会話を大切にしている。", sourceEvidence: "Bioとコミュニケーションスタイルのアンケート", tag: "一致度95%" },
        { title: "アウトドア活動の趣味", detail: "どちらも自然と触れ合う週末の活動が好き。", sourceEvidence: "Bio：秋のキャンプ", tag: "一致度88%" },
      ],
      needsCheck: [
        { title: "個人の資金計画", detail: "今後3年間の支出・貯蓄に関する考え方がまだ不明。", sourceEvidence: "プロフィールの資金項目が未記入", tag: "データ不足" },
      ],
      potentialFriction: [
        { title: "長期的な定住先の方向性", detail: "チャウさんは他の場所への定住も検討しており、ホーチミン市に定住したいというあなたの希望と異なる可能性があります。", sourceEvidence: "アンケート：定住計画について", tag: "注意" },
      ],
    },
    icebreakers: [
      "秋のキャンプが好きだそうですね。ハノイ近郊でまた行きたい場所はありますか？",
    ],
    probingQuestions: [
      "長期的に安定して暮らしたい場所はどこだとイメージしていますか？",
      "将来のための貯蓄について、どのような考えを持っていますか？",
    ],
    chatHistory: [
      {
        id: "m1",
        sender: "agent",
        text: "こんにちは、ハイ・ナムさん！あなたと<strong>ミン チャウ</strong>さんは価値観の面で非常に高い共通点があります。さらに話し合うべき点は長期的な定住計画です。",
      },
    ],
    stage: "matched",
    stageLabel: "新しくマッチ",
    savedLabel: "3日前に保存",
    notes: [
      { id: "n1", timeLabel: "3日前 · 初回分析", author: "system", text: "価値観とコミュニケーションの面で高い共鳴。長期的な居住地の方向性について直接会って確認する必要あり。" },
    ],
    nextDatePlan: {
      title: "週末のアコースティックカフェ",
      detail: "落ち着いた雰囲気で深い会話がしやすく、二人の感情表現豊かなコミュニケーションスタイルに合っている。",
    },
  },
];
