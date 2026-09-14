# Backend Feature Specification — CLARA Matching Coach

**Ngày:** 2026-09-14  
**Nguồn bằng chứng:** `docs/FRONTEND_AUDIT.md`, `frontend/src/**`, `docs/ideas/Matching-Coach.md`, `docs/designs/matching-coach/proposal/*`  
**Phạm vi tài liệu:** Đặc tả backend/AI cần để frontend hiện tại trở thành sản phẩm có máy chủ. **Không phải** implementation plan hay mã nguồn.  
**Quy tắc bằng chứng:** Không thêm dating-app đầy đủ (swipe, GPS realtime, P2P messaging, thanh toán, upload ảnh) trừ khi frontend/product copy yêu cầu.

### Phân loại yêu cầu

| Nhãn | Ý nghĩa |
| --- | --- |
| **Confirmed** | Có UI sống, type, mock mutation, hoặc contract thiết kế đã viết trong repo |
| **Inferred** | Nhãn nút / copy / type tồn tại nhưng runtime toast-only hoặc dead; backend nên làm nếu nối FE thật |
| **Assumed** | Cần để hệ thống vận hành an toàn (auth thật, id, hash) nhưng FE không chứng minh cơ chế |

---

## 1. Product boundary (backend)

Backend phục vụ **một user đã đăng nhập** khám phá **kho ứng viên mock**, tạo **phân tích tương thích riêng**, **chat với Clara**, **ghi chú quan sát**, **tái phân tích**, chỉnh **tiêu chí/trọng số/quyền riêng tư**, và (tuỳ chọn) đổi **trạng thái tìm hiểu**.

Backend **không** phục vụ:

- Hearing & Requirement Analyzer (root README — lệch sản phẩm)
- Nhắn tin hai chiều giữa user và ứng viên (Match chỉ toast trên FE; idea doc cấm đọc tin nhắn thật)
- Upload/download file, object storage ảnh
- Thanh toán, search full-text, analytics product, push notification
- Admin / RBAC đa vai trò (một loại user)

**Assumed:** Candidate pool là dữ liệu seed dùng chung (3 hồ sơ `cand_01`–`cand_03`), không phải user-generated dating inventory.

---

## 2. Feature mapping (Frontend → Backend)

Mỗi mục theo đúng schema yêu cầu.

### F1. Đăng nhập

| Trường | Nội dung |
| --- | --- |
| **Frontend Feature** | `LoginPage` — form email/password, demo login, remember (unused), forgot password (dead) |
| **User Action** | Submit form hoặc “Đăng nhập bằng tài khoản demo” |
| **API Endpoint** | `POST /api/auth/login` **(Assumed path; Confirmed need)** |
| **Request** | `{ "email": string, "password": string }` |
| **Response** | `{ "user": { "id", "name", "email", "age?", "city?" }, "token" \| session cookie }` — FE hiện chỉ persist `{ name, email }` |
| **Business Logic** | Tìm user theo email (case-insensitive **Assumed**); so khớp password hash; tạo session; trả display name. Demo `demo@clara.app` / `Demo@1234` phải login được nếu seed. |
| **Database Entities** | `UserAccount`, `Session` (nếu không JWT thuần) |
| **Authorization** | Public. Rate-limit **Assumed**. |
| **AI Processing** | Không |
| **Background Jobs** | Không |
| **Error Cases** | 400 format; 401 sai credentials (FE hiện gộp “email hoặc mật khẩu không hợp lệ”); 429 **Assumed** |

Ghi nhớ đăng nhập / quên mật khẩu: **không** là endpoint Confirmed. Xem mục Open.

### F2. Đăng ký

| Trường | Nội dung |
| --- | --- |
| **Frontend Feature** | `RegisterPage` — name, email, password, confirmPassword |
| **User Action** | Submit đăng ký |
| **API Endpoint** | `POST /api/auth/register` |
| **Request** | `{ "name", "email", "password" }` — `confirmPassword` chỉ validate client; **không gửi** nếu FE nối API đúng |
| **Response** | `{ "user": { "id", "name", "email" } }` **không** kèm session — Confirmed: không auto-login |
| **Business Logic** | Unique email; hash password; tạo `UserAccount` + `UserCriteria` mặc định (seed Hải Nam criteria **Assumed** cho demo, hoặc empty weights **Open**); không set session |
| **Database Entities** | `UserAccount`, `UserCriteria`, `PrivacySettings` (defaults) |
| **Authorization** | Public |
| **AI Processing** | Không |
| **Background Jobs** | Không (không có verify-email UI) |
| **Error Cases** | 400 validation; 409 email tồn tại (FE copy: “đã được đăng ký hoặc không hợp lệ”) |

**Confirmed business (không chỉ FE):** mật khẩu không được lưu plaintext. FE mock không lưu password — backend **bắt buộc** hash.

### F3. Đăng xuất

| Trường | Nội dung |
| --- | --- |
| **Frontend Feature** | Header dropdown Logout |
| **User Action** | Click đăng xuất |
| **API Endpoint** | `POST /api/auth/logout` **(Inferred nếu session server; Assumed nếu JWT stateless chỉ xóa client)** |
| **Request** | Empty / cookie |
| **Response** | `204` hoặc `{ "ok": true }` |
| **Business Logic** | Invalidate session. Client xóa `clara-auth-user`. |
| **Database Entities** | `Session` |
| **Authorization** | Authenticated |
| **AI / Jobs** | Không |
| **Error Cases** | 401 đã hết hạn — client vẫn về `/login` |

### F4. Theme & locale

