# Frontend Audit — CLARA Matching Coach

**Ngày audit:** 2026-09-14  
**Phạm vi mã nguồn:** `frontend/` (Vite + React 19 + TypeScript + Ant Design 6 + React Router 7)  
**Quy tắc bằng chứng:** Chỉ ghi nhận hành vi và mô hình dữ liệu có trong frontend đang chạy. Tài liệu thiết kế (`docs/ideas/`, `docs/designs/`) được trích dẫn riêng, không được coi là tính năng đã implement.  
**Trạng thái runtime:** Frontend-only. Không có HTTP client (`fetch` / `axios`) trong `frontend/src`. Không có file `.env`. Không có backend trong repository.

---

## Product Overview

CLARA Matching Coach là **decision-support copilot cho hẹn hò có chủ đích**. Người dùng không swipe/match như dating app đầy đủ; họ xem hồ sơ gợi ý, mở không gian phân tích riêng với agent Clara, đối chiếu tiêu chí, xem bản đồ tương thích 7 trục, checklist 3 nhóm (khớp / cần xác nhận / ma sát), chat tư vấn, ghi chú sau buổi gặp, rồi chủ động Match hoặc lưu để xem sau.

Định vị được hardcode trên UI:

- Header: `CLARA · Matching Coach` + tag `AI Clara` + subtitle `Decision-Support for Intentional Dating`
- Footer: “Decision-support copilot cho hẹn hò có chủ đích”
- Nguyên tắc: user luôn quyết định; agent không đọc tin nhắn thật; không chấm “độ tốt” của một người

**Mâu thuẫn branding trong repo (bằng chứng):**

| Nguồn | Mô tả sản phẩm |
| --- | --- |
| Root `README.md` | “AI-powered Hearing & Requirement Analyzer” — **không khớp** UI hiện tại |
| `frontend/README.md`, `docs/ideas/Matching-Coach.md`, UI | Dating compatibility copilot |

Sản phẩm đang chạy là Matching Coach. Root README là tài liệu lệch / cũ.

**Người dùng trong demo:** một loại user duy nhất (không role). Hồ sơ tiêu chí mẫu “Hải Nam, 28, Hà Nội” nằm trong mock; tài khoản đăng nhập chỉ có `name` + `email`. Header vẫn hardcode tuổi/thành phố `28 · Hà Nội`, không đọc `userProfile`.

**Danh sách ứng viên mock (cố định 3 hồ sơ):**

| ID | Tên (VI) | Nghề | Compat | Completeness | Stage |
| --- | --- | --- | --- | --- | --- |
| `cand_01` | Mai Linh | Product Designer | 81% | 74% | `chatting` |
| `cand_02` | Tuấn Anh | Bác sĩ nội trú | 72% | 68% | `met-once` |
| `cand_03` | Minh Châu | Content Strategist | 84% | 82% | `matched` |

---

## Routes

Định nghĩa tại `frontend/src/App.tsx`. Không có route 404. Không redirect người đã login ra khỏi `/login` `/register`.

| Path | Page | Auth | Layout | Hành vi khi thiếu dữ liệu |
| --- | --- | --- | --- | --- |
| `/login` | `LoginPage` | Public | `AuthLayout` | — |
| `/register` | `RegisterPage` | Public | `AuthLayout` | — |
| `/` | `DiscoverPage` | Required | `AppLayout` | — |
| `/profile/:candidateId` | `ProfilePage` | Required | `AppLayout` | ID không tồn tại → `<Navigate to="/" />` |
| `/analysis/:candidateId` | `AnalysisPage` | Required | `AppLayout` | ID không tồn tại → `<Navigate to="/" />` |
| `/analyses` | `MyAnalysesPage` | Required | `AppLayout` | Luôn dùng toàn bộ `candidates`; mặc định chọn phần tử đầu |
| `/preferences` | `PreferencesPage` | Required | `AppLayout` | — |

**Guard:** `RequireAuth` — nếu `!isAuthenticated` thì `Navigate` tới `/login` kèm `state.from`. Sau login, app **không** đọc `from`; luôn `navigate("/")`.

**Nav header/footer:** `/`, `/analyses`, `/preferences`. Profile và Analysis không có mục nav riêng.

**Deep link ứng viên hợp lệ (mock):** `/profile/cand_01`, `/analysis/cand_02`, v.v.

---

## Features

Mỗi feature dưới đây có cột **Hiện trạng runtime** để phân biệt UI thật, toast-only, và control chết.

### F1. Đăng nhập

