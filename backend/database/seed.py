"""
Seed dữ liệu mẫu ban đầu vào SQLite DB.
Idempotent: Chỉ insert khi bảng candidates còn trống.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..models.orm.candidate_orm import CandidateORM
from ..models.orm.user_orm import UserORM
from ..models.orm.observation_orm import ObservationORM


async def seed_initial_data(db: AsyncSession) -> None:
    """Insert dữ liệu mẫu nếu DB còn trống."""
    count = await db.scalar(select(func.count()).select_from(CandidateORM))
    if count and count > 0:
        return  # Đã có dữ liệu, bỏ qua

    # ─── Candidates Tiếng Việt ─────────────────────────────────────────────
    candidates_vi = [
        CandidateORM(
            candidate_id="cand_01",
            lang="vi",
            name="Mai Linh",
            age=26,
            job="Product Designer",
            location="TP.HCM",
            distance_km=3.2,
            avatar_gradient="radial-gradient(circle at 50% 30%, #f472b6 0%, #e11d48 60%, #4c0519 100%)",
            bio="Thích làm gốm Bát Tràng cuối tuần, yêu mèo. Đang chạy nước rút cho một dự án startup công nghệ. Thích lối sống tối giản, uống kombucha.",
            tags=["Làm gốm", "Yêu mèo", "Startup UI/UX", "Tối giản", "Kombucha"],
            quick_ai_summary="Đồng điệu về gu thẩm mỹ & nhịp sống; cần làm rõ mức độ bận rộn từ dự án startup.",
            questionnaire={
                "relationship_goal": "Tìm hiểu lâu dài, cùng nhau phát triển",
                "smoking": "Không hút thuốc",
                "pets": "Rất thích chó mèo",
                "weekend_habit": "Workshop làm gốm, cafe sách, thiết kế",
                "future_plan": None,
                "financial_view": None,
                "communication_style": "Thẳng thắn, tôn trọng không gian riêng",
                "children_view": "Chưa quyết định, muốn ổn định sự nghiệp trước",
            },
        ),
        CandidateORM(
            candidate_id="cand_02",
            lang="vi",
            name="Tuấn Anh",
            age=29,
            job="Bác sĩ nội trú",
            location="TP.HCM",
            distance_km=4.8,
            avatar_gradient="radial-gradient(circle at 50% 30%, #38bdf8 0%, #0284c7 60%, #082f49 100%)",
            bio="Bác sĩ tim mạch, thích chạy bộ đêm và nghe podcast khoa học. Cuối tuần thường phải trực cấp cứu nhưng luôn trân trọng từng khoảnh khắc gia đình.",
            tags=["Bác sĩ", "Trực đêm", "Chạy bộ", "Yêu gia đình", "Podcast"],
            quick_ai_summary="Giá trị sống rất nhân văn & chân thành; khác biệt về nhịp sinh hoạt ngày/đêm.",
            questionnaire={
                "relationship_goal": "Tìm kiếm người bạn đời thấu hiểu và cùng xây dựng tổ ấm",
                "smoking": "Không hút thuốc",
                "pets": "Thích chó, nhưng hiện tại ít thời gian chăm sóc",
                "weekend_habit": "Trực bệnh viện hoặc ngủ bù, cafe gần nhà",
                "future_plan": "Định cư lâu dài tại TP.HCM, muốn lập gia đình trong 2-3 năm tới",
                "financial_view": "Ưu tiên tích lũy an toàn và đầu tư dài hạn",
                "communication_style": "Điềm đạm, lắng nghe, ít nhắn tin nhanh",
                "children_view": "Muốn có 1-2 con khi công việc ổn định",
            },
        ),
        CandidateORM(
            candidate_id="cand_03",
            lang="vi",
            name="Minh Châu",
            age=27,
            job="Content Lead",
            location="TP.HCM",
            distance_km=2.1,
            avatar_gradient="radial-gradient(circle at 50% 30%, #a855f7 0%, #7c3aed 60%, #3b0764 100%)",
            bio="Yêu viết lách, chụp phim analog và du lịch tự túc. Có kế hoạch đi du học hoặc làm việc remote tại châu Âu trong 1 năm tới.",
            tags=["Chụp phim", "Viết lách", "Du lịch bụi", "Định cư nước ngoài", "Work from anywhere"],
            quick_ai_summary="Dữ liệu rất đầy đủ (82%); có khác biệt lớn về kế hoạch định cư dài hạn.",
            questionnaire={
                "relationship_goal": "Tìm người đồng điệu về tâm hồn, không gò bó truyền thống",
                "smoking": "Hút thuốc xã giao (social smoker)",
                "pets": "Nuôi 2 chú mèo Anh lông ngắn",
                "weekend_habit": "Lang thang săn ảnh film, đọc tiểu thuyết",
                "future_plan": "Dự định làm việc remote ở nước ngoài 1-2 năm",
                "financial_view": "Tự do tài chính, chi tiêu cho trải nghiệm du lịch",
                "communication_style": "Cởi mở, thích thảo luận sâu về triết học & nghệ thuật",
                "children_view": "Chưa có ý định sinh con",
            },
        ),
    ]

    # ─── Candidates Tiếng Nhật ─────────────────────────────────────────────
    candidates_ja = [
        CandidateORM(
            candidate_id="cand_jp_01",
            lang="ja",
            name="田中 ゆき (Yuki Tanaka)",
            age=25,
            job="グラフィックデザイナー",
            location="東京・渋谷",
            distance_km=2.4,
            avatar_gradient="radial-gradient(circle at 50% 30%, #f9a8d4 0%, #ec4899 60%, #831843 100%)",
            bio="陶芸とカフェ巡りが好き。週末は代官山でスケッチしてることが多いです。猫2匹と一緒に暮らしてます。ミニマリスト生活実践中。",
            tags=["陶芸", "猫好き", "ミニマリスト", "デザイン", "カフェ巡り"],
            quick_ai_summary="美的センスとライフスタイルの共鳴が高い。スタートアップの忙しさについて要確認。",
            questionnaire={
                "relationship_goal": "長期的なパートナーシップ、共に成長したい",
                "smoking": "吸わない",
                "pets": "猫2匹飼っている、大好き",
                "weekend_habit": "陶芸ワークショップ、カフェで読書、スケッチ",
                "future_plan": None,
                "financial_view": None,
                "communication_style": "率直で、個人の空間を大切にする",
                "children_view": "まだ決めていない、まずはキャリアを安定させたい",
            },
        ),
        CandidateORM(
            candidate_id="cand_jp_02",
            lang="ja",
            name="佐藤 はると (Haruto Sato)",
            age=30,
            job="内科医（研修医）",
            location="東京・新宿",
            distance_km=3.8,
            avatar_gradient="radial-gradient(circle at 50% 30%, #7dd3fc 0%, #0284c7 60%, #082f49 100%)",
            bio="心臓内科医。夜ランニングと科学系ポッドキャストが趣味。週末は当直が多いけど、家族との時間を何より大切にしてます。",
            tags=["医師", "夜勤あり", "ランニング", "家族思い", "ポッドキャスト"],
            quick_ai_summary="非常に誠実で人間的な価値観。生活リズムの違い（昼夜逆転）に注意が必要。",
            questionnaire={
                "relationship_goal": "心から理解し合える人生のパートナーを探している",
                "smoking": "吸わない",
                "pets": "犬が好き、でも今は世話する時間がない",
                "weekend_habit": "病院当直か睡眠補充、近所のカフェでゆっくり",
                "future_plan": "東京に長く住む予定、2〜3年以内に結婚したい",
                "financial_view": "安全な貯蓄と長期投資を優先",
                "communication_style": "穏やか、聞き上手、メッセージの返信はゆっくり目",
                "children_view": "仕事が落ち着いたら1〜2人欲しい",
            },
        ),
        CandidateORM(
            candidate_id="cand_jp_03",
            lang="ja",
            name="中村 みさき (Misaki Nakamura)",
            age=28,
            job="コンテンツプロデューサー",
            location="東京・中目黒",
            distance_km=1.7,
            avatar_gradient="radial-gradient(circle at 50% 30%, #c4b5fd 0%, #7c3aed 60%, #3b0764 100%)",
            bio="写真と旅が大好き。フィルムカメラでストリートスナップを撮ってます。来年はヨーロッパでリモートワークに挑戦したい！",
            tags=["フィルム写真", "旅好き", "バックパッカー", "海外志向", "リモートワーク"],
            quick_ai_summary="データ充実度高め(82%)。長期的な居住地・将来設計に大きな違いあり、要確認。",
            questionnaire={
                "relationship_goal": "魂で通じ合える人を探している、型にはまらない関係性",
                "smoking": "社交的に吸うことがある（ソーシャルスモーカー）",
                "pets": "英国短毛種の猫を2匹飼っている",
                "weekend_habit": "フィルム写真の街歩き、小説を読む",
                "future_plan": "1〜2年海外でリモートワークする予定",
                "financial_view": "経済的自由を目指し、旅や体験にお金を使う",
                "communication_style": "オープンで哲学・アートについて深く話すのが好き",
                "children_view": "子どもを持つつもりはない",
            },
        ),
    ]

    # ─── Users ─────────────────────────────────────────────────────────────
    users = [
        UserORM(
            user_id="usr_001",
            name="Hải Nam",
            age=28,
            lang="vi",
            relationship_goal="Nghiêm túc, kết hôn trong 2-3 năm",
            deal_breakers=["Không hút thuốc lá", "Yêu động vật"],
            lifestyle="Dậy sớm, chạy bộ, cafe sáng, coi trọng sự nghiệp",
            dimension_weights={
                "long_term_goals": 0.90,
                "core_values": 0.85,
                "communication": 0.80,
                "lifestyle_habits": 0.70,
                "interests": 0.60,
                "finances": 0.75,
                "future_plans": 0.85,
            },
            private_incognito=False,
        ),
        UserORM(
            user_id="usr_002",
            name="山本 健司 (Kenji Yamamoto)",
            age=29,
            lang="ja",
            relationship_goal="真剣なお付き合い、2〜3年以内に結婚も視野に",
            deal_breakers=["喫煙者NG", "動物好きな人が理想"],
            lifestyle="早起き、朝ランニング、コーヒー好き、仕事熱心",
            dimension_weights={
                "long_term_goals": 0.90,
                "core_values": 0.85,
                "communication": 0.80,
                "lifestyle_habits": 0.70,
                "interests": 0.60,
                "finances": 0.75,
                "future_plans": 0.85,
            },
            private_incognito=False,
        ),
    ]

    # ─── Observations mẫu ──────────────────────────────────────────────────
    observations = [
        ObservationORM(
            candidate_id="cand_01",
            user_id="usr_001",
            content="Linh có gu thẩm mỹ rất tinh tế, thích nói về triết lý sản phẩm. Buổi gặp ngắn nhưng khá thoải mái.",
            time_str="14:30 Hôm qua · Ghi nhận bởi bạn",
        ),
        ObservationORM(
            candidate_id="cand_jp_01",
            user_id="usr_002",
            content="ゆきさんは美的センスがとても繊細で、プロダクト哲学について話すのが好きみたい。短い出会いだったけどとても居心地よかった。",
            time_str="昨日14:30 · あなたが記録",
        ),
    ]

    # ─── Bulk insert ────────────────────────────────────────────────────────
    db.add_all(candidates_vi + candidates_ja)
    db.add_all(users)
    await db.flush()  # Flush để FK constraints hoạt động
    db.add_all(observations)
    await db.commit()

    print("[OK] Seed data inserted successfully.")
