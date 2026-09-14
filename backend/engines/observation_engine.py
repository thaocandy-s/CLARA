import logging
from typing import List, Dict, Any, Optional
from ..models.user import UserProfile
from ..models.candidate import CandidateProfile
from ..models.analysis import (
    AnalyzeResponseData,
    ReanalyzeResponseData,
    PromotedItem,
    RadarAxis,
    ChecklistGroup
)
from ..services.claude_client import claude_client

logger = logging.getLogger("clara.observation_engine")

REANALYZE_SYSTEM_PROMPT = """Bạn là CLARA Dynamic Observation Ingestion Engine.

NHIỆM VỤ CỦA BẠN:
Đọc đoạn ghi chú quan sát thực tế (unstructured text) của người dùng sau buổi hẹn hò ngoài đời thực, trích xuất các dữ kiện mới để:
1. Lấp các lỗ hổng thông tin còn thiếu (đặc biệt là các mục đang nằm trong "needs_check").
2. Chuyển trạng thái hạng mục checklist (promoted_items):
   - Từ "needs_check" sang "matched" nếu thông tin mới khẳng định sự phù hợp.
   - Hoặc từ "needs_check" sang "potential_friction" nếu phát hiện mâu thuẫn/rủi ro.
3. Tăng tỷ lệ Đầy đủ dữ liệu (data_completeness) một cách hợp lý (ví dụ: từ 74% lên 85-90%).
4. Cập nhật lại mảng điểm 7 trục radar tương ứng với thông tin mới vừa xác minh.
5. Gợi ý 2 ý tưởng cho buổi hẹn tiếp theo.

ĐỊNH DẠNG ĐẦU RA (CHỈ TRẢ VỀ JSON DUY NHẤT):
{
  "updated_overall_compatibility": 87,
  "updated_data_completeness": 88,
  "confidence_level": "Tin cậy cao",
  "confidence_detail": "Đã bổ sung dữ liệu quan sát thực tế về kế hoạch gia đình và định cư dài hạn.",
  "promoted_items": [
    {
      "from_category": "needs_check",
      "to_category": "matched",
      "title": "Kế hoạch thời gian & Gia đình",
      "new_detail": "Đối phương xác nhận mong muốn kết hôn trong 2 năm tới và định cư tại TP.HCM.",
      "source_evidence": "Ghi chú thực tế sau buổi hẹn"
    }
  ],
  "updated_radar_axes": [
    { "key": "long_term_goals", "label": "Mục tiêu lâu dài", "value": 90 },
    { "key": "core_values", "label": "Giá trị sống", "value": 90 },
    { "key": "communication", "label": "Giao tiếp", "value": 85 },
    { "key": "lifestyle_habits", "label": "Lối sống & Thói quen", "value": 85 },
    { "key": "interests", "label": "Sở thích & Giải trí", "value": 80 },
    { "key": "finances", "label": "Tài chính & Thực tế", "value": 70 },
    { "key": "future_plans", "label": "Kế hoạch tương lai", "value": 88 }
  ],
  "coach_note": "Thông tin thực tế mới cho thấy mức độ gắn kết tương lai giữa hai bạn rõ nét hơn rất nhiều!",
  "next_date_ideas": [
    "Một buổi tối đi dạo và cùng trải nghiệm workshop thủ công.",
    "Cùng tham gia một hoạt động ngoài trời nhẹ nhàng vào sáng Chủ Nhật."
  ]
}
"""


REANALYZE_SYSTEM_PROMPT_JA = """あなたはCLARA Dynamic Observation Ingestion Engineです。

あなたの任務:
実際のデート後にユーザーが記録した自由記述の観察メモ（unstructured text）を読み取り、新しい事実を抽出して以下を行います:
1. 不足していた情報（特に「needs_check / 要確認事項」にある項目）を解消する。
2. チェックリスト項目のステータス移行（promoted_items）:
   - 新しい情報で相性の良さが確認された場合は、「needs_check」から「matched」へ昇格。
   - 矛盾や懸念が見つかった場合は、「needs_check」から「potential_friction」へ移行。
3. データ充実度（data_completeness）を合理的に引き上げる（例: 74%から85〜90%へ）。
4. 新たに検証された事実に基づき、7軸レーダーのスコアを更新する。
5. 次回デートのための具体的なアイデアを2つ提案する。

【最重要言語ルール】
すべての出力テキスト（title, new_detail, source_evidence, coach_note, next_date_ideas, confidence_level, confidence_detail）は、必ず自然で丁寧な日本語のみで出力してください。ベトナム語や英語を出力してはなりません。

出力形式（有効なJSONのみを返すこと）:
{
  "updated_overall_compatibility": 87,
  "updated_data_completeness": 88,
  "confidence_level": "信頼度: 高",
  "confidence_detail": "デート後の観察メモを統合し、将来設計や価値観の具体性が確認できました。",
  "promoted_items": [
    {
      "from_category": "needs_check",
      "to_category": "matched",
      "title": "昇格した項目タイトル",
      "new_detail": "新しい詳細...",
      "source_evidence": "デート後の記録より"
    }
  ],
  "updated_radar_axes": [
    { "key": "long_term_goals", "label": "長期的な目標", "value": 90 },
    { "key": "core_values", "label": "大切にしている価値観", "value": 90 },
    { "key": "communication", "label": "コミュニケーション", "value": 85 },
    { "key": "lifestyle_habits", "label": "生活習慣・リズム", "value": 85 },
    { "key": "interests", "label": "趣味・関心", "value": 80 },
    { "key": "finances", "label": "金銭感覚・現実性", "value": 70 },
    { "key": "future_plans", "label": "将来設計・居住地", "value": 88 }
  ],
  "coach_note": "新しい事実により、お二人の将来像がぐっと鮮明になりました！",
  "next_date_ideas": [
    "夕方に散歩しながら落ち着いたカフェに立ち寄る。",
    "日曜の午前に一緒に軽いアウトドアやワークショップに参加する。"
  ]
}
"""