- **User intent:** Vào app bằng email/password.
- **Data FE:** `email`, `password`; prefill email từ `location.state.email` sau đăng ký. Checkbox “Ghi nhớ” tồn tại nhưng **không được đọc** khi submit.
- **Backend required:** Xác thực credentials, trả session/token. **Chưa có.**
- **Entities:** User account.
- **Endpoint (cần):** `POST` auth login — **chưa tồn tại trong code.**
- **Validation FE:** Form required; `AuthContext`: email regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`, `password.length >= 4`. **Không so khớp password thật** (kể cả demo `Demo@1234`).
- **Authorization:** Public.
- **AI:** Không.
- **Sync/async:** Đồng bộ client; delay 600ms trước khi navigate (chỉ để hiện notification).
- **Success:** Notification thành công → `/`. Persist `{ name, email }` vào `localStorage` key `clara-auth-user`.
- **Failure:** Notification lỗi (format email/password).
- **Stub:** “Quên mật khẩu?” không có `onClick`. Nút demo điền `demo@clara.app` / `Demo@1234`.

### F2. Đăng ký

- **User intent:** Tạo tài khoản rồi đăng nhập.
- **Data FE:** `name`, `email`, `password`, `confirmPassword`.
- **Backend required:** Tạo user, hash password, uniqueness email.
- **Validation:** Required; confirm phải khớp; `register()` fail nếu email đã có trong `clara-known-users` hoặc format sai / password < 4.
- **Authorization:** Public.
- **AI:** Không.
- **Success:** Chỉ lưu `email → name` vào `clara-known-users`. **Không lưu password. Không auto-login.** Notification → `/login` với `state.email` sau 1s.
- **Failure:** Notification “email đã đăng ký hoặc không hợp lệ”.

### F3. Đăng xuất

- **User intent:** Kết thúc phiên.
- **Action:** Dropdown avatar → Logout.
- **Success:** Notification → `setUser(null)` sau 600ms → xóa `clara-auth-user` → guard đẩy về `/login`.
- **AI:** Không.

### F4. Theme & locale (chrome)

- Theme light/dark: `clara-theme` trong `localStorage`.
- Locale `vi` | `ja`: `clara-locale`. Đổi locale **reset** `candidates` và `userProfile` từ mock tương ứng → mất notes/chat in-memory.
- Status pill “Clara sẵn sàng” **static**, không phản ánh health API.
- **AI:** Không.

### F5. Discover — danh sách hồ sơ

- **User intent:** Xem gợi ý hồ sơ theo tiêu chí, lọc, chọn người để xem/phân tích.
- **Data FE:** `Candidate[]` từ `AppStateContext` (mock).
- **Bộ lọc UI:**
  - Tag mục tiêu / giá trị / lối sống: state local `selected: number[]` — **không áp vào danh sách**.
  - Slider độ đầy đủ dữ liệu (`minCompleteness`, default 70): **có filter** `c.dataCompleteness >= minCompleteness`.
  - “Xóa bộ lọc”: clear tags + slider = 0.
  - Banner “Ưu tiên hiện tại” (Định hướng lâu dài, Giao tiếp cởi mở): **static copy**, không editable.
- **Search text:** Không có.
- **Pagination:** Không có.
- **Empty state:** Không có; filter hết thì grid trống im lặng.
- **Backend:** List/filter candidates + (nếu làm thật) AI quick summary. Hiện không gọi API.
- **AI:** Hiển thị `aiQuickSummary` precomputed trong mock — không inference.
- **Bookmark trên card:** Button không `onClick` (dead control).

### F6. Candidate card

- Hiển thị: gradient avatar (không ảnh file), match badge, data %, tên/tuổi (link profile), job/location/`distanceKm`, bio, AI summary, tags.
- Actions sống: “Xem hồ sơ” → `/profile/:id`; “Phân tích với Agent” → `/analysis/:id`.
- Completeness ≥ 70 hiện icon check xanh.

### F7. Hồ sơ chi tiết

- **User intent:** Đọc bio, tags, đối chiếu tiêu chí, xem completeness/AI summary trước khi phân tích sâu.
- **Data:** Toàn bộ `Candidate` (đặc biệt `bio`, `tags`, `compareRows`, `aiQuickSummary`, `dataCompleteness`, `confidenceLabel`).
- **Actions:**
  - Back `navigate(-1)`.
  - “Lưu để xem sau”: toast `profile.savedToast` — **không đổi `stage`, không persist**.
  - “Phân tích với Agent”: navigate analysis.

### F8. Không gian phân tích (Analysis)

- **User intent:** Đối chiếu, xem radar + checklist, chat Clara, lưu exploring hoặc Match.
- **Layout 3 cột:** so sánh + guardrail | `ChatPanel` | radar + checklist + CTA.
- **Radar:** SVG từ `radarAxes` (7 trục). Footnote nói trọng số theo tiêu chí user — **không tính lại từ `userProfile.weights` lúc runtime**.
- **Checklist:** read-only 3 nhóm + `sourceEvidence` + optional `tag`.
- **Guardrail copy:** Agent không chấm người; dựa trên tiêu chí user.
- **CTA:**
  - Lưu exploring: toast + `navigate("/analyses")` — **không đổi `stage`**.
  - Match & gửi lời nhắn: toast — **không messaging thật** (khớp ý tưởng “mock P2P chat”).
- **Backend/AI:** Cần analyze + chat. Runtime dùng mock đã nhúng sẵn trên `Candidate`.

### F9. Chat Clara

- **User intent:** Hỏi opener, date, tài chính, lời khuyên.
- **Data:** `chatHistory`, draft; reply dùng `icebreakers`, `probingQuestions`, `nextDatePlan`, `overallCompatibility`.
- **Flow:** `appendChatMessage(user)` → `isTyping` 900ms → `generateAgentReply` (keyword match vi/ja) → append agent.
- **Chips:** opener / date / finance / key advice gửi query đã dịch.
- **Clear history:** button **không `onClick`**.
- **Loading:** text typing. **Không error path** (simulator luôn trả lời).
- **AI:** UI AI; logic rule-based local. HTML trong message qua `dangerouslySetInnerHTML`.

### F10. My Analyses

- **User intent:** Theo dõi người đang tìm hiểu, ghi chú sau gặp, yêu cầu phân tích lại, chat lại, lưu trữ.
- **Data:** Toàn bộ `candidates` được coi là watching list (không có subset “saved”).
- **Actions:**
  - Chọn candidate (border rose); đổi selection reset `readyToRecalculate`.
  - Thêm ghi chú → `addNote` (prepend `Note`, `timeLabel` i18n “Vừa xong”) → enable recalculate.
  - Recalculate: `dataCompleteness = min(98, current + 14)` — **không cập nhật radar/checklist/compatibility**.
  - Chat với Clara → `/analysis/:id`.
  - Lưu trữ: `message.info` — **không set `stage: "archived"`**.
- **Hiển thị:** stage tag, match %, data %, `nextDatePlan`, safety tips i18n static.
- **Empty:** không handle `candidates.length === 0`.
- **AI:** Nút recalculate hiện icon Gemini khi ready — không gọi model.

### F11. Preferences

- **Deal-breakers (3 switch):** keys `no_smoking`, `long_term`, `pet_friendly`; default tất cả `true`. State local — **không persist vào `userProfile.dealBreakers` khi Save**.
- **Weights sliders:** copy từ `userProfile.weights` (mock chỉ **5 trục**, không có `finances` / `future_plans`). “Lưu thay đổi” gọi `updateWeights` (memory).
- **Privacy (3 switch):** `incognito` default false; `hide_from_partner` true; `no_training` true. Local only.
- **Ethics list:** static.
- **Danger zone:** `Modal.confirm` → toast “đã xóa” — **không xóa notes/chat/candidates**.
- **AI:** Copy về không train AI; không pipeline.

### F12. Không tồn tại trên frontend (đã kiểm)

- Upload/download file, avatar file, attachment chat
- Text search, pagination, infinite scroll
- Dashboard thống kê tổng hợp (chỉ có % trên từng hồ sơ)
- Push notification server
- Password reset flow
- Multi-role / admin
- Environment-based API URL
- React Query / Redux / Zustand
- Trang 404, trang user profile của chính user (editable)

---

## User Flows

### Flow 1 — Đăng ký → Đăng nhập → Discover

```
RegisterPage.onFinish
  → AuthContext.register(name, email, password)
  → localStorage clara-known-users[email]=name
  → notification success
  → navigate /login { email }
