# Architecture — CLARA Matching Coach

**Ngày:** 2026-09-14  
**Đầu vào:** `docs/FRONTEND_AUDIT.md`, `docs/BACKEND_SPEC.md`, `frontend/src/**`  
**Phạm vi:** Quyết định kiến trúc. **Không** chứa mã triển khai.

Mỗi quyết định dưới đây gắn với nhu cầu sản phẩm thật (SPA Matching Coach, dữ liệu tình cảm nhạy cảm, 3 hồ sơ seed, Clara LLM, không dating-app đầy đủ). Hạ tầng không giải quyết nhu cầu đó bị **loại**.

---

## 1. System Overview

### Sản phẩm trong runtime

Một SPA (`frontend/`, Vite + React) để user đăng nhập, xem hồ sơ gợi ý, mở không gian phân tích với Clara, chat, ghi chú sau buổi gặp, chỉnh tiêu chí, xóa lịch sử phân tích. Frontend hiện mock toàn bộ; backend phải thay mock bằng **một API + một CSDL quan hệ + một LLM provider**.

### Hình dạng hệ thống

```
┌─────────────────────────────────────────────────────────┐
│  Trình duyệt                                            │
│  React SPA  ·  theme/locale localStorage (không API)    │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS, same-origin /api
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Modular monolith (một process)                         │
│  HTTP + session cookie + modules (auth…clara)           │
│  Gọi LLM đồng bộ trong request analyze/chat/reanalyze   │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
               ▼                          ▼
     ┌─────────────────┐        ┌─────────────────┐
     │ Relational DB   │        │ LLM provider    │
     │ (một instance)  │        │ (HTTPS)         │
     └─────────────────┘        └─────────────────┘
```

**Không có:** object storage, message broker, vector DB, Redis, Kubernetes, service mesh, email gateway, payment, P2P chat server.

### Vì sao modular monolith, không microservices

| Yếu tố sản phẩm | Hệ quả kiến trúc |
| --- | --- |
| Một SPA, 7 route, một loại user | Một bounded context “compatibility copilot”, không có team/domain độc lập cần deploy riêng |
| 3 ứng viên seed, không GPS/swipe/inbox | Không có dịch vụ matching realtime hay media |
| Analyze/chat/reanalyze đọc cùng criteria + analysis + notes | Tách service sẽ tạo chatty RPC trên mọi request Clara |
| FE không poll job, không webhook | Không cần hàng đợi đa service |
| Dữ liệu phải không lộ sang “đối phương” | Một process + một DB dễ enforce ownership hơn lưới service |

Microservices chỉ có lý khi scale độc lập (ví dụ hàng triệu profile + media CDN). Sản phẩm hiện tại **không** có yêu cầu đó.

### Quyết định runtime (ngôn ngữ)

**Một backend TypeScript** (cùng hệ sinh thái với `frontend/src/types`) chạy HTTP server.

**Vì sao:** Domain types đã nằm ở frontend (`Candidate`, `Checklist`, `ChatMessage`, …). Monolith TS giảm lệch contract. Không bắt buộc framework cụ thể trong tài liệu này.

---

## 2. Backend Architecture

### Nguyên tắc

1. **Một deployable** — API process phục vụ toàn bộ `/api/*`.
2. **Module theo domain sản phẩm**, không theo tầng kỹ thuật (không chia `controllers-service` thành repo riêng).
3. **Clara (AI) không sở hữu dữ liệu** — chỉ nhận DTO đã load, trả JSON có schema; persistence thuộc `analyses` / `conversations`.
4. **Ứng viên là catalog seed**, không phải user-generated inventory.
5. **Mọi dữ liệu phân tích thuộc user đang login** — module khác không được query “theo candidateId” mà bỏ `userId`.

### Layers trong một process

```
HTTP (routes, cookie, locale)
    → module API handler
        → domain service (rules BACKEND_SPEC §5)
            → repository (SQL)
            → clara client (chỉ module clara)
```

Handlers không gọi LLM trực tiếp. `explorations` được thêm note; `clara` đọc note + analysis để reanalyze. Vòng phụ thuộc: `clara` phụ thuộc domain DTO; domain **không** phụ thuộc vendor SDK.

### Thành phần cố ý không có

| Thành phần | Lý do loại |
| --- | --- |
| API gateway riêng | Một origin, vài endpoint |
| BFF tách khỏi API | SPA đủ mỏng; không đa client |
| Worker fleet | FE expect JSON sync (chat ~900ms, recalculate tức thì) |
| GraphQL | FE chưa có client; REST khớp `sample-contracts.json` |

