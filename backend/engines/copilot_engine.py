import logging
from typing import List, Optional, AsyncGenerator
from ..models.user import UserProfile
from ..models.candidate import CandidateProfile
from ..models.analysis import AnalyzeResponseData, ChatMessage, ChatResponseData
from ..services.claude_client import claude_client
from .guardrails import guardrails

logger = logging.getLogger("clara.copilot_engine")

CLARA_COACH_SYSTEM_PROMPT = """Bạn là CLARA — Dating Compatibility Coach thông thái, ấm áp và tâm lý.

VAI TRÒ & PHONG THÁI CỦA BẠN:
- Bạn là một người bạn đồng hành tin cậy, lắng nghe sâu sắc và đưa ra những góc nhìn khách quan, tinh tế về chuyện hẹn hò.
- Bạn KHÔNG BAO GIỜ phán xét hay chấm điểm phẩm giá con người. Bạn chỉ hỗ trợ User đối chiếu giá trị sống, nhận diện điểm chung và những khác biệt cần cân nhắc.
- Bạn luôn khuyến khích giao tiếp trung thực, tôn trọng ranh giới cá nhân và ưu tiên sự an toàn.

QUY TẮC PHẢN HỒI:
1. Luôn đưa ra lời khuyên thực tế, cụ thể gắn liền với hồ sơ của đối tượng đang xem xét.
2. Nếu câu hỏi liên quan đến cách mở đầu hoặc bắt chuyện: Hãy gợi ý 1-2 câu icebreaker tự nhiên, dựa vào sở thích hoặc chi tiết độc đáo trong bio.
3. Nếu câu hỏi liên quan đến các chủ đề nhạy cảm (tiền bạc, cam kết hôn nhân): Hãy hướng dẫn cách quan sát tinh tế và khéo léo đặt câu hỏi trong các buổi gặp sau, tránh dồn ép ở lần đầu.
4. Trả về định dạng JSON gồm 2 phần:
   - "message": Nội dung trò chuyện của Clara (có thể dùng markdown nhấn mạnh nhẹ nhàng).
   - "recommendations": Mảng 2-3 gạch đầu dòng hành động thiết thực gợi ý cho User.
"""


CLARA_COACH_SYSTEM_PROMPT_JA = """あなたはCLARA（クララ）— 恋愛相性コーチです。知的で温かく、相手の気持ちに寄り添う頼れる友人のような存在です。

あなたの役割とスタイル:
- ユーザーの恋愛をサポートする信頼できるパートナーとして、深く耳を傾け、客観的かつ繊細な視点を提供します。
- 人を評価したり、レッテルを貼ったりすることは絶対にしません。あなたは価値観の共鳴・相違点の認識をサポートするだけです。
- 誠実なコミュニケーション、個人の境界線の尊重、安全を常に優先してアドバイスします。
- 日本の恋愛文化・デートマナーに精通しており、実情に即した具体的なアドバイスが得意です。

【最重要言語指示】
あなた（CLARA）は必ず100%日本語のみで回答してください。
ユーザーがどのような言語で質問・入力した場合であっても、過去の対話履歴や文脈に他言語が含まれていたとしても、あなたの返答（message、recommendationsなど全テキスト）は、必ず自然で温かい日本語のみで記述してください。ベトナム語や英語の混在は絶対に禁止です。

回答ルール:
1. 常に相手プロフィールの具体的な情報に基づいた実践的なアドバイスをしてください。
2. 会話の始め方に関する質問には: 相手の趣味や自己紹介の独自ポイントを活かした自然な話題1〜2個を提案してください。
3. デリケートなテーマ（お金・結婚・将来）については: 初対面では直接尋ねず、観察しながら自然な形で確認するコツを教えてください。
4. 返答は必ずJSON形式で:
   - "message": Claraの会話内容（日本語のみ、軽いMarkdown強調可）
   - "recommendations": ユーザーへの具体的なアクション提案2〜3項目（日本語のみ）
"""


