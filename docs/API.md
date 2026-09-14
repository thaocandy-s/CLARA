# API Contract — CLARA Matching Coach

**Ngày:** 2026-09-14  
**Cơ sở:** `frontend/src/**`, `docs/FRONTEND_AUDIT.md`, `docs/BACKEND_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`  
**Phạm vi:** Hợp đồng HTTP. **Không** implement API server trong bước này.

### Bằng chứng frontend

- **Không có** `fetch` / `axios` / service client trong `frontend/src`.
- Kỳ vọng dữ liệu = TypeScript `Candidate`, `UserProfile`, `AuthUser`, `Note`, `ChatMessage` (`frontend/src/types/index.ts`, `AuthContext.tsx`).
- Hành động = handlers trong pages/store (mutate Context), không URL backend.

Contract dưới đây dùng **camelCase + shape FE** để nối SPA **không bắt buộc đổi type**. Khác `sample-contracts.json` (snake_case, envelope `status/data`).

---

## 0. Conventions

| Mục | Quyết định | Vì sao |
| --- | --- | --- |
| Base | `https://<origin>/api` | ARCHITECTURE same-origin |
| Format | JSON UTF-8 | FE object literals |
| Auth | Cookie session httpOnly `clara_session`; `credentials: include` | Logout revoke; tránh JWT localStorage (XSS chat HTML) |
| Locale | Header `Accept-Language: vi` \| `ja` (fallback `vi`) | `LocaleContext`; không API theme/locale |
| IDs | `cand_01`… như mock; user `usr_…` | FE route params |
| Pagination | **Không** | Discover/My Analyses không page |
| Sorting | Ghi trên từng GET; FE list không UI sort | |
| Filtering | Chỉ `minCompleteness` trên list | Slider `DiscoverPage` |
| Envelope lỗi | `{ "error": { "code": string, "message": string } }` | FE chưa parse; toast dùng `message` |
| Envelope thành công | Body trực tiếp, **không** `{ status, data }` | Khác design JSON; khớp object FE |

**Cookie:** `Set-Cookie` lúc login; xóa lúc logout. Không trả `token` trong JSON (FE hiện chỉ cần `{ name, email }`).

**Authorization:** session → `userId`. Catalog đọc mọi user login. Analysis/notes/chat/exploration chỉ owner. Sai owner → **404** (không 403).

---

## 1. Shared DTOs (khớp `frontend/src/types/index.ts`)

```ts
// Auth — AuthContext.tsx
type AuthUser = { name: string; email: string };

// Mở rộng GET /api/me (header đang hardcode age/city)
type MeUser = AuthUser & {
  id: string;
  age: number | null;
  city: string | null;
  intent: string | null;
};

type RadarAxis = { key: string; label: string; value: number };
type ChecklistItem = { title: string; detail: string; sourceEvidence: string; tag?: string };
type Checklist = {
  matched: ChecklistItem[];
  needsCheck: ChecklistItem[];
  potentialFriction: ChecklistItem[];
};
type CompareRow = {
  label: string;
  userValue: string;
  targetValue: string;
  needsConfirmation?: boolean;
};
type DatingStage = "matched" | "chatting" | "met-once" | "archived";
type Note = {
  id: string;
  timeLabel: string; // derive từ created_at
  author: "user" | "system";
  text: string;      // DB column `body`
};
type ChatMessage = {
  id: string;
  sender: "agent" | "user";
  text: string;      // DB column `body`
  recommendation?: { title: string; items: string[] };
};
type Candidate = { /* toàn bộ fields types/index.ts Candidate */ };
type UserProfile = {
  name: string;
  age: number;
  city: string;
  intent: string;
  dealBreakers: string[]; // xem mismatch flags vs strings
  weights: RadarAxis[];
};
```

`Candidate` trên API = **catalog ⨝ exploration ⨝ current analysis ⨝ notes ⨝ chat** (FE đang giữ một object). DB tách bảng — API ghép lại.

Chưa analyze: `dataCompleteness: 0`, `overallCompatibility: 0`, `radarAxes` đủ **7 key** giá trị `0` (tránh `RadarChart` chia 0 trục), checklist/chat/notes rỗng, `stage: "chatting"`, `nextDatePlan: { title: "", detail: "" }`.

---

## 2. Endpoints

Mỗi endpoint: consumer FE (file sẽ gọi khi nối mạng). Hôm nay **không file nào gọi HTTP**.

---

### 2.1 `POST /api/auth/register`