---

## 3. Domain Modules

Ranh giới lấy từ UI thật, **không** copy `projects/` / `documents/`.

```
modules/
  auth/             # register, login, logout, session
  users/            # GET/PUT me, criteria, privacy, xóa lịch sử (orchestration)
  candidates/       # seed hồ sơ, GET list/detail (phần catalog)
  explorations/     # watching, stage, notes
  analyses/         # persist CompatibilityAnalysis, versions
  conversations/    # tin nhắn Clara theo exploration
  clara/            # prompt, schema, provider, guardrail
  shared/           # errors, logging, db handle — không chứa business dating
```

### 3.1 `auth`

**Chịu trách nhiệm:** `UserAccount` credentials, session cookie, login rate-limit in-process.  
**Không:** tiêu chí radar, gọi LLM.  
**Vì sao tách:** FE có `/login` `/register` public; còn lại `RequireAuth`. Vòng đời session khác vòng đời analysis.

### 3.2 `users`

**Chịu trách nhiệm:** hồ sơ hiển thị (`name`, `age`, `city`, `intent`), `UserCriteria` (deal-breakers, weights), `PrivacySettings`, điều phối `DELETE analysis-history`.  
**Không:** nội dung ứng viên.  
**Vì sao:** PreferencesPage + header user là “self”; xóa lịch sử là quyền user, không phải admin.

### 3.3 `candidates`

**Chịu trách nhiệm:** 3 hồ sơ `cand_01|02|03` (vi/ja), `distanceKm` tĩnh, `gradient`, questionnaire.  
**Không:** điểm tương thích (thuộc `analyses` theo user).  
**Vì sao:** FE nhúng score vào `Candidate` vì mock; backend **tách catalog vs analysis** để hai user không đè điểm nhau.

### 3.4 `explorations`

**Chịu trách nhiệm:** cặp `(userId, candidateId)`, `DatingStage`, `ObservationNote`, save/match/archive.  
**Không:** JSON radar.  
**Vì sao:** My Analyses là tiến trình tìm hiểu (stage, notes, “đang theo dõi”), khác bản đồ tương thích.

### 3.5 `analyses`

**Chịu trách nhiệm:** bản ghi `CompatibilityAnalysis` (radar, checklist, compare, completeness, icebreakers, probing, nextDatePlan, summary), `previous_analysis_id`.  
**Không:** gọi model.  
**Vì sao:** AnalysisPage và card Discover đọc cùng shape; cache/invalidation sống ở đây.

### 3.6 `conversations`

**Chịu trách nhiệm:** lịch sử `ChatMessage` user/agent + recommendation JSON; xóa thread; tôn trọng `incognito` (không ghi).  
**Không:** P2P (sản phẩm cấm).  
**Vì sao:** ChatPanel là thread theo candidate, độc lập nút Match toast.

### 3.7 `clara`

**Chịu trách nhiệm:** bốn engine (analyze, chat, reanalyze, guardrail), locale vi/ja, structured output, `no_training` → cờ provider.  
**Không:** SQL. Input do service khác assemble.  
**Vì sao:** proposal “Core Agent làm thật”; thay vendor không đụng schema exploring.

### Phụ thuộc cho phép

```
auth ← users
candidates ← (read) explorations, analyses, clara
explorations ← users, candidates
analyses ← explorations, users, candidates
conversations ← explorations, users
clara ← (DTO only)  // được gọi bởi analyses + conversations services
users ──orchestrate──► analyses, conversations, explorations   # delete history
```

Cấm: `candidates` import `clara`; `auth` import `clara`.

---

## 4. Database Architecture

### Một CSDL quan hệ

**Chọn:** một engine SQL. **Dev/demo:** SQLite file. **Nhiều process/máy:** Postgres cùng schema.

**Vì sao SQL, không document DB:** quan hệ rõ (`user` 1—N `exploration` 1—N `note`/`message`/`analysis`); uniqueness `(user_id, candidate_id)`; xóa cascade lịch sử.  
**Vì sao không Redis:** không session scale-out, không leaderboard, không pub/sub. Session nằm **bảng `sessions`** trong cùng DB — logout FE yêu cầu revoke được.  
**Vì sao không vector DB:** context Clara = criteria + 1 candidate + analysis + notes + vài message; nhét prompt, không retrieval corpus.

### Logical schema (không phải migration)