LoginPage.attemptLogin
  → AuthContext.login (format check only)
  → localStorage clara-auth-user
  → navigate /
RequireAuth pass → AppLayout → DiscoverPage
  → candidates = mock (VI hoặc JA theo locale)
```

**Expected backend response (chưa có):** session/token + user. FE hiện không expect JSON.

### Flow 2 — Discover → Profile → Analysis → Chat

```
CandidateCard Link /profile/:id
  → getCandidate(id) | Navigate /
  → Link /analysis/:id
ChatPanel.send(text)
  → appendChatMessage(user)
  → setTimeout 900ms
  → generateAgentReply(candidate, text, locale)
  → appendChatMessage(agent ± recommendation)
```

**Expected AI response shape (từ types):** `ChatMessage { id, sender, text, recommendation? }`.

### Flow 3 — Lưu exploring / Match (UI only)

```
Analysis "Lưu vào đang tìm hiểu" → toast + navigate /analyses
  (không mutate stage)
Analysis "Match & Gửi lời nhắn" → toast
  (không tạo conversation P2P)
Profile "Lưu để xem sau" → toast
Card bookmark → no-op
```

### Flow 4 — Ghi chú → Recalculate

```
MyAnalyses handleAddNote
  → AppState.addNote(id, text)
  → readyToRecalculate=true
