-- Catalog seed: 3 candidates × vi/ja. No per-user analysis rows.

INSERT INTO candidates (id, age, distance_km, gradient, created_at) VALUES
  (
    'cand_01',
    26,
    4,
    'radial-gradient(circle at 50% 35%, #ec4899 0%, #312e81 60%, #0f172a 100%)',
    '2026-01-01T00:00:00.000Z'
  ),
  (
    'cand_02',
    29,
    8,
    'radial-gradient(circle at 50% 35%, #06b6d4 0%, #1e1b4b 60%, #0b0e17 100%)',
    '2026-01-01T00:00:00.000Z'
  ),
  (
    'cand_03',
    27,
    3,
    'radial-gradient(circle at 50% 35%, #8b5cf6 0%, #1e1b4b 60%, #0a0d14 100%)',
    '2026-01-01T00:00:00.000Z'
  );

INSERT INTO candidate_i18n (
  candidate_id, locale, name, job, location, bio, tags_json, questionnaire_json
) VALUES
(
  'cand_01',
  'vi',
  'Mai Linh',
  'Product Designer',
  'TP. Hồ Chí Minh',
  'Thích những buổi sáng cà phê ngắm phố xá và cuối tuần đi workshop làm gốm. Tìm một người biết lắng nghe, tôn trọng không gian riêng và cùng nhau hoàn thiện bản thân.',
  '["🌱 Không hút thuốc","🎨 Nghệ thuật & Gốm","☕ Specialty Coffee","📚 Đọc sách phát triển"]',
  '{"relationship_goal":"Tìm hiểu lâu dài, cùng nhau phát triển","smoking":"Không hút thuốc","pets":"Rất thích chó mèo","weekend_habit":"Workshop làm gốm, cafe sách, thiết kế","future_plan":null,"financial_view":null}'
),
(
  'cand_01',
  'ja',
  'マイ リン',
  'プロダクトデザイナー',
  'ホーチミン市',
  '街並みを眺めながらのモーニングコーヒーと、週末の陶芸ワークショップが好き。人の話をよく聞き、個人の空間を尊重しながら、一緒に成長できる人を探しています。',
  '["🌱 禁煙","🎨 アート・陶芸","☕ スペシャルティコーヒー","📚 自己啓発の読書"]',
  '{"relationship_goal":"長期的に向き合い、ともに成長したい","smoking":"吸わない","pets":"犬や猫が好き","weekend_habit":"陶芸ワークショップ、ブックカフェ、デザイン","future_plan":null,"financial_view":null}'
),
(
  'cand_02',
  'vi',
  'Tuấn Anh',
  'Bác sĩ nội trú',
  'Hà Nội',
  'Công việc có những ca trực đêm bận rộn nhưng khi ở nhà tôi thích nấu ăn và chạy bộ cự ly dài. Tìm người độc lập, có thế giới riêng và thích sự ổn định.',
  '["🏃 Chạy Marathon","🍳 Nấu ăn","🐱 Nuôi 1 chú mèo"]',
  '{"relationship_goal":"Tìm sự ổn định lâu dài","smoking":"Không hút thuốc","pets":"Nuôi mèo","weekend_habit":"Trực đêm, nấu ăn, chạy bộ dài","future_plan":null,"financial_view":null}'
),
(
  'cand_02',
  'ja',
  'トゥアン アイン',
  '研修医',
  'ハノイ',
  '夜勤で忙しい仕事ですが、家にいるときは料理と長距離ランニングが好きです。自立していて自分の世界を持ち、安定した関係を望む人を探しています。',
  '["🏃 マラソン","🍳 料理","🐱 猫を1匹飼っている"]',
  '{"relationship_goal":"長期的に安定した関係","smoking":"吸わない","pets":"猫を飼っている","weekend_habit":"夜勤、料理、長距離走","future_plan":null,"financial_view":null}'
),
(
  'cand_03',
  'vi',
  'Minh Châu',
  'Content Strategist',
  'Hà Nội',
  'Thích nhạc Acoustic, camping vào mùa thu và trò chuyện sâu về tâm lý học. Tin rằng một mối quan hệ bền vững bắt đầu từ sự tôn trọng và chân thành.',
  '["⛺ Camping","🎸 Acoustic","🧘 Mindfulness"]',
  '{"relationship_goal":"Xây dựng mối quan hệ bền vững, chân thành","smoking":"Không hút thuốc","pets":null,"weekend_habit":"Camping, nghe nhạc Acoustic","future_plan":"Cân nhắc định cư dài hạn khác","financial_view":null}'
),
(
  'cand_03',
  'ja',
  'ミン チャウ',
  'コンテンツストラテジスト',
  'ハノイ',
  'アコースティック音楽、秋のキャンプ、心理学についての深い会話が好き。持続可能な関係は尊重と誠実さから始まると信じています。',
  '["⛺ キャンプ","🎸 アコースティック","🧘 マインドフルネス"]',
  '{"relationship_goal":"尊重と誠実さに基づく持続的な関係","smoking":"吸わない","pets":null,"weekend_habit":"キャンプ、アコースティック音楽","future_plan":"別の土地での長期居住を検討","financial_view":null}'
);