```
users
  id PK, email UNIQUE, name, password_hash, created_at

sessions
  id PK, user_id FK, token_hash UNIQUE, expires_at
  -- vì sao: SPA reload vẫn login (clara-auth-user); logout phải hủy hàng

user_criteria
  user_id PK/FK
  age, city, intent, lifestyle
  deal_breaker_no_smoking, deal_breaker_long_term, deal_breaker_pet_friendly
  weights_json          -- 5 hoặc 7 trục 0–100; conflict spec để implementation chốt

privacy_settings
  user_id PK/FK
  incognito, hide_from_partner, no_training

candidates
  id PK                 -- cand_01…
  distance_km, gradient
  -- nội dung đa ngữ: candidates_i18n (candidate_id, locale) name, job, location, bio, tags_json, questionnaire_json
  -- vì sao: FE data.ts + data.ja.ts

explorations
  id PK
  user_id FK, candidate_id FK
  UNIQUE(user_id, candidate_id)
  stage                  -- matched | chatting | met-once | archived
  created_at, updated_at

observation_notes
  id PK, exploration_id FK
  author                 -- user | system
  body
  created_at
  ingested_analysis_id FK NULL

compatibility_analyses
  id PK, exploration_id FK
  payload_json           -- radar, checklist, compare, scores… khớp FE
  overall_compatibility, data_completeness
  is_current BOOL
  previous_analysis_id FK NULL
  created_at
  -- vì sao JSON payload: FE cần blob lớn, ít query ad-hoc theo trục; cột số để filter Discover minCompleteness

chat_messages
  id PK, exploration_id FK
  sender, body, recommendation_json NULL, created_at
```

Candidate seed **không** xóa khi user xóa lịch sử. Delete history: xóa explorations của user (cascade notes, analyses, messages).

### Ownership trong SQL

Mọi query analysis/notes/chat **bắt đầu từ `explorations.user_id = session.user_id`**. Không `WHERE candidate_id = ?` trần.

---

## 5. API Architecture

### Style

REST JSON dưới `/api`, như `BACKEND_SPEC` và `POST /api/clara/analyze|reanalyze`.

**Vì sao REST:** FE sẽ `fetch` theo hành động trang; design file đã REST; không subscription UI.

### Origin

**Reverse proxy cùng origin** (SPA static + `/api` prefix).

**Vì sao:** cookie session httpOnly không cần localStorage token (XSS chat HTML là rủi ro thật trên FE). Theme/locale vẫn localStorage — không nhạy.

### Bảng route → module

| Route | Module |
| --- | --- |
| `/api/auth/*` | auth |
| `/api/me`, `/api/me/criteria`, `/api/me/privacy`, `DELETE /api/me/analysis-history` | users |
| `/api/candidates`, `/api/candidates/:id` | candidates + join analyses |
| `/api/explorations*` | explorations |
| `/api/clara/analyze`, `/reanalyze` | analyses service → clara |
| `/api/clara/chat`, `DELETE .../chat/:id` | conversations → clara |

### Thành phần response

- Catalog fields từ `candidates`.
- Overlay per-user từ `compatibility_analyses` hiện tại + `explorations`.
- Discover `minCompleteness`: filter SQL/in-memory trên cột `data_completeness` của **analysis của user**; chưa analyze → completeness 0 hoặc ẩn khỏi default 70 **(chốt lúc implement; FE default 70)**.

### Idempotency analyze

`POST /analyze` với cùng user+candidate+`criteria_version` trả bản `is_current` nếu chưa có note mới. **Vì sao:** user vào `/analysis/:id` nhiều lần; FE không có nút “chạy lại từ đầu” riêng với analyze lần đầu.

### Versioning

Không `/v1` cho đến khi phá contract FE. Prefix `/api` đủ.

---

## 6. Authentication

### Quyết định: session phía server + cookie httpOnly + `SameSite=Lax`

Luồng FE bắt buộc: register **không** set session; login set; reload giữ; logout xóa.

| Phương án | Vì sao không chọn làm mặc định |
| --- | --- |
| JWT trên `localStorage` | Trùng lỗ XSS với `dangerouslySetInnerHTML` chat; logout không revoke |
| JWT stateless thuần | Không bảng session — logout FE không vô hiệu token còn hạn |
| OAuth | Không UI |
| FE mock “mọi email đều vào” | Vi phạm lưu notes/chat nhạy cảm |

Cookie đặt bởi `POST /login`. SPA `credentials: include`. CSRF: same-origin proxy giảm rủi ro; nếu FE/API lệch port dev thì double-submit token hoặc proxy Vite.

