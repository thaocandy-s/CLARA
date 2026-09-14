import type { AppLocale } from "../../shared/locale.js";
import { sanitizeAgentHtml } from "../../shared/sanitize.js";
import { RADAR_KEYS } from "../users/defaults.js";
import { RADAR_LABELS } from "../candidates/labels.js";
import type { CriteriaDto, Weight } from "../users/service.js";

export type Questionnaire = {
  relationship_goal?: string | null;
  smoking?: string | null;
  pets?: string | null;
  weekend_habit?: string | null;
  future_plan?: string | null;
  financial_view?: string | null;
};

export type AnalyzeInput = {
  locale: AppLocale;
  userName: string;
  criteria: CriteriaDto;
  candidate: {
    id: string;
    name: string;
    job: string;
    bio: string;
    tags: string[];
    questionnaire: Questionnaire;
  };
  pendingNotes: string[];
};

type ChecklistItem = { title: string; detail: string; sourceEvidence: string; tag?: string };

const present = (value: string | null | undefined) => Boolean(value && value.trim());

const tokenOverlap = (a: string, b: string) => {
  const tokenize = (s: string) =>
    s
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length > 2);
  const left = new Set(tokenize(a));
  const right = tokenize(b);
  if (!left.size || !right.length) return 0;
  const hits = right.filter((t) => left.has(t)).length;
  return Math.min(1, hits / Math.max(4, right.length / 3));
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const weightOf = (weights: Weight[], key: string, fallback = 70) =>
  weights.find((w) => w.key === key)?.value ?? fallback;

const smokingConflict = (q: Questionnaire, noSmoking: boolean) => {
  if (!noSmoking || !present(q.smoking)) return false;
  const s = q.smoking!.toLowerCase();
  return !/không|khong|吸わない|non-smok|no smoke/.test(s) && /hút|吸|smoke/.test(s);
};

const notesFill = (notes: string[], re: RegExp) => notes.some((n) => re.test(n));

