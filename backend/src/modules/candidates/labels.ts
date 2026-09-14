import type { AppLocale } from "../../shared/locale.js";

export const RADAR_LABELS: Record<AppLocale, Record<string, string>> = {
  vi: {
    long_term_goals: "Mục tiêu lâu dài",
    core_values: "Giá trị sống",
    communication: "Giao tiếp",
    lifestyle_habits: "Lối sống & Thói quen",
    interests: "Sở thích & Giải trí",
    finances: "Tài chính & Thực tế",
    future_plans: "Kế hoạch tương lai",
  },
  ja: {
    long_term_goals: "長期的な目標",
    core_values: "価値観",
    communication: "コミュニケーション",
    lifestyle_habits: "生活習慣",
    interests: "趣味・娯楽",
    finances: "金銭と現実面",
    future_plans: "将来の計画",
  },
};

export const emptyRadar = (locale: AppLocale) =>
  Object.entries(RADAR_LABELS[locale]).map(([key, label]) => ({ key, label, value: 0 }));

export const STAGE_LABELS: Record<AppLocale, Record<string, string>> = {
  vi: {
    chatting: "Đang tìm hiểu",
    matched: "Đã match",
    "met-once": "Đã gặp mặt",
    archived: "Đã lưu trữ",
  },
  ja: {
    chatting: "やり取り中",
    matched: "マッチ済み",
    "met-once": "一度会った",
    archived: "アーカイブ",
  },
};

export const relativeSavedLabel = (iso: string | undefined, locale: AppLocale) => {
  if (!iso) return locale === "ja" ? "未保存" : "Chưa lưu";
  const delta = Date.now() - new Date(iso).getTime();
  const hours = Math.max(0, Math.floor(delta / 3_600_000));
  if (hours < 1) return locale === "ja" ? "たった今更新" : "Cập nhật vừa xong";
  if (hours < 24) return locale === "ja" ? `${hours}時間前に更新` : `Cập nhật ${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return locale === "ja" ? `${days}日前に更新` : `Cập nhật ${days} ngày trước`;
};

export const noteTimeLabel = (iso: string, locale: AppLocale, author: string) => {
  const by =
    author === "system"
      ? locale === "ja"
        ? "初期分析"
        : "Khởi tạo phân tích ban đầu"
      : locale === "ja"
        ? "あなたが記録"
        : "Ghi nhận bởi bạn";
  const delta = Date.now() - new Date(iso).getTime();
  if (delta < 60_000) return locale === "ja" ? `たった今 · ${by}` : `Vừa xong · ${by}`;
  const hours = Math.floor(delta / 3_600_000);
  if (hours < 24) return locale === "ja" ? `${Math.max(1, hours)}時間前 · ${by}` : `${Math.max(1, hours)} giờ trước · ${by}`;
  const days = Math.floor(hours / 24);
  return locale === "ja" ? `${days}日前 · ${by}` : `${days} ngày trước · ${by}`;
};
