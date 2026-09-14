# CLARA Dating Compatibility Agent — HTML Mockups

Bộ thiết kế giao diện HTML Mockup cho sản phẩm **Dating Compatibility Agent (Matching-Coach)** theo concept tại [Matching-Coach.md](../../ideas/Matching-Coach.md).

---

## 🎨 Tổng quan Kiến trúc Giao diện

Bộ mockup được xây dựng hoàn chỉnh với Vanilla HTML5, CSS3 hiện đại theo chủ đề màu sáng (**Light Romantic-Tech Palette**, Glassmorphism nhẹ, Typography Google Fonts `Outfit` & `Plus Jakarta Sans`), kết hợp JavaScript tương tác (Radar chart động 7 trục tối ưu cho nền sáng, Chat Simulator thời gian thực với AI Clara, Logging & Recalculation).

| Tệp Mockup | Màn hình | Mục đích & Tính năng chính |
| :--- | :--- | :--- |
| [`index.html`](index.html) | **Màn hình 1: Gợi ý Hồ sơ & Shortlist** | Duyệt danh sách profile với góc nhìn giá trị cốt lõi, mức độ đầy đủ dữ liệu (Data completeness), tóm tắt AI Clara ban đầu và CTA *"Phân tích với Agent"*. |
| [`compatibility-copilot.html`](compatibility-copilot.html) | **Màn hình 2: Không gian Phân tích Tương thích (Core Clara)** | Bố cục 3 cột chuyên sâu: Đối chiếu tiêu chí User vs Đối tượng, Trò chuyện với Clara (gợi ý Icebreaker, 3 câu hỏi sâu), Checklist 3 màu (Phù hợp, Cần xác nhận, Cân nhắc) & Bản đồ tương thích 7 trục (SVG Radar Map trên nền sáng). |
| [`my-analyses.html`](my-analyses.html) | **Màn hình 3: Hồ sơ đang tìm hiểu (My Analyses)** | Theo dõi tiến trình sau buổi hẹn offline. User tự ghi chú điều mới biết được; Clara cập nhật lại bản đồ tương thích mà không hề nghe lén/đọc lén tin nhắn thật. |
| [`preferences-criteria.html`](preferences-criteria.html) | **Màn hình 4: Tiêu chí, Deal-breakers & Quyền riêng tư** | Cài đặt điều không thể thỏa hiệp (không hút thuốc, kết hôn), thanh trượt trọng số 7 trục và thiết lập bảo vệ dữ liệu (Incognito Clara, xóa lịch sử). |
| [`styles.css`](styles.css) | **Global Design System (Light Theme)** | Tokens nền sáng sang trọng, màu sắc tương thích, hiệu ứng ánh sáng ambient glow dịu nhẹ, card glassmorphism, responsive cho desktop và mobile. |
| [`app.js`](app.js) | **Interactive Logic** | Trình sinh biểu đồ Radar SVG động tối ưu nền sáng, bộ giả lập chat với Clara phản hồi theo ngữ cảnh, bộ ghi chú & tính toán lại điểm tương thích. |
| [`proposal/README.md`](proposal/README.md) | **Đề án Phân định Dữ liệu & Core Agent** | Đặc tả rạch ròi Data Mock vs. Core Agent làm thật vs. Data Thật, kèm 4 Engine cốt lõi và JSON Schemas. |

---

## 🚀 Hướng Dẫn Cách Mở Mockup Trên Trình Duyệt

Vì mockup được viết hoàn toàn bằng **HTML, CSS và JavaScript thuần (Zero Dependencies)**, bạn có thể mở và xem ngay lập tức bằng nhiều cách:

### Cách 1: Mở trực tiếp từ File Explorer (Nhanh nhất - Không cần cài đặt)
1. Mở File Explorer trên Windows, điều hướng đến thư mục:
   ```text
   c:\Users\Admin\Documents\src\CLARA\docs\designs\matching-coach
   ```
2. **Nhấp đúp chuột** vào file [`index.html`](index.html).
3. Trang web sẽ tự động mở lên trong trình duyệt mặc định của bạn (Google Chrome, Microsoft Edge, Brave,...).
4. Sử dụng thanh menu trên cùng để bấm chuyển qua lại giữa các màn hình:
   - **Khám phá hồ sơ** (`index.html`)
   - **Không gian phân tích** (`compatibility-copilot.html`)
   - **Đang tìm hiểu** (`my-analyses.html`)
   - **Tiêu chí & Bộ lọc** (`preferences-criteria.html`)