| Trường | Nội dung |
| --- | --- |
| **Frontend Feature** | ThemeToggle, LanguageSwitcher, pill “Clara sẵn sàng” |
| **User Action** | Đổi theme/locale |
| **API Endpoint** | **Không yêu cầu** — Confirmed client `localStorage` |
| **Request / Response** | N/A |
| **Business Logic** | Locale `vi` \| `ja` ảnh hưởng **nội dung ứng viên và analysis** trên FE (hai file mock). Backend nếu trả copy đã dịch cần `Accept-Language` hoặc `locale` query **(Inferred)**. |
| **Entities** | Không bắt buộc; optional `UserPreferences.locale` **Assumed không** vì FE không sync |
| **Authorization** | N/A |
| **AI** | Chat/analyze nên tôn trọng locale của request **(Inferred)** |
| **Jobs** | Không |
| **Error Cases** | Locale không hỗ trợ → fallback `vi` **Assumed** |

Health pill: **Confirmed** static. `GET /api/health` **không** Confirmed.

### F5–F6. Discover + Candidate card

| Trường | Nội dung |
| --- | --- |
| **Frontend Feature** | `DiscoverPage`, `CandidateCard` |
| **User Action** | Xem list; kéo slider completeness; (UI) chọn tag; mở profile/analysis; bookmark (dead) |
| **API Endpoint** | `GET /api/candidates?minCompleteness=` **(Confirmed need)** |
| **Request** | Query: `minCompleteness` 0–100 (default FE 70). Optional **Inferred:** `goals[]`, `values[]`, `lifestyle[]` — FE chưa gửi. Optional `locale`. |
| **Response** | `{ "items": CandidateListItem[] }` — không pagination (Confirmed N=3, không UI page) |
| **Business Logic** | Trả hồ sơ seed. Completeness trên **card** là của analysis **theo user đang login**, không phải thuộc tính tĩnh ứng viên nếu analyze per-user **(Inferred — hiện mock nhúng sẵn trên Candidate)**. Filter `dataCompleteness >= min`. Tag filter: không implement cho đến khi FE apply **(Inferred)**. |
| **Database Entities** | `CandidateProfile`; join `CompatibilityAnalysis`, `Exploration` cho user |
| **Authorization** | Authenticated. Mọi user login thấy cùng pool. Analysis fields chỉ của owner. |
| **AI Processing** | `aiQuickSummary` trên card: precompute lúc analyze hoặc lúc list **(Inferred)**. Không Confirmed gọi AI mỗi render. |
| **Background Jobs** | Precompute summary khi criteria đổi **(Inferred)** |
| **Error Cases** | 401; empty list hợp lệ (FE grid trống) |

**CandidateListItem** (shape FE card cần): `id, name, age, job, location, distanceKm, bio, tags, gradient, overallCompatibility, dataCompleteness, matchLabel, matchBadgeTone, aiQuickSummary`.

Check icon completeness ≥ 70: **Confirmed** rule UI; backend có thể trả nguyên số, FE tự so.

### F7. Hồ sơ chi tiết

| Trường | Nội dung |
| --- | --- |
| **Frontend Feature** | `ProfilePage` |
| **User Action** | Mở `/profile/:candidateId`; lưu xem sau (toast); vào analysis |
| **API Endpoint** | `GET /api/candidates/:candidateId` |
| **Request** | Path id |
| **Response** | Candidate public fields + analysis snippet (compareRows, completeness, confidence, aiQuickSummary) |
| **Business Logic** | 404 → FE redirect `/`. “Lưu để xem sau”: **Inferred** `POST /api/explorations` (xem F8/F10). |
| **Entities** | `CandidateProfile`, `CompatibilityAnalysis`, `Exploration` |
| **Authorization** | Authenticated; analysis của caller |
| **AI** | Không bắt buộc nếu analysis đã cache |
| **Jobs** | Không |
| **Error Cases** | 404 unknown id |

### F8. Không gian phân tích

| Trường | Nội dung |
| --- | --- |
| **Frontend Feature** | `AnalysisPage` — compare, radar, checklist, CTAs |
| **User Action** | Mở `/analysis/:id`; lưu exploring; Match toast |
| **API Endpoint** | `GET /api/analyses/:candidateId` (cached) và/hoặc `POST /api/clara/analyze` **(Confirmed design path)** |
| **Request (analyze)** | Server **nên** tự lấy user+candidate từ auth+id, không tin payload client đầy đủ **(Assumed security)**. Design sample gửi full `user_profile` + `candidate_profile`. |
| **Response** | Radar 7 axes, checklist 3 nhóm + `sourceEvidence`, compareRows, overallCompatibility, dataCompleteness, confidenceLabel, icebreakers, probingQuestions, nextDatePlan **(nextDatePlan Confirmed trên FE, không có trong sample-contracts — Inferred thêm)** |
| **Business Logic** | Idempotent: lần 2 trả cache trừ khi criteria/notes đổi. Tạo `Exploration` nếu chưa có. Seed system note “Khởi tạo phân tích ban đầu” **(Confirmed mock notes author system)**. |
| **Entities** | `CompatibilityAnalysis`, `Exploration`, `ObservationNote` (system), `ChatMessage` (welcome) |
| **Authorization** | Owner only. Ứng viên không đọc được **(Confirmed copy hide_from_partner)**. |
| **AI Processing** | Engine 1 (+ icebreakers/probing Engine 2). Xem mục AI. |
| **Background Jobs** | **Inferred** nếu LLM > vài giây; FE hiện expect payload sẵn khi vào trang (sync). |
| **Error Cases** | 404 candidate; 401; 422 thiếu criteria; 503 LLM |

**Match & gửi lời nhắn:** Confirmed toast-only. Backend **không** bắt buộc messaging. **Inferred:** `POST /api/explorations/:candidateId/match` set `stage=matched`. **Assumed:** không gửi email/SMS.

### F9. Chat Clara