| | |
| --- | --- |
| **Authentication** | Public |
| **Authorization** | Anonymous |
| **Path / Query** | Không |
| **Pagination / filter / sort** | Không |

**Request body**

```json
{ "name": "string", "email": "string", "password": "string" }
```

`confirmPassword` **không** gửi (chỉ `RegisterPage` validator).

**Validation:** `name` trim ≥ 1; email chứa `@`; `password.length >= 8` (DB/app — **chặt hơn** FE `>= 4`); email unique NOCASE.

**Response 201**

```json
{ "user": { "name": "Nguyễn Văn A", "email": "a@b.c" } }
```

Không cookie. Khớp `register()` không `setUser`.

**Errors:** `400 VALIDATION`; `409 EMAIL_TAKEN` (FE gộp copy “đã đăng ký hoặc không hợp lệ”).

**Consumers:** `frontend/src/pages/auth/RegisterPage.tsx`, `store/AuthContext.tsx` (`register`).

---

### 2.2 `POST /api/auth/login`

| | |
| --- | --- |
| **Authentication** | Public |
| **Authorization** | Anonymous |

**Request**

```json
{ "email": "string", "password": "string" }
```

**Validation:** email format; password non-empty; verify hash.

**Response 200** + `Set-Cookie`

```json
{ "user": { "name": "Nghi yeu Duc", "email": "demo@clara.app" } }
```

Demo: `demo@clara.app` / `Demo@1234` (`AuthContext.DEMO_ACCOUNT`, `LoginPage`).

**Errors:** `400`; `401 INVALID_CREDENTIALS` (FE không tách “sai mật khẩu” vs “không tồn tại”); `429`.

Không endpoint remember-me / forgot-password (`LoginPage` stub).

**Consumers:** `LoginPage.tsx`, `AuthContext.tsx` (`login`). Redirect `/` — `RequireAuth.tsx` không đọc `state.from`.

---

### 2.3 `POST /api/auth/logout`

**Authentication / Authorization:** session bắt buộc (nếu cookie hết hạn vẫn `204` + clear cookie — UX logout).

**Body:** rỗng.

**Response:** `204` + expire cookie.

**Errors:** thường không cần 401.

**Consumers:** `components/layout/AppLayout.tsx` (`handleLogout`).

---

### 2.4 `GET /api/me`

**Auth:** session.

**Response 200** `MeUser`

**Errors:** `401`.

**Pagination / filter:** không.

**Consumers (khi nối):** `AppLayout.tsx` (name + `{age} · {city}`), có thể hydrate `AuthContext`. **Hiện không gọi**; header hardcode 28 / Hà Nội.

---

### 2.5 `GET /api/me/criteria`

**Auth:** session.

**Response 200**

```json
{
  "name": "Hải Nam",
  "age": 28,
  "city": "Hà Nội",
  "intent": "Nghiêm túc, kết hôn trong 2-3 năm",
  "dealBreakers": ["Không hút thuốc lá", "Yêu động vật"],
  "dealBreakerFlags": {
    "no_smoking": true,
    "long_term": true,
    "pet_friendly": true
  },
  "weights": [
    { "key": "long_term_goals", "label": "…", "value": 90 }
  ],
  "version": 1
}
```

`dealBreakerFlags` khớp `PreferencesPage` keys. `dealBreakers` string[] khớp `UserProfile`. `version` cho optimistic lock (DB `user_criteria.version`) — FE chưa có field.

**Consumers:** `PreferencesPage.tsx`, `AppStateContext.tsx` (`userProfile`).

---

### 2.6 `PUT /api/me/criteria`

**Auth:** session.

**Request**

```json
{
  "dealBreakerFlags": {
    "no_smoking": true,
    "long_term": true,
    "pet_friendly": true
  },
  "weights": [{ "key": "long_term_goals", "label": "…", "value": 90 }],
  "version": 1
}
```

`name`/`age`/`city`/`intent` **không** có form edit — không nhận trên PUT v1.

**Validation:** weights `value` 0–100 integer; keys thuộc tập radar; `version` khớp (optional 409).

**Response 200:** cùng shape GET criteria, `version` +1. Analysis cũ **stale** (`criteria_version`).

**Errors:** `400`; `401`; `409 VERSION_CONFLICT`.

**Consumers:** `PreferencesPage.tsx` `handleSave` (hiện chỉ `updateWeights` — contract nhận **cả** flags vì toast “tiêu chí và trọng số”).

---

### 2.7 `GET /api/me/privacy`

**Auth:** session.

**Response 200**