handleRecalculate
  → AppState.recalculate(id)  // completeness +14, cap 98
  → toast với % mới
```

**Expected backend (từ design docs, chưa wire):** `POST /api/clara/reanalyze` trả compatibility, completeness, radar, promoted checklist items. Runtime **không** apply các field đó.

### Flow 5 — Lưu trọng số

```
Preferences sliders → handleSave → updateWeights(weights) → toast
Deal-breakers / privacy không đi vào AppState
```

### Flow 6 — Đổi ngôn ngữ

```
LanguageSwitcher → LocaleContext → clara-locale
AppState useEffect → replace candidates + userProfile từ mock
Mất notes/chat session in-memory
```

### Flow 7 — Logout

```
Header dropdown → notification → logout() 600ms
→ RequireAuth → /login
```

---

## Frontend Data Models

Nguồn sự thật: `frontend/src/types/index.ts` + `AuthUser` trong `AuthContext.tsx`.

### `RadarAxis`

| Field | Type | Ghi chú |
| --- | --- | --- |
| `key` | `string` | Ví dụ `long_term_goals`, `core_values`, `communication`, `lifestyle_habits`, `interests`, `finances`, `future_plans` |
| `label` | `string` | Nhãn i18n trong mock |
| `value` | `number` | UI dùng % 0–100 (sliders và radar) |

### `ChecklistItem` / `Checklist`

- `title`, `detail`, `sourceEvidence`, optional `tag`
- Nhóm: `matched[]`, `needsCheck[]`, `potentialFriction[]`
- `ChecklistTone`: `"matched" | "check" | "friction"`

### `CompareRow`

- `label`, `userValue`, `targetValue`, optional `needsConfirmation`

### `DatingStage`

`"matched" | "chatting" | "met-once" | "archived"`

UI có `stageLabel` (string đã dịch) song song với `stage`. Không có control để đổi stage. `archived` có màu mapping nhưng không được set bởi action Lưu trữ.

### `Note`

- `id`, `timeLabel` (string hiển thị, không phải ISO datetime), `author: "user" | "system"`, `text`

### `ChatMessage` / `ChatRecommendation`

- `sender: "agent" | "user"`
- `text` có thể chứa HTML
- `recommendation?: { title, items: string[] }`

### `Candidate` (aggregate chính)

Demographics: `id`, `name`, `age`, `job`, `location`, `distanceKm`, `bio`, `tags`, `gradient`  
Analysis payload nhúng sẵn: `overallCompatibility`, `dataCompleteness`, `confidenceLabel`, `matchLabel`, `matchBadgeTone`, `aiQuickSummary { positive, question }`, `compareRows`, `radarAxes`, `checklist`, `icebreakers`, `probingQuestions`  
Session: `chatHistory`, `stage`, `stageLabel`, `savedLabel`, `notes`, `nextDatePlan { title, detail }`

### `UserProfile`

- `name`, `age`, `city`, `intent`, `dealBreakers: string[]`, `weights: RadarAxis[]`
- Mock weights **5 trục**; radar ứng viên **7 trục**. Không có `user_id` trên type FE.

### `AuthUser`

- `name`, `email` — không password, không roles, không user id.

### Known users map

`Record<email, displayName>` trong `localStorage`.

---

## Existing API Contracts

### Runtime frontend

**Không có API contract được gọi.** Không base URL, không headers, không OpenAPI trong app.

`frontend/README.md` nói notes/chat/auth lưu `localStorage`. Thực tế:

| Key | Persist |
| --- | --- |
| `clara-auth-user` | Có |
| `clara-known-users` | Có |
| `clara-theme` | Có |
| `clara-locale` | Có |
| candidates / notes / chat / weights | **Chỉ React state** — mất khi reload (reload lại mock) |

### Design-time contracts (chưa wire)

File: `docs/designs/matching-coach/proposal/sample-contracts.json`

#### `POST /api/clara/analyze`

**Request:** `user_profile` (user_id, name, age, relationship_goal, deal_breakers, lifestyle, dimension_weights 7 keys 0–1) + `candidate_profile` (candidate_id, name, age, job, location, bio, questionnaire).

**Response:** `status: success` + `data`: `overall_compatibility`, `data_completeness`, `confidence_level`, `confidence_detail`, `radar_axes`, `direct_comparison`, `checklist` (có `match_score` thêm so với FE type), `icebreakers`, `probing_questions`.

**Gap vs FE types:**  
- Weights design dùng 0–1; FE sliders 0–100.  
- `direct_comparison.status` vs FE `CompareRow.needsConfirmation`.  
- Checklist design có `match_score`; FE dùng `tag` string.  
- Analyze không trả `aiQuickSummary`, `chatHistory`, `stage`, `nextDatePlan`.  
- Proposal README còn nhắc `POST /api/clara/chat` trong HTML prototype — **không có** trong `sample-contracts.json`.

#### `POST /api/clara/reanalyze`

**Request:** `candidate_id`, `new_observation_note`, `previous_analysis_id`.

**Response:** `updated_overall_compatibility`, `updated_data_completeness`, `confidence_level`, `promoted_items[]`, `updated_radar_axes`.

FE `recalculate()` không consume contract này.

---

## Required Backend Capabilities

Bảng dưới tách **cần để UI hiện tại có ý nghĩa** vs **chỉ là toast/stub**. Không thêm capability “thường thấy ở dating app” nếu UI không có.

| Capability | Nguồn bằng chứng UI | Độ ưu tiên theo UI | Sync? |
| --- | --- | --- | --- |
| Register | Register form | Cần nếu auth thật | Sync |
| Login / session | Login + RequireAuth | Cần | Sync |
| Logout | Header | Cần | Sync |
| List candidates | Discover | Cần (hoặc seed mock server) | Sync |
| Filter completeness | Slider Discover | Cần | Sync (query) |
| Filter tags goal/value/lifestyle | Tag clouds (chưa apply) | **Inferred** nếu làm filter thật | Sync |
| Get candidate by id | Profile, Analysis | Cần | Sync |
| Analyze compatibility | Analysis prefilled fields | Cần cho AI core | Có thể async nếu latency LLM |
| AI quick summary on cards | `aiQuickSummary` | Cần nếu không hardcode | Async hoặc precompute |
| Chat with Clara | ChatPanel | Cần | Streaming được design docs đề xuất; FE hiện đợi 1 message |
| Persist chat history | `chatHistory` | Cần nếu không mất khi reload | Sync write |
| Clear chat | Button (dead) | **Inferred** từ label | Sync |
| Add observation note | My Analyses | Cần (data thật theo proposal) | Sync |
| Reanalyze from notes | Recalculate button | Cần AI core | Async hợp lý |
| Save weights | Preferences save | Cần | Sync |
| Save deal-breakers | Switches + save copy | **Inferred** (Save không ghi hiện tại) | Sync |
| Privacy flags | Switches | **Inferred** | Sync |
| Delete analysis history | Modal danger | Cần nếu không chỉ toast | Sync |
| Bookmark / save exploring | Toasts + dead bookmark | **Inferred**; mock P2P match có thể giữ toast | Sync |
| Archive | Toast | **Inferred** (`DatingStage.archived`) | Sync |
| Match & message | Toast + product idea “mock messaging” | Có thể **giữ mock** | — |
| Forgot password | Link không handler | **Open** | — |
| Remember me | Checkbox unused | **Open** | — |
| User profile CRUD (age/city/intent) | `UserProfile` type + hardcode header | **Open** — không có form edit profile | — |

---

## Required Database Entities

Suy ra **chỉ** từ types + persist keys + contracts. Không invent bảng GPS/swipe.

### Confirmed bởi mô hình FE

| Entity | Fields cốt lõi | Ghi chú |
| --- | --- | --- |
| **UserAccount** | email, display name, password hash (thật) | FE chỉ có name/email |
| **UserCriteria / UserProfile** | intent, city, age, deal_breakers, weights | Weights 5 vs 7 trục cần thống nhất |
| **CandidateProfile** | id, demographics, bio, tags, location, distanceKm, questionnaire-like facts | Pool mock 3 hồ sơ theo proposal |
| **CompatibilityAnalysis** | overallCompatibility, dataCompleteness, confidence, matchLabel, radar, checklist, compareRows, icebreakers, probing, aiQuickSummary | Hiện nhúng trong Candidate |
| **ChatThread / ChatMessage** | per user+candidate, sender, text, recommendation JSON | |
| **ObservationNote** | id, candidate, author, text, display time | |
| **ExplorationState** | stage, stageLabel, savedLabel | |

### Có trên design contract nhưng chưa có type FE

- `user_id` (`usr_001`)
- `analysis_id` (`anly_001`) cho reanalyze
- `questionnaire` structured trên candidate
- `lifestyle` string trên user
- `promoted_items` sau reanalyze

### Không có bằng chứng FE cần persist

- Ảnh chân dung file (dùng CSS `gradient`)
- GPS realtime
- P2P message store
- Device tokens

---

## Authentication & Authorization Requirements

**Hiện trạng:** Mock client. Mọi email hợp lệ + password ≥ 4 ký tự đều login được. Không JWT, không cookie server, không refresh, không OAuth, không RBAC.

**Yêu cầu suy từ UI (khi làm backend thật):**

| Rule | Bằng chứng |
| --- | --- |
| Mọi route app yêu cầu user đã đăng nhập | `RequireAuth` |
| Một user chỉ thấy analysis/chat/notes của mình | Copy privacy “ẩn với đối phương”, “sandbox cá nhân” |
| Candidate pool có thể dùng chung (mock) | 3 hồ sơ cố định |
| Không có admin UI | Không route/role |
| Register không login sẵn | `register()` không `setUser` |
| Session persist across reload | `clara-auth-user` |

**Forgot password / remember me:** chỉ UI. Không được coi là requirement đã confirmed.

**Incognito Clara:** switch mô tả “không lưu câu hỏi và ghi chú sau khi đóng phiên” — chưa có logic; nếu implement thì ảnh hưởng retention chat/notes.

---

## AI Features

| Bề mặt UI | Runtime | Design intent (`docs/designs/.../proposal/README.md`) |
| --- | --- | --- |
| AI quick summary trên card/profile | Mock field | Core Agent — LLM 1 câu đối chiếu |
| Radar 7 trục + overall % | Mock numbers | Engine 1 structured scoring |
| Checklist 3 nhóm + source_evidence | Mock | Engine 1 bắt buộc citation |
| Icebreakers / probing | Mock arrays + chat keyword | Engine 2 |
| Chat Clara | Keyword simulator 900ms | Engine 2 streaming LLM |
| Recalculate từ ghi chú | +14% completeness | Engine 3 extract facts, promote checklist, update radar |
| Safety copy / finance advice | Static i18n + keyword finance | Engine 4 guardrails |
| “Clara sẵn sàng” | Static green pill | Health/status — không xác định |

**Nguyên tắc sản phẩm (copy + idea doc, không phải code enforcement):** không chấm phẩm giá người; luôn kèm căn cứ; hiện completeness/confidence; không đọc tin nhắn P2P.

**Chat simulator keywords:** opener, questions, finance, date (vi + ja). Fallback luôn có recommendation “nhắc nhở”.

---

## File / Storage Requirements

| Hạng mục | Bằng chứng |
| --- | --- |
| Upload | **Không có** input file / FormData |
| Download | **Không có** |
| Ảnh ứng viên | CSS `gradient` + SVG silhouette |
| Object storage | **Không yêu cầu** từ FE hiện tại |
| localStorage | Auth, known users, theme, locale |
| Chat HTML | Lưu text/HTML trong memory state |

Nếu sau này thay gradient bằng ảnh thật, đó là **assumption mới**, chưa có trên FE.

---

## Background Job Requirements

**Không có** queue UI, job id, polling, webhook, hay “đang phân tích…” ngoài chat typing 900ms.

**Inferred (không confirmed bởi FE):**

- Analyze/reanalyze LLM có thể chạy async nếu latency cao — FE hiện expect kết quả đã có trên `Candidate` khi vào trang, và recalculate gần như tức thì.
- Không có inbox job, email, hay scheduled reminder.

Proposal HTML nói streaming chat — FE không có SSE/WebSocket client.

---

## Error & Edge Cases

| Case | Hành vi hiện tại |
| --- | --- |
| Chưa login vào `/` | Redirect `/login` + `state.from` (from bị bỏ qua sau login) |
| Candidate id sai | Redirect `/` im lặng |
| Login format sai | Notification error |
| Register email trùng (known-users) | Notification error |
| Password confirm mismatch | Validator Ant Design, chưa gọi `register` |
| Chat empty send | No-op |
| Note empty | No-op |
| Recalculate khi chưa add note | Button disabled |
| Recalculate lặp | Cap completeness 98 |
| Filter Discover hết card | Grid trống, không Empty |
| `candidates[0]` missing trên My Analyses | Optional chaining `selectedId`; `active` fallback `[0]` — crash nếu mảng rỗng (**chưa có empty**) |
| Đổi locale | Mất notes/chat in-memory |
| Clear chat / bookmark / forgot password | Dead / no handler |
| Delete history confirm | Toast thành công giả |
| Network/API error | Không có — không gọi mạng |
| Loading trang | Không Spin/Skeleton |
| XSS | `dangerouslySetInnerHTML` trên chat |
| Login khi đã authenticated | Vẫn render LoginPage |
| Brand link AuthLayout → `/` | RequireAuth đẩy lại login nếu chưa auth |

---

## Confirmed Requirements

Những mục này **có UI + model + (thường) state mutation hoặc điều hướng** trong frontend:

1. SPA Matching Coach với 7 route như bảng Routes.
2. Auth mock tối thiểu: register (nhớ tên theo email), login format-check, logout, persist session client, guard routes.
3. i18n vi/ja cho chrome và nội dung mock ứng viên.
4. Theme light/dark.
5. Discover list 3 candidates; filter theo `dataCompleteness`.
6. Profile detail với bio, tags, compare rows, completeness, AI summary.
7. Analysis workspace: compare, radar 7 axes, checklist 3 nhóm có `sourceEvidence`, chat, CTAs.
8. Chat Clara với chips, typing delay, recommendation cards.
9. My Analyses: chọn hồ sơ, thêm note, tăng completeness giả, xem next date plan + safety tips, link lại chat.
10. Preferences: deal-breaker switches, weight sliders, privacy switches, ethics copy, confirm xóa lịch sử.
11. Copy sản phẩm: user quyết định, không đọc tin nhắn thật, không chấm người, hiện độ tin cậy/đầy đủ dữ liệu.
12. Candidate IDs `cand_01|02|03` và user mock Hải Nam là dữ liệu demo chính thức trong app.
13. Design file định nghĩa `POST /api/clara/analyze` và `POST /api/clara/reanalyze` (chưa kết nối).

---

## Inferred Requirements

Suy từ **nhãn nút / type / copy** nhưng runtime chưa làm đúng hoặc chỉ toast:

1. Tag filter Discover (mục tiêu, giá trị, lối sống) **nên** lọc danh sách — UI có, logic chưa gắn.
2. Bookmark / “Lưu để xem sau” / “Lưu vào đang tìm hiểu” **nên** đưa hồ sơ vào watching list (hiện list = tất cả mock).
3. “Lưu trữ” **nên** set `stage: archived` và có thể ẩn khỏi list đang theo dõi.
4. “Xóa lịch sử” chat **nên** xóa `chatHistory` của candidate đó.
5. Danger zone **nên** xóa notes, chat, radar đã lưu của user.
6. Nút Save Preferences **nên** persist deal-breakers và privacy, không chỉ weights.
7. Recalculate **nên** cập nhật radar, checklist, compatibility, confidence — không chỉ +14% completeness (khớp contract reanalyze).
8. Header user meta **nên** lấy `userProfile.age/city` hoặc AuthUser, không hardcode.
9. `RequireAuth.state.from` **nên** restore deep link sau login.
10. Chat production **nên** là LLM contextual, không keyword matcher — README frontend và proposal khẳng định simulator là tạm.
11. Analyze lần đầu **nên** là API khi vào Analysis, thay vì JSON nhúng sẵn (proposal Engine 1).
12. Privacy `no_training` / `hide_from_partner` **nên** thành flag backend khi có AI thật.
13. Demo account **nên** verify password nếu auth thật.

---

## Assumptions

Đánh dấu rõ những điểm **không chứng minh được từ FE runtime**, kể cả khi docs ý tưởng nói tới:

1. **Assumption:** Root README “Hearing & Requirement Analyzer” không phải scope sản phẩm đang implement.
2. **Assumption:** 3 ứng viên là đủ cho MVP hackathon (proposal: 3–5 hồ sơ mock; app có đúng 3).
3. **Assumption:** Messaging P2P và GPS không thuộc backend MVP (proposal “Data Mock”; FE chỉ toast Match và `distanceKm` tĩnh).
4. **Assumption:** Một user demo = Hải Nam criteria, kể cả khi login email khác — `userProfile` không gắn AuthUser.
5. **Assumption:** My Analyses = toàn bộ candidate pool, không phải danh sách saved riêng.
6. **Assumption:** `savedLabel` (“Cập nhật 2 giờ trước”) là copy tĩnh, không phải timestamp hệ thống.
7. **Assumption:** `timeLabel` trên Note không cần ISO; FE chỉ render string.
8. **Assumption:** Không cần phân trang vì N=3; nếu pool lớn hơn, FE chưa có contract page/cursor.
9. **Assumption:** Streaming chat là mục tiêu thiết kế HTML, không phải hợp đồng FE hiện tại.
10. **Assumption:** Weights 0–100 trên FE sẽ map sang 0–1 trên contract analyze khi nối API.
11. **Assumption:** Không có môi trường staging/prod API vì không có env vars.

---

## Open Questions

1. Auth thật dùng session cookie, JWT, hay tiếp tục mock cho hackathon?
2. Forgot password và Remember me có nằm trong scope backend không?
3. User có form chỉnh `intent`, age, city, deal-breakers text tự do không, hay chỉ 3 switch cố định?
4. Radar 7 trục vs preferences 5 sliders: trục nào bắt buộc? `finances` và `future_plans` có slider không?
5. Filter tag Discover: filter client trên tags ứng viên, hay server-side theo questionnaire?
6. Watching list: mọi candidate, chỉ bookmarked, hay mọi người đã từng analyze?
7. Match & message: mãi mãi toast, hay tạo record `stage=matched`?
8. Archive: ẩn khỏi Discover, khỏi My Analyses, hay cả hai?
9. Xóa dữ liệu: xóa analyses/notes/chat thôi, hay xóa cả account?
10. Incognito: xóa khi đóng tab, khi logout, hay khi tắt switch?
11. Chat API có nằm trong contract chính thức không (`/api/clara/chat` chỉ xuất hiện ở proposal HTML)?
12. Analyze chạy khi nào: preload list, lúc mở Analysis, hay background?
13. Locale: backend trả nội dung đã dịch, hay FE dịch? Đổi ngôn ngữ có được phép wipe session analysis?
14. Có cần `user_id` / `analysis_id` ổn định để reanalyze không?
15. Completeness: công thức đếm field (proposal) hay heuristic +14 như mock?
16. Có cho thêm candidate ngoài 3 mock không?
17. Header “Clara sẵn sàng” có map sang healthcheck LLM không?
18. Có cần chỉnh `confidenceLabel` động sau reanalyze không (contract có, FE mock tĩnh trừ completeness)?
19. Register có cần verify email không? (UI không có.)
20. Có tách CLARA Hearing Analyzer (root README) thành sản phẩm khác, hay bỏ?

---

## Appendix A — Feature → API → Entity (trace)

| Feature | User goal | FE data | Backend op | Entity | Endpoint (existing/needed) | Validation | Authz | AI | Timing | Success (FE) | Failure (FE) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login | Vào app | email, password | Verify user | UserAccount | **needed** login | email regex, pwd≥4 | public | no | sync | toast + `/` | toast |
| Register | Tạo TK | name, email, pwd, confirm | Create user | UserAccount | **needed** register | required, match, unique email | public | no | sync | toast + `/login` | toast |
| Logout | Thoát | — | Invalidate session | Session | **needed** | — | auth | no | sync | toast + `/login` | none |
| Discover | Xem gợi ý | Candidate[] | List | Candidate, Analysis | **needed** list | completeness ≥ min | auth | summary precomputed | sync | render cards | empty grid |
| Profile | Đọc hồ sơ | Candidate | Get by id | Candidate | **needed** get | id exists | auth | display | sync | page | redirect `/` |
| Analysis view | Xem phân tích | analysis fields | Analyze or get cached | CompatibilityAnalysis | **design** `POST /api/clara/analyze` | candidate+user criteria | owner | yes | sync in UI today | render | redirect `/` |
| Chat | Hỏi Clara | ChatMessage | Generate reply | ChatMessage | **needed** (not in sample-contracts) | non-empty | owner | yes | 900ms mock | append | none |
| Add note | Ghi nhận thực tế | Note.text | Create note | ObservationNote | **needed** | non-empty | owner | no | sync | prepend list | no-op |
| Recalculate | Cập nhật map | completeness | Reanalyze | Analysis | **design** `POST /api/clara/reanalyze` | note just added (UI) | owner | yes | sync mock | +14% + toast | disabled |
| Save weights | Đổi ưu tiên | RadarAxis[] 0–100 | Update criteria | UserProfile | **needed** | 0–100 | owner | maybe reanalyze later | sync | toast | none |
| Delete history | Xóa phân tích | — | Delete analyses | Analysis, Note, Chat | **needed** | confirm modal | owner | no | sync | toast only | cancel |
| Match | Kết nối | — | Mock toast | — | none in FE | — | auth | no | sync | toast | none |

---

## Appendix B — Source map

| Concern | Path |
| --- | --- |
| Routes | `frontend/src/App.tsx` |
| Auth | `frontend/src/store/AuthContext.tsx`, `pages/auth/*`, `components/RequireAuth.tsx` |
| App state | `frontend/src/store/AppStateContext.tsx` |
| Types | `frontend/src/types/index.ts` |
| Mock VI/JA | `frontend/src/mock/data.ts`, `data.ja.ts` |
| Chat sim | `frontend/src/utils/chatSimulator.ts` |
| i18n | `frontend/src/i18n/translations.ts` |
| Product idea | `docs/ideas/Matching-Coach.md` |
| Architecture split mock/real/AI | `docs/designs/matching-coach/proposal/README.md` |
| JSON contracts | `docs/designs/matching-coach/proposal/sample-contracts.json` |

---

*Hết audit. Không có thay đổi mã ứng dụng trong bước này.*
