# Database Design — CLARA Matching Coach

**Ngày:** 2026-09-14  
**Engine (dev/demo):** SQLite 3  
**Engine (nhiều process):** cùng schema trên PostgreSQL  
**Nguồn:** `docs/BACKEND_SPEC.md`, `docs/ARCHITECTURE.md`, `frontend/src/types/index.ts`  
**Migration thực tế:** `backend/db/migrations/`  
**ORM schema:** `backend/src/db/schema.ts` (Drizzle, TypeScript)

Mọi ràng buộc toàn vẹn sống **trên CSDL + transaction**, không tin validation frontend.

---

## 1. Principles

| Nguyên tắc | Áp dụng |
| --- | --- |
| Chỉ entity sản phẩm cần | Không bảng file, job, payment, notification, vector, audit_log, FTS |
| Không lưu derived không cần query | `stageLabel`, `savedLabel`, `timeLabel` **không** có cột — derive lúc đọc |
| Derived **được** lưu khi filter/index | `overall_compatibility`, `data_completeness` — Discover lọc `minCompleteness` |
| Catalog ≠ analysis | Điểm Clara **không** nằm trên `candidates` |
| Ownership | Mọi note/chat/analysis đi qua `explorations.user_id` |
| Hard delete lịch sử | `DELETE` cascade theo exploration; không soft-delete (copy “xóa vĩnh viễn”) |
| Không soft-delete user | Không UI xóa account |
| Không pagination schema | FE không page/cursor; N=3 hồ sơ. List notes/chat: `ORDER BY created_at DESC` |
| Không search engine | Không `LIKE` toàn cục, không FTS5 |
| Concurrent | Unique pair user–candidate; tối đa một analysis `is_current` mỗi exploration; `BEGIN IMMEDIATE` |