```json
{
  "incognito": false,
  "hideFromPartner": true,
  "noTraining": true
}
```

Khớp `privacyMeta` keys (JSON camelCase).

**Consumers:** `PreferencesPage.tsx` (state local, chưa persist).

---

### 2.8 `PUT /api/me/privacy`

**Auth:** session.

**Request / response:** cùng 3 boolean.

**Validation:** boolean required.

**Errors:** `400`; `401`.

**Consumers:** `PreferencesPage.tsx` — nên gộp Save hoặc PUT riêng khi toggle. FE Save hiện không gửi privacy.

---

### 2.9 `DELETE /api/me/analysis-history`

**Auth:** session. Owner only (self).

**Body:** rỗng.

**Response:** `204`. Xóa `explorations` CASCADE notes/analyses/chat. **Không** xóa `users` / `candidates`.

**Errors:** `401`.

**Consumers:** `PreferencesPage.tsx` `handleDeleteHistory` (`Modal.confirm`).

---

### 2.10 `GET /api/candidates`

**Auth:** session.

**Query**

| Param | Type | Required | Default | FE |
| --- | --- | --- | --- | --- |
| `minCompleteness` | int 0–100 | no | omit = không lọc server | `DiscoverPage` default **70** nên **gửi 70** khi nối |

Không `goals`/`values`/`lifestyle` (tag cloud không filter). Không `page`. Không `q`.

**Sort:** không guarantee UI; server `candidates.id ASC`.

**Response 200**

```json
{ "items": [ /* Candidate */ ] }
```

Mỗi phần tử đủ field `Candidate` để `CandidateCard` không đổi props.

**Errors:** `400` query; `401`.

**Empty:** `{ "items": [] }` — FE grid trống, không Empty component.

**Consumers:** `pages/DiscoverPage.tsx`, `components/CandidateCard.tsx` (qua list).

---

### 2.11 `GET /api/candidates/:candidateId`

**Auth:** session.

**Path:** `candidateId` (`cand_01` \| `cand_02` \| `cand_03`).

**Response 200:** một `Candidate` (catalog + overlay user: analysis, notes, chat, stage).

**Errors:** `401`; `404` → FE `Navigate` `/` (`ProfilePage`, `AnalysisPage`).

**Consumers:** `ProfilePage.tsx`, `AnalysisPage.tsx`, `ChatPanel.tsx` (nested), `RadarChart.tsx`, `ChecklistPanel.tsx`. Có thể preload Discover rồi chỉ GET detail — không bắt buộc.

---

### 2.12 `GET /api/explorations`

**Auth:** session.

**Query (optional):** `includeArchived=true|false` default `true` để **khớp FE hiện tại** (mọi mock candidate hiện trên My Analyses). Khi product chốt archive ẩn: default `false`.

**Sort:** `updated_at DESC`.

**Response 200:** `{ "items": Candidate[] }` cùng shape list (notes + stage cần cho `MyAnalysesPage`).

**Consumers:** `pages/MyAnalysesPage.tsx`.

Mismatch: FE không có “saved-only”; list = pool. Server có thể trả 3 catalog + exploration overlay kể cả chưa POST save.

---

### 2.13 `POST /api/explorations/:candidateId`

**Ý:** “Lưu để xem sau” / “Lưu vào đang tìm hiểu”.

**Auth:** session. `404` nếu candidate không seed.

**Body:** rỗng.

**Response 200/201:** `{ "candidateId", "stage" }` (`chatting` nếu mới).

Idempotent unique `(user_id, candidate_id)`.

**Consumers:** `ProfilePage.tsx` bookmark toast; `AnalysisPage.tsx` save exploring; `CandidateCard.tsx` bookmark (**dead** — chưa `onClick`).

---

### 2.14 `POST /api/explorations/:candidateId/match`

**Auth:** session.

**Body:** rỗng.

**Response 200:** `{ "stage": "matched" }`. **Không** P2P message.

**Consumers:** `AnalysisPage.tsx` Match button (toast-only hôm nay).

---

### 2.15 `POST /api/explorations/:candidateId/archive`

**Auth:** session.

**Body:** rỗng.

**Response 200:** `{ "stage": "archived" }`.

**Consumers:** `MyAnalysesPage.tsx` nút Lưu trữ (toast-only).

---

### 2.16 `POST /api/explorations/:candidateId/notes`

**Auth:** session. Tạo exploration nếu chưa có.

**Request**

```json
{ "text": "Sau buổi cafe, Linh muốn ở TP.HCM lâu dài." }
```