export const buildAnalysis = (input: AnalyzeInput) => {
  const { locale, criteria, candidate, pendingNotes, userName } = input;
  const q = candidate.questionnaire;
  const notes = pendingNotes;
  const labels = RADAR_LABELS[locale];

  const futureKnown = present(q.future_plan) || notesFill(notes, /định cư|hcm|ホーチミン|将来|settle|tp\.?\s*hcm/i);
  const financeKnown = present(q.financial_view) || notesFill(notes, /tiết kiệm|tài chính|金銭|節約|spend|saving/i);
  const fields = [
    present(candidate.bio),
    present(q.relationship_goal),
    present(q.smoking),
    present(q.pets),
    present(q.weekend_habit),
    futureKnown,
    financeKnown,
  ];
  const dataCompleteness = clamp((fields.filter(Boolean).length / fields.length) * 100);

  const longTermScore = present(q.relationship_goal)
    ? 70 + tokenOverlap(criteria.intent ?? "", q.relationship_goal!) * 25
    : 55;
  const valuesScore = (() => {
    let score = 70;
    if (criteria.dealBreakerFlags.no_smoking && present(q.smoking) && !smokingConflict(q, true)) score += 12;
    if (criteria.dealBreakerFlags.pet_friendly && present(q.pets)) score += 8;
    if (smokingConflict(q, criteria.dealBreakerFlags.no_smoking)) score -= 35;
    return score;
  })();
  const lifestyleScore = present(q.weekend_habit)
    ? 60 + tokenOverlap(criteria.lifestyle ?? candidate.bio, q.weekend_habit!) * 30
    : 58;
  const interestScore = candidate.tags.length
    ? 62 + Math.min(20, candidate.tags.length * 4)
    : 55;
  const commScore = 68;
  const financeScore = financeKnown ? 72 : 52;
  const futureScore = futureKnown ? 78 : 58;

  const axes = {
    long_term_goals: clamp(longTermScore),
    core_values: clamp(valuesScore),
    communication: clamp(commScore),
    lifestyle_habits: clamp(lifestyleScore),
    interests: clamp(interestScore),
    finances: clamp(financeScore),
    future_plans: clamp(futureScore),
  };

  let weightSum = 0;
  let weighted = 0;
  for (const key of RADAR_KEYS) {
    const w = weightOf(criteria.weights, key);
    weightSum += w;
    weighted += axes[key] * w;
  }
  const overallCompatibility = clamp(weighted / (weightSum || 1));

  const matched: ChecklistItem[] = [];
  const needsCheck: ChecklistItem[] = [];
  const potentialFriction: ChecklistItem[] = [];

  if (criteria.dealBreakerFlags.no_smoking && present(q.smoking) && !smokingConflict(q, true)) {
    matched.push({
      title: locale === "ja" ? "禁煙の価値観" : "Lối sống không hút thuốc",
      detail:
        locale === "ja"
          ? `プロフィールの喫煙欄は「${q.smoking}」。あなたの非交渉条件と一致します。`
          : `Hồ sơ ghi "${q.smoking}". Khớp với tiêu chí không hút thuốc của bạn.`,
      sourceEvidence: locale === "ja" ? "候補者アンケート: smoking" : "Khảo sát ứng viên: smoking",
      tag: locale === "ja" ? "一致" : "Khớp",
    });
  }
  if (criteria.dealBreakerFlags.pet_friendly && present(q.pets)) {
    matched.push({
      title: locale === "ja" ? "動物との相性" : "Thái độ với thú cưng",
      detail:
        locale === "ja"
          ? `ペット欄: ${q.pets}`
          : `Hồ sơ: ${q.pets}. Phù hợp nếu bạn ưu tiên người yêu động vật.`,
      sourceEvidence: locale === "ja" ? "候補者アンケート: pets" : "Khảo sát ứng viên: pets",
      tag: locale === "ja" ? "一致" : "Khớp",
    });
  } else if (criteria.dealBreakerFlags.pet_friendly) {
    needsCheck.push({
      title: locale === "ja" ? "ペットへの態度" : "Thái độ với thú cưng",
      detail:
        locale === "ja"
          ? "ペットに関する直接的な記述がまだありません。"
          : "Chưa có thông tin trực tiếp về thú cưng trên hồ sơ.",
      sourceEvidence: locale === "ja" ? "アンケート pets が未記入" : "Khảo sát: pets trống",
      tag: locale === "ja" ? "データ不足" : "Chưa đủ dữ liệu",
    });
  }

  if (present(q.relationship_goal)) {
    matched.push({
      title: locale === "ja" ? "関係の方向性" : "Hướng mối quan hệ",
      detail: `${criteria.intent ?? "—"} → ${q.relationship_goal}`,
      sourceEvidence: locale === "ja" ? "relationship_goal" : "Khảo sát: relationship_goal",
    });
  }

  if (!futureKnown) {
    needsCheck.push({
      title: locale === "ja" ? "居住・将来計画" : "Kế hoạch định cư / tương lai",
      detail:
        locale === "ja"
          ? "将来の居住計画がプロフィールにありません。会話で確認してください。"
          : "Hồ sơ chưa nêu kế hoạch định cư. Nên hỏi khi gặp mặt.",
      sourceEvidence: locale === "ja" ? "future_plan 未記入" : "Khảo sát: future_plan trống",
      tag: locale === "ja" ? "要確認" : "Cần xác nhận",
    });
  } else if (notesFill(notes, /định cư|hcm|ホーチミン|将来|settle|tp\.?\s*hcm/i)) {
    matched.push({
      title: locale === "ja" ? "将来の居住" : "Kế hoạch định cư",
      detail: notes.find((n) => /định cư|hcm|ホーチミン|将来|settle|tp\.?\s*hcm/i.test(n)) ?? q.future_plan ?? "",
      sourceEvidence: locale === "ja" ? "ユーザーの観察メモ" : "Ghi chú quan sát của bạn",
      tag: locale === "ja" ? "メモから更新" : "Từ ghi chú",
    });
  }

  if (!financeKnown) {
    needsCheck.push({
      title: locale === "ja" ? "金銭観" : "Phong cách chi tiêu",
      detail:
        locale === "ja"
          ? "金銭管理の記述がありません。初回で直接聞かないでください。"
          : "Chưa có dữ liệu tài chính. Đừng hỏi tiền ở buổi đầu — quan sát cách chọn địa điểm.",
      sourceEvidence: locale === "ja" ? "financial_view 未記入" : "Khảo sát: financial_view trống",
      tag: locale === "ja" ? "観察" : "Cần quan sát",
    });
  } else if (notesFill(notes, /tiết kiệm|tài chính|金銭|節約|spend|saving/i)) {
    matched.push({
      title: locale === "ja" ? "金銭観（メモ）" : "Quan điểm tài chính",
      detail: notes.find((n) => /tiết kiệm|tài chính|金銭|節約|spend|saving/i.test(n)) ?? "",
      sourceEvidence: locale === "ja" ? "ユーザーの観察メモ" : "Ghi chú quan sát của bạn",
    });
  }

  if (smokingConflict(q, criteria.dealBreakerFlags.no_smoking)) {
    potentialFriction.push({
      title: locale === "ja" ? "喫煙" : "Hút thuốc",
      detail: locale === "ja" ? "禁煙希望と候補者の喫煙欄が食い違っています。" : "Deal-breaker không hút thuốc có thể xung đột với hồ sơ.",
      sourceEvidence: `smoking: ${q.smoking}`,
      tag: locale === "ja" ? "注意" : "Lưu ý",
    });
  }

  if (/trực đêm|夜勤|night/i.test(q.weekend_habit ?? "") || /trực đêm|夜勤/.test(candidate.bio)) {
    potentialFriction.push({
      title: locale === "ja" ? "生活リズム" : "Nhịp sống / lịch làm việc",
      detail:
        locale === "ja"
          ? "不規則な勤務がプロフィールに書かれています。時間の合わせ方が課題になり得ます。"
          : "Hồ sơ đề cập lịch làm việc thất thường (trực đêm). Có thể cần thích ứng thời gian.",
      sourceEvidence: present(q.weekend_habit) ? `weekend_habit: ${q.weekend_habit}` : `bio: ${candidate.bio.slice(0, 80)}`,
      tag: locale === "ja" ? "注意" : "Lưu ý",
    });
  }

  const radarAxes = RADAR_KEYS.map((key) => ({ key, label: labels[key], value: axes[key] }));
  const confidenceLabel =
    dataCompleteness >= 80
      ? locale === "ja"
        ? "信頼度は高め（主要項目が埋まっています）"
        : "Tin cậy khá (các mục chính đã có dữ kiện)"
      : locale === "ja"
        ? `信頼度は中程度（データの充実度 ${dataCompleteness}%）`
        : `Tin cậy trung bình (độ đầy đủ dữ liệu ${dataCompleteness}%)`;

  const matchLabel =
    overallCompatibility >= 78
      ? locale === "ja"
        ? "高い適合度"
        : "Độ khớp cao"
      : overallCompatibility >= 65
        ? locale === "ja"
          ? "確認しながら進められる適合"
          : "Khớp, còn điểm cần trao đổi"
        : locale === "ja"
          ? "差がある点に注意"
          : "Có khác biệt cần lưu ý";

  const icebreakers = [
    locale === "ja"
      ? `${candidate.name}さんの仕事（${candidate.job}）について、いちばん好きな瞬間を聞いてみる。`
      : `Hỏi ${candidate.name} điều gì ở công việc ${candidate.job} khiến họ gắn bó.`,
    present(q.weekend_habit)
      ? locale === "ja"
        ? `週末の過ごし方「${q.weekend_habit}」をきっかけに、次の休みの話をふくらませる。`
        : `Mở chuyện từ thói quen cuối tuần: "${q.weekend_habit}".`
      : locale === "ja"
        ? `自己紹介文の趣味から共通点を探す。`
        : `Lấy một chi tiết trong bio để hỏi cho tự nhiên.`,
  ];

  const probingQuestions = needsCheck.slice(0, 3).map((item) =>
    locale === "ja" ? `${item.title}について、最近どう考えているか聞いてみる。` : `Khi gặp mặt, hỏi thêm về: ${item.title.toLowerCase()}.`
  );
  if (probingQuestions.length < 3) {
    probingQuestions.push(
      locale === "ja"
        ? "忙しい時期に、一人の時間が欲しいか、話を聞いてほしいか。"
        : "Khi công việc dồn dập, bạn ấy muốn ở một mình hay được trò chuyện?"
    );
  }

  const nextDatePlan = present(q.weekend_habit)
    ? {
        title: locale === "ja" ? `${q.weekend_habit} に沿ったデート` : `Buổi hẹn gần với "${q.weekend_habit}"`,
        detail:
          locale === "ja"
            ? "公共の場で、短めの時間から。相性スコアは安全を保証しません。"
            : "Nên gặp ở nơi công cộng, khung giờ vừa phải. Điểm tương thích không đồng nghĩa an toàn.",
      }
    : {
        title: locale === "ja" ? "カフェで短時間会う" : "Cafe buổi chiều, thời lượng vừa",
        detail:
          locale === "ja"
            ? "公共のカフェで様子を見る。急いで金銭の話をしない。"
            : "Không gian công cộng, quan sát nhịp trò chuyện; không hỏi tiền buổi đầu.",
      };

  const positive =
    matched[0]?.detail ??
    (locale === "ja" ? "公開プロフィール上の接点を手がかりに会話できます。" : "Có điểm giao trên hồ sơ công khai để mở lời.");
  const question =
    needsCheck[0]?.detail ??
    (locale === "ja" ? "欠けている項目は決めつけず、会って確認してください。" : "Những mục còn thiếu cần hỏi khi gặp, đừng suy diễn.");

  const payload = {
    confidenceLabel,
    matchLabel,
    matchBadgeTone: overallCompatibility >= 75 ? ("match" as const) : ("check" as const),
    aiQuickSummary: { positive, question },
    compareRows: [
      {
        label: locale === "ja" ? "関係の目標" : "Mục tiêu mối quan hệ",
        userValue: criteria.intent ?? "—",
        targetValue: q.relationship_goal ?? (locale === "ja" ? "未記入（要確認）" : "Chưa nêu rõ (cần xác nhận)"),
        needsConfirmation: !present(q.relationship_goal),
      },
      {
        label: locale === "ja" ? "非交渉条件" : "Ranh giới / Non-negotiables",
        userValue: criteria.dealBreakers.join(", ") || "—",
        targetValue: [q.smoking, q.pets].filter(present).join(", ") || (locale === "ja" ? "未記入" : "Chưa nêu"),
      },
      {
        label: locale === "ja" ? "週末の過ごし方" : "Nhịp sống & Cuối tuần",
        userValue: criteria.lifestyle ?? "—",
        targetValue: q.weekend_habit ?? (locale === "ja" ? "未記入" : "Chưa nêu"),
        needsConfirmation: !present(q.weekend_habit),
      },
      {
        label: locale === "ja" ? "将来・居住" : "Kế hoạch tương lai / Định cư",
        userValue: criteria.city ? (locale === "ja" ? `${criteria.city} 周辺` : `Gắn với ${criteria.city}`) : "—",
        targetValue: futureKnown
          ? q.future_plan || notes.find((n) => /định cư|hcm|ホーチミン|将来|settle/i.test(n)) || "—"
          : locale === "ja"
            ? "未記入（要確認）"
            : "Chưa nêu rõ (cần xác nhận)",
        needsConfirmation: !futureKnown,
      },
    ],
    radarAxes,
    checklist: { matched, needsCheck, potentialFriction },
    icebreakers,
    probingQuestions,
    nextDatePlan,
  };

  const welcome =
    locale === "ja"
      ? `${userName}さん、こんにちは。<strong>${candidate.name}</strong>さんとの公開プロフィールとあなたの基準を突き合わせました。適合度は人の優劣ではなく、あなたの優先事項との重なりです。`
      : `Xin chào ${userName}. Tôi đã đối chiếu hồ sơ công khai của <strong>${candidate.name}</strong> với tiêu chí của bạn — đây là độ khớp với ưu tiên của bạn, không phải xếp hạng con người.`;

  return {
    overallCompatibility,
    dataCompleteness,
    payload,
    welcomeHtml: sanitizeAgentHtml(welcome),
  };
};

