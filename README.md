# CLARA – Dating Compatibility Copilot (Matching-Coach Agent)

Hệ thống AI Agent hỗ trợ phân tích độ tương thích đa chiều (7 trục radar), kiểm chứng giá trị sống, phát hiện rủi ro tài chính & đạo đức (Guardrails) và đồng hành cố vấn hẹn hò (Clara Coach).

---

## 🚀 Hướng dẫn Test & Trò chuyện với Agent qua Terminal (Không cần Frontend)

### 1. Khởi động Giao diện Terminal Chat tương tác
Bạn có thể chạy trực tiếp bằng 1 trong 2 cách:
```bash
# Cách 1: Chạy trực tiếp file Python
python cli_chat.py

# Cách 2: Chạy qua file batch (Windows)
test_chat.bat
```

#### Các tính năng trong Terminal Chat:
- **Chọn ứng viên**: Chọn tìm hiểu `Mai Linh` (Designer), `Tuấn Anh` (Bác sĩ), hoặc `Minh Châu` (Content Lead).
- **Trò chuyện tự nhiên**: Hỏi về cách mở đầu, thói quen hẹn hò, gợi ý địa điểm an toàn, đánh giá tài chính...
- **Lệnh tắt hỗ trợ**:
  - `/analyze`: Xem bảng điểm 7 trục radar và checklist phân loại (Matched / Needs Check / Potential Friction).
  - `/note <nội dung>`: Ghi chép quan sát thực tế sau buổi hẹn (ví dụ: `/note Hôm nay cafe ở Thảo Điền, Linh chia sẻ muốn kết hôn sau 2 năm và định cư ở TP.HCM`) -> Hệ thống tự động nâng điểm tương thích, tăng tỷ lệ hoàn thiện dữ liệu và thăng hạng checklist!
  - `/switch`: Đổi sang tìm hiểu ứng viên khác.
  - `/history`: Xem lại toàn bộ cuộc đối thoại trong phiên chat.
  - `/stream`: Bật / tắt chế độ stream từng từ.
  - `/help`: Xem hướng dẫn và câu hỏi mẫu.
  - `/exit` hoặc `exit`: Thoát phiên trò chuyện.

---

### 2. Chạy Bộ Testcase Kịch bản Tự động (Scenario Tests)
Hệ thống đi kèm bộ testcase toàn diện kiểm thử mọi khía cạnh của Agent:
```bash
# Chạy riêng bộ kịch bản Agent (6 scenarios)
python -m pytest -v tests/test_agent_scenarios.py

# Chạy toàn bộ test suite dự án (14 testcases)
python -m pytest -v
```

#### Các kịch bản được kiểm thử:
1. `test_multi_turn_conversation_flow`: Hội thoại nhiều lượt liên tục với lịch sử ngữ cảnh.
2. `test_candidate_specific_context_personalization`: Cá nhân hóa phản hồi theo từng hồ sơ đối tượng.
3. `test_guardrails_scam_and_financial_safety`: Bộ lọc an toàn cảnh báo rủi ro chuyển tiền, lừa đảo crypto.
4. `test_probing_questions_and_icebreakers`: Tự động sinh câu mở đầu và câu hỏi đào sâu.
5. `test_observation_note_real_time_reflection`: Cập nhật lại bản đồ tương thích sau khi nạp ghi chú hẹn hò.
6. `test_stream_chat_generation`: Phản hồi dạng stream token liên tục.

