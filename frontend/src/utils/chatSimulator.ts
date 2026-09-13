import type { Candidate, ChatMessage } from "../types";
import type { Locale } from "../i18n/translations";

let counter = 1000;
const nextId = () => `sim-${counter++}`;

const keywords: Record<Locale, Record<"opener" | "questions" | "finance" | "date", string[]>> = {
  vi: {
    opener: ["mở đầu", "bắt đầu", "icebreaker"],
    questions: ["hỏi", "câu hỏi", "tiếp theo"],
    finance: ["tài chính", "tiền"],
    date: ["hẹn", "date", "gặp"],
  },
  ja: {
    opener: ["会話の始め方", "アイスブレイク", "始め方"],
    questions: ["質問", "聞くべき", "次に"],
    finance: ["金銭", "お金", "資金"],
    date: ["デート", "会う", "初デート"],
  },
};

const copy = {
  vi: {
    openerText: (name: string) =>
      `Dựa trên hồ sơ của <strong>${name}</strong>, đây là những điểm giao thoa thú vị bạn có thể khai thác để mở đầu câu chuyện một cách tự nhiên.`,
    openerTitle: "Gợi ý mở đầu trò chuyện (Icebreaker)",
    questionsText: (compat: number) =>
      `Hồ sơ của hai bạn có độ tương thích <strong>${compat}%</strong>. Đây là những câu hỏi giúp bạn xác nhận các điểm còn đang ở nhóm "cần xác nhận thêm".`,
    questionsTitle: "3 câu hỏi sâu nên hỏi trong buổi hẹn tới",
    financeText: (name: string) =>
      `⚠️ <strong>Lưu ý về độ đầy đủ dữ liệu</strong>: Hồ sơ của ${name} chưa có thông tin trực tiếp về phong cách quản lý tài chính cá nhân.<br/><br/>💡 Lời khuyên: Đừng hỏi quá dồn dập về tiền bạc ở buổi đầu. Hãy quan sát qua thói quen lựa chọn địa điểm hẹn hoặc quan điểm chi tiêu khi đi du lịch.`,
    dateText: (name: string) => `Dựa trên sở thích chung, đây là gợi ý cho buổi hẹn sắp tới với ${name}.`,
    dateTitle: "Ý tưởng buổi hẹn phù hợp",
    fallbackText: (name: string, compat: number) =>
      `Tôi đã ghi nhận câu hỏi của bạn. Nhìn chung, giữa bạn và ${name} có <strong>${compat}% điểm tương đồng</strong>. Bạn có muốn lưu điểm này vào checklist ghi nhớ không?`,
    fallbackTitle: "Nhắc nhở từ Clara",
    fallbackItem: "Hãy giữ tâm thế cởi mở — Agent chỉ hỗ trợ góc nhìn, cảm xúc trực tiếp khi gặp mặt mới là yếu tố quyết định.",
  },
  ja: {
    openerText: (name: string) =>
      `<strong>${name}</strong>さんのプロフィールをもとに、自然な会話の始め方に使える興味深い共通点をまとめました。`,
    openerTitle: "会話の始め方（アイスブレイク）の提案",
    questionsText: (compat: number) =>
      `お二人の相性は<strong>${compat}%</strong>です。「要確認」グループにある点を確かめるための質問をご紹介します。`,
    questionsTitle: "次のデートで聞くべき深い質問3つ",
    financeText: (name: string) =>
      `⚠️ <strong>データの充実度について</strong>：${name}さんのプロフィールには、個人の金銭管理スタイルに関する直接的な情報がまだありません。<br/><br/>💡 アドバイス：最初のデートでお金の話を急ぎすぎないようにしましょう。デート先の選び方や旅行時の消費スタイルから感じ取るのがおすすめです。`,
    dateText: (name: string) => `共通の趣味をもとに、${name}さんとの次のデートの提案です。`,
    dateTitle: "おすすめのデートアイデア",
    fallbackText: (name: string, compat: number) =>
      `ご質問を確認しました。全体として、あなたと${name}さんには<strong>${compat}%の共通点</strong>があります。この点をチェックリストに記録しておきますか？`,
    fallbackTitle: "クララからのアドバイス",
    fallbackItem: "オープンな気持ちを保ちましょう — エージェントはあくまで視点を提供するだけで、実際に会ったときの直感こそが決め手です。",
  },
};

export const generateAgentReply = (candidate: Candidate, userText: string, locale: Locale = "vi"): ChatMessage => {
  const lower = userText.toLowerCase();
  const kw = keywords[locale];
  const c = copy[locale];

  if (kw.opener.some((k) => lower.includes(k))) {
    return {
      id: nextId(),
      sender: "agent",
      text: c.openerText(candidate.name),
      recommendation: { title: c.openerTitle, items: candidate.icebreakers },
    };
  }

  if (kw.questions.some((k) => lower.includes(k))) {
    return {
      id: nextId(),
      sender: "agent",
      text: c.questionsText(candidate.overallCompatibility),
      recommendation: { title: c.questionsTitle, items: candidate.probingQuestions },
    };
  }

  if (kw.finance.some((k) => lower.includes(k))) {
    return {
      id: nextId(),
      sender: "agent",
      text: c.financeText(candidate.name),
    };
  }

  if (kw.date.some((k) => lower.includes(k))) {
    return {
      id: nextId(),
      sender: "agent",
      text: c.dateText(candidate.name),
      recommendation: {
        title: c.dateTitle,
        items: [candidate.nextDatePlan.title + " — " + candidate.nextDatePlan.detail],
      },
    };
  }

  return {
    id: nextId(),
    sender: "agent",
    text: c.fallbackText(candidate.name, candidate.overallCompatibility),
    recommendation: { title: c.fallbackTitle, items: [c.fallbackItem] },
  };
};