**Timestamps:** `TEXT` ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`). SQLite không có `timestamptz`.

**Boolean:** `INTEGER` 0/1.

**PK:** `TEXT` (ULID/UUID do app; candidate id tự nhiên `cand_01`).

---

## 2. ER diagram

```
users 1──1 user_criteria
users 1──1 privacy_settings
users 1──N sessions
users 1──N explorations N──1 candidates
candidates 1──N candidate_i18n
explorations 1──N observation_notes
explorations 1──N compatibility_analyses
explorations 1──N chat_messages
observation_notes N──0..1 compatibility_analyses   (ingested)
compatibility_analyses N──0..1 compatibility_analyses (previous)
```

---

## 3. Tables not created (and why)

| Ý tưởng | Lý do bỏ |
| --- | --- |
| `roles`, `permissions` | Một loại user |
| `password_resets`, `email_verifications` | UI chết / không có |
| `media`, `blobs` | Gradient CSS |
| `geo_positions` | `distance_km` tĩnh trên catalog |
| `p2p_messages` | Match toast; Clara cấm đọc tin thật |
| `analysis_axes` (row per axis) | FE đọc cả blob; JSON trong `payload_json` |
| `tags` M2M | `tags_json` trên i18n, không filter server thật |
| `audit_events` | Log process, không query UI |
| `jobs` | LLM sync trong HTTP |
| Soft-delete cột `deleted_at` | Danger zone = hard delete |

---

## 4. Table specifications

### 4.1 `users`

**Purpose:** Tài khoản email/password.  
**Ownership:** Chính user (`id`).  
**Multi-user:** Email unique toàn hệ thống.

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | TEXT | NO | — | **PK** |
| `email` | TEXT | NO | — | Normalized lowercase ở app; unique NOCASE |
| `name` | TEXT | NO | — | Display (register) |
| `password_hash` | TEXT | NO | — | Argon2/bcrypt; không trả API |
| `created_at` | TEXT | NO | — | ISO UTC |

**Không** `updated_at` — không form sửa account.  
**Không** soft delete / audit.

- **Unique:** `email` (`ux_users_email`)
- **Check:** `length(trim(email)) >= 3`, `instr(email, '@') > 1`, `length(name) >= 1`, `length(password_hash) >= 20`
- **FK:** không
- **Indexes:** PK; unique email
- **Filter/sort:** lookup login by email (unique)

---

### 4.2 `sessions`

**Purpose:** Cookie session có thể revoke (logout).  
**Ownership:** `user_id`.

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | TEXT | NO | — | **PK** |
| `user_id` | TEXT | NO | — | **FK** → `users.id` ON DELETE CASCADE |
| `token_hash` | TEXT | NO | — | Hash của secret cookie, không lưu raw |
| `expires_at` | TEXT | NO | — | ISO UTC |
| `created_at` | TEXT | NO | — | |

- **Unique:** `token_hash`
- **Indexes:** `ix_sessions_user_id`, `ix_sessions_expires_at` (dọn hết hạn)
- **Check:** `length(token_hash) >= 32`
- **Concurrent:** insert lúc login; delete lúc logout. Nhiều session/user được phép (không có “remember” server; nhiều tab OK)

---

### 4.3 `user_criteria`

**Purpose:** Tiêu chí Clara (Preferences + analyze input).  
**Ownership:** `user_id` = PK/FK 1:1.

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `user_id` | TEXT | NO | — | **PK, FK** → `users.id` CASCADE |
| `age` | INTEGER | YES | NULL | Mock 28; không form edit |
| `city` | TEXT | YES | NULL | |
| `intent` | TEXT | YES | NULL | Relationship goal |
| `lifestyle` | TEXT | YES | NULL | Design contract; FE chưa form |
| `deal_breaker_no_smoking` | INTEGER | NO | `1` | FE default on |
| `deal_breaker_long_term` | INTEGER | NO | `1` | |
| `deal_breaker_pet_friendly` | INTEGER | NO | `1` | |
| `weights_json` | TEXT | NO | — | JSON array `{key,label,value}` |
| `version` | INTEGER | NO | `1` | Tăng khi PUT; không phải hash derived |
| `updated_at` | TEXT | NO | — | |
| `created_at` | TEXT | NO | — | |

- **Check:** flags `IN (0,1)`; `version >= 1`; `json_valid(weights_json)`
- **Concurrent:** `UPDATE ... WHERE user_id=? AND version=?` rồi `version = version+1` (optimistic). Analyze đọc `version` snapshot vào `compatibility_analyses.criteria_version`

`weights_json` giữ 5 hoặc 7 trục (open spec). App validate `value` 0–100 trước insert; SQLite không iterate JSON array dễ — **app + `json_valid`**.

---

### 4.4 `privacy_settings`

**Purpose:** Incognito / ẩn đối phương / no_training.  
**Ownership:** 1:1 `users`.

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `user_id` | TEXT | NO | — | **PK, FK** CASCADE |
| `incognito` | INTEGER | NO | `0` | FE default false |
| `hide_from_partner` | INTEGER | NO | `1` | |
| `no_training` | INTEGER | NO | `1` | |
| `updated_at` | TEXT | NO | — | |

- **Check:** mỗi flag `IN (0,1)`
- **Không** biến `hide_from_partner` thành grant cho user khác (không bảng ACL)

---

### 4.5 `candidates`

**Purpose:** Catalog seed dùng chung (3 hàng).  
**Ownership:** hệ thống. Mọi user authenticated đọc. **Không** CASCADE khi xóa user.

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | TEXT | NO | — | **PK** `cand_01`… |
| `age` | INTEGER | NO | — | Giống nhau hai locale |
| `distance_km` | REAL | NO | — | Tĩnh, không GPS |
| `gradient` | TEXT | NO | — | CSS |
| `created_at` | TEXT | NO | — | |

- **Check:** `age BETWEEN 18 AND 120`, `distance_km >= 0`, `id LIKE 'cand_%'`
- **Không** cột compatibility
- **Filter Discover completeness:** không trên bảng này

---

### 4.6 `candidate_i18n`

**Purpose:** `data.ts` / `data.ja.ts`.  
**Ownership:** catalog.

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `candidate_id` | TEXT | NO | — | **FK** → `candidates.id` RESTRICT |
| `locale` | TEXT | NO | — | `vi` \| `ja` |
| `name` | TEXT | NO | — | |
| `job` | TEXT | NO | — | |
| `location` | TEXT | NO | — | |
| `bio` | TEXT | NO | — | |
| `tags_json` | TEXT | NO | — | JSON string array |
| `questionnaire_json` | TEXT | NO | `'{}'` | Design contract; nullable facts |

**PK:** `(candidate_id, locale)`

- **Check:** `locale IN ('vi','ja')`, `json_valid(tags_json)`, `json_valid(questionnaire_json)`
- **Unique:** PK
- **Sort:** không

---

### 4.7 `explorations`

**Purpose:** Tiến trình user–candidate (My Analyses, save/match/archive).  
**Ownership:** `user_id`. Đây là **chốt ACL**.

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | TEXT | NO | — | **PK** |
| `user_id` | TEXT | NO | — | **FK** users CASCADE |
| `candidate_id` | TEXT | NO | — | **FK** candidates RESTRICT |
| `stage` | TEXT | NO | `'chatting'` | Enum DatingStage |
| `created_at` | TEXT | NO | — | |
| `updated_at` | TEXT | NO | — | Đổi stage / note / analyze |

- **Unique:** `(user_id, candidate_id)` — một exploration / cặp
- **Check:** `stage IN ('matched','chatting','met-once','archived')`
- **Indexes:** `ix_explorations_user_id` (My Analyses), unique pair
- **Derive:** `stageLabel` từ i18n+stage; `savedLabel` từ `updated_at`
- **Filter:** watching list = rows của user, **Inferred** `stage <> 'archived'`
- **Sort:** `updated_at DESC` (FE mock không sort rõ; hợp “cập nhật gần nhất”)
- **Soft delete:** không — archive là `stage`
- **Concurrent:** `INSERT OR IGNORE` / catch unique; `UPDATE stage` last-write-wins trên `updated_at` (không UI conflict)

Xóa lịch sử: `DELETE FROM explorations WHERE user_id=?` → cascade children.

---

### 4.8 `observation_notes`

**Purpose:** Ghi chú user/system.  
**Ownership:** qua exploration.

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | TEXT | NO | — | **PK** |
| `exploration_id` | TEXT | NO | — | **FK** explorations CASCADE |
| `author` | TEXT | NO | — | `user` \| `system` |
| `body` | TEXT | NO | — | Không rỗng (CHECK) |
| `ingested_analysis_id` | TEXT | YES | NULL | **FK** analyses SET NULL |
| `created_at` | TEXT | NO | — | |

- **Check:** `author IN ('user','system')`, `length(trim(body)) >= 1`
- **Indexes:** `ix_notes_exploration_created` `(exploration_id, created_at DESC)`
- **Sort:** newest first (FE prepend)
- **Filter reanalyze:** `author='user' AND ingested_analysis_id IS NULL`
- **Không** `time_label`
- **Concurrent:** insert append-only; ingest update trong cùng transaction reanalyze

---

### 4.9 `compatibility_analyses`

**Purpose:** Kết quả Clara (AnalysisPage, overlay Discover/Profile).  
**Ownership:** qua exploration.

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | TEXT | NO | — | **PK** (design `anly_…`) |
| `exploration_id` | TEXT | NO | — | **FK** CASCADE |
| `criteria_version` | INTEGER | NO | — | Snapshot `user_criteria.version` |
| `locale` | TEXT | NO | — | Locale lúc generate |
| `overall_compatibility` | INTEGER | NO | — | 0–100; hiển thị + sort |
| `data_completeness` | INTEGER | NO | — | 0–100; **filter** Discover |
| `is_current` | INTEGER | NO | `1` | Chỉ một hàng =1 / exploration |
| `previous_analysis_id` | TEXT | YES | NULL | **FK** self SET NULL |
| `payload_json` | TEXT | NO | — | Radar, checklist, compare, summary, icebreakers, probing, nextDatePlan, labels |
| `created_at` | TEXT | NO | — | Immutable version |

**Không** `updated_at` — version mới = insert.

- **Check:** scores `BETWEEN 0 AND 100`; `is_current IN (0,1)`; `locale IN ('vi','ja')`; `json_valid(payload_json)`; `criteria_version >= 1`
- **Unique partial:** `ux_analyses_one_current` ON `(exploration_id) WHERE is_current = 1`
- **Indexes:** `ix_analyses_exploration`, `ix_analyses_completeness` không bắt buộc (N nhỏ); filter completeness **join** exploration user rồi `data_completeness >= ?`
- **Không** nhét checklist thành bảng con — không query theo title

**Stale khi criteria đổi:** `criteria_version < user_criteria.version` → analyze lại; không xóa hàng cũ.

---

### 4.10 `chat_messages`

**Purpose:** Thread Clara.  
**Ownership:** qua exploration.  
**Incognito:** app **không INSERT** (không dùng bảng “ephemeral”).

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | TEXT | NO | — | **PK** |
| `exploration_id` | TEXT | NO | — | **FK** CASCADE |
| `sender` | TEXT | NO | — | `agent` \| `user` |
| `body` | TEXT | NO | — | |
| `recommendation_json` | TEXT | YES | NULL | `{title, items[]}` |
| `created_at` | TEXT | NO | — | |

- **Check:** `sender IN ('agent','user')`; `length(trim(body)) >= 1`; `recommendation_json IS NULL OR json_valid(recommendation_json)`
- **Indexes:** `ix_chat_exploration_created` `(exploration_id, created_at)`
- **Sort:** chronological ASC (ChatPanel)
- **Clear history:** `DELETE FROM chat_messages WHERE exploration_id=?` — giữ analysis
- **Không** full-text search

---

## 5. Payload JSON (`compatibility_analyses.payload_json`)

Không phải bảng. Schema logic (khớp FE types):

```json
{
  "confidenceLabel": "string",
  "matchLabel": "string",
  "matchBadgeTone": "match | check",
  "aiQuickSummary": { "positive": "string", "question": "string" },
  "compareRows": [{ "label": "", "userValue": "", "targetValue": "", "needsConfirmation": false }],
  "radarAxes": [{ "key": "", "label": "", "value": 0 }],
  "checklist": {
    "matched": [{ "title": "", "detail": "", "sourceEvidence": "", "tag": "" }],
    "needsCheck": [],
    "potentialFriction": []
  },
  "icebreakers": [],
  "probingQuestions": [],
  "nextDatePlan": { "title": "", "detail": "" },
  "promotedItems": []
}
```

App **từ chối lưu** nếu thiếu `sourceEvidence` trên mọi checklist item, hoặc `radarAxes` không đủ 7 key canonical.

Cột `overall_compatibility` / `data_completeness` **bắt buộc khớp** payload khi insert (cùng transaction, cùng giá trị LLM) — tránh drift.

---

## 6. Data ownership & multi-user

| Data | Ai đọc | Ai ghi |
| --- | --- | --- |
| `candidates`, `candidate_i18n` | Mọi session đăng nhập | Seed/migration only |
| `users`, criteria, privacy, sessions | Self | Self |
| `explorations` + children | Self (`explorations.user_id`) | Self |

**Mọi SELECT note/chat/analysis:**

```sql
FROM observation_notes n
JOIN explorations e ON e.id = n.exploration_id
WHERE e.user_id = :session_user_id
```

Không `WHERE candidate_id = :id` trần trên bảng con.

Hai user analyze cùng `cand_01` → hai `explorations`, hai analysis. Catalog không bị đè.

Không bảng `shares`. `hide_from_partner` không mở SELECT cho user khác.

---

## 7. Filtering, sorting, pagination, search

| Nhu cầu FE | SQL |
| --- | --- |
| Discover `minCompleteness` | `LEFT JOIN` current analysis; `COALESCE(a.data_completeness, 0) >= :min` |
| Tag cloud Discover | **Không** SQL v1 (FE chưa apply) |
| My Analyses list | `explorations WHERE user_id=?` `[AND stage != 'archived']` `ORDER BY updated_at DESC` |
| Notes | `ORDER BY created_at DESC` |
| Chat | `ORDER BY created_at ASC` |
| Pagination | **Không** `LIMIT/OFFSET` bắt buộc. Gợi ý an toàn: notes/chat `LIMIT 500` ở app chống phình — không phải UI page |
| Search | **Không** |
| Sort compatibility | Không UI sort; có cột nếu sau này |

---

## 8. Concurrent updates

| Sự kiện | Bảo vệ |
| --- | --- |
| Hai request tạo exploration cùng cặp | `UNIQUE(user_id, candidate_id)` |
| Hai analyze song song | Transaction: lock exploration row (`BEGIN IMMEDIATE`); unique `is_current` |
| Reanalyze ×2 | Cùng lock; pending notes `UPDATE ingested` trong TX; lần 2 → 409 nếu không còn pending |
| PUT criteria vs analyze | Optimistic `criteria.version`; analysis gắn `criteria_version` |
| Clear chat vs insert chat | TX theo exploration; last write wins chấp nhận được |
| Delete history vs chat | FK CASCADE; TX `DELETE explorations` |

SQLite: `BEGIN IMMEDIATE` trên mọi write Clara/note/criteria để tránh `SQLITE_BUSY` xen kẽ.

---

## 9. Transaction boundaries (app phải mở TX)

1. **Register:** `users` + `user_criteria` + `privacy_settings` — all or nothing.  
2. **Login:** insert `sessions`.  
3. **Logout:** delete session.  
4. **Analyze (cache miss):** ensure exploration + insert analysis `is_current=1` + system note [+ optional welcome chat].  
5. **Analyze (cache hit):** read only.  
6. **Add note:** insert note; `explorations.updated_at`.  
7. **Reanalyze:** verify pending notes; set old `is_current=0`; insert new analysis; set `ingested_analysis_id`; bump `updated_at`.  
8. **Chat:** insert user+agent (nếu không incognito).  
9. **Clear chat:** delete messages.  
10. **Save criteria:** update criteria `version+1`; (không xóa analysis — đánh dấu stale qua version).  
11. **Delete history:** delete explorations của user (cascade).  
12. **Match/archive/save:** update `stage` + `updated_at`.

LLM **ngoài** TX ngắn: gọi model → rồi TX persist. Không giữ lock SQLite suốt 30s LLM.

---

## 10. Integrity extras

PRAGMA: `foreign_keys = ON` mọi connection.

Trigger (migration): không bắt buộc nếu app set `updated_at`. Có trigger `explorations.updated_at` khi insert note — optional; app chủ động UPDATE cho rõ.

`ingested_analysis_id` phải cùng `exploration_id` với note — **SQLite không dễ composite FK**. Enforce trong TX reanalyze (app). Không trigger phức tạp trừ khi cần.

---

## 11. Seed

Migration `0002_seed_candidates.sql`: 3 candidates + 6 i18n rows (vi/ja).  
**Không** seed analysis/notes/chat (per-user, do Clara hoặc empty).  
Demo user: script `backend/src/db/seed-demo.ts` hash password lúc chạy (không commit plaintext).

Questionnaire: từ mock/compare + `sample-contracts.json` cho `cand_01`.

---

## 12. Indexes summary

| Name | Table | Columns | Unique |
| --- | --- | --- | --- |
| `sqlite_pk` | each | `id` / composite | yes |
| `ux_users_email` | users | `email` COLLATE NOCASE | yes |
| `ux_sessions_token_hash` | sessions | `token_hash` | yes |
| `ix_sessions_user_id` | sessions | `user_id` | no |
| `ix_sessions_expires_at` | sessions | `expires_at` | no |
| `ux_explorations_user_candidate` | explorations | `user_id, candidate_id` | yes |
| `ix_explorations_user_id` | explorations | `user_id` | no |
| `ix_notes_exploration_created` | observation_notes | `exploration_id, created_at DESC` | no |
| `ux_analyses_one_current` | compatibility_analyses | `exploration_id` WHERE `is_current=1` | yes partial |
| `ix_analyses_exploration` | compatibility_analyses | `exploration_id` | no |
| `ix_chat_exploration_created` | chat_messages | `exploration_id, created_at` | no |

---

## 13. PostgreSQL later

Đổi `TEXT` ISO → `TIMESTAMPTZ`; `INTEGER` 0/1 → `BOOLEAN`; `json_valid` → `JSONB`. Partial unique index giữ nguyên. Không đổi tên bảng/cột.

---

*Schema vật lý: `backend/db/migrations/0001_init.sql`, `0002_seed_candidates.sql`.*
