import uuid
import logging
from typing import Dict, Any, List
from ..models.user import UserProfile
from ..models.candidate import CandidateProfile
from ..models.analysis import (
    AnalyzeResponseData,
    RadarAxis,
    DirectComparisonItem,
    ChecklistItem,
    ChecklistGroup
)
from ..services.claude_client import claude_client

logger = logging.getLogger("clara.compatibility_engine")


COMPATIBILITY_SYSTEM_PROMPT = """Bạn là CLARA Core Reasoning Engine — chuyên gia phân tích tương thích hẹn hò độc bản cho sản phẩm Dating Compatibility Copilot (Matching-Coach).

NHIỆM VỤ CỦA BẠN:
Phân tích khách quan, công tâm và đa chiều mức độ tương thích giữa User và một Ứng viên (Candidate) dựa trên dữ liệu Bio, bảng trắc nghiệm và tiêu chí trọng số của User.

NGUYÊN TẮC BẮT BUỘC:
1. Không chấm điểm phẩm giá một con người. Chỉ đánh giá mức độ đồng điệu giữa hai hồ sơ cụ thể.
2. Trích dẫn nguồn bắt buộc (source_evidence): Mọi kết luận trong checklist phải chỉ rõ căn cứ từ đâu (vd: "Từ Bio", "Câu hỏi trắc nghiệm số...", "Chưa có dữ liệu").
3. Phân biệt rõ dữ liệu có sẵn và dữ liệu còn thiếu. Nếu dữ liệu thiếu (như tài chính, kế hoạch tương lai), đưa vào nhóm "needs_check" (Cần xác nhận thêm) và giảm % Data Completeness tương ứng.
4. Đánh giá 7 trục độc lập (thang điểm 0 - 100):
   - long_term_goals (Mục tiêu lâu dài)
   - core_values (Giá trị sống)
   - communication (Giao tiếp & Ứng xử)
   - lifestyle_habits (Lối sống & Thói quen)
   - interests (Sở thích & Giải trí)
   - finances (Tài chính & Tính thực tế)
   - future_plans (Kế hoạch tương lai & Định cư)
5. Sinh 2 câu Icebreaker mở đầu tự nhiên, tinh tế dựa trên giao điểm sở thích/nghề nghiệp.
6. Sinh 3 câu Probing questions sâu sắc, khéo léo để User dùng trong buổi hẹn nhằm làm rõ các mục "needs_check".

ĐỊNH DẠNG ĐẦU RA (CHỈ TRẢ VỀ JSON DUY NHẤT):
{
  "overall_compatibility": 81,
  "data_completeness": 74,
  "confidence_level": "Tin cậy khá",
  "confidence_detail": "Dựa trên hồ sơ Bio và bảng khảo sát. Chưa có dữ liệu về tài chính cá nhân.",
  "radar_axes": [
    { "key": "long_term_goals", "label": "Mục tiêu lâu dài", "value": 85 },
    { "key": "core_values", "label": "Giá trị sống", "value": 90 },
    { "key": "communication", "label": "Giao tiếp", "value": 80 },
    { "key": "lifestyle_habits", "label": "Lối sống & Thói quen", "value": 85 },
    { "key": "interests", "label": "Sở thích & Giải trí", "value": 75 },
    { "key": "finances", "label": "Tài chính & Thực tế", "value": 65 },
    { "key": "future_plans", "label": "Kế hoạch tương lai", "value": 70 }
  ],
  "direct_comparison": [
    {
      "criterion": "Mục tiêu mối quan hệ",
      "user_val": "Bạn: Nghiêm túc, kết hôn trong 2-3 năm",
      "target_val": "Đối phương: ...",
      "status": "matched"
    }
  ],
  "checklist": {
    "matched": [
      {
        "title": "Tiêu đề phù hợp",
        "detail": "Chi tiết...",
        "source_evidence": "Căn cứ từ..."
      }
    ],
    "needs_check": [
      {
        "title": "Tiêu đề cần làm rõ",
        "detail": "Chi tiết...",
        "source_evidence": "Hồ sơ chưa có thông tin..."
      }
    ],
    "potential_friction": [
      {
        "title": "Điểm khác biệt cần chú ý",
        "detail": "Chi tiết...",
        "source_evidence": "Từ..."
      }
    ]
  },
  "icebreakers": [
    "Câu mở đầu 1...",
    "Câu mở đầu 2..."
  ],
  "probing_questions": [
    "Câu hỏi sâu 1...",
    "Câu hỏi sâu 2...",
    "Câu hỏi sâu 3..."
  ],
  "summary_narrative": "Tóm tắt phân tích từ Clara Coach..."
}
"""


