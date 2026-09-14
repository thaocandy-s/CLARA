# CLARA · Matching Coach

**CLARA** là một decision-support copilot cho hẹn hò: giúp người dùng đánh giá mức độ phù hợp với một đối tượng hẹn hò trước khi quyết định match — thay vì chỉ dựa vào ảnh, bio hay cảm tính ban đầu. Agent không thay người dùng quyết định hay "chấm điểm con người", mà giúp họ nhìn rõ điểm chung, điểm khác biệt, thông tin còn thiếu và những câu hỏi nên trao đổi trước và sau buổi hẹn.

Xem ý tưởng sản phẩm gốc tại [`docs/ideas/Matching-Coach.md`](docs/ideas/Matching-Coach.md) và các tài liệu kiến trúc/spec tại [`docs/`](docs/) (`ARCHITECTURE.md`, `API.md`, `AI_ARCHITECTURE.md`, `DATABASE.md`, `BACKEND_SPEC.md`).

## Cấu trúc dự án

| Thư mục | Nội dung |
| --- | --- |
| [`frontend/`](frontend) | Ứng dụng web React 19 + TypeScript + Ant Design, giao tiếp với backend qua Vite dev proxy `/api`. |
| [`backend/`](backend) | API Node.js/TypeScript (Hono), SQLite (drizzle + better-sqlite3), xác thực bằng session cookie, tích hợp Claude (Anthropic) cho các tác vụ AI của Clara. |
| [`docs/`](docs) | Tài liệu ý tưởng sản phẩm, kiến trúc hệ thống, spec API/AI/database. |
| [`docs/designs/matching-coach/`](docs/designs/matching-coach) | Bộ mockup HTML/CSS/JS thuần dùng trong giai đoạn thiết kế trước khi hiện thực hóa bằng React + backend thật. |

## Chạy thử nhanh

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev        # http://localhost:3000 (tự migrate DB + seed tài khoản demo)

# Terminal 2 — frontend
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Đăng nhập bằng tài khoản demo có sẵn: `demo@clara.app` / `Demo@1234`.

Chi tiết cấu hình (biến môi trường, Clara AI provider, test...) xem [`backend/README.md`](backend/README.md) và [`frontend/README.md`](frontend/README.md).