| Trường | Nội dung |
| --- | --- |
| **Frontend Feature** | `ChatPanel` |
| **User Action** | Gửi text / bấm chip; (dead) xóa lịch sử |
| **API Endpoint** | `POST /api/clara/chat` **(Inferred — có trên proposal HTML, không có sample-contracts.json)**; `GET` history nằm trong analysis/candidate payload; `DELETE /api/clara/chat/:candidateId` **(Inferred từ label)** |
| **Request** | `{ "candidateId": string, "text": string, "locale": "vi" \| "ja" }` |
| **Response** | `{ "userMessage": ChatMessage, "agentMessage": ChatMessage }` — `ChatMessage`: `id, sender, text, recommendation?` |
| **Business Logic** | Reject empty. Persist cả hai chiều trừ khi incognito **(Inferred)**. Context = criteria + candidate + latest analysis + notes + recent messages. Không đọc P2P chat (không tồn tại). Sanitize HTML nếu vẫn cho HTML **(Assumed; FE dùng dangerouslySetInnerHTML)**. |
| **Entities** | `ChatThread`, `ChatMessage` |
| **Authorization** | Owner |
| **AI Processing** | Engine 2. Chip intents: opener, date, finance, key advice **(Confirmed keywords)**. |
| **Background Jobs** | Không bắt buộc. Streaming **không** Confirmed bởi FE (đợi 1 JSON sau ~900ms). |
| **Error Cases** | 400 empty; 401; 404; 503 — FE hiện không có error UI |

### F10. My Analyses

| Trường | Nội dung |
| --- | --- |
| **Frontend Feature** | `MyAnalysesPage` |
| **User Action** | Chọn hồ sơ; thêm ghi chú; recalculate; chat; archive toast |
| **API Endpoint** | `GET /api/explorations` — **Inferred** watching list (FE hiện = mọi candidate). `POST /api/explorations/:candidateId/notes`. `POST /api/clara/reanalyze`. `POST /api/explorations/:candidateId/archive` **(Inferred)**. |
| **Request (note)** | `{ "text": string }` |
| **Request (reanalyze)** | Design: `{ "candidate_id", "new_observation_note", "previous_analysis_id" }`. FE tách: note đã lưu trước, rồi bấm recalculate **không gửi lại text** — backend lấy notes chưa ingest **(Inferred)**. |
| **Response (note)** | `Note { id, timeLabel, author: "user", text }` — newest first |
| **Response (reanalyze)** | Design: updated compatibility, completeness, confidence, promoted_items, radar. **Inferred FE cần thêm:** checklist, compareRows, icebreakers, probing, nextDatePlan, aiQuickSummary — mock +14% là **không đủ** so với copy nút. |
| **Business Logic** | Recalculate disabled trên FE đến khi vừa add note — **không** tin client; server từ chối nếu không có note mới kể từ lần analyze cuối **(Inferred)**. Completeness mock `min(98, +14)` **không** phải công thức sản phẩm; completeness phải phản ánh dữ liệu thật **(Confirmed product copy + proposal)**. |
| **Entities** | `Exploration`, `ObservationNote`, `CompatibilityAnalysis` |
| **Authorization** | Owner |
| **AI Processing** | Engine 3 |
| **Background Jobs** | **Inferred** async job + poll; FE hiện sync toast |
| **Error Cases** | 400 empty note; 409 no new notes; 404 |

Safety tips trên trang: **Confirmed** i18n static — không API.

### F11. Preferences

| Trường | Nội dung |
| --- | --- |
| **Frontend Feature** | `PreferencesPage` |
| **User Action** | Toggle deal-breakers/privacy; kéo weights; Save; xóa lịch sử (modal) |
| **API Endpoint** | `GET /api/me/criteria`; `PUT /api/me/criteria`; `PUT /api/me/privacy`; `DELETE /api/me/analysis-history` |
| **Request (criteria)** | `{ "dealBreakers": { "no_smoking", "long_term", "pet_friendly" }, "weights": RadarAxis[] }` — FE Save hiện **chỉ** `updateWeights` (**Inferred** backend nhận cả deal-breakers vì copy “đã lưu tiêu chí và trọng số”) |
| **Request (privacy)** | `{ "incognito", "hide_from_partner", "no_training" }` |
| **Response** | Criteria + privacy đã lưu |
| **Business Logic** | Weights 0–100 integer. Keys radar: xem entity. Đổi weights **không** tự reanalyze trên FE — cache analysis có thể stale **(Inferred: invalidate hoặc reanalyze)**. Delete: xóa analyses, notes, chat, radar của user; **không** xóa `UserAccount` (copy: “ghi chú và radar map đã lưu”). Candidate seed giữ nguyên. |
| **Entities** | `UserCriteria`, `PrivacySettings`, plus cascade delete child data |
| **Authorization** | Owner |
| **AI** | `no_training` cấm dùng hội thoại/notes cho train/fine-tune **(Confirmed copy)**. Không gửi data sang vendor retention nếu flag on **(Assumed vendor zero-retention)**. |
| **Jobs** | Không |
| **Error Cases** | 400 weight out of range; 401 |

Ethics list: static FE — không API.

### F12. Session user (header)

| Trường | Nội dung |
| --- | --- |
| **Frontend Feature** | Avatar + name; meta age/city hardcode |
| **User Action** | Xem header |
| **API Endpoint** | `GET /api/me` **(Inferred — FE chưa gọi)** |
| **Request** | Auth |
| **Response** | `{ id, name, email, age, city, intent }` từ `UserAccount` + `UserCriteria` |
| **Business Logic** | Thay hardcode 28 / Hà Nội |
| **Entities** | `UserAccount`, `UserCriteria` |
| **Authz / AI / Jobs** | Authenticated; không; không |
| **Error Cases** | 401 |

Không có trang edit profile — **không** Confirmed `PATCH /api/me` demographic.

---

## 3. Complete feature matrix