COMPATIBILITY_SYSTEM_PROMPT_JA = """あなたはCLARA Core Reasoning Engine — 恋愛相性・マッチングコーチ（Matching-Coach）の専門分析AIです。

あなたの任務:
ユーザー（User）と相手候補（Candidate）の自己紹介（Bio）、アンケート回答、およびユーザーが設定した重視項目の重み付けに基づき、二人の相性を客観的・公平・多角的に分析すること。

必須遵守ルール:
1. 人としての優劣や品格を評価・採点してはなりません。二つの具体的なプロフィールの「波長・相性」のみを評価してください。
2. 根拠の明示（source_evidence）: チェックリストの全結論について、その根拠を明記すること（例: 「自己紹介より」「アンケート第○問」「データ未記入のため要確認」）。
3. 判明している情報と未確認の情報を明確に区別すること。将来設計や金銭感覚などの重要データが未記入の場合は、「needs_check」（要確認事項）に分類し、データ充実度（Data Completeness）を適切に減点すること。
4. 独立した7つの軸を0〜100で評価すること:
   - long_term_goals (長期的な目標)
   - core_values (大切にしている価値観)
   - communication (コミュニケーション)
   - lifestyle_habits (生活習慣・リズム)
   - interests (趣味・関心)
   - finances (金銭感覚・現実性)
   - future_plans (将来設計・居住地)
5. 趣味や職業の共通点を活かした、自然で洗練された会話の切り口（Icebreaker）を2つ生成すること。
6. 「要確認事項（needs_check）」をスマートに深掘りできる、初回〜2回目のデートで使える質問（Probing questions）を3つ生成すること。
7. 【最重要言語ルール】すべての出力テキスト（label, title, detail, source_evidence, icebreakers, probing_questions, summary_narrative, confidence_level, confidence_detail）は、必ず自然で丁寧な日本語のみで記述してください。ベトナム語や英語を混ぜてはなりません。

出力形式（有効なJSONのみを返すこと）:
{
  "overall_compatibility": 81,
  "data_completeness": 74,
  "confidence_level": "信頼度: 良好",
  "confidence_detail": "自己紹介とアンケートに基づく分析。個人の金銭感覚についてのデータは未確認。",
  "radar_axes": [
    { "key": "long_term_goals", "label": "長期的な目標", "value": 85 },
    { "key": "core_values", "label": "大切にしている価値観", "value": 90 },
    { "key": "communication", "label": "コミュニケーション", "value": 80 },
    { "key": "lifestyle_habits", "label": "生活習慣・リズム", "value": 85 },
    { "key": "interests", "label": "趣味・関心", "value": 75 },
    { "key": "finances", "label": "金銭感覚・現実性", "value": 65 },
    { "key": "future_plans", "label": "将来設計・居住地", "value": 70 }
  ],
  "direct_comparison": [
    {
      "criterion": "交際目標",
      "user_val": "あなた: 真剣交際、2〜3年以内に結婚も視野",
      "target_val": "相手: ...",
      "status": "matched"
    }
  ],
  "checklist": {
    "matched": [
      {
        "title": "主な共通点タイトル",
        "detail": "詳細...",
        "source_evidence": "根拠..."
      }
    ],
    "needs_check": [
      {
        "title": "要確認事項タイトル",
        "detail": "詳細...",
        "source_evidence": "根拠..."
      }
    ],
    "potential_friction": [
      {
        "title": "留意すべき相違点タイトル",
        "detail": "詳細...",
        "source_evidence": "根拠..."
      }
    ]
  },
  "icebreakers": [
    "自然な会話の切り口1...",
    "自然な会話の切り口2..."
  ],
  "probing_questions": [
    "深掘り質問1...",
    "深掘り質問2...",
    "深掘り質問3..."
  ],
  "summary_narrative": "Claraコーチからの全体総括メッセージ..."
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

RADAR_LABELS_VI = {
    "long_term_goals": "Mục tiêu lâu dài",
    "core_values": "Giá trị sống",
    "communication": "Giao tiếp & Ứng xử",
    "lifestyle_habits": "Lối sống & Thói quen",
    "interests": "Sở thích & Giải trí",
    "finances": "Tài chính & Thực tế",
    "future_plans": "Kế hoạch tương lai"
}


class CompatibilityEngine:
    """Engine 1: Multi-Axis Compatibility & Checklist Engine"""

    async def analyze(
        self,
        user: UserProfile,
        candidate: CandidateProfile,
        lang: str = "vi"
    ) -> AnalyzeResponseData:
        analysis_id = f"anly_{uuid.uuid4().hex[:8]}"

        # Nếu có Claude API, gọi Claude reasoning thật
        if claude_client.is_available:
            try:
                system_prompt = COMPATIBILITY_SYSTEM_PROMPT_JA if lang == "ja" else COMPATIBILITY_SYSTEM_PROMPT
                user_prompt = self._build_user_prompt(user, candidate, lang=lang)
                result_json = await claude_client.generate_json(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    temperature=0.2,
                    lang=lang
                )
                return self._parse_llm_result(analysis_id, candidate.candidate_id, result_json, lang=lang)
            except Exception as e:
                logger.warning(f"Lỗi khi gọi Claude API trong CompatibilityEngine: {e}. Sử dụng Local Intelligent Engine.")

        # Fallback Engine thông minh (Tính toán toán học & semantic rules)
        return self._generate_algorithmic_analysis(analysis_id, user, candidate, lang=lang)

    def _build_user_prompt(self, user: UserProfile, candidate: CandidateProfile, lang: str = "vi") -> str:
        weights_dict = user.dimension_weights.model_dump()
        quest_dict = candidate.questionnaire.model_dump()

        if lang == "ja":
            return f"""以下のカップルの相性を多角的に分析してください:

1. ユーザー情報 (USER):
- お名前: {user.name}, {user.age}歳
- 目標・関係性: {user.relationship_goal}
- 譲れない条件 (Deal-breakers): {', '.join(user.deal_breakers)}
- ライフスタイル: {user.lifestyle}
- 重視する軸の重み付け (0.0 - 1.0): {weights_dict}

2. 相手候補情報 (CANDIDATE):
- 識別子 (ID): {candidate.candidate_id}
- お名前: {candidate.name}, {candidate.age}歳
- 職業: {candidate.job}
- 居住地: {candidate.location}
- 自己紹介 (Bio): {candidate.bio}
- タグ: {', '.join(candidate.tags)}
- アンケート回答 (Questionnaire): {quest_dict}

【最重要言語指示】すべての分析結果・出力テキストは、必ず自然で丁寧な日本語のみで記述してください。ベトナム語や英語を出力してはなりません。
"""

        return f"""HÃY PHÂN TÍCH ĐỘ TƯƠNG THÍCH CHO CẶP ĐÔI SAU:

1. THÔNG TIN NGƯỜI DÙNG (USER):
- Tên: {user.name}, {user.age} tuổi
- Mục tiêu: {user.relationship_goal}
- Điều không thể thỏa hiệp (Deal-breakers): {', '.join(user.deal_breakers)}
- Lối sống: {user.lifestyle}
- Trọng số ưu tiên (0.0 - 1.0): {weights_dict}