**Validation:** trim length ≥ 1 (FE no-op nếu rỗng).

**Response 201** `Note` (`timeLabel` server, ví dụ i18n “Vừa xong”).

**Errors:** `400 EMPTY_NOTE`; `401`; `404` candidate.

**Consumers:** `MyAnalysesPage.tsx` `handleAddNote` → `AppStateContext.addNote`.

---

### 2.17 `POST /api/clara/analyze`

**Auth:** session.

**Request (khớp FE, không tin client profile)**

```json
{ "candidateId": "cand_01" }
```

Server load criteria + candidate i18n theo `Accept-Language`. **Không** nhận full `user_profile` như `sample-contracts.json` (tránh spoof).

**Validation:** `candidateId` thuộc seed.

**Response 200:** `Candidate` đã có analysis (idempotent nếu `criteria_version` khớp và không note pending).

Hoặc tối thiểu analysis slice — **ưu tiên full `Candidate`** để `AnalysisPage` gán 1 object.

**Errors:** `401`; `404`; `422 LLM_SCHEMA`; `503 LLM_UNAVAILABLE`; `429`.

**Pagination:** không.

**Consumers:** `AnalysisPage.tsx` lúc mount (hiện mock sẵn). Design file: `docs/designs/matching-coach/proposal/sample-contracts.json`.

---

### 2.18 `POST /api/clara/reanalyze`

**Auth:** session.

**Request**

```json
{ "candidateId": "cand_01" }
```

Không gửi `new_observation_note` / `previous_analysis_id` — FE recalculate **sau** addNote, không kèm text. Server lấy notes `ingested_analysis_id IS NULL`.

**Response 200:** `Candidate` cập nhật (radar, checklist, completeness, compatibility, notes).

**Errors:** `401`; `404`; `409 NO_PENDING_NOTES` (nút FE disable đến khi add note); `422`; `503`.

**Consumers:** `MyAnalysesPage.tsx` `handleRecalculate` → `AppStateContext.recalculate`.

---

### 2.19 `POST /api/clara/chat`

**Auth:** session.

**Request**

```json
{ "candidateId": "cand_01", "text": "Gợi ý thêm câu mở đầu tự nhiên khác?" }
```

Locale từ header. Chip queries: `translations.ts` `chat.query*`.

**Validation:** trim ≥ 1.

**Response 200**

```json
{
  "userMessage": { "id": "…", "sender": "user", "text": "…" },
  "agentMessage": {
    "id": "…",
    "sender": "agent",
    "text": "…",
    "recommendation": { "title": "…", "items": [] }
  }
}
```

Incognito: vẫn 200 messages; **không persist**.

**Errors:** `400`; `401`; `404`; `503`.

**Không stream** (FE đợi 1 JSON).

**Consumers:** `components/chat/ChatPanel.tsx` (`send` → `appendChatMessage` + `chatSimulator.ts`).

---

### 2.20 `DELETE /api/clara/chat/:candidateId`

**Auth:** session.

**Response:** `204`. Xóa `chat_messages`, giữ analysis.

**Errors:** `401`; `404`.

**Consumers:** `ChatPanel.tsx` nút xóa lịch sử (**không `onClick`** hiện tại).

---

### 2.21 Không có trong contract v1

| Path | Lý do |
| --- | --- |
| Theme / locale persist | `ThemeContext` / `LocaleContext` localStorage |
| Forgot password, refresh token, OAuth | Không UI sống |
| Upload, search, payments | Không FE |
| `GET /api/health` | Pill Clara static |
| GraphQL / SSE `/clara/chat/stream` | FE one-shot |
| `PATCH /api/me` demographics | Không form |

---

## 3. HTTP status map

| Code | Khi |
| --- | --- |
| 200 | OK có body |
| 201 | Register, note |
| 204 | Logout, delete history, clear chat |
| 400 | Validation |
| 401 | Thiếu/sai session; login fail |
| 404 | Candidate / exploration không thấy (gồm không sở hữu) |
| 409 | Email trùng; reanalyze không note; criteria version |
| 422 | LLM JSON không đủ 7 trục / thiếu `sourceEvidence` |
| 429 | Rate limit login/chat |
| 503 | LLM timeout/down |

---

## 4. Frontend file → endpoints