| ID | Frontend | Endpoint | Auth | AI | Async? | Status |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | Register | `POST /api/auth/register` | public | no | sync | **Confirmed need** |
| A2 | Login | `POST /api/auth/login` | public | no | sync | **Confirmed need** |
| A3 | Logout | `POST /api/auth/logout` | user | no | sync | **Inferred** |
| A4 | Current user | `GET /api/me` | user | no | sync | **Inferred** |
| C1 | Discover list | `GET /api/candidates` | user | optional cached summary | sync | **Confirmed need** |
| C2 | Profile / analysis shell | `GET /api/candidates/:id` | user | cached | sync | **Confirmed need** |
| E1 | Watching list | `GET /api/explorations` | user | no | sync | **Inferred** (FE = all candidates) |
| E2 | Save exploring / bookmark | `POST /api/explorations/:candidateId` | user | no | sync | **Inferred** |
| E3 | Match | `POST /api/explorations/:candidateId/match` | user | no | sync | **Inferred** (toast-only today) |
| E4 | Archive | `POST /api/explorations/:candidateId/archive` | user | no | sync | **Inferred** |
| N1 | Add note | `POST /api/explorations/:candidateId/notes` | user | no | sync | **Confirmed need** |
| N2 | List notes | included in E1/C2 | user | no | sync | **Confirmed need** |
| P1 | Get/save criteria | `GET\|PUT /api/me/criteria` | user | no | sync | **Confirmed need** (weights); deal-breakers **Inferred** |
| P2 | Privacy | `GET\|PUT /api/me/privacy` | user | policy | sync | **Inferred** |
| P3 | Delete analysis history | `DELETE /api/me/analysis-history` | user | no | sync | **Inferred** (toast-only) |
| AI1 | Initial analyze | `POST /api/clara/analyze` | user | yes | sync FE; async **Inferred** | **Confirmed design** |
| AI2 | Reanalyze | `POST /api/clara/reanalyze` | user | yes | sync FE; async **Inferred** | **Confirmed design** |
| AI3 | Chat | `POST /api/clara/chat` | user | yes | sync one-shot **Confirmed FE** | **Inferred endpoint** |
| AI4 | Clear chat | `DELETE /api/clara/chat/:candidateId` | user | no | sync | **Inferred** |
| X1 | Forgot password | — | — | — | — | **Out of scope** unless product decides |
| X2 | Remember me | — | — | — | — | Client-only / **Open** |
| X3 | Theme/locale persist | — | — | — | — | **Confirmed client-only** |
| X4 | File upload | — | — | — | — | **Not required** |
| X5 | Pagination/search | — | — | — | — | **Not required** |
| X6 | Payments | — | — | — | — | **Not required** |
| X7 | P2P messages | — | — | — | — | **Not required** |

---

## 4. Domain entities

Quan hệ tổng: `UserAccount` 1—1 `UserCriteria`, 1—1 `PrivacySettings`, 1—N `Exploration`. `Exploration` N—1 `CandidateProfile`. `Exploration` 1—1 current `CompatibilityAnalysis` (và N versions **Assumed**). `Exploration` 1—N `ObservationNote`, 1—N `ChatMessage`.

### 4.1 UserAccount

**Purpose:** Tài khoản đăng nhập.  
**Ownership:** Chính user đó.  
**Relationships:** 1:1 criteria, privacy; 1:N explorations, sessions.  
**Lifecycle:** created on register → active → (no delete-account UI).  
**Constraints:** email unique.

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| `id` | string (e.g. `usr_…`) | req | **Assumed** — FE không có |
| `email` | string | req | unique; format |
| `name` | string | req | display |
| `passwordHash` | string | req | **Assumed** backend; never return |
| `createdAt` | datetime | req | **Assumed** |

**Business rules:** Register không login; login cần password đúng; demo account seedable.

### 4.2 UserCriteria

**Purpose:** Tiêu chí phân tích (data thật theo proposal).  
**Ownership:** UserAccount.  
**Relationships:** used as analyze input.  
**Lifecycle:** created with defaults on register; updated on Save preferences.

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| `userId` | string | req | PK/FK |
| `name` | string | opt | mock “Hải Nam”; có thể trùng UserAccount.name |
| `age` | int | opt | mock 28; không form edit **Open** |
| `city` | string | opt | mock Hà Nội |
| `intent` / `relationship_goal` | string | opt | mock “Nghiêm túc, kết hôn trong 2-3 năm” |
| `lifestyle` | string | opt | **Design contract only**, không type FE |
| `dealBreakerFlags` | object | req | keys `no_smoking`, `long_term`, `pet_friendly` boolean — **Confirmed UI** |
| `dealBreakersText` | string[] | opt | mock `["Không hút thuốc lá", "Yêu động vật"]` — song song flags |
| `weights` | list `{ key, label, value: 0–100 }` | req | FE 5 keys; radar 7 keys — **conflict Open** |

**Canonical radar keys (Confirmed on candidate mock + design):**  
`long_term_goals`, `core_values`, `communication`, `lifestyle_habits`, `interests`, `finances`, `future_plans`.

**Business rules:**

- Trọng số là ưu tiên của **user**, không phải điểm ứng viên.
- Analyze phải dùng weights hiện tại (copy radar footnote) — FE chưa recalculate khi đổi slider.
- Deal-breaker bật → checklist/friction hoặc cảnh báo nếu candidate mâu thuẫn (copy switch).
- Không áp chuẩn mực xã hội lên user (copy preferences).

### 4.3 PrivacySettings

**Purpose:** Kiểm soát lưu trữ và tiết lộ.  
**Ownership:** UserAccount.

| Field | Type | Req | Default (FE) |
| --- | --- | --- | --- |
| `incognito` | bool | req | `false` |
| `hideFromPartner` | bool | req | `true` |
| `noTraining` | bool | req | `true` |

**Business rules:**

- `hideFromPartner`: không API nào cho candidate/user khác đọc analysis, notes, chat, questions.
- `noTraining`: không đưa notes/chat vào corpus train; vendor: không retention **Assumed**.
- `incognito`: không persist chat/notes sau khi đóng phiên **(Inferred; Open khi nào “đóng phiên”)**. Analyze radar vẫn cần policy rõ — **Open**.