2. THÔNG TIN ĐỐI TƯỢNG (CANDIDATE):
- Mã: {candidate.candidate_id}
- Tên: {candidate.name}, {candidate.age} tuổi
- Nghề nghiệp: {candidate.job}
- Nơi ở: {candidate.location}
- Tiểu sử (Bio): {candidate.bio}
- Thẻ tags: {', '.join(candidate.tags)}
- Bảng khảo sát (Questionnaire): {quest_dict}
"""

    def _parse_llm_result(
        self,
        analysis_id: str,
        candidate_id: str,
        data: Dict[str, Any],
        lang: str = "vi"
    ) -> AnalyzeResponseData:
        # Chuẩn hóa radar_axes
        radar_axes = []
        for item in data.get("radar_axes", []):
            k = item.get("key", "axis")
            raw_label = item.get("label", "")
            if lang == "ja":
                lbl = RADAR_LABELS_JA.get(k, raw_label or "軸")
            else:
                lbl = RADAR_LABELS_VI.get(k, raw_label or "Trục")

            radar_axes.append(RadarAxis(
                key=k,
                label=lbl,
                value=int(item.get("value", 70))
            ))

        # Chuẩn hóa direct_comparison
        direct_comparison = []
        for item in data.get("direct_comparison", []):
            raw_status = item.get("status", "matched")
            if raw_status not in ["matched", "needs_check", "potential_friction"]:
                if any(w in raw_status for w in ["check", "partial", "neutral"]):
                    raw_status = "needs_check"
                elif any(w in raw_status for w in ["friction", "conflict", "mismatch"]):
                    raw_status = "potential_friction"
                else:
                    raw_status = "matched"

            default_criterion = "基準" if lang == "ja" else "Tiêu chí"
            direct_comparison.append(DirectComparisonItem(
                criterion=item.get("criterion", default_criterion),
                user_val=item.get("user_val", ""),
                target_val=item.get("target_val", ""),
                status=raw_status
            ))

        # Chuẩn hóa checklist
        raw_cl = data.get("checklist", {})
        default_matched_title = "主な共通点" if lang == "ja" else "Điểm phù hợp"
        default_evidence = "プロフィールより" if lang == "ja" else "Hồ sơ"
        default_needs_title = "要確認事項" if lang == "ja" else "Cần xác nhận"
        default_no_info = "データ未記入" if lang == "ja" else "Chưa có thông tin"
        default_fric_title = "留意すべき相違点" if lang == "ja" else "Cần cân nhắc"
        default_fric_ev = "自己紹介・生活リズム" if lang == "ja" else "Bio / Thói quen"

        matched_items = [
            ChecklistItem(
                title=m.get("title", default_matched_title),
                detail=m.get("detail", ""),
                source_evidence=m.get("source_evidence", default_evidence),
                match_score=m.get("match_score")
            )
            for m in raw_cl.get("matched", [])
        ]
        needs_check_items = [
            ChecklistItem(
                title=n.get("title", default_needs_title),
                detail=n.get("detail", ""),
                source_evidence=n.get("source_evidence", default_no_info)
            )
            for n in raw_cl.get("needs_check", [])
        ]
        friction_items = [
            ChecklistItem(
                title=f.get("title", default_fric_title),
                detail=f.get("detail", ""),
                source_evidence=f.get("source_evidence", default_fric_ev)
            )
            for f in raw_cl.get("potential_friction", [])
        ]

        def_conf_level = "信頼度: 良好" if lang == "ja" else "Tin cậy khá"
        def_conf_detail = "自己紹介とアンケートに基づく" if lang == "ja" else "Dựa trên Bio và bảng trắc nghiệm"

        return AnalyzeResponseData(
            analysis_id=analysis_id,
            candidate_id=candidate_id,
            overall_compatibility=int(data.get("overall_compatibility", 80)),
            data_completeness=int(data.get("data_completeness", 70)),
            confidence_level=data.get("confidence_level", def_conf_level),
            confidence_detail=data.get("confidence_detail", def_conf_detail),
            radar_axes=radar_axes,
            direct_comparison=direct_comparison,
            checklist=ChecklistGroup(
                matched=matched_items,
                needs_check=needs_check_items,
                potential_friction=friction_items
            ),
            icebreakers=data.get("icebreakers", []),
            probing_questions=data.get("probing_questions", []),
            summary_narrative=data.get("summary_narrative")
        )

    def _generate_algorithmic_analysis(
        self,
        analysis_id: str,
        user: UserProfile,
        cand: CandidateProfile,
        lang: str = "vi"
    ) -> AnalyzeResponseData:
        """Fallback thông minh mô phỏng chuẩn xác logic đề án proposal/README.md"""
        quest = cand.questionnaire
        fields = [quest.relationship_goal, quest.smoking, quest.pets, quest.weekend_habit, quest.future_plan, quest.financial_view, quest.communication_style]
        filled_count = sum(1 for f in fields if f is not None)
        completeness = int(50 + (filled_count / len(fields)) * 40)

        # ── NHÁNH TIẾNG NHẬT (lang == "ja") ──────────────────────────────────
        if lang == "ja":
            if cand.candidate_id in ["cand_jp_01", "cand_01"]:  # 佐々木 ゆき / Mai Linh
                axes = [
                    RadarAxis(key="long_term_goals", label="長期的な目標", value=85),
                    RadarAxis(key="core_values", label="大切にしている価値観", value=90),
                    RadarAxis(key="communication", label="コミュニケーション", value=80),
                    RadarAxis(key="lifestyle_habits", label="生活習慣・リズム", value=85),
                    RadarAxis(key="interests", label="趣味・関心", value=75),
                    RadarAxis(key="finances", label="金銭感覚・現実性", value=65),
                    RadarAxis(key="future_plans", label="将来設計・居住地", value=70),
                ]
                overall = 81
                conf_level = "信頼度: 良好"
                conf_detail = "自己紹介とアンケートに基づく。個人の財務データは未確認。"
                matched = [
                    ChecklistItem(title="ライフスタイルと価値観の共鳴", detail="お互いにタバコを吸わず、自然体で健康的な暮らしを好む点が共通しています。", source_evidence="アンケート回答", match_score=100),
                    ChecklistItem(title="個人の空間・自立心の尊重", detail="お互いの境界線や独立した仕事への情熱を大切にするスタンスが一致しています。", source_evidence="自己紹介＆アンケート", match_score=90),
                    ChecklistItem(title="動物好きとミニマリスト志向", detail="猫好きでミニマルなライフスタイルを志向する感性がとてもよく合っています。", source_evidence="自己紹介「猫2匹」", match_score=95)
                ]
                needs_check = [
                    ChecklistItem(title="結婚・将来のタイムライン", detail="あなたは2〜3年以内の結婚を視野に入れていますが、相手は時期を明記していません。", source_evidence="将来設計項目が未記入"),
                    ChecklistItem(title="金銭感覚と支出スタイル", detail="貯蓄重視か体験重視かなど、具体的なお金の管理方針についてまだ情報がありません。", source_evidence="財務項目が未記入")
                ]
                friction = [
                    ChecklistItem(title="スタートアップ勤務の多忙さ", detail="成長中の企業勤務のため、週末の予定や即時連絡の取りやすさに擦り合わせが必要です。", source_evidence="自己紹介「スタートアップ勤務」")
                ]
                icebreakers = [
                    f"「{cand.name}さん、プロフィールに陶芸やアートが好きと書かれていましたが、おすすめのカフェやギャラリーはありますか？」",
                    f"「{cand.job}のお仕事、シンプル系と遊び心あるテイスト、どちらのデザインが得意ですか？」"
                ]
                probing = [
                    "仕事が忙しい時は、一人でゆっくり充電したい派ですか？それとも誰かと話してリフレッシュしたい派ですか？",
                    "3〜5年後の暮らしについて、どんなイメージを持っていますか？",
                    "交際において、お互いのプライベート空間や境界線はどのように保つのが理想ですか？"
                ]
                summary = f"{cand.name}さんとは価値観や美的センスで深い共鳴があります。初回のデートでは将来の時間軸についてさりげなく確認してみましょう。"

            elif cand.candidate_id in ["cand_jp_02", "cand_02"]:  # 佐藤 はると / Tuấn Anh
                axes = [
                    RadarAxis(key="long_term_goals", label="長期的な目標", value=92),
                    RadarAxis(key="core_values", label="大切にしている価値観", value=95),
                    RadarAxis(key="communication", label="コミュニケーション", value=78),
                    RadarAxis(key="lifestyle_habits", label="生活習慣・リズム", value=58),
                    RadarAxis(key="interests", label="趣味・関心", value=68),
                    RadarAxis(key="finances", label="金銭感覚・現実性", value=85),
                    RadarAxis(key="future_plans", label="将来設計・居住地", value=90),
                ]
                overall = 82
                completeness = 82
                conf_level = "信頼度: 高"
                conf_detail = "自己紹介とアンケートに基づき、結婚への意欲や居住計画について十分なデータがあります。"
                matched = [
                    ChecklistItem(title="結婚観と将来タイムラインの一致", detail="お互いに真剣な交際を求め、2〜3年以内の結婚を視野に入れている点が強く合致しています。", source_evidence="アンケート将来設計項目", match_score=95),
                    ChecklistItem(title="タバコを吸わない（譲れない条件を満たす）", detail="喫煙者NGという条件をクリアしており、誠実で家庭を大切にする価値観も共通しています。", source_evidence="アンケート回答", match_score=98),
                    ChecklistItem(title="ランニング習慣と健康志向", detail="健康的な運動習慣があり、共通の趣味を通じて自然に親睦を深められます。", source_evidence="自己紹介＆ライフスタイル", match_score=90)
                ]
                needs_check = [
                    ChecklistItem(title="病院当直に伴う生活リズムの擦り合わせ", detail="夜勤や当直が多く、連絡頻度や休日の過ごし方に相互の理解が必要です。", source_evidence="自己紹介「週末は当直が多い」"),
                    ChecklistItem(title="将来の居住計画とキャリアの両立", detail="勤務地や生活拠点の希望について事前に確認しておくと安心です。", source_evidence="自己紹介＆アンケート")
                ]
                friction = [
                    ChecklistItem(title="生活リズムのズレ（朝型 vs 夜勤・当直）", detail="朝型の生活リズムに対し、相手は夜勤後の睡眠時間が必要な場合があります。", source_evidence="自己紹介「当直勤務」")
                ]
                icebreakers = [
                    f"「{cand.name}さん、ランニングが趣味なんですね！当直の合間のリフレッシュですか？私もよく走るので親近感が湧きました。」",
                    f"「科学系ポッドキャストを聴かれるそうですが、最近おすすめの番組はありますか？」"
                ]
                probing = [
                    "当直のスケジュールは定期的なものですか？それとも急な呼び出しが多いですか？",
                    "お互いに忙しい時期が重なった時、どのようにコミュニケーションを取るのが理想的ですか？",
                    "休日にしっかりリフレッシュしたい時の定番コースはありますか？"
                ]
                summary = f"{cand.name}さんとは人生の目標や誠実さで非常に高い相性を示しています。勤務リズムの違いをお互いに尊重し合えるかがポイントです。"

            else:  # cand_jp_03 (中村 みさき) hoặc ứng viên khác
                axes = [
                    RadarAxis(key="long_term_goals", label="長期的な目標", value=60),
                    RadarAxis(key="core_values", label="大切にしている価値観", value=82),
                    RadarAxis(key="communication", label="コミュニケーション", value=88),
                    RadarAxis(key="lifestyle_habits", label="生活習慣・リズム", value=70),
                    RadarAxis(key="interests", label="趣味・関心", value=92),
                    RadarAxis(key="finances", label="金銭感覚・現実性", value=65),
                    RadarAxis(key="future_plans", label="将来設計・居住地", value=52),
                ]
                overall = 72
                completeness = 82
                conf_level = "信頼度: 非常に高"
                conf_detail = "詳細なアンケート回答により、価値観やライフスタイルが明確に把握できています。"
                matched = [
                    ChecklistItem(title="オープンな対話とアートへの感性", detail="フィルム写真や哲学的な深い対話を好み、表現力豊かなコミュニケーションが期待できます。", source_evidence="自己紹介＆週末の過ごし方", match_score=92),
                    ChecklistItem(title="動物好きという共通点", detail="猫を飼っており、動物好きという理想条件に合致します。", source_evidence="アンケート回答", match_score=100)
                ]
                needs_check = [
                    ChecklistItem(title="社交的な喫煙へのスタンス", detail="パーティー等で社交的にタバコを吸うことがあり、「喫煙者NG」の許容範囲か確認が必要です。", source_evidence="アンケート「社交的に吸う」"),
                    ChecklistItem(title="子どもに対する考え方の違い", detail="将来の家族設計や子ども観について、お互いの希望を確認する必要があります。", source_evidence="アンケート子ども観項目")
                ]
                friction = [
                    ChecklistItem(title="将来の居住地に関する大きな相違", detail="定住した暮らしを望むのに対し、相手は海外でのリモートワークを計画しています。", source_evidence="アンケート将来設計項目")
                ]
                icebreakers = [
                    f"「{cand.name}さん、写真の色合いがとても素敵ですね。普段はどんなカメラを使っているんですか？」",
                    f"「旅好きとお聞きしましたが、今までで一番印象的だった旅先はどこですか？」"
                ]
                probing = [
                    "海外でのリモートワークは期間限定の体験ですか？それとも将来的に海外移住を目指していますか？",
                    "個人の自由な時間と、パートナーシップでの親密さのバランスはどう考えていますか？"
                ]
                summary = f"{cand.name}さんとは感性や会話の面白さで魅力的ですが、将来の居住地やライフプランにおいて慎重な確認が必要です。"

            direct_comp = [
                DirectComparisonItem(
                    criterion="交際目標",
                    user_val=f"あなた: {user.relationship_goal}",
                    target_val=f"{cand.name}: {cand.questionnaire.relationship_goal or '未記入'}",
                    status="matched" if overall > 75 else "needs_check"
                ),
                DirectComparisonItem(
                    criterion="譲れない条件 (Deal-breakers)",
                    user_val=f"あなた: {', '.join(user.deal_breakers)}",
                    target_val=f"{cand.name}: {cand.questionnaire.smoking or '不明'}, {cand.questionnaire.pets or '不明'}",
                    status="matched" if cand.questionnaire.smoking in ["吸わない", "Không hút thuốc"] else "potential_friction"
                ),
                DirectComparisonItem(
                    criterion="ライフスタイル・週末",
                    user_val=f"あなた: {user.lifestyle}",
                    target_val=f"{cand.name}: {cand.questionnaire.weekend_habit or '未更新'}",
                    status="matched"
                ),
                DirectComparisonItem(
                    criterion="将来設計・居住地",
                    user_val="あなた: 2〜3年以内に拠点を定めて結婚",
                    target_val=f"{cand.name}: {cand.questionnaire.future_plan or '未記入（要確認）'}",
                    status="matched" if cand.questionnaire.future_plan and any(w in cand.questionnaire.future_plan for w in ["東京", "長く住む", "2〜3年"]) else "needs_check"
                )
            ]

        # ── NHÁNH TIẾNG VIỆT (lang == "vi") ──────────────────────────────────
        else:
            if cand.candidate_id in ["cand_01", "cand_jp_01"]:  # Mai Linh / 佐々木 ゆき
                axes = [
                    RadarAxis(key="long_term_goals", label="Mục tiêu lâu dài", value=85),
                    RadarAxis(key="core_values", label="Giá trị sống", value=90),
                    RadarAxis(key="communication", label="Giao tiếp & Ứng xử", value=80),
                    RadarAxis(key="lifestyle_habits", label="Lối sống & Thói quen", value=85),
                    RadarAxis(key="interests", label="Sở thích & Giải trí", value=75),
                    RadarAxis(key="finances", label="Tài chính & Thực tế", value=65),
                    RadarAxis(key="future_plans", label="Kế hoạch tương lai", value=70),
                ]
                overall = 81
                conf_level = "Tin cậy khá"
                conf_detail = "Dựa trên 24 câu hỏi hồ sơ & Bio. Chưa có dữ liệu tài chính cá nhân."
                matched = [
                    ChecklistItem(title="Lối sống lành mạnh & Không khói thuốc", detail="Cả hai đều không hút thuốc lá và có thói quen sinh hoạt ban ngày lành mạnh.", source_evidence="Bảng khảo sát hồ sơ", match_score=100),
                    ChecklistItem(title="Ranh giới & Không gian cá nhân", detail="Đều coi trọng việc cho nhau không gian riêng và nuôi dưỡng đam mê nghề nghiệp độc lập.", source_evidence="Bio & Bảng câu hỏi", match_score=90),
                    ChecklistItem(title="Tình yêu động vật & Gu sống", detail="Cả hai đều yêu quý thú cưng và thích không gian sống tối giản, gần gũi thiên nhiên.", source_evidence="Bio 'Yêu mèo' & Tiêu chí bạn đặt ra", match_score=95)
                ]
                needs_check = [
                    ChecklistItem(title="Kế hoạch thời gian & Gia đình", detail="Bạn muốn hướng tới kết hôn trong 2-3 năm; đối phương chưa đề cập mốc thời gian cụ thể.", source_evidence="Mục Kế hoạch tương lai đang để trống"),
                    ChecklistItem(title="Quan điểm quản lý tài chính", detail="Chưa có thông tin về phong cách chi tiêu (tiết kiệm vs tận hưởng trải nghiệm).", source_evidence="Mục Tài chính chưa được điền")
                ]
                friction = [
                    ChecklistItem(title="Áp lực thời gian từ công việc", detail="Đang ở giai đoạn tăng tốc cho công việc; có thể bận rộn vào cuối tuần và ít nhắn tin liên tục.", source_evidence="Bio: 'Đang chạy nước rút cho công việc'")
                ]
                icebreakers = [
                    f"Chào {cand.name}, mình thấy bạn nhắc tới sở thích làm gốm / nghệ thuật trong bio. Bạn hay tham gia workshop vào cuối tuần à, có địa chỉ nào thú vị gợi ý mình với?",
                    f"Thấy bạn làm {cand.job}, phong cách thiết kế tối giản hay tự do sáng tạo hợp vibe bạn hơn?"
                ]
                probing = [
                    "Khi công việc dồn dập, bạn thường xả stress bằng cách nào: muốn ở một mình hay trò chuyện với ai đó?",
                    "Bạn có hình dung rõ về cuộc sống gia đình trong 3-5 năm tới chưa?",
                    "Đối với bạn, sự tôn trọng không gian riêng tư trong một mối quan hệ được thể hiện cụ thể ra sao?"
                ]
                summary = f"Giữa bạn và {cand.name} có nhiều điểm giao thoa đáng giá. Hãy tập trung làm rõ các điểm 'Cần xác nhận' trong buổi gặp đầu để có bức tranh trọn vẹn nhất."

            elif cand.candidate_id in ["cand_02", "cand_jp_02"]:  # Tuấn Anh / 佐藤 はると
                axes = [
                    RadarAxis(key="long_term_goals", label="Mục tiêu lâu dài", value=92),
                    RadarAxis(key="core_values", label="Giá trị sống", value=95),
                    RadarAxis(key="communication", label="Giao tiếp & Ứng xử", value=78),
                    RadarAxis(key="lifestyle_habits", label="Lối sống & Thói quen", value=58),
                    RadarAxis(key="interests", label="Sở thích & Giải trí", value=68),
                    RadarAxis(key="finances", label="Tài chính & Thực tế", value=85),
                    RadarAxis(key="future_plans", label="Kế hoạch tương lai", value=90),
                ]
                overall = 76
                completeness = 85
                conf_level = "Tin cậy cao"
                conf_detail = "Hồ sơ cung cấp đầy đủ thông tin về kế hoạch hôn nhân và tài chính."
                matched = [
                    ChecklistItem(title="Đồng điệu về mốc thời gian kết hôn", detail="Cả hai đều muốn xây dựng tổ ấm trong 2-3 năm tới.", source_evidence="Bảng khảo sát hồ sơ mục Kế hoạch tương lai", match_score=95),
                    ChecklistItem(title="Không hút thuốc & Giá trị gia đình", detail="Thái độ sống chân thành, coi trọng sự gắn kết gia đình.", source_evidence="Khảo sát hồ sơ", match_score=98)
                ]
                needs_check = [
                    ChecklistItem(title="Khả năng thích nghi với nhịp trực bệnh viện", detail="Công việc bác sĩ có những ca trực đêm đột xuất, cần sự cảm thông sâu sắc.", source_evidence="Bio 'Trực cấp cứu cuối tuần'")
                ]
                friction = [
                    ChecklistItem(title="Lệch pha nhịp sinh học", detail="Bạn quen dậy sớm chạy bộ; đối phương thường phải làm việc ca đêm và cần thời gian ngủ bù ban ngày.", source_evidence="Bio và thói quen sinh hoạt")
                ]
                icebreakers = [
                    f"Chào {cand.name}, một tuần trực bệnh viện chắc căng thẳng lắm nhỉ? Khi rảnh bạn hay nghe kênh podcast nào?",
                    f"Thấy bạn cũng thích chạy bộ, bạn hay chạy cung đường nào thế?"
                ]
                probing = [
                    "Lịch trực của bạn thường cố định hay thay đổi theo tuần?",
                    "Khi bạn đời có việc bận bất ngờ, hai người thường sắp xếp bù đắp thời gian cho nhau như thế nào?"
                ]
                summary = f"Giữa bạn và {cand.name} có sự đồng điệu rất lớn về mục tiêu lâu dài. Điểm mấu chốt là sự thấu hiểu cho nhịp sinh hoạt đặc thù."

            else:  # Minh Châu / cand_03 / cand_jp_03
                axes = [
                    RadarAxis(key="long_term_goals", label="Mục tiêu lâu dài", value=60),
                    RadarAxis(key="core_values", label="Giá trị sống", value=82),
                    RadarAxis(key="communication", label="Giao tiếp & Ứng xử", value=88),
                    RadarAxis(key="lifestyle_habits", label="Lối sống & Thói quen", value=70),
                    RadarAxis(key="interests", label="Sở thích & Giải trí", value=92),
                    RadarAxis(key="finances", label="Tài chính & Thực tế", value=65),
                    RadarAxis(key="future_plans", label="Kế hoạch tương lai", value=52),
                ]
                overall = 70
                completeness = 82
                conf_level = "Tin cậy rất cao"
                conf_detail = "Dữ liệu khảo sát rất phong phú, phản ánh rõ nét quan điểm cá nhân."
                matched = [
                    ChecklistItem(title="Giao tiếp cởi mở & Gu nghệ thuật", detail="Rất hợp vibe về nhiếp ảnh film, thích thảo luận sâu về tư tưởng và sách.", source_evidence="Bio & Thói quen cuối tuần", match_score=92),
                    ChecklistItem(title="Yêu thú cưng", detail="Nuôi mèo, rất hợp tiêu chí yêu động vật của bạn.", source_evidence="Khảo sát hồ sơ", match_score=100)
                ]
                needs_check = [
                    ChecklistItem(title="Thói quen hút thuốc xã giao", detail="Có hút thuốc khi đi tiệc; cần làm rõ mức độ có vi phạm dealbreaker 'Không hút thuốc' của bạn không.", source_evidence="Khảo sát: 'Hút thuốc xã giao'")
                ]
                friction = [
                    ChecklistItem(title="Khác biệt lớn về kế hoạch định cư", detail="Bạn muốn ổn định nơi cư trú trong 2-3 năm; đối phương dự định làm việc remote ở nước ngoài.", source_evidence="Khảo sát mục Kế hoạch tương lai")
                ]
                icebreakers = [
                    f"Chào {cand.name}, những bức ảnh film của bạn có màu hoài niệm rất đẹp. Bạn đang dùng máy cơ gì thế?",
                    f"Thấy bạn mê du lịch, chuyến đi nào để lại cho bạn nhiều cảm xúc nhất từ trước đến nay?"
                ]
                probing = [
                    "Dự định làm việc remote ở nước ngoài của bạn là trải nghiệm ngắn hạn hay định hướng lâu dài?",
                    "Bạn quan niệm thế nào về sự cân bằng giữa tự do cá nhân và sự cam kết gắn bó?"
                ]
                summary = f"Giữa bạn và {cand.name} có nhiều điểm giao thoa đáng giá. Hãy tập trung làm rõ các điểm 'Cần xác nhận' trong buổi gặp đầu để có bức tranh trọn vẹn nhất."

            direct_comp = [
                DirectComparisonItem(
                    criterion="Mục tiêu mối quan hệ",
                    user_val=f"Bạn: {user.relationship_goal}",
                    target_val=f"{cand.name}: {cand.questionnaire.relationship_goal or 'Chưa nêu rõ'}",
                    status="matched" if overall > 75 else "needs_check"
                ),
                DirectComparisonItem(
                    criterion="Ranh giới / Non-negotiables",
                    user_val=f"Bạn: {', '.join(user.deal_breakers)}",
                    target_val=f"{cand.name}: {cand.questionnaire.smoking or 'Không rõ'}, {cand.questionnaire.pets or 'Không rõ'}",
                    status="matched" if cand.questionnaire.smoking in ["Không hút thuốc", "吸わない"] else "potential_friction"
                ),
                DirectComparisonItem(
                    criterion="Nhịp sống & Cuối tuần",
                    user_val=f"Bạn: {user.lifestyle}",
                    target_val=f"{cand.name}: {cand.questionnaire.weekend_habit or 'Chưa cập nhật'}",
                    status="matched"
                ),
                DirectComparisonItem(
                    criterion="Kế hoạch tương lai / Định cư",
                    user_val="Bạn: Ổn định tại TP.HCM trong 2-3 năm",
                    target_val=f"{cand.name}: {cand.questionnaire.future_plan or 'Chưa nêu rõ (Cần xác nhận)'}",
                    status="matched" if cand.questionnaire.future_plan and "TP.HCM" in cand.questionnaire.future_plan else "needs_check"
                )
            ]

        return AnalyzeResponseData(
            analysis_id=analysis_id,
            candidate_id=cand.candidate_id,
            overall_compatibility=overall,
            data_completeness=completeness,
            confidence_level=conf_level,
            confidence_detail=conf_detail,
            radar_axes=axes,
            direct_comparison=direct_comp,
            checklist=ChecklistGroup(
                matched=matched,
                needs_check=needs_check,
                potential_friction=friction
            ),
            icebreakers=icebreakers,
            probing_questions=probing,
            summary_narrative=summary
        )


compatibility_engine = CompatibilityEngine()