| File | Endpoints khi nối |
| --- | --- |
| `pages/auth/LoginPage.tsx` | `POST /auth/login` |
| `pages/auth/RegisterPage.tsx` | `POST /auth/register` |
| `store/AuthContext.tsx` | login, register, logout |
| `components/RequireAuth.tsx` | gián tiếp 401 → `/login` |
| `components/layout/AppLayout.tsx` | `POST /auth/logout`, `GET /me` |
| `pages/DiscoverPage.tsx` | `GET /candidates?minCompleteness=` |
| `components/CandidateCard.tsx` | đọc list; bookmark → `POST /explorations/:id` |
| `pages/ProfilePage.tsx` | `GET /candidates/:id`, POST exploration |
| `pages/AnalysisPage.tsx` | GET detail và/hoặc `POST /clara/analyze`; match; save |
| `components/chat/ChatPanel.tsx` | `POST /clara/chat`, `DELETE /clara/chat/:id` |
| `components/RadarChart.tsx` | data từ parent Candidate |
| `components/ChecklistPanel.tsx` | data từ parent |
| `pages/MyAnalysesPage.tsx` | `GET /explorations`, notes, reanalyze, archive, GET/chat |
| `pages/PreferencesPage.tsx` | GET/PUT criteria, privacy, DELETE history |
| `store/AppStateContext.tsx` | lớp state thay mock sau khi API trả `Candidate[]` / `UserProfile` |
| `store/LocaleContext.tsx` | chỉ header `Accept-Language` |
| `utils/chatSimulator.ts` | **thay** bằng `POST /clara/chat` |

`LanguageSwitcher.tsx`, `ThemeToggle.tsx`: không API.

---

## 5. Inconsistency report

Mọi lệch giữa FE types, “API calls” (không tồn tại), BACKEND_SPEC, DB, design contracts.

### 5.1 Frontend không có API calls

| Bên | Sự thật |
| --- | --- |
| FE | Zero HTTP |
| Spec/Arch | REST `/api/...` |
| **Kết luận** | Contract là **mục tiêu nối**; chưa có service layer. Nối mạng = thêm client, **không** đổi `Candidate` nếu API trả đúng type |

### 5.2 Naming: camelCase vs snake_case

| FE / API này | `sample-contracts.json` | DB |
| --- | --- | --- |
| `candidateId` | `candidate_id` | `candidate_id` |
| `dataCompleteness` | `data_completeness` | `data_completeness` |
| `sourceEvidence` | `source_evidence` | trong `payload_json` |
| `overallCompatibility` | `overall_compatibility` | cột + payload |

**Quyết định:** HTTP camelCase. Adapter Clara/DB map cột.

### 5.3 Envelope analyze

Design: `{ status, data: { radar_axes, direct_comparison, ... } }`.  
FE: phẳng trên `Candidate`.  
API v1: **phẳng `Candidate`**, không `status: success`.

### 5.4 Analyze request body

Design gửi full `user_profile` + `candidate_profile`.  
ARCHITECTURE/DB: session + `candidateId`.  
FE: không có form gửi questionnaire.  
**API v1:** `{ candidateId }` only.

### 5.5 Reanalyze request

Design: `new_observation_note`, `previous_analysis_id`.  
FE: chỉ `recalculate(candidateId)` sau note.  
DB: `ingested_analysis_id` NULL.  
**API v1:** `{ candidateId }`.

### 5.6 Reanalyze response vs FE mutation

FE: chỉ `dataCompleteness = min(98, +14)`.  
Design: compatibility, radar, `promoted_items`.  
DB: full `payload_json` version mới.  
**API:** trả `Candidate` đầy đủ — **FE phải gán object**, không `+14` khi nối (đổi `AppStateContext.recalculate`, không đổi type).

### 5.7 Weights 5 vs 7

| Nguồn | Trục |
| --- | --- |
| `UserProfile.weights` mock | 5 (thiếu `finances`, `future_plans`) |
| `Candidate.radarAxes` / design | 7 |
| DB `weights_json` | JSON tự do + `json_valid` |
| PUT criteria | chấp nhận 5 hoặc 7; Clara map thiếu = default |

### 5.8 Weights scale

FE slider 0–100. Design `dimension_weights` 0–1. DB JSON 0–100. API **0–100**. Clara chia 100 nếu model cần 0–1.

### 5.9 Deal-breakers

| Nguồn | Shape |
| --- | --- |
| `UserProfile.dealBreakers` | `string[]` |
| Preferences switches | `{ no_smoking, long_term, pet_friendly }` |
| DB | 3 INTEGER flags |
| Design | `string[]` |

API GET trả **cả hai**. PUT **flags**. FE Save chưa gửi flags (mismatch hành vi).

