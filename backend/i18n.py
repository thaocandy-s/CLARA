# -*- coding: utf-8 -*-
"""
CLARA i18n — Internationalization Module
Chứa toàn bộ chuỗi UI cho Tiếng Việt (vi) và Tiếng Nhật (ja).
"""

from typing import Literal

Lang = Literal["vi", "ja"]

_STRINGS: dict = {
    # ── Language selection ──────────────────────────────────────────────────
    "lang_select_title": {
        "vi": "CHỌN NGÔN NGỮ / LANGUAGE SELECTION",
        "ja": "言語を選択してください / CHỌN NGÔN NGỮ",
    },
    "lang_opt_vi": {
        "vi": "[1] 🇻🇳  Tiếng Việt",
        "ja": "[1] 🇻🇳  Tiếng Việt",
    },
    "lang_opt_ja": {
        "vi": "[2] 🇯🇵  日本語 (Japanese)",
        "ja": "[2] 🇯🇵  日本語 (Japanese)",
    },
    "lang_select_prompt": {
        "vi": "Chọn (1/2): ",
        "ja": "選択してください (1/2): ",
    },
    "lang_invalid": {
        "vi": "Lựa chọn không hợp lệ, vui lòng chọn 1 hoặc 2.",
        "ja": "無効な選択です。1 か 2 を入力してください。",
    },

    # ── Banner ──────────────────────────────────────────────────────────────
    "banner_title": {
        "vi": "CLARA — DATING COMPATIBILITY COACH",
        "ja": "CLARA — 恋愛相性コーチ",
    },
    "banner_subtitle": {
        "vi": "Trợ lý Đồng hành Hẹn hò & Đánh giá Tương thích",
        "ja": "デートの相性評価 & 恋愛サポートアシスタント",
    },
    "banner_user_label": {
        "vi": "Người dùng hiện tại",
        "ja": "現在のユーザー",
    },
    "banner_engine_label": {
        "vi": "Động cơ AI",
        "ja": "AIエンジン",
    },
    "banner_engine_claude": {
        "vi": "Claude LLM",
        "ja": "Claude LLM",
    },
    "banner_engine_local": {
        "vi": "Local Algorithmic Copilot (Offline Mode)",
        "ja": "ローカルアルゴリズム Copilot（オフラインモード）",
    },
    "banner_hint": {
        "vi": "Gõ /help để xem danh sách câu lệnh hỗ trợ.",
        "ja": "/help と入力すると利用可能なコマンドが表示されます。",
    },
    "banner_age": {
        "vi": "tuổi",
        "ja": "歳",
    },
    "banner_goal_label": {
        "vi": "Mục tiêu",
        "ja": "目標",
    },

    # ── Candidate menu ──────────────────────────────────────────────────────
    "candidate_menu_title": {
        "vi": "DANH SÁCH ỨNG VIÊN ĐANG TÌM HIỂU:",
        "ja": "相手候補一覧:",
    },
    "candidate_bio_label": {
        "vi": "Bio",
        "ja": "自己紹介",
    },
    "candidate_tags_label": {
        "vi": "Tags",
        "ja": "タグ",
    },
    "candidate_select_prompt": {
        "vi": "Chọn ứng viên để bắt đầu (1-{n}) hoặc nhập ID: ",
        "ja": "候補を選択してください (1-{n}) またはIDを入力: ",
    },
    "candidate_invalid": {
        "vi": "Lựa chọn không hợp lệ, vui lòng chọn lại.",
        "ja": "無効な選択です。もう一度選んでください。",
    },
    "candidate_analyzing": {
        "vi": "Đang tính toán phân tích tương thích 7 trục cho {name}...",
        "ja": "{name} の7軸相性分析を計算中...",
    },

    # ── Scorecard ───────────────────────────────────────────────────────────
    "scorecard_profile": {
        "vi": "HỒ SƠ ĐỐI TƯỢNG",
        "ja": "相手プロフィール",
    },
    "scorecard_compat": {
        "vi": "ĐỘ TƯƠNG THÍCH",
        "ja": "相性スコア",
    },
    "scorecard_completeness": {
        "vi": "ĐỘ ĐẦY ĐỦ DỮ LIỆU",
        "ja": "データ充実度",
    },
    "scorecard_confidence": {
        "vi": "Độ tin cậy",
        "ja": "信頼度",
    },
    "scorecard_matched": {
        "vi": "✓ Điểm phù hợp hàng đầu:",
        "ja": "✓ 主な共通点:",
    },
    "scorecard_needs_check": {
        "vi": "? Cần xác nhận thêm:",
        "ja": "? 要確認事項:",
    },
    "scorecard_icebreaker": {
        "vi": "💡 Gợi ý câu mở đầu tự nhiên:",
        "ja": "💡 自然な会話の切り口:",
    },
    "scorecard_hint": {
        "vi": "Bạn có thể hỏi bất cứ điều gì hoặc gõ /help để xem các lệnh hỗ trợ.",
        "ja": "何でも質問できます。/help でコマンド一覧を確認できます。",
    },

    # ── Full analysis ───────────────────────────────────────────────────────
    "analysis_title": {
        "vi": "BÁO CÁO PHÂN TÍCH TƯƠNG THÍCH TOÀN DIỆN",
        "ja": "総合相性分析レポート",
    },
    "analysis_radar": {
        "vi": "1. BẢN ĐỒ TƯƠNG THÍCH 7 TRỤC RADAR:",
        "ja": "1. 7軸レーダー相性マップ:",
    },
    "analysis_matched": {
        "vi": "2. PHÙ HỢP & ĐỒNG ĐIỆU (MATCHED):",
        "ja": "2. 共通点・波長が合う (MATCHED):",
    },
    "analysis_needs_check": {
        "vi": "3. CẦN XÁC NHẬN THÊM (NEEDS CHECK):",
        "ja": "3. 要確認事項 (NEEDS CHECK):",
    },
    "analysis_friction": {
        "vi": "4. ĐIỂM KHÁC BIỆT CẦN LƯU Ý (POTENTIAL FRICTION):",
        "ja": "4. 注意すべき相違点 (POTENTIAL FRICTION):",
    },
    "analysis_probe": {
        "vi": "5. CÂU HỎI SÂU ĐỂ KHÁM PHÁ TRONG BUỔI HẸN:",
        "ja": "5. デートで深掘りすべき質問:",
    },
    "analysis_evidence": {
        "vi": "Căn cứ",
        "ja": "根拠",
    },

    # ── Note / Observation ──────────────────────────────────────────────────
    "note_processing": {
        "vi": "📥 Đang ghi nhận quan sát sau hẹn và kích hoạt Observation Engine...",
        "ja": "📥 デート後の観察を記録し、観察エンジンを起動中...",
    },
    "note_no_candidate": {
        "vi": "Chưa chọn ứng viên.",
        "ja": "候補が選択されていません。",
    },
    "note_empty": {
        "vi": "Vui lòng nhập nội dung ghi chú sau cú pháp /note <nội dung>",
        "ja": "/メモ <内容> または /note <内容> の形式で入力してください",
    },
    "note_updated_title": {
        "vi": "✨ CẬP NHẬT THÀNH CÔNG TỪ QUAN SÁT THỰC TẾ!",
        "ja": "✨ 実際の観察から相性を更新しました！",
    },
    "note_compat_new": {
        "vi": "Độ tương thích mới",
        "ja": "新しい相性スコア",
    },
    "note_completeness_new": {
        "vi": "Mức hoàn thiện dữ liệu",
        "ja": "データ充実度",
    },
    "note_promoted_title": {
        "vi": "🚀 HẠNG MỤC ĐÃ ĐƯỢC THĂNG CẤP DỮ LIỆU:",
        "ja": "🚀 データランクが昇格した項目:",
    },
    "note_coach": {
        "vi": "Lời nhắn từ Clara",
        "ja": "Claraからのメッセージ",
    },
    "note_next_date": {
        "vi": "Gợi ý cho buổi hẹn tiếp theo:",
        "ja": "次のデートへのアドバイス:",
    },

    # ── Chat labels ─────────────────────────────────────────────────────────
    "chat_prompt": {
        "vi": "Bạn > ",
        "ja": "あなた > ",
    },
    "chat_clara_label": {
        "vi": "Clara Coach",
        "ja": "Clara コーチ",
    },
    "chat_error": {
        "vi": "Lỗi khi nhận phản hồi",
        "ja": "応答の取得中にエラーが発生しました",
    },
    "chat_recommendations": {
        "vi": "📋 Gợi ý hành động từ Clara:",
        "ja": "📋 Claraからの行動アドバイス:",
    },

    # ── Safety / guardrails ─────────────────────────────────────────────────
    "safety_title": {
        "vi": "CẢNH BÁO AN TOÀN TỪ CLARA",
        "ja": "CLARAからの安全警告",
    },

    # ── Help ────────────────────────────────────────────────────────────────
    "help_title": {
        "vi": "CÁC LỆNH HỖ TRỢ TRONG TERMINAL CHAT:",
        "ja": "ターミナルチャットで使えるコマンド一覧:",
    },
    "help_analyze": {
        "vi": "/analyze (/分析)    Xem báo cáo tương thích 7 trục đầy đủ.",
        "ja": "/analyze (/分析)    7軸相性レポートを表示します。",
    },
    "help_note": {
        "vi": "/note <nội dung>   Ghi chú sau hẹn để cập nhật radar.",
        "ja": "/メモ <内容>         デート後メモを記録して相性を更新します。",
    },
    "help_switch": {
        "vi": "/switch            Đổi sang ứng viên khác.",
        "ja": "/switch            別の候補に切り替えます。",
    },
    "help_history": {
        "vi": "/history           Xem lịch sử trò chuyện.",
        "ja": "/history           会話履歴を表示します。",
    },
    "help_stream": {
        "vi": "/stream            Bật / tắt chế độ stream.",
        "ja": "/stream            ストリーミングモードのON/OFF切替。",
    },
    "help_clear": {
        "vi": "/clear             Xóa màn hình.",
        "ja": "/clear             画面をクリアします。",
    },
    "help_help": {
        "vi": "/help              Hiển thị bảng trợ giúp này.",
        "ja": "/help              このヘルプを表示します。",
    },
    "help_exit": {
        "vi": "/exit              Thoát khỏi chương trình.",
        "ja": "/exit              プログラムを終了します。",
    },
    "help_samples_title": {
        "vi": "GỢI Ý CÂU HỎI MẪU CHO CLARA:",
        "ja": "CLARAへの質問例:",
    },
    "help_sample_1": {
        "vi": '• "Gợi ý cho mình 2 câu mở đầu tự nhiên dựa trên sở thích của bạn này"',
        "ja": '• 「この人の趣味に合わせた自然な会話の切り口を2つ教えて」',
    },
    "help_sample_2": {
        "vi": '• "Quan điểm tài chính có phù hợp với mình không?"',
        "ja": '• 「この人の金銭感覚は私と合っていますか？」',
    },
    "help_sample_3": {
        "vi": '• "Lần đầu gặp mặt nên hẹn ở đâu và nói về chủ đề gì an toàn?"',
        "ja": '• 「初回デートはどこで何を話すと安心ですか？」',
    },
    "help_sample_4": {
        "vi": '• "Bạn này bảo chuyển khoản đầu tư thì sao?" (Test Guardrail)',
        "ja": '• 「この人から投資のために送金してと言われたら？」（ガードレールテスト）',
    },

    # ── History ─────────────────────────────────────────────────────────────
    "history_title": {
        "vi": "LỊCH SỬ TRÒ CHUYỆN VỚI CLARA",
        "ja": "CLARAとの会話履歴",
    },
    "history_empty": {
        "vi": "Chưa có tin nhắn nào trong phiên trò chuyện này.",
        "ja": "このセッションにはまだメッセージがありません。",
    },
    "history_you": {
        "vi": "Bạn",
        "ja": "あなた",
    },
    "history_clara": {
        "vi": "Clara",
        "ja": "Clara",
    },

    # ── Stream toggle ───────────────────────────────────────────────────────
    "stream_on": {
        "vi": "Chế độ stream hiện đang: BẬT",
        "ja": "ストリーミングモード: ON",
    },
    "stream_off": {
        "vi": "Chế độ stream hiện đang: TẮT",
        "ja": "ストリーミングモード: OFF",
    },

    # ── Exit ────────────────────────────────────────────────────────────────
    "exit_bye": {
        "vi": "Tạm biệt bạn! Chúc bạn có những buổi hẹn vui vẻ và an toàn!",
        "ja": "さようなら！素敵なデートになることを願っています！",
    },
    "exit_interrupt": {
        "vi": "Tạm biệt bạn! Chúc bạn tìm được người đồng điệu cùng Clara!",
        "ja": "さようなら！Claraと一緒に素敵な出会いを見つけてください！",
    },
}


def get(key: str, lang: Lang = "vi") -> str:
    """Lấy chuỗi UI theo key và ngôn ngữ. Fallback về tiếng Việt nếu không tìm thấy."""
    entry = _STRINGS.get(key)
    if entry is None:
        return f"[i18n:{key}]"
    return entry.get(lang, entry.get("vi", f"[i18n:{key}:{lang}]"))