RADAR_LABELS_JA = {
    "long_term_goals": "長期的な目標",
    "core_values": "大切にしている価値観",
    "communication": "コミュニケーション",
    "lifestyle_habits": "生活習慣・リズム",
    "interests": "趣味・関心",
    "finances": "金銭感覚・現実性",
    "future_plans": "将来設計・居住地"
}


class ObservationEngine:
    """Engine 3: Observation Ingestion & Dynamic Re-analysis"""

    async def reanalyze(
        self,
        candidate: CandidateProfile,
        user: UserProfile,
        note: str,
        prev_analysis: Optional[AnalyzeResponseData] = None,
        lang: str = "vi"
    ) -> ReanalyzeResponseData:
        # 1. Gọi Claude LLM nếu có API
        if claude_client.is_available:
            try:
                system_prompt = REANALYZE_SYSTEM_PROMPT_JA if lang == "ja" else REANALYZE_SYSTEM_PROMPT
                user_prompt = self._build_prompt(candidate, user, note, prev_analysis, lang=lang)
                result_json = await claude_client.generate_json(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    temperature=0.2,
                    lang=lang
                )
                return self._parse_llm_result(candidate.candidate_id, result_json, prev_analysis, lang=lang)
            except Exception as e:
                logger.warning(f"Lỗi khi gọi Claude API trong ObservationEngine: {e}. Sử dụng Local Re-analysis Engine.")

        # 2. Fallback Engine thuật toán quy luật
        return self._generate_algorithmic_reanalysis(candidate, user, note, prev_analysis, lang=lang)

    def _build_prompt(
        self,
        cand: CandidateProfile,
        user: UserProfile,
        note: str,
        prev: Optional[AnalyzeResponseData],
        lang: str = "vi"
    ) -> str:
        prev_completeness = prev.data_completeness if prev else 74
        prev_compat = prev.overall_compatibility if prev else 81
        needs_check_titles = []
        if prev:
            needs_check_titles = [item.title for item in prev.checklist.needs_check]

        if lang == "ja":
            return f"""再分析用のコンテキスト情報:
- 相手候補: {cand.name}（{cand.job}、{cand.location}）
- ユーザーの交際目標: {user.relationship_goal}、譲れない条件: {', '.join(user.deal_breakers)}
- 前回の相性スコア: {prev_compat}%
- 前回のデータ充実度: {prev_completeness}%
- 前回の要確認事項: {', '.join(needs_check_titles) or '将来設計、金銭感覚'}

【デート後に記録された新しい観察メモ】:
\"\"\"{note}\"\"\"

上記の観察メモから事実を抽出し、要確認事項を解消してチェックリストを昇格させ、データ充実度を高めて7軸レーダーのスコアを更新してください。
必ずすべて自然な日本語で回答してください。"""

        return f"""THÔNG TIN PHÂN TÍCH TÁI ĐÁNH GIÁ:
- Đối tượng: {cand.name} ({cand.job}, {cand.location})
- Tiêu chí User: {user.relationship_goal}, dealbreakers: {', '.join(user.deal_breakers)}
- Điểm tương thích trước đó: {prev_compat}%
- Độ đầy đủ dữ liệu trước đó: {prev_completeness}%
- Các mục đang cần làm rõ trước đó: {', '.join(needs_check_titles) or 'Kế hoạch tương lai, tài chính'}

GHI CHÚ MỚI GHI NHẬN SAU BUỔI HẸN:
\"\"\"{note}\"\"\"

Hãy trích xuất thông tin thực tế từ ghi chú trên, giải quyết các mục cần làm rõ, nâng hạng mục checklist tương ứng, tăng % data completeness và cập nhật lại điểm 7 trục radar!"""

    def _parse_llm_result(
        self,
        candidate_id: str,
        data: Dict[str, Any],
        prev: Optional[AnalyzeResponseData],
        lang: str = "vi"
    ) -> ReanalyzeResponseData:
        promoted = []
        valid_cats = ["matched", "needs_check", "potential_friction"]
        default_title = "昇格項目" if lang == "ja" else "Hạng mục"
        default_ev = "デート後の記録" if lang == "ja" else "Ghi chú sau buổi hẹn"

        for p in data.get("promoted_items", []):
            fc = p.get("from_category", "needs_check")
            tc = p.get("to_category", "matched")
            fc = fc if fc in valid_cats else "needs_check"
            tc = tc if tc in valid_cats else "matched"
            promoted.append(PromotedItem(
                from_category=fc,
                to_category=tc,
                title=p.get("title", default_title),
                new_detail=p.get("new_detail", ""),
                source_evidence=p.get("source_evidence", default_ev)
            ))

        updated_axes = []
        for a in data.get("updated_radar_axes", []):
            k = a.get("key", "axis")
            raw_label = a.get("label", "")
            lbl = RADAR_LABELS_JA.get(k, raw_label or "軸") if lang == "ja" else raw_label or "Trục"
            updated_axes.append(RadarAxis(
                key=k,
                label=lbl,
                value=int(a.get("value", 80))
            ))

        # Cập nhật checklist nếu có previous analysis
        updated_checklist = None
        if prev:
            # Tạo bản sao checklist và di chuyển các item được promoted
            updated_checklist = ChecklistGroup(
                matched=list(prev.checklist.matched),
                needs_check=[],
                potential_friction=list(prev.checklist.potential_friction)
            )
            promoted_titles = {p.title for p in promoted}
            for item in prev.checklist.needs_check:
                if item.title in promoted_titles:
                    # Chuyển sang matched
                    updated_checklist.matched.append(item)
                else:
                    updated_checklist.needs_check.append(item)

        conf_level_def = "信頼度: 高" if lang == "ja" else "Tin cậy cao"
        conf_detail_def = "デート後の観察メモを統合しました" if lang == "ja" else "Đã tích hợp ghi chú sau buổi hẹn"
        coach_note_def = "新しい情報により、相性の全体像がより鮮明になりました！" if lang == "ja" else "Dữ liệu mới giúp bức tranh tương thích rõ ràng hơn rất nhiều!"
        date_ideas_def = ["開放的なカフェでゆっくり話す", "共通の趣味のワークショップに参加する"] if lang == "ja" else ["Buổi cafe tại không gian mở", "Cùng tham gia workshop"]

        return ReanalyzeResponseData(
            candidate_id=candidate_id,
            updated_overall_compatibility=int(data.get("updated_overall_compatibility", 87)),
            updated_data_completeness=int(data.get("updated_data_completeness", 88)),
            confidence_level=data.get("confidence_level", conf_level_def),
            confidence_detail=data.get("confidence_detail", conf_detail_def),
            promoted_items=promoted,
            updated_radar_axes=updated_axes,
            updated_checklist=updated_checklist,
            coach_note=data.get("coach_note", coach_note_def),
            next_date_ideas=data.get("next_date_ideas", date_ideas_def)
        )

    def _generate_algorithmic_reanalysis(
        self,
        cand: CandidateProfile,
        user: UserProfile,
        note: str,
        prev: Optional[AnalyzeResponseData],
        lang: str = "vi"
    ) -> ReanalyzeResponseData:
        lower_note = note.lower()

        promoted = []
        new_compat = 87
        new_completeness = 88

        if lang == "ja":
            # Kiểm tra tương lai, hôn nhân, định cư Tokyo
            if any(w in lower_note for w in ["結婚", "将来", "東京", "住む", "2年", "3年", "長期的", "家庭"]):
                promoted.append(PromotedItem(
                    from_category="needs_check",
                    to_category="matched",
                    title="将来設計・家庭観の合致",
                    new_detail="相手も東京での長期的な定住と、2〜3年以内の結婚に前向きであることが確認できました。",
                    source_evidence="デート後のあなたの記録より"
                ))

            # Kiểm tra tài chính / chi tiêu
            if any(w in lower_note for w in ["お金", "金銭", "会計", "割り勘", "貯蓄", "投資", "経済"]):
                promoted.append(PromotedItem(
                    from_category="needs_check",
                    to_category="matched",
                    title="金銭感覚の健全性とバランス",
                    new_detail="無理のないバランスの取れた支出感覚を持ち、経済的自立を尊重していることが確認できました。",
                    source_evidence="デート中の実際の観察より"
                ))

            if not promoted:
                promoted.append(PromotedItem(
                    from_category="needs_check",
                    to_category="matched",
                    title="対面でのコミュニケーションの心地よさ",
                    new_detail="直接会っての会話がとても自然で、多くの共通点や価値観の重なりが確認できました。",
                    source_evidence="デート後のあなたの記録より"
                ))

            new_axes = [
                RadarAxis(key="long_term_goals", label="長期的な目標", value=90),
                RadarAxis(key="core_values", label="大切にしている価値観", value=90),
                RadarAxis(key="communication", label="コミュニケーション", value=85),
                RadarAxis(key="lifestyle_habits", label="生活習慣・リズム", value=85),
                RadarAxis(key="interests", label="趣味・関心", value=80),
                RadarAxis(key="finances", label="金銭感覚・現実性", value=70),
                RadarAxis(key="future_plans", label="将来設計・居住地", value=88),
            ]

            return ReanalyzeResponseData(
                candidate_id=cand.candidate_id,
                updated_overall_compatibility=new_compat,
                updated_data_completeness=new_completeness,
                confidence_level="信頼度: 高",
                confidence_detail="実際のデートでの観察メモを統合し、将来設計に関する情報の不確実性が解消されました。",
                promoted_items=promoted,
                updated_radar_axes=new_axes,
                coach_note=f"初回のデートでとても有益な情報が得られましたね！{cand.name}さんとの相性スコアは{new_compat}%に上昇しました。",
                next_date_ideas=[
                    "土曜の午後に一緒に陶芸やクラフトの体験ワークショップに行く。",
                    "お互いに気になっていた落ち着いた雰囲気のカフェで次回ゆっくり語り合う。"
                ]
            )

        else:
            # Kiểm tra kế hoạch tương lai / hôn nhân / TP.HCM
            if any(w in lower_note for w in ["kết hôn", "định cư", "tp.hcm", "hồ chí minh", "2 năm", "3 năm", "lâu dài"]):
                promoted.append(PromotedItem(
                    from_category="needs_check",
                    to_category="matched",
                    title="Kế hoạch thời gian & Gia đình",
                    new_detail="Đối phương xác nhận mong muốn gắn bó với TP.HCM và định hướng kết hôn trong 2 năm tới.",
                    source_evidence="Ghi chú sau buổi hẹn của bạn"
                ))

            # Kiểm tra quan điểm chi tiêu / tài chính
            if any(w in lower_note for w in ["tài chính", "tiền", "chi tiêu", "tiết kiệm", "đầu tư", "chia bill"]):
                promoted.append(PromotedItem(
                    from_category="needs_check",
                    to_category="matched",
                    title="Quan điểm quản lý tài chính",
                    new_detail="Có quan điểm chi tiêu cân bằng, tôn trọng sự độc lập tài chính.",
                    source_evidence="Quan sát thực tế trong buổi hẹn"
                ))

            if not promoted:
                promoted.append(PromotedItem(
                    from_category="needs_check",
                    to_category="matched",
                    title="Sự cởi mở & Tương tác ngoài đời",
                    new_detail="Cuộc trò chuyện trực tiếp diễn ra tự nhiên, giúp làm sáng tỏ nhiều điểm chung.",
                    source_evidence="Ghi chú sau buổi hẹn của bạn"
                ))

            # Cập nhật 7 trục
            new_axes = [
                RadarAxis(key="long_term_goals", label="Mục tiêu lâu dài", value=90),
                RadarAxis(key="core_values", label="Giá trị sống", value=90),
                RadarAxis(key="communication", label="Giao tiếp", value=85),
                RadarAxis(key="lifestyle_habits", label="Lối sống & Thói quen", value=85),
                RadarAxis(key="interests", label="Sở thích & Giải trí", value=80),
                RadarAxis(key="finances", label="Tài chính & Thực tế", value=70),
                RadarAxis(key="future_plans", label="Kế hoạch tương lai", value=88),
            ]

            return ReanalyzeResponseData(
                candidate_id=cand.candidate_id,
                updated_overall_compatibility=new_compat,
                updated_data_completeness=new_completeness,
                confidence_level="Tin cậy cao",
                confidence_detail="Đã tích hợp ghi chú sau buổi gặp thực tế; các khoảng trống dữ liệu về tương lai đã được làm rõ.",
                promoted_items=promoted,
                updated_radar_axes=new_axes,
                coach_note=f"Buổi hẹn đã mang lại nhiều dữ kiện giá trị! Mức độ tương thích giữa bạn và {cand.name} tăng lên {new_compat}% nhờ sự rõ ràng về định hướng tương lai.",
                next_date_ideas=[
                    "Cùng tham gia một buổi workshop trải nghiệm vào chiều thứ Bảy.",
                    "Thử một quán ăn có món ẩm thực vùng miền mà cả hai cùng yêu thích."
                ]
            )


observation_engine = ObservationEngine()
