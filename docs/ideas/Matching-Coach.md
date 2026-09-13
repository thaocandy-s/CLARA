## Concept: Dating Compatibility Agent

Một AI agent hỗ trợ người dùng đánh giá độ phù hợp với một đối tượng hẹn hò trước khi quyết định match. Agent không thay người dùng quyết định hay “chấm điểm con người”, mà giúp họ nhìn rõ điểm chung, khác biệt, thông tin còn thiếu và các câu hỏi nên trao đổi.

### Luồng chính

1. User xem danh sách profile được gợi ý và chọn một người muốn tìm hiểu.
2. User bấm “Phân tích độ phù hợp” để vào không gian riêng với Agent.
3. Agent dùng thông tin profile của hai bên, kết hợp với ưu tiên do user cung cấp, để phân tích ban đầu.
4. Màn hình gồm:
   - Chat với Agent để làm rõ mục tiêu, giá trị, nhu cầu và điều không thể thỏa hiệp.
   - Checklist trực quan: phù hợp, cần xác nhận thêm, hoặc có khác biệt cần cân nhắc.
   - Compatibility Map/biểu đồ: mục tiêu dài hạn, giá trị sống, giao tiếp, lối sống, sở thích, tính thực tế, kế hoạch tương lai và deal-breakers.
   - Mức độ tin cậy/độ đầy đủ dữ liệu, tránh tạo cảm giác kết luận chắc chắn khi chưa đủ thông tin.
5. Agent gợi ý điểm chung để mở đầu, câu hỏi tiếp theo, ý tưởng gặp mặt, và những chủ đề cần làm rõ.
6. Khi user thấy khả quan, họ chủ động bấm Match hoặc gửi lời mời kết nối.

### Sau khi hai người bắt đầu trò chuyện

Agent không đọc, nghe lén hoặc tự can thiệp vào cuộc trò chuyện thật giữa hai người.

User có thể vào mục **Profiles I’m Exploring / My Analyses** để mở lại từng đối tượng đã phân tích, tiếp tục chat với Agent và tự cập nhật các thông tin mới học được. Agent sẽ cập nhật checklist, biểu đồ, các điểm cần chú ý và câu hỏi tiếp theo.

### Giá trị sản phẩm

Các dating app hiện nay thường giúp user tìm profile và bắt đầu cuộc trò chuyện, nhưng chưa thực sự hỗ trợ họ đánh giá liệu một kết nối có đáng để đầu tư thời gian và cảm xúc hay không.

Agent giúp user:

- Không chỉ match theo ảnh, bio hoặc cảm tính ban đầu.
- Nhận biết sớm các giá trị chung và khác biệt quan trọng.
- Biết cần hỏi gì thay vì trò chuyện chung chung.
- Giảm quá tải khi có nhiều lựa chọn.
- Ra quyết định match chủ động và có căn cứ hơn.

Định vị phù hợp:

> Một decision-support copilot cho dating: hỗ trợ user khám phá mức độ tương thích một cách minh bạch, có chủ đích và an toàn.

### Rủi ro cần xử lý

- Phân tích sai vì dữ liệu thiếu hoặc profile không phản ánh đầy đủ con người thật.
- AI tạo cảm giác chắc chắn giả hoặc gây áp lực phải match.
- Thiên kiến văn hóa, lối sống, giới tính hoặc chuẩn mực quan hệ.
- Dữ liệu cá nhân và thông tin tình cảm rất nhạy cảm.
- Agent suy diễn hoặc gán nhãn tâm lý từ ít thông tin.
- “Tương thích cao” bị hiểu nhầm là “an toàn”.

Nguyên tắc thiết kế:

- User luôn là người quyết định.
- Chỉ dùng thông tin user đồng ý cung cấp.
- Không chấm “độ tốt” của một người; chỉ đánh giá độ khớp với ưu tiên user đặt ra.
- Giải thích dữ liệu nào dẫn tới mỗi kết luận.
- Hiển thị mức độ tin cậy và các thông tin còn thiếu.
- Cho phép chỉnh tiêu chí, chỉnh trọng số, không lưu hoặc xóa lịch sử phân tích.
- Tách rõ đánh giá tương thích và an toàn khi hẹn hò.

### Điểm khác biệt cho AI Hackathon

Nhiều ứng dụng đã có gợi ý profile, matching score, tạo bio hoặc gợi ý câu mở đầu bằng AI. Điểm khác biệt của concept này không nằm ở chatbot hay đề xuất match đơn thuần, mà ở:

> AI-guided compatibility exploration: một không gian phân tích riêng, minh bạch và do user kiểm soát, giúp khám phá sự phù hợp trước khi kết nối.

MVP hackathon nên tập trung vào:

```text
Profile list
→ Chọn đối tượng
→ Agent phân tích
→ Checklist + Compatibility Map
→ Gợi ý câu hỏi/câu mở đầu
→ User cập nhật thông tin mới
→ Match hoặc lưu để xem sau
```

Như vậy, concept vừa có tính ứng dụng, vừa tránh biến thành một dating app đầy đủ nhưng quá rộng cho phạm vi hackathon.