---

### Cách 2: Mở nhanh bằng 1 dòng lệnh Terminal / PowerShell
Mở PowerShell hoặc Command Prompt tại thư mục dự án và chạy:
```powershell
# Mở trực tiếp bằng trình duyệt mặc định:
Start-Process "c:\Users\Admin\Documents\src\CLARA\docs\designs\matching-coach\index.html"

# Hoặc mở bằng Google Chrome:
start chrome "c:\Users\Admin\Documents\src\CLARA\docs\designs\matching-coach\index.html"

# Hoặc mở bằng Microsoft Edge:
start msedge "c:\Users\Admin\Documents\src\CLARA\docs\designs\matching-coach\index.html"
```

---

### Cách 3: Chạy Local Web Server (Mượt mà như Web App thật)
Nếu bạn muốn chạy qua HTTP Server cục bộ (`localhost`):

- **Cách dùng Python (nếu máy có sẵn Python):**
  ```bash
  cd c:\Users\Admin\Documents\src\CLARA\docs\designs\matching-coach
  python -m http.server 3000
  ```
  👉 Mở trình duyệt truy cập: `http://localhost:3000`

- **Cách dùng Node.js / npx:**
  ```bash
  npx serve c:\Users\Admin\Documents\src\CLARA\docs\designs\matching-coach
  ```

---

### Cách 4: Mở từ IDE (Antigravity / VS Code)
1. Ở cây thư mục bên trái của IDE, tìm đến thư mục `docs/designs/matching-coach`.
2. Chuột phải vào file `index.html`.
3. Chọn **Reveal in File Explorer** (sau đó nhấp đúp file) hoặc chọn **Open with Default Browser / Live Preview** nếu có cài extension.

---

## 💡 Các tương tác bạn có thể trải nghiệm trực tiếp trên Browser

1. **Chuyển đổi màn hình qua Header Navigation**:
   - Tất cả 4 màn hình đều liên kết với nhau thông qua thanh điều hướng ở đầu trang (`Khám phá hồ sơ`, `Không gian phân tích`, `Đang tìm hiểu`, `Tiêu chí & Bộ lọc`).
2. **Trải nghiệm Chat với Clara (`compatibility-copilot.html`)**:
   - Thử bấm vào các nút gợi ý: `💬 Thêm câu mở đầu`, `☕ Ý tưởng buổi hẹn đầu`, `💰 Kiểm tra quan điểm tài chính`, hoặc gõ câu hỏi vào ô chat và nhấn Enter/Gửi. Clara sẽ phản hồi kèm thẻ khuyến nghị hành động thực tế.
3. **Trải nghiệm Tự ghi nhận thông tin (`my-analyses.html`)**:
   - Nhập một ghi chú vào ô ghi nhận (ví dụ: *"Buổi cafe hôm nay rất vui, cô ấy thích du lịch bụi"*), bấm **"Thêm ghi chú"**.
   - Nút **"Cập nhật lại phân tích"** sẽ phát sáng; khi bấm vào, thanh **Độ đầy đủ dữ liệu** sẽ tự động tăng từ 74% lên 88% với thông báo cập nhật bản đồ tương thích!
4. **Kéo thanh trượt trọng số (`preferences-criteria.html`)**:
   - Kéo các thanh trượt tỷ lệ phần trăm tương thích để thấy con số phần trăm cập nhật trực tiếp.

---

## 🛡️ Tôn chỉ Thiết kế & Đạo đức AI

- **User là người quyết định cuối cùng:** AI đóng vai trò như một người bạn đồng hành thông thái (**Clara Coach**), không chấm điểm con người và không thay thế trực giác tình cảm.
- **Minh bạch cơ sở phân tích:** Mọi mục trong checklist đều ghi rõ căn cứ từ dữ liệu nào (Bio, bảng khảo sát hay ghi chú người dùng).
- **Độ tin cậy & Dữ liệu còn thiếu:** Luôn có thước đo "Data Completeness" để nhắc nhở người dùng khi dữ liệu chưa đủ.
- **Bảo mật tuyệt đối:** Không can thiệp hoặc đọc lén cuộc trò chuyện thật giữa hai người.