Mật khẩu: hash (Argon2/bcrypt) trong `users`. Demo `demo@clara.app` seed. Policy server **≥ FE** (`length >= 4` chỉ là mock).

`GET /api/me` thay `clara-auth-user` cho name/age/city. **Vì sao:** header đang hardcode 28 / Hà Nội.

Forgot-password / remember-me: **không** có trong kiến trúc v1 (control chết trên FE).

---

## 7. Authorization

Một role `authenticated_user`.

Middleware: session hợp lệ → `userId` trên request. Public chỉ register/login.

| Tài nguyên | Rule | Vì sao (sản phẩm) |
| --- | --- | --- |
| Candidate catalog | Mọi user đã login đọc | Pool mock dùng chung |
| Analysis, notes, Clara chat, stage | Chỉ `exploration.user_id` | Copy “ẩn với đối phương”, “sandbox”; không actor candidate |
| `hide_from_partner=false` | **Vẫn không** mở API cho người khác | Không có UI share; flag là cam kết, không phải ACL đa user |
| Delete history | Chỉ data của self; giữ `candidates` | Copy danger zone |
| Clara | Chỉ với `candidateId` thuộc seed | Tránh prompt injection id lạ |

Lỗi ownership: **404** không 403 (tránh dò exploration id).

Không RBAC admin — không màn admin.

---

## 8. File Storage

**Không có object storage, disk upload, CDN ảnh.**

**Vì sao:** FE dùng CSS `gradient` + SVG; không `input type=file`, không FormData, không download. `BACKEND_SPEC` loại hạng mục này.

Avatar sau này là thay đổi sản phẩm, không phải phần kiến trúc hiện tại.

---

## 9. Background Jobs

**V1: không hàng đợi, không worker, không job id.**

LLM chạy **trong HTTP request** analyze / reanalyze / chat (timeout cứng, ví dụ 30–60s).

**Vì sao:**

- ChatPanel: một reply sau delay, không SSE.
- Recalculate: toast ngay với payload mới.
- AnalysisPage: không Spin “đang phân tích”.
- Không UI poll / `previous_analysis` async.

Nếu p95 LLM quá chậm, **đổi FE trước** (loading + job), rồi mới thêm queue. Thêm Kafka/Redis “phòng khi” không khớp sản phẩm đang có.

Precompute 3 summary khi PUT criteria: vẫn **inline** trong request Save (3 completion) hoặc để lần list/analyze sau cache-miss. Không broker.

---

## 10. AI Architecture

### Vị trí

Chỉ module `clara`. Provider = HTTP API một vendor. Adapter mỏng: `completeJson(schema, messages, { locale, noRetention })`.

```
analyses.analyze()
  load criteria, candidate, current analysis?
  → clara.analyze(dto)
  → validate schema (7 axes, 3 checklist groups, sourceEvidence bắt buộc)
  → analyses.save() + explorations.ensure() + system note

conversations.chat()
  load thread, analysis, notes, privacy.incognito
  → clara.chat(dto)
  → persist unless incognito

explorations.addNote()        # không LLM
analyses.reanalyze()
  reject nếu không note chưa ingest
  → clara.reanalyze(previous, notes)
  → new analysis version, mark notes ingested
```

### Không RAG / không tool-calling bắt buộc

Hồ sơ + note + thread nhỏ hơn cửa sổ context. Function calling không có hệ thống ngoài (không calendar, không maps — `distanceKm` giả).

### Guardrail

System prompt + post-check: có `sourceEvidence`; cấm ngôn ngữ “người này kém”; finance chip không thúc hỏi tiền. Safety tips My Analyses là copy i18n FE — không model.

### Locale

`Accept-Language` hoặc body `locale` (`vi`|`ja`). Catalog i18n từ DB; Clara sinh cùng ngôn ngữ. **Vì sao:** LanguageSwitcher đổi mock content; session analysis không được trả nhầm user khác khi đổi locale.

### Chi phí

Cache analysis theo `(userId, candidateId, criteriaHash, locale)` trong DB `is_current`. Chat không cache. Log token (không log nội dung note nếu `no_training`).

---

## 11. Caching

| Lớp | Công cụ | Dùng khi |
| --- | --- | --- |
| Browser | HTTP cache tắt cho `/api/me`, analyses | Dữ liệu theo user, privacy |
| Application | **Không Redis** | |
| Database | Hàng `is_current` analysis | Discover/Profile/Analysis đọc lại |
| Process memory | Optional `Map` catalog 3 candidates | Seed hiếm đổi |