### 4.4 Session

**Purpose:** Phiên đăng nhập persist reload (FE `clara-auth-user`).  
**Ownership:** UserAccount.  
**Assumed** nếu dùng opaque session; JWT thì entity tuỳ chọn.

| Field | Type | Req |
| --- | --- | --- |
| `id` / token hash | string | req |
| `userId` | string | req |
| `expiresAt` | datetime | req |

### 4.5 CandidateProfile

**Purpose:** Hồ sơ ứng viên mock dùng chung.  
**Ownership:** Hệ thống (không thuộc user).  
**Lifecycle:** seed; không CRUD UI.

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| `id` | string | req | `cand_01`, `cand_02`, `cand_03` |
| `name` | string | req | |
| `age` | int | req | |
| `job` | string | req | |
| `location` | string | req | |
| `distanceKm` | number | req | **static mock**, không GPS |
| `bio` | string | req | |
| `tags` | string[] | req | |
| `gradient` | string | req | CSS, không file |
| `questionnaire` | object | opt | **Design:** relationship_goal, smoking, pets, weekend_habit, future_plan, financial_view (nullable) |
| `localeContent` | map vi/ja | **Inferred** | FE có hai mock files |

**Không** lưu `overallCompatibility` trên entity này nếu điểm phụ thuộc user — thuộc `CompatibilityAnalysis`. Mock FE nhúng lẫn; backend **nên** tách **(Inferred)**.

### 4.6 Exploration

**Purpose:** Trạng thái “đang tìm hiểu” giữa một user và một candidate.  
**Ownership:** UserAccount.  
**Relationships:** 1 candidate; analyses; notes; chat.  
**Lifecycle:** created on analyze hoặc save; `chatting` / `met-once` / `matched` / `archived`.

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| `id` | string | req | **Assumed** |
| `userId` | string | req | |
| `candidateId` | string | req | unique (user, candidate) |
| `stage` | enum | req | `matched` \| `chatting` \| `met-once` \| `archived` |
| `stageLabel` | string | opt | có thể derive từ i18n + stage |
| `savedLabel` | string | opt | FE copy tĩnh; **Inferred** derive từ `updatedAt` |
| `createdAt` `updatedAt` | datetime | req | **Assumed** |

**Business rules:**

- Unique pair user–candidate.
- Archive **Inferred** ẩn khỏi watching list; Discover **Open**.
- Match **Inferred** set `matched`; không tạo message P2P.
- FE hiện list mọi candidate như đang theo dõi — backend có thể trả pool + exploration overlay **(Assumed MVP)**.

### 4.7 CompatibilityAnalysis

**Purpose:** Kết quả Engine 1 (và cập nhật Engine 3).  
**Ownership:** qua Exploration / UserAccount.  
**Lifecycle:** created analyze → superseded by reanalyze (giữ `previous_analysis_id` **Confirmed design**).

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| `id` | string | req | e.g. `anly_001` |
| `explorationId` / user+candidate | string | req | |
| `overallCompatibility` | int 0–100 | req | “Đồng thuận %” — **không** phải điểm phẩm giá người |
| `dataCompleteness` | int 0–100 | req | mock cap 98 là heuristic, **không** Confirmed công thức |
| `confidenceLabel` | string | req | |
| `confidenceDetail` | string | opt | design contract |
| `matchLabel` | string | req | e.g. Độ khớp cao |
| `matchBadgeTone` | `match` \| `check` | req | |
| `aiQuickSummary` | `{ positive, question }` | req | card/profile |
| `compareRows` | list | req | `label, userValue, targetValue, needsConfirmation?` |
| `radarAxes` | 7 × `{ key, label, value 0–100 }` | req | |
| `checklist` | 3 groups of items | req | mỗi item `title, detail, sourceEvidence`, `tag?`; design có `match_score` **optional** |
| `icebreakers` | string[] | req | |
| `probingQuestions` | string[] | req | |
| `nextDatePlan` | `{ title, detail }` | req | FE; missing in sample-contracts |
| `promotedItems` | list | opt | reanalyze only |
| `modelMeta` | object | opt | **Assumed** model/version, not shown FE |
| `createdAt` | datetime | req | |

**Constraints:** Mỗi checklist item **bắt buộc** `sourceEvidence` (product + proposal).  
**Business rules:** Xem mục 5.

### 4.8 ObservationNote

**Purpose:** Ghi chú user (và system) sau trò chuyện/gặp — data thật.  
**Ownership:** User via Exploration.

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| `id` | string | req | FE `note-{n}` |
| `explorationId` | string | req | |
| `author` | `user` \| `system` | req | |
| `text` | string | req | non-empty trim |
| `createdAt` | datetime | req | |
| `timeLabel` | string | opt | FE display; derive “Vừa xong” |
| `ingestedInAnalysisId` | string | opt | **Inferred** cho reanalyze gating |

**Business rules:** Newest first. System note lúc khởi tạo analysis. User notes không phải tin nhắn P2P.

### 4.9 ChatThread / ChatMessage

**Purpose:** Hội thoại user ↔ Clara, theo từng candidate.  
**Ownership:** User. Ứng viên không thấy.

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| `id` | string | req | |
| `explorationId` | string | req | |
| `sender` | `agent` \| `user` | req | |
| `text` | string | req | may contain HTML in mock |
| `recommendation` | `{ title, items[] }` | opt | |
| `createdAt` | datetime | req | |

**Business rules:** Empty send rejected. Clear history xóa messages, không xóa analysis **(Inferred)**. Incognito: skip persist **(Inferred)**.

### 4.10 Enums & value objects

**DatingStage:** `matched` | `chatting` | `met-once` | `archived`  
**ChecklistTone / group:** matched | needsCheck | potentialFriction  
**Locale:** `vi` | `ja`  
**Deal-breaker keys:** `no_smoking` | `long_term` | `pet_friendly`  
**Radar keys:** bảy key ở 4.2  