### 5.10 Note / chat column names

FE `Note.text`, `ChatMessage.text`. DB `body`. API JSON dùng **`text`**.

FE `timeLabel` / `stageLabel` / `savedLabel`: không cột — API derive.

### 5.11 AuthUser vs UserProfile vs users table

| | Fields |
| --- | --- |
| `AuthUser` | name, email |
| `UserProfile` | name, age, city, intent, dealBreakers, weights — **không email** |
| Header | `user.name` + hardcode age/city |
| DB `users` | id, email, name, password_hash |
| DB criteria | age, city, intent, flags, weights |

Login JSON **chỉ** `AuthUser` để khỏi sửa `AuthContext`. Age/city qua `GET /me` (FE chưa gọi).

Register không lưu password trên FE; DB bắt buộc `password_hash`. Login FE chấp mọi email; API **401** nếu sai — **đổi hành vi**, không đổi form.

### 5.12 Password policy

FE ≥ 4. API/DB ≥ 8 (DATABASE.md + BACKEND_SPEC). Demo `Demo@1234` vẫn pass. Register FE có thể fail 400 nếu user chọn pwd 4–7 ký tự — **cần copy** hoặc nới DB (chốt product).

### 5.13 Checklist `tag` vs `match_score`

FE `tag?: string`. Design `match_score`. DB payload theo FE `tag`.

`direct_comparison.status` vs `CompareRow.needsConfirmation`. API dùng FE.

### 5.14 `nextDatePlan`

FE + DB payload **có**. `sample-contracts` analyze **không**. API **có**.

### 5.15 Chat

Proposal HTML `/api/clara/chat`. `sample-contracts.json` **không**. FE simulator. API **có** 2.19. Không SSE.

### 5.16 Discover tags vs query

FE tag state không filter. API **không** query tags. DB `tags_json` không index search.

### 5.17 Completeness filter

FE client `c.dataCompleteness >= min`. API `minCompleteness`. Chưa analyze = 0 → **ẩn** với default 70 cho đến analyze hoặc hạ slider. Khác mock (mọi card đã có %).

### 5.18 My Analyses = all candidates

FE `candidates.map`. DB explorations có thể 0 hàng. API GET `/explorations` **v1 trả overlay trên cả catalog** để khỏi đổi page (Inferred watching-list vs pool — BACKEND_SPEC open).

### 5.19 Stage mutations

FE toast không đổi `stage`. DB `explorations.stage` + enum. API match/archive/save **có** — FE chưa gọi.

### 5.20 Delete / clear

FE toast / dead button. DB CASCADE / DELETE messages. API 2.9, 2.20.

### 5.21 Incognito / no_training

FE switches local. DB `privacy_settings`. API GET/PUT privacy. Không field trên `UserProfile`.

### 5.22 i18n

FE hai mock files. DB `candidate_i18n`. API `Accept-Language`. Đổi locale FE hiện **wipe** in-memory notes — API **giữ** notes; analysis `locale` cột có thể stale (reanalyze/analyze lại) — **mismatch UX** nếu không refetch.

### 5.23 `questionnaire_json`

DB có. FE `Candidate` **không** có questionnaire. API **không** bắt FE type mới; Clara đọc DB.

### 5.24 `analysis_id`

Design reanalyze `previous_analysis_id`. FE không. DB `id` + `previous_analysis_id`. API ẩn trong server.

### 5.25 Health pill

FE static. Không GET health.

### 5.26 Pagination / search

Không UI, không query, không bảng FTS — nhất quán.

### 5.27 Radar footnote vs PUT criteria

Copy: trọng số ảnh hưởng radar. FE không reanalyze khi Save. API đánh dấu stale; GET list có thể còn payload cũ đến `POST /analyze` — **cần** refetch analyze sau Save (FE chưa làm).

### 5.28 HTML chat

FE `dangerouslySetInnerHTML`. DB `body` TEXT. API `text` có thể HTML. Sanitize phía server — FE không đổi.

---

## 6. Minimal FE wiring (không implement ở đây)

Khi nối, **không bắt buộc** đổi `types/index.ts` nếu API trả `Candidate` / `AuthUser` / `Note` / `ChatMessage`.

Có thể thêm (không bắt buộc contract): `credentials: 'include'`; gửi `minCompleteness`; `Accept-Language`.

Đổi hành vi (không phải type): login 401 thật; recalculate replace Candidate; persist notes qua reload.

---

*Hết hợp đồng API. Chưa implement HTTP server.*