**Vì sao không Redis:** 3 hồ sơ + analysis JSON theo user; SQL đủ; thêm Redis là SPOF và ops không giải quyết bottleneck đã đo.

Invalidation: `PUT /api/me/criteria` → `is_current=false` (hoặc xóa current) để lần analyze/list tính lại. **Vì sao:** footnote radar “theo tiêu chí của bạn” nhưng FE chưa reanalyze khi kéo slider.

---

## 12. Error Handling

Envelope (FE chưa có; cần khi nối mạng):

```json
{ "error": { "code": "UNAUTHORIZED", "message": "…" } }
```

| HTTP | Khi nào | Hành vi FE hiện tại / mong đợi |
| --- | --- | --- |
| 400 | Validation (email, empty note, weights) | Toast auth; note no-op |
| 401 | Hết session | `RequireAuth` → `/login` |
| 404 | Sai `candidateId` / không sở hữu | `<Navigate to="/" />` |
| 409 | Email trùng; reanalyze không có note mới | Register toast; disable nút |
| 422 | LLM JSON không parse sau retry | Chưa có UI — log + message generic |
| 429 | Login/chat abuse (in-process counter) | Chưa có UI |
| 503 | Provider down / timeout | Chat hiện không fail — cần toast |

Không nuốt lỗi LLM thành “completeness +14” giả.

---

## 13. Logging

Structured log một dòng/request: `request_id`, `user_id` (sau auth), `route`, `status`, `duration_ms`, `candidate_id` nếu có, `llm_tokens` nếu Clara.

**Không log:** password, body note/chat đầy đủ khi `no_training`, cookie raw.

**Vì sao:** dữ liệu hẹn hò + ghi chú sau buổi gặp là PII nhạy cảm; copy ethics + `no_training`. Debug Clara dùng `analysis_id` + `request_id`, không dump prompt có tên thật trên log tập trung nếu có thể tránh.

---

## 14. Observability

Tối thiểu:

- Log stdout (process manager / host thu)
- `GET /api/health` **liveness process + DB open** — không gắn pill “Clara sẵn sàng” trừ khi product quyết (pill hiện **static**)
- Đếm 5xx và timeout LLM (metric in-process hoặc log-based)

**Không:** distributed tracing đa service (một process), APM bắt buộc, OpenTelemetry mesh.

**Vì sao đủ:** một monolith, bottleneck là LLM latency, nhìn `duration_ms` + token trên log request Clara.

---

## 15. Security

Bắt buộc vì **ghi chú tình cảm, tiêu chí, chat coach**, không vì checklist generic.

| Kiểm soát | Vì sao |
| --- | --- |
| Hash mật khẩu | FE mock không lưu pwd; backend không được bắt chước |
| Cookie httpOnly, không token localStorage | XSS từ HTML chat |
| Sanitize hoặc cấm HTML từ model | `dangerouslySetInnerHTML` |
| Ownership trên mọi exploration | Ẩn phân tích với đối phương |
| `no_training` → API vendor zero-retention / disable logs | Switch Preferences |
| Incognito → không INSERT chat/notes | Copy “không lưu sau khi đóng phiên” — chốt: không persist Clara turns khi flag on |
| Không endpoint đọc “tin nhắn thật” | Tôn chỉ sản phẩm |
| HTTPS production | Session cookie |
| Rate limit login + `/clara/chat` in-memory | Tránh abuse LLM cost; không cần Redis |
| Secrets LLM chỉ env process | Không commit |

CORS chặt nếu chưa same-origin.

---

## 16. Scalability

Mục tiêu: demo/hackathon và vài trăm user đồng thời, **không** triệu swipe/ngày.

Nút thắt: **số call LLM**, không CPU SQL (N candidate = 3).

Cách scale hợp sản phẩm:

1. Cache analysis trong DB (đã thiết kế).
2. Timeout + 429 chat.
3. Một replica API chỉ khi SQLite hết phù hợp → Postgres + vài process stateless (session vẫn trong DB, không sticky Redis).

Không scale bằng Kafka partition hay K8s HPA “vì chuẩn production”. Khi có bằng chứng p95/queue, mở lại jobs + FE loading.

---

## 17. Deployment

```
[static SPA] ─┐
              ├─ reverse proxy :443
[api process]─┘     /        /api
                    │
              [sqlite file | postgres]
```