---

## 5. Business rules (extracted)

Không dựa chỉ vào validation FE.

### 5.1 Product / ethics (Confirmed copy + idea doc)

1. User luôn là người quyết định Match / không Match; agent không tự match.
2. Agent **không** đọc, nghe lén, hay can thiệp tin nhắn thật giữa hai người (không xây P2P reader).
3. Không chấm “độ tốt” / phẩm giá một người; chỉ độ khớp với tiêu chí **của user**.
4. Mọi nhận định checklist phải kèm căn cứ (`sourceEvidence`).
5. Phải hiện độ đầy đủ dữ liệu và độ tin cậy; không tạo chắc chắn giả khi thiếu data.
6. Tương thích cao **không** đồng nghĩa an toàn — safety copy tách khỏi compatibility score.
7. Chỉ dùng thông tin user đồng ý cung cấp (criteria, notes, chat Clara).
8. Phân tích là không gian riêng; đối phương không biết user đang phân tích (`hide_from_partner` default on).
9. User được xóa lịch sử phân tích (notes + radar).
10. User được chỉnh tiêu chí và trọng số.

### 5.2 Auth (Confirmed FE + mandatory backend)

11. App routes yêu cầu authenticated user.
12. Register: email chưa tồn tại; password confirm khớp (client); **server** vẫn enforce email unique + password policy **mạnh hơn** `length >= 4` **(Assumed min policy; FE min 4 là quá yếu cho production)**.
13. Login: không chấp nhận mọi email như mock; phải verify secret.
14. Register không tạo session.
15. Session sống qua reload cho đến logout.

### 5.3 Candidates & completeness

16. Pool demo: `cand_01` Mai Linh, `cand_02` Tuấn Anh, `cand_03` Minh Châu.
17. Discover mặc định ẩn hồ sơ completeness &lt; 70 (FE default slider) — user có thể hạ về 0.
18. Completeness ≥ 70 → UI “verified” check — cosmetic.
19. Completeness ∈ [0, 100]; mock +14 cap 98 **không** thay công thức sản phẩm. Proposal: đếm thuộc tính có dữ kiện / thuộc tính trọng yếu. Reanalyze phải **tăng có căn cứ** khi note lấp lỗ trống, không cộng hằng số mù.

### 5.4 Analysis

20. Radar **đúng 7 trục** với key cố định; value 0–100.
21. Checklist đúng 3 nhóm; nhóm rỗng không render (FE).
22. `compareRows.needsConfirmation` khi target chưa rõ / cần xác nhận.
23. Icebreakers từ giao điểm hồ sơ (proposal); probing nhằm mục `needs_check`.
24. Analyze input = UserCriteria + CandidateProfile (+ questionnaire).
25. Reanalyze input = analysis hiện tại + ghi chú mới; được phép promote checklist `needs_check` → `matched` (design `promoted_items`).
26. Đổi locale không được lộ data user khác; nội dung AI theo ngôn ngữ UI **(Inferred)**.

### 5.5 Notes & recalculate

27. Note rỗng bị từ chối.
28. Recalculate chỉ sau khi có quan sát mới (FE disable; server phải enforce).
29. Notes prepend (mới nhất trên).

### 5.6 Chat

30. Bốn intent chips: opener, date idea, finance, key advice — model phải phủ.
31. Finance: không thúc đẩy hỏi tiền sớm (simulator + safety).
32. Fallback: nhắc user cảm xúc gặp mặt mới quyết định.

### 5.7 Preferences & privacy

33. Save phải persist weights; **nên** persist deal-breakers (copy toast).
34. Xóa lịch sử: không xóa account, không xóa candidate seed.
35. `no_training` = cấm học từ dữ liệu cá nhân user.

### 5.8 Explicit non-rules (do not implement as if required)

- Email verification, password reset, OAuth, 2FA  
- Pagination, full-text search, GPS  
- Image pipeline  
- Billing  
- Multi-tenant admin  

---

## 6. API requirements (catalog)

Base **Assumed:** `/api`. JSON UTF-8. Auth header `Authorization: Bearer` **hoặc** httpOnly cookie **(Open)**. Locale: `Accept-Language` **Inferred**.

### Public

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Tạo account |
| POST | `/api/auth/login` | Session |

### Authenticated

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/logout` | Hủy session |
| GET | `/api/me` | Header / criteria identity |
| GET | `/api/me/criteria` | Preferences load |
| PUT | `/api/me/criteria` | Save weights + deal-breakers |
| GET | `/api/me/privacy` | Load switches |
| PUT | `/api/me/privacy` | Save privacy |
| DELETE | `/api/me/analysis-history` | Danger zone |
| GET | `/api/candidates` | Discover |
| GET | `/api/candidates/:candidateId` | Profile + analysis overlay |
| GET | `/api/explorations` | My Analyses list |
| POST | `/api/explorations/:candidateId` | Save exploring |
| POST | `/api/explorations/:candidateId/match` | Match (optional persist) |
| POST | `/api/explorations/:candidateId/archive` | Archive |
| POST | `/api/explorations/:candidateId/notes` | Add note |
| POST | `/api/clara/analyze` | Initial AI analysis |
| POST | `/api/clara/reanalyze` | Observation ingestion |
| POST | `/api/clara/chat` | Clara reply |
| DELETE | `/api/clara/chat/:candidateId` | Clear history |

**Error envelope (Assumed, FE chưa có):** `{ "error": { "code", "message" } }` với HTTP 400/401/403/404/409/422/429/503.

**Không có:** REST cho theme, upload, payments, search, webhooks user-facing.

---

## 7. Authentication

### Flow required by frontend

```
[Register] POST /register { name, email, password }
    → 201 user (no token)
    → FE /login prefill email

[Login] POST /login { email, password }
    → 200 user + credential
    → FE persist identity (today localStorage {name,email}; production: token/cookie)
    → FE navigate /