export const buildChatReply = (
  locale: AppLocale,
  candidateName: string,
  overallCompatibility: number,
  icebreakers: string[],
  probing: string[],
  nextDate: { title: string; detail: string },
  financeKnown: boolean,
  userText: string
) => {
  const lower = userText.toLowerCase();
  const isOpener = /mở đầu|icebreaker|始め方|アイス/.test(lower);
  const isDate = /hẹn|date|gặp|デート|会う/.test(lower);
  const isFinance = /tài chính|tiền|金銭|お金/.test(lower);
  const isAdvice = /lời khuyên|advice|アドバイス|key/.test(lower) || /hỏi|câu hỏi|質問/.test(lower);

  if (isOpener) {
    return {
      text: sanitizeAgentHtml(
        locale === "ja"
          ? `<strong>${candidateName}</strong>さんの公開情報から、自然に話を始められる接点です。`
          : `Dựa trên hồ sơ công khai của <strong>${candidateName}</strong>, đây là điểm giao để mở lời tự nhiên.`
      ),
      recommendation: {
        title: locale === "ja" ? "会話の始め方" : "Gợi ý mở đầu trò chuyện (Icebreaker)",
        items: icebreakers,
      },
    };
  }
  if (isFinance) {
    return {
      text: sanitizeAgentHtml(
        financeKnown
          ? locale === "ja"
            ? `金銭観の手がかりはありますが、初回で深く聞かないでください。場所の選び方を観察しましょう。`
            : `Đã có vài tín hiệu về chi tiêu, nhưng buổi đầu hãy quan sát cách chọn địa điểm — đừng hỏi tiền dồn dập.`
          : locale === "ja"
            ? `<strong>データ不足:</strong> ${candidateName}さんには金銭管理の直接記述がありません。<br/>初回でお金の話を急がないでください。`
            : `⚠️ <strong>Thiếu dữ liệu:</strong> Hồ sơ của ${candidateName} chưa có thông tin tài chính trực tiếp.<br/>Đừng hỏi tiền buổi đầu; hãy quan sát địa điểm hẹn.`
      ),
      recommendation: {
        title: locale === "ja" ? "金銭の話について" : "Lưu ý về tài chính",
        items: [
          locale === "ja"
            ? "相性スコアは安全や誠実さを保証しません。"
            : "Độ khớp không đồng nghĩa an toàn hay trung thực về tiền bạc.",
        ],
      },
    };
  }
  if (isDate) {
    return {
      text: sanitizeAgentHtml(
        locale === "ja"
          ? `${candidateName}さんとの次の会い方の提案です。公共の場で。`
          : `Gợi ý buổi hẹn với ${candidateName}, ưu tiên nơi công cộng.`
      ),
      recommendation: { title: nextDate.title, items: [nextDate.detail] },
    };
  }
  if (isAdvice) {
    return {
      text: sanitizeAgentHtml(
        locale === "ja"
          ? `適合度は <strong>${overallCompatibility}%</strong> です。「要確認」を会話で埋めてください。`
          : `Độ khớp hiện <strong>${overallCompatibility}%</strong>. Hãy dùng câu hỏi để làm rõ nhóm cần xác nhận.`
      ),
      recommendation: {
        title: locale === "ja" ? "確認したい質問" : "Câu hỏi nên hỏi",
        items: probing,
      },
    };
  }
  return {
    text: sanitizeAgentHtml(
      locale === "ja"
        ? `ご質問を受け取りました。あなたと${candidateName}さんの重なりは <strong>${overallCompatibility}%</strong> です。会ったときの感覚が最終判断です。`
        : `Tôi đã ghi nhận câu hỏi. Độ tương đồng với ${candidateName} là <strong>${overallCompatibility}%</strong>. Cảm xúc khi gặp mặt mới là yếu tố quyết định.`
    ),
    recommendation: {
      title: locale === "ja" ? "クララから" : "Nhắc nhở từ Clara",
      items: [
        locale === "ja"
          ? "エージェントは視点を出すだけで、マッチを強制しません。"
          : "Agent chỉ hỗ trợ góc nhìn, không tự match hộ bạn.",
      ],
    },
  };
};