- **Dev:** Vite :5173 proxy `/api` → API :3000 (hoặc tương đương); SQLite local.
- **Prod:** một VM hoặc một PaaS process; SPA build copy vào cùng proxy; env `DATABASE_URL`, `LLM_API_KEY`, `SESSION_SECRET`.
- Seed candidates + demo user lúc migrate.
- **Không** Kubernetes, multi-region, blue/green bắt buộc.

**Vì sao:** một frontend-only repo đang chờ một API; ops phải nhỏ hơn domain Clara.

Backup: file SQLite / Postgres dump — chứa notes/chat; mã hóa at-rest bên host nếu có.

---

## 18. Request / data flows

### 18.1 Register → Login → Discover

```
RegisterPage
  POST /api/auth/register { name, email, password }
  auth: unique email, hash, insert users + default criteria/privacy
  201 { user }  NO cookie
  → /login

LoginPage
  POST /api/auth/login { email, password }
  auth: verify, insert sessions, Set-Cookie
  200 { user }
  → /

DiscoverPage
  GET /api/candidates?minCompleteness=70
  candidates: 3 rows i18n
  analyses: left join current payload for this user
  filter completeness
  200 items[]  (score/summary rỗng hoặc cache)
```

Theme/locale không đi qua server.

### 18.2 Discover → Profile → Analysis (Clara analyze)

```
GET /api/candidates/cand_01
  404 → FE về /
  200 catalog + overlay analysis nếu có

Mở /analysis/cand_01
  POST /api/clara/analyze { candidateId }   # server lấy user từ session
    explorations.ensure(user, cand)
    if current analysis && criteriaHash match && no pending notes
      return cached
    candidates.load + users.criteria
    clara.analyze → validate
    analyses.insert is_current
    notes.insert system “khởi tạo”
    conversations.insert welcome agent message (optional, mock có sẵn history)
  200 full analysis DTO = AnalysisPage + ChatPanel initial
```

Không worker. Timeout → 503.

### 18.3 Chat Clara

```
ChatPanel send
  POST /api/clara/chat { candidateId, text, locale }
  400 nếu empty
  explorations.mustOwn
  if !privacy.incognito: insert user message
  load analysis + notes + last messages
  clara.chat
  if !incognito: insert agent message
  200 { agentMessage }
```

Clear history: `DELETE` messages, giữ analysis.

### 18.4 Note → Reanalyze (My Analyses)

```
POST /api/explorations/cand_01/notes { text }
  insert note ingested_analysis_id NULL
  201 note (timeLabel derive)

POST /api/clara/reanalyze { candidateId }
  409 nếu không note pending
  clara.reanalyze(previous payload, notes)
  analyses: is_current false cũ; insert mới; link previous
  stamp notes ingested
  200 updated radar/checklist/completeness/compatibility
```

Không `+14` cứng.

### 18.5 Preferences save và xóa lịch sử

```
PUT /api/me/criteria { weights, dealBreakers }
  update user_criteria
  analyses.mark stale for user
  200

PUT /api/me/privacy { incognito, hideFromPartner, noTraining }
  200  — ảnh hưởng persist chat và cờ LLM

DELETE /api/me/analysis-history
  delete explorations of user (cascade)
  204
  candidates seed intact
```

### 18.6 Logout

```
POST /api/auth/logout
  delete session row
  Clear-Cookie
  FE → /login
```

### 18.7 Match / Archive / Save (inferred persist)

Cùng module `explorations`, cập nhật `stage`. Không tạo message P2P, không email. Match toast vẫn đúng nếu chỉ `stage=matched`.

---

## 19. Quyết định đã chốt vs cố ý không làm

| Chốt | Không làm (v1) |
| --- | --- |
| Modular monolith TS + SQL | Microservices, K8s, Kafka |
| Session DB + cookie | JWT localStorage, OAuth |
| Module theo dating domain | `projects/documents/notifications` |
| LLM sync in request | Redis queue, Celery |
| Analysis JSON in SQL | Vector DB, Elasticsearch |
| Catalog 3 candidates | Media bucket, GPS |
| Same-origin `/api` | GraphQL gateway |

---

## 20. Open (không chặn hình dạng hệ thống)

- SQLite vs Postgres ngay production đầu tiên (schema giống nhau).
- 5 vs 7 weight keys (module `users` + `clara` map).
- Discover khi user chưa analyze lần nào (completeness 0).
- Incognito “đóng phiên” = logout hay tắt tab.
- HTML vs plain text trong `chat_messages.body`.

Những điểm này không đòi thêm loại hạ tầng mới.

---

*Hết kiến trúc. Chưa implement backend.*