[Reload] credential still valid
    → RequireAuth passes (today reads localStorage; production: GET /me)

[Logout] POST /logout + clear client
    → /login
```

**Confirmed:** email+password; demo account; no OAuth UI; no refresh-token UI; persist across reload; all app pages behind auth.

**Assumed mechanism (Open trong audit):**  

- Khuyến nghị đặc tả: **session cookie httpOnly + CSRF** hoặc **JWT access** vì FE chưa có client API.  
- Password: salted hash (Argon2/bcrypt).  
- Demo seed: `demo@clara.app` / `Demo@1234`.

**Out of scope Confirmed:** forgot password, remember-me server, email verify.

---

## 8. Authorization

Một role: `authenticated_user`. Không admin.

| Operation | Permission |
| --- | --- |
| Auth register/login | Anonymous |
| Logout, GET/PUT me, criteria, privacy | Self |
| List/get candidates | Any authenticated (shared seed) |
| Read/write analysis, notes, chat, exploration | **Only owning userId** |
| Analyze/reanalyze/chat | Owner; candidateId must exist in seed |
| Delete analysis history | Self; cannot delete other users |
| Match/archive/save | Owner exploration |
| Read another user’s notes/chat/analysis | **Denied always** (`hideFromPartner` + product rule, kể cả khi flag off — flag off **không** Confirmed nghĩa là share với đối phương; không có UI share) |

**Assumed:** Flag `hideFromPartner=false` vẫn **không** expose API cho ứng viên vì không có actor “candidate user”. Flag là cam kết sản phẩm / future, không mở endpoint.

**403 vs 404:** **Assumed** 404 cho exploration không thuộc user (tránh leak id).

---

## 9. AI requirements

Bốn bề mặt. Không RAG corpus ngoài hồ sơ + notes + chat Clara + criteria. **Vector DB không Confirmed.**

### 9.1 Quick summary (card/profile)

| | |
| --- | --- |
| **Input** | UserCriteria (intent, deal-breakers, weights) + Candidate bio/tags/questionnaire |
| **Output** | `{ positive: string, question: string }` — một điểm đồng điệu, một điểm cần trao đổi |
| **Context** | Không lịch sử chat bắt buộc |
| **Model capability** | Short grounded summarization, bilingual vi/ja |
| **Prompt** | So sánh tiêu chí user vs hồ sơ; cấm chấm phẩm giá; cấm chắc chắn khi thiếu data |
| **Structured output** | JSON 2 fields |
| **Tools** | Không |
| **RAG** | Không |
| **Memory** | Không ngoài criteria+candidate |
| **Persistence** | Trên `CompatibilityAnalysis.aiQuickSummary` |
| **Streaming** | Không (card render sync) |
| **Errors** | Fallback ẩn block hoặc copy trung tính **Inferred**; FE luôn expect 2 strings |
| **Cost** | Rẻ; cache theo `(userCriteriaVersion, candidateId, locale)` |

**Status:** Output **Confirmed** FE; live LLM **Inferred** (mock precomputed).

### 9.2 Analyze — Engine 1 + icebreakers/probing/date plan

| | |
| --- | --- |
| **Input** | Full UserCriteria + CandidateProfile + questionnaire; locale |
| **Output** | overallCompatibility, dataCompleteness, confidence, matchLabel/tone, compareRows, radarAxes[7], checklist[3] with sourceEvidence, icebreakers[], probingQuestions[], nextDatePlan, aiQuickSummary |
| **Context** | Chỉ hai hồ sơ; không P2P |
| **Model capability** | Structured reasoning, citation, scoring calibrated 0–100, missing-data awareness |
| **Prompt** | Persona Clara: ấm, khách quan, không phán xét; user quyết định; cite bio/questionnaire; deal-breakers → friction nếu conflict; weights ảnh hưởng overall (footnote FE) |
| **Structured output** | JSON schema (align sample-contracts + FE types). Prefer FE field names khi serve app. |
| **Tools / function calling** | Optional schema-enforcer; không search tool **Confirmed** |
| **RAG** | Không — profiles đủ nhỏ |
| **Memory** | Persist analysis; không cross-candidate leakage |
| **Streaming** | Không — trang expect full object |
| **Errors** | 422 unparseable; retry; không trả score nếu parse fail |
| **Cost** | Đắt hơn summary; cache; invalidate khi PUT criteria |

Có thể tách 1 lần gọi structured (rẻ hơn chat). **Assumed** một completion JSON.

### 9.3 Chat — Engine 2

| | |
| --- | --- |
| **Input** | `text`; locale; candidateId |
| **Context** | Criteria, candidate, latest analysis (checklist/radar/gaps), last N messages, notes |
| **Output** | `text` (+ optional HTML bold như mock) + optional `recommendation { title, items }` |
| **Model capability** | Conversational coaching; grounded in analysis; intent: opener / questions / finance / date / general |
| **Prompt** | Không đọc tin nhắn dating thật; không thúc match; finance: quan sát địa điểm chứ không hỏi tiền buổi 1; safety public places |
| **Structured output** | JSON message; recommendation optional |
| **Tools** | Không bắt buộc. Function “get_icebreakers” **Assumed unnecessary** if context inlined |
| **RAG** | Không |
| **Memory** | Thread per user+candidate; respect incognito |
| **Streaming** | Design HTML muốn; **FE Confirmed** one-shot. Spec: **non-stream JSON** để khớp FE; stream là enhancement |
| **Errors** | 503 + FE message (chưa có UI) |
| **Cost** | Cao nhất (mỗi turn); limit length **Assumed**; no_training → disable provider logging |

### 9.4 Reanalyze — Engine 3

| | |
| --- | --- |
| **Input** | previous analysis JSON + new note(s) + original profiles + weights |
| **Output** | updated scores, completeness, confidence, radar, **full checklist**, promoted_items; **Inferred** nextDatePlan, probing, summary |
| **Context** | Toàn bộ notes hoặc notes chưa ingest |
| **Model capability** | Information extraction from unstructured Vietnamese/Japanese notes; map to axes; promote/demote checklist với evidence = “ghi chú của user” |
| **Prompt** | Không bịa fact ngoài note+profile; completeness chỉ tăng khi lấp gap thật |
| **Structured output** | Như design reanalyze + fields FE còn thiếu |
| **Tools** | Không |
| **RAG** | Không |
| **Memory** | New analysis version; link `previous_analysis_id` |
| **Streaming** | Không |
| **Errors** | Note không chứa fact mới → completeness không nhảy +14 giả; vẫn 200 với no-op **Open** |
| **Cost** | Trung bình; chỉ khi user bấm |

### 9.5 Guardrails — Engine 4 (cross-cutting)

Áp vào analyze/chat/reanalyze:

- Cấm xếp hạng người “tốt/xấu”
- Cấm chẩn đoán tâm lý
- Cấm đảm bảo an toàn từ compatibility
- Cấm yêu cầu PII tài chính sớm
- Tôn trọng `no_training`

Không cần model riêng nếu system prompt + output filter **Assumed**.

---

## 10. Background jobs

FE **không** có job id, polling, hay “đang phân tích” ngoài chat typing.

| Operation | Sync vs async | Verdict |
| --- | --- | --- |
| Auth, CRUD notes, preferences, delete, list | Sync | **Confirmed** |
| Chat | Sync one response | **Confirmed FE**; stream optional |
| Analyze first open | FE expects ready data | **Assumed sync** với timeout; **Inferred** job nếu LLM chậm + FE chưa poll |
| Reanalyze | FE sync toast | Same |
| Precompute list summaries for 3 candidates | Optional cache refresh on criteria save | **Inferred** |
| Email, digest, reminders | No UI | **Not required** |
| Training jobs | Contradicts no_training | **Not required** |

**Recommendation for implementers (not FE-confirmed):** nếu p95 LLM &gt; 8s, thêm `202 + job` sẽ **vỡ** AnalysisPage hiện tại (không loading). Ưu tiên sync + cache.

---

## 11. External services

Chỉ những gì product/FE thực sự cần.

| Service | Required? | Why |
| --- | --- | --- |
| **LLM provider** (OpenAI, Gemini, Anthropic, v.v.) | **Inferred** cho AI core; mock có thể không cần | Chat, analyze, reanalyze, summary |
| **Object storage** | **No** | Gradient CSS, no upload |
| **Email** | **No** | No verify/reset/invite |
| **Payments** | **No** | |
| **Search engine** | **No** | No text search |
| **Vector database** | **No** | Context nhỏ, nhét prompt |
| **Analytics** | **No** | No product analytics UI |
| **Maps / geolocation** | **No** | `distanceKm` tĩnh |
| **Push / websocket messaging** | **No** | Match toast; no P2P |
| **OAuth IdP** | **No** | Email/password only |
| **Transactional DB** | **Assumed** | Persist users, analyses, notes, chat |

---

## 12. Confirmed / Inferred / Assumed (summary)

### Confirmed

- Cần auth register → login (no auto-login) → logout client; protect app data by user.
- Cần list/get 3 candidates với fields card/profile/analysis.
- Cần persist (khi có backend) notes, chat turns, weights.
- Cần AI outputs: 7-axis radar, 3-group cited checklist, compare rows, icebreakers, probing, chat recommendations, completeness, compatibility %, confidence, nextDatePlan, aiQuickSummary.
- Design endpoints analyze + reanalyze.
- Privacy copy: hide from partner, no training, delete history, no P2P reading.
- i18n vi/ja content.
- No file, payment, search, pagination APIs.

### Inferred

- REST paths `/api/auth/*`, `/api/me`, `/api/candidates`, `/api/explorations`, `/api/clara/chat`.
- Watching list ≠ full pool; save/bookmark/archive/match persist `Exploration.stage`.
- Save preferences includes deal-breakers + privacy.
- Delete history và clear chat thật.
- Recalculate returns full analysis, not +14%.
- `GET /api/me` for header age/city.
- Locale on AI requests.
- Server-side enforce “note before reanalyze”.
- LLM live replacing mocks.
- Cache invalidation on criteria change.

### Assumed

- Password hashing, user id, analysis id, timestamps ISO.
- Session/JWT choice.
- Password policy stronger than length 4.
- Default criteria for new users (copy Hải Nam vs empty).
- Weights mapping 0–100 ↔ design 0–1.
- Error JSON envelope.
- Completeness formula as filled-fields ratio.
- Zero-retention LLM mode when `no_training`.
- Shared candidate seed, not per-user candidates.
- No streaming in v1.
- Match remains non-messaging.

### Open (blocks implementation choices, not invented features)

1. JWT vs cookie.  
2. 5 vs 7 weight sliders.  
3. New user criteria defaults.  
4. Discover tag filters server-side hay bỏ.  
5. My Analyses = all seed vs saved-only.  
6. Incognito retention window.  
7. Analyze on list vs on first Analysis open.  
8. Completeness exact formula.  
9. Whether Match/Archive are persisted.  
10. Chat HTML vs plain text (XSS).

---

## 13. Mapping FE types → persist vs compute

| FE `Candidate` field | Persist on | Compute |
| --- | --- | --- |
| id, name, age, job, location, distanceKm, bio, tags, gradient | CandidateProfile | |
| overallCompatibility … nextDatePlan, checklist, radar, chat, notes, stage | Analysis / Exploration / Chat / Note | AI or user |
| UserProfile.weights | UserCriteria | |
| AuthUser | UserAccount | |

---

*Đặc tả này không chứa mã triển khai. Bước tiếp theo (khi được yêu cầu): kế hoạch implement backend khớp các endpoint Confirmed trước, Inferred sau.*