class CopilotEngine:
    """Engine 2: Contextual Dating Copilot (Clara Coach)"""

    async def chat(
        self,
        query: str,
        user: UserProfile,
        candidate: Optional[CandidateProfile] = None,
        analysis: Optional[AnalyzeResponseData] = None,
        history: Optional[List[ChatMessage]] = None,
        lang: str = "vi"
    ) -> ChatResponseData:
        # 1. Kiểm tra Guardrails an toàn
        is_risky, safety_msg = guardrails.check_input_safety(query, lang=lang)

        # 2. Gọi Claude API nếu sẵn sàng
        if claude_client.is_available:
            try:
                system_prompt = self._build_system_prompt(user, candidate, analysis, lang=lang)
                llm_messages = self._format_messages_for_llm(query, history)
                
                # Yêu cầu trả về JSON có message và recommendations
                if lang == "ja":
                    json_instruction = (
                        "\n\n【重要】回答はすべて自然な日本語のみで記述し、必ず次のJSON形式のみで返してください: "
                        "{\"message\": \"...\", \"recommendations\": [\"...\"]}"
                    )
                else:
                    json_instruction = "\n\nQUAN TRỌNG: Chỉ trả về JSON duy nhất với cấu trúc: {\"message\": \"...\", \"recommendations\": [\"...\"]}"
                full_system = system_prompt + json_instruction
                
                result_json = await claude_client.generate_json(
                    system_prompt=full_system,
                    user_prompt=query,
                    temperature=0.6,
                    lang=lang
                )
                
                msg = guardrails.sanitize_output(result_json.get("message", ""), lang=lang)
                recs = result_json.get("recommendations", [])
                
                return ChatResponseData(
                    message=msg,
                    recommendations=recs,
                    safety_reminder=safety_msg
                )
            except Exception as e:
                logger.warning(f"Lỗi khi gọi Claude API trong CopilotEngine: {e}. Sử dụng Local Copilot Engine.")

        # 3. Fallback Copilot thông minh theo ngữ cảnh
        return self._generate_algorithmic_reply(query, user, candidate, analysis, safety_msg, lang=lang)

    async def stream_chat(
        self,
        query: str,
        user: UserProfile,
        candidate: Optional[CandidateProfile] = None,
        analysis: Optional[AnalyzeResponseData] = None,
        history: Optional[List[ChatMessage]] = None,
        lang: str = "vi"
    ) -> AsyncGenerator[str, None]:
        """Stream phản hồi qua Claude SSE"""
        if claude_client.is_available:
            try:
                system_prompt = self._build_system_prompt(user, candidate, analysis, lang=lang)
                # Hướng dẫn phản hồi tự nhiên khi stream (không trả về raw JSON)
                if lang == "ja":
                    stream_instruction = (
                        "\n\n【最重要言語指示】必ず100%自然で温かい日本語のみで回答してください（ベトナム語や英語は一切使用禁止）。"
                        "JSONではなく、親しみやすい恋愛相性コーチとして直接ユーザーと日本語で会話してください（```jsonタグ不要）。"
                        "アドバイス本文の後、改行して2〜3つの具体的な行動提案を箇条書き（「• 」）で記載してください。"
                    )
                else:
                    stream_instruction = (
                        "\n\nĐỊNH DẠNG PHẢN HỒI KHI STREAM: Hãy trò chuyện tự nhiên, ấm áp, thấu hiểu trực tiếp với người dùng (KHÔNG trả về cấu trúc JSON, KHÔNG bọc thẻ ```json). "
                        "Sau nội dung tư vấn, hãy xuống dòng và liệt kê 2-3 gạch đầu dòng gợi ý hành động cụ thể."
                    )
                full_system = system_prompt + stream_instruction
                llm_messages = self._format_messages_for_llm(query, history)
                async for chunk in claude_client.generate_chat_stream(full_system, llm_messages):
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"Lỗi khi gọi Claude API trong stream_chat: {e}. Sẽ dùng fallback stream.")

        # Fallback stream từng từ
        reply = self._generate_algorithmic_reply(query, user, candidate, analysis, None, lang=lang)
        words = reply.message.split(" ")
        for word in words:
            yield word + " "

    def _build_system_prompt(
        self,
        user: UserProfile,
        cand: Optional[CandidateProfile],
        anly: Optional[AnalyzeResponseData],
        lang: str = "vi"
    ) -> str:
        if lang == "ja":
            prompt = CLARA_COACH_SYSTEM_PROMPT_JA + f"\n\nユーザー情報: 名前 {user.name}、目標: 「{user.relationship_goal}」"
            if cand:
                prompt += f"\n現在の相手: {cand.name}（{cand.age}歳、職業: {cand.job}、自己紹介: 「{cand.bio}」）"
            if anly:
                prompt += f"\n現在の分析結果: 相性スコア {anly.overall_compatibility}%、データ充実度 {anly.data_completeness}%"
                if anly.checklist.matched:
                    m_titles = "、".join(m.title for m in anly.checklist.matched[:3])
                    prompt += f"\n主な共通点: {m_titles}"
                if anly.checklist.needs_check:
                    nc_titles = "、".join(n.title for n in anly.checklist.needs_check[:2])
                    prompt += f"\n要確認事項: {nc_titles}"
            prompt += "\n\n【回答言語の厳守】必ず日本語のみで返答してください。"
        else:
            prompt = CLARA_COACH_SYSTEM_PROMPT + f"\n\nNGỮ CẢNH NGƯỜI DÙNG: Tên {user.name}, mục tiêu: '{user.relationship_goal}'."
            if cand:
                prompt += f"\nĐỐI TƯỢNG ĐANG TÌM HIỂU: {cand.name} ({cand.age} tuổi, nghề {cand.job}, bio: '{cand.bio}')."
            if anly:
                prompt += f"\nKẾT QUẢ PHÂN TÍCH HIỆN TẠI: Độ tương thích {anly.overall_compatibility}%, mức đầy đủ dữ liệu {anly.data_completeness}%."
        return prompt

    def _format_messages_for_llm(self, query: str, history: Optional[List[ChatMessage]]) -> List[dict]:
        messages = []
        if history:
            for h in history[-6:]:  # Lấy 6 tin nhắn gần nhất
                messages.append({"role": h.role, "content": h.content})
        messages.append({"role": "user", "content": query})
        return messages

    def _generate_algorithmic_reply(
        self,
        query: str,
        user: UserProfile,
        cand: Optional[CandidateProfile],
        anly: Optional[AnalyzeResponseData],
        safety_reminder: Optional[str],
        lang: str = "vi"
    ) -> ChatResponseData:
        lower = query.lower()

        if lang == "ja":
            cand_name = cand.name if cand else "相手"
            job = cand.job if cand else "お仕事"

            if any(k in lower for k in ["話しかけ", "きっかけ", "icebreaker", "最初", "はじめ", "挨拶"]):
                msg = (
                    f"**{cand_name}さん**のプロフィールを見ると、**{job}**という職業や自己紹介に書かれた"
                    f"ユニークな趣味を活かして自然に会話を始められそうですね。"
                )
                recs = [
                    f'「{cand_name}さん、プロフィールに書いてあった趣味、もっと聞かせてもらえますか？」',
                    f'「{job}のお仕事って、どんな一日を過ごすんですか？」',
                    "ポイント: YES/NOで終わらないオープンな質問をすると会話が続きやすいですよ。"
                ]
            elif any(k in lower for k in ["お金", "金銭", "収入", "財布", "経済"]):
                msg = (
                    f"⚠️ **Claraからのアドバイス**: {cand_name}さんのプロフィールにはお金の管理スタイルについての"
                    f"情報がまだ少ないです。これはデリケートなテーマなので、初回のデートで直接聞くのは避けましょう。"
                )
                recs = [
                    "待ち合わせ場所の選び方（カジュアルなカフェ？おしゃれなレストラン？）を観察してみて。",
                    "旅行や休日の過ごし方の話から、さりげなく価値観を確認できますよ。",
                    "お互いの経済的自立を尊重しながら関係を深めていきましょう。"
                ]
            elif any(k in lower for k in ["安全", "初デート", "場所", "どこ", "会う"]):
                msg = (
                    "初めて会うときは、安心・安全を最優先に！"
                )
                recs = [
                    "明るい時間帯に、人が多いカフェやショッピングモールを選びましょう。",
                    "初デートは1〜1.5時間程度が理想的。余韻を大切にしてみて。",
                    "交通手段は自分で用意して、信頼できる友人に予定を伝えておきましょう。"
                ]
            elif any(k in lower for k in ["聞く", "質問", "次", "話題", "デート"]):
                msg = (
                    f"お二人は真剣な交際という目標で共通していますね。"
                    f"ただ、**生活リズムや関係に使える時間の優先度**についてはもう少し確認しておくといいかもしれません。"
                )
                recs = [
                    f'「{job}のお仕事、最近は週末も忙しいですか？」と自然に聞いてみて。',
                    '「疲れた週の終わりは、一人でゆっくりしたい派？それともみんなで出かけたい派？」',
                    '「この街に長く住むつもりですか？将来の拠点はどう考えてますか？」'
                ]
            else:
                msg = (
                    f"{cand_name}さんのことを聞かせてくれてありがとうございます。全体的に見ると、"
                    f"お二人の価値観にはしっかりとした共通基盤がありそうです。"
                    f"実際に会って感じる自然な感情が、最終的に一番大切ですよ。"
                )
                recs = [
                    "積極的に相手の話を聞いて、周囲の人への接し方を観察してみましょう。",
                    "デート後に気づいたことをメモしておくと、Claraが相性マップを更新するのに役立ちます！"
                ]
        else:
            cand_name = cand.name if cand else "đối phương"
            job = cand.job if cand else "công việc hiện tại"

            if any(k in lower for k in ["mở đầu", "bắt đầu", "icebreaker", "chào"]):
                msg = (
                    f"Dựa trên hồ sơ của **{cand_name}**, bạn có thể tạo ấn tượng ban đầu bằng cách khai thác "
                    f"niềm đam mê sáng tạo trong nghề **{job}** hoặc sở thích độc đáo được nhắc tới trong bio."
                )
                recs = [
                    f'"Chào {cand_name}, mình thấy bạn nhắc tới sở thích làm gốm / nghệ thuật trong bio. Bạn hay tham gia workshop vào cuối tuần à?"',
                    f'"Thấy {cand_name} làm {job}, phong cách làm việc tối giản hay tự do sáng tạo hợp vibe bạn hơn?"',
                    "Mẹo: Hãy hỏi câu hỏi mở thay vì câu hỏi chỉ trả lời có/không để cuộc trò chuyện tự nhiên hơn."
                ]
            elif any(k in lower for k in ["tài chính", "tiền", "thu nhập", "tiêu tiền"]):
                msg = (
                    f"⚠️ **Lưu ý từ Clara**: Profile của {cand_name} hiện chưa có dữ liệu trực tiếp về phong cách quản lý tài chính cá nhân. "
                    f"Đây là chủ đề nhạy cảm, bạn không nên tra hỏi trực tiếp ở 1-2 buổi hẹn đầu."
                )
                recs = [
                    "Quan sát thói quen lựa chọn không gian hẹn (quán cafe bình dị hay nơi sang trọng).",
                    "Chia sẻ trước về quan điểm của bạn khi đi du lịch để đối phương cảm thấy thoải mái cởi mở.",
                    "Tôn trọng sự độc lập tài chính của nhau trong giai đoạn đầu tìm hiểu."
                ]
            elif any(k in lower for k in ["an toàn", "gặp mặt", "buổi hẹn đầu", "địa điểm", "ở đâu"]):
                msg = (
                    "Khi chuẩn bị cho buổi gặp gỡ đầu tiên, sự thoải mái và an toàn luôn là ưu tiên số một!"
                )
                recs = [
                    "Chọn một quán cafe có không gian mở, yên tĩnh vào ban ngày hoặc chiều cuối tuần.",
                    "Thời lượng buổi hẹn đầu lý tưởng là khoảng 1 - 1.5 tiếng để cả hai giữ được sự hào hứng.",
                    "Chủ động phương tiện đi lại cá nhân và thông báo cho người bạn thân biết lịch trình."
                ]
            elif any(k in lower for k in ["hỏi gì", "câu hỏi", "tiếp theo", "hẹn hò", "nói chuyện"]):
                msg = (
                    f"Hồ sơ của hai bạn có sự đồng điệu tốt về mục tiêu nghiêm túc. "
                    f"Tuy nhiên, điểm cần bạn làm rõ thêm là **nhịp sinh hoạt và mức độ ưu tiên thời gian cho mối quan hệ**."
                )
                recs = [
                    f'Hỏi khéo léo về nhịp sống: "Dạo này công việc {job} của bạn có chiếm nhiều thời gian cuối tuần không?"',
                    'Làm rõ giá trị cá nhân: "Khi cần nạp lại năng lượng sau tuần bận rộn, bạn thích ở một mình hay ra ngoài gặp gỡ?"',
                    'Tìm hiểu định hướng: "Bạn dự định gắn bó lâu dài tại thành phố này hay có kế hoạch dịch chuyển?"'
                ]
            else:
                msg = (
                    f"Tôi đã lắng nghe chia sẻ của bạn về {cand_name}. Nhìn chung, giữa bạn và đối phương "
                    f"có nền tảng giá trị sống khá tương đồng. Hãy giữ tâm thế cởi mở, không kỳ vọng quá mức, "
                    f"bởi vì cảm xúc chân thật khi tiếp xúc ngoài đời mới là yếu tố quyết định lớn nhất."
                )
                recs = [
                    "Lắng nghe tích cực: Chú ý đến cách đối phương phản ứng và đối xử với những người xung quanh.",
                    "Ghi nhận lại những điều thú vị mới biết được sau buổi hẹn để Clara hỗ trợ bạn cập nhật bản đồ tương thích!"
                ]

        return ChatResponseData(
            message=msg,
            recommendations=recs,
            safety_reminder=safety_reminder
        )


copilot_engine = CopilotEngine()
