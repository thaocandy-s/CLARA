import type { Candidate, UserProfile } from "../types";

export const userProfile: UserProfile = {
  name: "Hải Nam",
  age: 28,
  city: "Hà Nội",
  intent: "Nghiêm túc, kết hôn trong 2-3 năm",
  dealBreakers: ["Không hút thuốc lá", "Yêu động vật"],
  weights: [
    { key: "long_term_goals", label: "Mục tiêu dài hạn & Kế hoạch tương lai", value: 90 },
    { key: "core_values", label: "Giá trị sống & Đạo đức cốt lõi", value: 85 },
    { key: "communication", label: "Giao tiếp & Cân bằng cảm xúc", value: 80 },
    { key: "lifestyle_habits", label: "Lối sống & Thói quen sinh hoạt", value: 70 },
    { key: "interests", label: "Sở thích giải trí & Hoạt động chung", value: 60 },
  ],
};

export const candidates: Candidate[] = [
  {
    id: "cand_01",
    name: "Mai Linh",
    age: 26,
    job: "Product Designer",
    location: "TP. Hồ Chí Minh",
    distanceKm: 4,
    bio: "Thích những buổi sáng cà phê ngắm phố xá và cuối tuần đi workshop làm gốm. Tìm một người biết lắng nghe, tôn trọng không gian riêng và cùng nhau hoàn thiện bản thân.",
    tags: ["🌱 Không hút thuốc", "🎨 Nghệ thuật & Gốm", "☕ Specialty Coffee", "📚 Đọc sách phát triển"],
    gradient: "radial-gradient(circle at 50% 35%, #ec4899 0%, #312e81 60%, #0f172a 100%)",
    overallCompatibility: 81,
    dataCompleteness: 74,
    confidenceLabel: "Tin cậy khá (dựa trên 24 câu hỏi & Bio, thiếu dữ liệu tài chính)",
    matchLabel: "Độ khớp cao",
    matchBadgeTone: "match",
    aiQuickSummary: {
      positive: "Gu thẩm mỹ, lối sống lành mạnh, tôn trọng ranh giới cá nhân.",
      question: "Cân bằng thời gian khi công việc bận rộn.",
    },
    compareRows: [
      { label: "Mục tiêu mối quan hệ", userValue: "Nghiêm túc, kết hôn trong 2-3 năm", targetValue: "Tìm hiểu lâu dài, cùng phát triển" },
      { label: "Ranh giới / Non-negotiables", userValue: "Không hút thuốc, yêu động vật", targetValue: "Không thuốc lá, thích chó mèo" },
      { label: "Nhịp sống & Cuối tuần", userValue: "Cà phê sáng, chạy bộ, nghỉ ngơi", targetValue: "Làm gốm, cafe sách, workshop" },
      { label: "Kế hoạch tương lai / Định cư", userValue: "Ổn định tại TP.HCM", targetValue: "Chưa nêu rõ (Cần xác nhận)", needsConfirmation: true },
    ],
    radarAxes: [
      { key: "long_term_goals", label: "Mục tiêu lâu dài", value: 85 },
      { key: "core_values", label: "Giá trị sống", value: 90 },
      { key: "communication", label: "Giao tiếp", value: 80 },
      { key: "lifestyle_habits", label: "Lối sống & Thói quen", value: 85 },
      { key: "interests", label: "Sở thích & Giải trí", value: 75 },
      { key: "finances", label: "Tài chính & Thực tế", value: 65 },
      { key: "future_plans", label: "Kế hoạch tương lai", value: 70 },
    ],
    checklist: {
      matched: [
        { title: "Lối sống lành mạnh", detail: "Cả hai đều không hút thuốc lá và ưa thích các hoạt động ban ngày.", sourceEvidence: "Câu hỏi khảo sát hồ sơ", tag: "Khớp 100%" },
        { title: "Ranh giới cá nhân", detail: "Đều coi trọng việc cho nhau không gian riêng và nuôi dưỡng đam mê cá nhân.", sourceEvidence: "Phân tích Bio & Trả lời trắc nghiệm", tag: "Khớp 90%" },
      ],
      needsCheck: [
        { title: "Kế hoạch thời gian & Gia đình", detail: "Bạn muốn hướng tới kết hôn trong 2-3 năm; Linh chưa đề cập mốc thời gian cụ thể.", sourceEvidence: "Hồ sơ chưa điền mục này", tag: "Chưa đủ dữ liệu" },
        { title: "Phong cách chi tiêu", detail: "Chưa có thông tin về quan điểm tiết kiệm vs trải nghiệm hiện tại.", sourceEvidence: "Nên cảm nhận qua cách chọn địa điểm hẹn", tag: "Cần quan sát" },
      ],
      potentialFriction: [
        { title: "Áp lực thời gian công việc", detail: "Linh đang ở giai đoạn startup bận rộn; có thể không duy trì được nhắn tin liên tục mỗi ngày.", sourceEvidence: 'Bio "Đang chạy nước rút cho startup"', tag: "Lưu ý" },
      ],
    },
    icebreakers: [
      "Chào Linh, anh thấy em nhắc tới gốm thủ công trong bio. Em hay đi workshop vào dịp cuối tuần à, có chỗ nào thú vị gợi ý anh với?",
      "Anh cũng rất thích phong cách thiết kế tối giản. Điều gì khiến em chọn gắn bó với mảng Product Design vậy?",
    ],
    probingQuestions: [
      "Khi công việc dồn dập, em thường xả stress bằng cách nào: muốn ở một mình hay trò chuyện với ai đó?",
      "Em có hình dung rõ về cuộc sống gia đình trong 3-5 năm tới chưa?",
      "Đối với em, sự tôn trọng không gian riêng tư được thể hiện cụ thể ra sao?",
    ],
    chatHistory: [
      {
        id: "m1",
        sender: "agent",
        text: 'Xin chào Hải Nam! Tôi đã hoàn thành quét nhanh độ khớp giữa bạn và <strong>Mai Linh</strong> dựa trên 8 tiêu chí trọng tâm của bạn.<br/><br/>🎉 <strong>Điểm sáng:</strong> Hai bạn đều thuộc tuýp người hướng nội vừa phải, thích lối sống lành mạnh (không hút thuốc) và đều trân trọng sự nghiệp riêng nhưng mong muốn xây dựng mối quan hệ nghiêm túc.',
        recommendation: {
          title: "Gợi ý mở đầu trò chuyện (Icebreaker)",
          items: [
            '"Chào Linh, anh thấy em nhắc tới gốm thủ công trong bio. Em hay đi workshop vào dịp cuối tuần à, có chỗ nào thú vị gợi ý anh với?"',
            '"Anh cũng rất thích phong cách thiết kế tối giản. Điều gì khiến em chọn gắn bó với mảng Product Design vậy?"',
          ],
        },
      },
      {
        id: "m2",
        sender: "user",
        text: "Agent xem giúp mình: Linh có điểm gì khác biệt lớn có thể trở thành rào cản (deal-breaker) không?",
      },
      {
        id: "m3",
        sender: "agent",
        text: 'Tôi không thấy dấu hiệu xung đột nghiêm trọng (deal-breaker) về lối sống hay đạo đức. Tuy nhiên, có <strong>2 điểm cần làm rõ</strong>:<br/><br/>1. <strong>Cân bằng thời gian:</strong> Linh làm tại một startup đang ở giai đoạn tăng trưởng nhanh. Đôi khi có thể phải OT hoặc làm việc vào thứ Bảy.<br/>2. <strong>Kế hoạch kết hôn:</strong> Bạn mong muốn ổn định trong 2-3 năm tới, còn hồ sơ của Linh mới dừng ở mức "Tìm hiểu lâu dài, tùy duyên".',
        recommendation: {
          title: "3 câu hỏi sâu nên hỏi trong 2 buổi hẹn đầu",
          items: [
            '"Khi công việc dồn dập, em thường xả stress bằng cách nào: muốn ở một mình hay trò chuyện với ai đó?"',
            '"Em có hình dung rõ về cuộc sống gia đình trong 3-5 năm tới chưa?"',
            '"Đối với em, sự tôn trọng không gian riêng tư được thể hiện cụ thể ra sao?"',
          ],
        },
      },
    ],
    stage: "chatting",
    stageLabel: "Đang nhắn tin",
    savedLabel: "Cập nhật 2 giờ trước",
    notes: [
      { id: "n1", timeLabel: "Hôm qua lúc 21:30 · Ghi nhận bởi bạn", author: "user", text: "Linh phản hồi tin nhắn rất lịch thiệp, đồng ý đi workshop làm gốm vào chiều thứ Bảy tuần này tại Thảo Điền." },
      { id: "n2", timeLabel: "3 ngày trước · Khởi tạo phân tích ban đầu", author: "system", text: "Khớp về sở thích nghệ thuật và lối sống lành mạnh; cần xác nhận kế hoạch tương lai dài hạn khi gặp mặt trực tiếp." },
    ],
    nextDatePlan: {
      title: "Workshop Làm gốm & Cafe Thảo Điền",
      detail: "Thời gian: Chiều thứ Bảy, 15:00. Không gian sáng tạo, ít áp lực phỏng vấn đối mặt, giúp cả hai dễ dàng mở lòng tự nhiên.",
    },
  },
  {
    id: "cand_02",
    name: "Tuấn Anh",
    age: 29,
    job: "Bác sĩ nội trú",
    location: "Hà Nội",
    distanceKm: 8,
    bio: "Công việc có những ca trực đêm bận rộn nhưng khi ở nhà tôi thích nấu ăn và chạy bộ cự ly dài. Tìm người độc lập, có thế giới riêng và thích sự ổn định.",
    tags: ["🏃 Chạy Marathon", "🍳 Nấu ăn", "🐱 Nuôi 1 chú mèo"],
    gradient: "radial-gradient(circle at 50% 35%, #06b6d4 0%, #1e1b4b 60%, #0b0e17 100%)",
    overallCompatibility: 72,
    dataCompleteness: 68,
    confidenceLabel: "Tin cậy trung bình (dựa trên 18 câu hỏi hồ sơ)",
    matchLabel: "Khác biệt lịch trình",
    matchBadgeTone: "check",
    aiQuickSummary: {
      positive: "Tinh thần trách nhiệm cao, hướng tới mối quan hệ lâu dài.",
      question: "Lịch làm việc theo ca có thể cần bạn là người chủ động thích ứng thời gian.",
    },
    compareRows: [
      { label: "Mục tiêu mối quan hệ", userValue: "Nghiêm túc, kết hôn trong 2-3 năm", targetValue: "Tìm sự ổn định lâu dài" },
      { label: "Ranh giới / Non-negotiables", userValue: "Không hút thuốc, yêu động vật", targetValue: "Không thuốc lá, nuôi mèo" },
      { label: "Nhịp sống & Cuối tuần", userValue: "Cà phê sáng, chạy bộ, nghỉ ngơi", targetValue: "Trực đêm, nấu ăn, chạy bộ dài" },
      { label: "Kế hoạch tương lai / Định cư", userValue: "Ổn định tại TP.HCM", targetValue: "Chưa nêu rõ (Cần xác nhận)", needsConfirmation: true },
    ],
    radarAxes: [
      { key: "long_term_goals", label: "Mục tiêu lâu dài", value: 78 },
      { key: "core_values", label: "Giá trị sống", value: 75 },
      { key: "communication", label: "Giao tiếp", value: 65 },
      { key: "lifestyle_habits", label: "Lối sống & Thói quen", value: 55 },
      { key: "interests", label: "Sở thích & Giải trí", value: 70 },
      { key: "finances", label: "Tài chính & Thực tế", value: 72 },
      { key: "future_plans", label: "Kế hoạch tương lai", value: 68 },
    ],
    checklist: {
      matched: [
        { title: "Định hướng nghiêm túc", detail: "Cả hai đều tìm kiếm một mối quan hệ ổn định lâu dài.", sourceEvidence: "Câu hỏi khảo sát hồ sơ", tag: "Khớp 85%" },
      ],
      needsCheck: [
        { title: "Nhịp sinh hoạt ngày/đêm", detail: "Lịch trực đêm của Tuấn Anh có thể lệch với nhịp sinh hoạt ban ngày của bạn.", sourceEvidence: "Bio: ca trực đêm bận rộn", tag: "Cần quan sát" },
      ],
      potentialFriction: [
        { title: "Thời gian dành cho nhau", detail: "Lịch làm việc theo ca có thể khiến việc lên kế hoạch hẹn hò khó khăn hơn.", sourceEvidence: "Bio & đặc thù nghề bác sĩ nội trú", tag: "Lưu ý" },
      ],
    },
    icebreakers: [
      "Nghe nói bác sĩ nội trú lịch trực dày lắm, anh vẫn giữ được thói quen chạy bộ đường dài à, bí quyết là gì vậy?",
    ],
    probingQuestions: [
      "Lịch trực đêm của anh thường rơi vào ngày nào trong tuần?",
      "Anh cân bằng giữa công việc áp lực cao và đời sống cá nhân như thế nào?",
    ],
    chatHistory: [
      {
        id: "m1",
        sender: "agent",
        text: "Xin chào Hải Nam! Đây là bản phân tích nhanh giữa bạn và <strong>Tuấn Anh</strong>. Điểm cần lưu ý nhất là sự khác biệt nhịp sinh hoạt do đặc thù công việc bác sĩ nội trú.",
      },
    ],
    stage: "met-once",
    stageLabel: "Đã hẹn cafe lần 1",
    savedLabel: "Cập nhật 2 ngày trước",
    notes: [
      { id: "n1", timeLabel: "2 ngày trước · Khởi tạo phân tích ban đầu", author: "system", text: "Khớp về định hướng nghiêm túc; cần quan sát thêm về khả năng sắp xếp thời gian gặp gỡ đều đặn." },
    ],
    nextDatePlan: {
      title: "Cafe sáng cuối tuần gần bệnh viện",
      detail: "Chọn khung giờ linh hoạt theo lịch trực của Tuấn Anh, ưu tiên buổi sáng để cả hai đều tỉnh táo.",
    },
  },
  {
    id: "cand_03",
    name: "Minh Châu",
    age: 27,
    job: "Content Strategist",
    location: "Hà Nội",
    distanceKm: 3,
    bio: "Thích nhạc Acoustic, camping vào mùa thu và trò chuyện sâu về tâm lý học. Tin rằng một mối quan hệ bền vững bắt đầu từ sự tôn trọng và chân thành.",
    tags: ["⛺ Camping", "🎸 Acoustic", "🧘 Mindfulness"],
    gradient: "radial-gradient(circle at 50% 35%, #8b5cf6 0%, #1e1b4b 60%, #0a0d14 100%)",
    overallCompatibility: 84,
    dataCompleteness: 82,
    confidenceLabel: "Tin cậy cao (dựa trên 28 câu hỏi & Bio chi tiết)",
    matchLabel: "Giá trị tương đồng",
    matchBadgeTone: "match",
    aiQuickSummary: {
      positive: "Phong cách giao tiếp cảm xúc, sở thích outdoor cuối tuần.",
      question: "Kế hoạch tài chính cá nhân trong 3 năm tới.",
    },
    compareRows: [
      { label: "Mục tiêu mối quan hệ", userValue: "Nghiêm túc, kết hôn trong 2-3 năm", targetValue: "Xây dựng mối quan hệ bền vững, chân thành" },
      { label: "Ranh giới / Non-negotiables", userValue: "Không hút thuốc, yêu động vật", targetValue: "Không thuốc lá" },
      { label: "Nhịp sống & Cuối tuần", userValue: "Cà phê sáng, chạy bộ, nghỉ ngơi", targetValue: "Camping, nghe nhạc Acoustic" },
      { label: "Kế hoạch tương lai / Định cư", userValue: "Ổn định tại TP.HCM", targetValue: "Cân nhắc định cư dài hạn khác", needsConfirmation: true },
    ],
    radarAxes: [
      { key: "long_term_goals", label: "Mục tiêu lâu dài", value: 80 },
      { key: "core_values", label: "Giá trị sống", value: 92 },
      { key: "communication", label: "Giao tiếp", value: 90 },
      { key: "lifestyle_habits", label: "Lối sống & Thói quen", value: 82 },
      { key: "interests", label: "Sở thích & Giải trí", value: 88 },
      { key: "finances", label: "Tài chính & Thực tế", value: 60 },
      { key: "future_plans", label: "Kế hoạch tương lai", value: 62 },
    ],
    checklist: {
      matched: [
        { title: "Giao tiếp cảm xúc cởi mở", detail: "Cả hai đều coi trọng những cuộc trò chuyện sâu sắc và chân thành.", sourceEvidence: "Bio & khảo sát phong cách giao tiếp", tag: "Khớp 95%" },
        { title: "Sở thích hoạt động ngoài trời", detail: "Đều thích các hoạt động cuối tuần gắn với thiên nhiên.", sourceEvidence: "Bio: camping mùa thu", tag: "Khớp 88%" },
      ],
      needsCheck: [
        { title: "Kế hoạch tài chính cá nhân", detail: "Chưa rõ quan điểm chi tiêu/tiết kiệm trong 3 năm tới.", sourceEvidence: "Hồ sơ chưa điền mục tài chính", tag: "Chưa đủ dữ liệu" },
      ],
      potentialFriction: [
        { title: "Định hướng nơi định cư dài hạn", detail: "Châu đang cân nhắc khả năng định cư ở nơi khác, khác với mong muốn ổn định tại TP.HCM của bạn.", sourceEvidence: "Câu hỏi khảo sát: kế hoạch định cư", tag: "Lưu ý" },
      ],
    },
    icebreakers: [
      "Nghe nói em thích camping mùa thu, có địa điểm nào ở gần Hà Nội em muốn quay lại nhất không?",
    ],
    probingQuestions: [
      "Em hình dung nơi mình sẽ sống ổn định lâu dài ở đâu?",
      "Quan điểm của em về việc tiết kiệm cho tương lai như thế nào?",
    ],
    chatHistory: [
      {
        id: "m1",
        sender: "agent",
        text: "Xin chào Hải Nam! Bạn và <strong>Minh Châu</strong> có độ tương đồng giá trị sống rất cao. Điểm cần trao đổi thêm là kế hoạch định cư dài hạn.",
      },
    ],
    stage: "matched",
    stageLabel: "Mới kết nối",
    savedLabel: "Đã lưu 3 ngày trước",
    notes: [
      { id: "n1", timeLabel: "3 ngày trước · Khởi tạo phân tích ban đầu", author: "system", text: "Đồng điệu cao về giá trị sống và giao tiếp; cần xác nhận thêm định hướng nơi ở lâu dài." },
    ],
    nextDatePlan: {
      title: "Cafe nhạc Acoustic cuối tuần",
      detail: "Không gian ấm cúng, dễ trò chuyện sâu, phù hợp với phong cách giao tiếp cảm xúc của cả hai.",
    },
  },
];

export const getCandidateInitials = (name: string) =>
  name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
