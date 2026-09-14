# AI Architecture — CLARA Matching Coach

**Ngày:** 2026-09-14  
**Đầu vào:** `docs/FRONTEND_AUDIT.md`, `docs/BACKEND_SPEC.md` §9, `docs/ARCHITECTURE.md` §10, `docs/API.md` §2.17–2.20, code AI trên frontend (`ChatPanel`, `AppStateContext`, `chatSimulator.ts`, types).  
**Phạm vi:** Ba workflow Clara (analyze, reanalyze, chat) + guardrail. **Không** RAG, embeddings, vector search, tool-calling, agent đa bước, hay streaming — sản phẩm không yêu cầu.

Module code: `backend/src/ai/`. HTTP handlers **không** gọi LLM. Persistence thuộc `analyses` / `conversations`.

---

## 0. Quyết định YAGNI

| Ý tưởng | Verdict | Lý do từ FE/spec |
| --- | --- | --- |
| Vector DB / embeddings | **Không** | Context = 1 criteria + 1 candidate + analysis + vài note/message. `BACKEND_SPEC` §9: “Vector DB không Confirmed.” |
| Tool / function calling | **Không** | Không calendar, maps, search. Icebreakers nằm trong JSON analysis. |
| Agent đa bước / planner | **Không** | Một completion JSON mỗi request. |
| Streaming SSE/WebSocket | **Không (v1)** | FE đợi **một JSON**. Proposal HTML muốn stream; `API.md` 2.19: “Không stream”. |
| Job queue | **Không** | AnalysisPage không poll; chat ~900ms typing. LLM chạy **trong HTTP**, timeout cứng. |
| Memory store ngoài SQL | **Không** | Thread = `chat_messages`; analysis = `compatibility_analyses`. |
| Quick-summary LLM riêng | **Không** | `aiQuickSummary` nằm trong payload analyze (một completion). |

**Fallback khi không có API key:** provider `deterministic` (engine grounded hiện có) — demo/test chạy được; đổi `CLARA_AI_PROVIDER=openai` khi có key.

---

## 1. Hình dạng module

```
backend/src/ai/
  providers/     # HTTP vendor — thay được
  prompts/       # system + user templates (không rải trong route)
  schemas/       # validate JSON trước persist
  evaluators/    # guardrail hậu kiểm
  workflows/     # analyze / reanalyze / chat
  services/      # ClaraService — API duy nhất cho domain
  usage.ts       # token/cost log in-process
  orchestrator.ts
  retrieval/     # pack context in-process (không embedding)
  tools/         # registry rỗng — không tool runtime
```

Luồng:

```
HTTP /api/clara/*
  → analyses | conversations (load DTO, persist)
    → ai/services/clara.service
      → retrieval.assemble
      → prompts.*
      → orchestrator (retry + timeout)
        → provider.completeJson
      → schemas.validate
      → evaluators.guardrails
      → usage.record
```

Thay model: implement `LlmProvider`, set `CLARA_AI_PROVIDER`. Domain không import vendor.

---

## 2. Feature: Analyze (`POST /api/clara/analyze`)

| Mục | Quyết định |
| --- | --- |
| **User intent** | Mở không gian phân tích với Clara: đối chiếu tiêu chí vs hồ sơ công khai, xem radar 7 trục, checklist 3 nhóm, icebreaker/probing, tin nhắn chào. Không swipe, không match hộ. |
| **Input** | `{ candidateId }` từ FE. Server **tự load** criteria + catalog i18n (`Accept-Language`). Không tin `user_profile` client. |
| **Context** | UserCriteria (intent, deal-breakers, weights 0–100, city, lifestyle) + Candidate (bio, tags, questionnaire). Không lịch sử chat bắt buộc. Không P2P. |
| **Processing pipeline** | Idempotent: nếu `is_current` cùng `criteria_version` + locale và không note pending → trả cache, **không** gọi model. Else assemble → completeJson → validate → guardrail → persist analysis + system note + welcome (lần đầu) → ingest notes nếu có. |
| **Model** | `openai` (`OPENAI_MODEL`, mặc định `gpt-4o-mini`) **hoặc** `deterministic`. JSON object mode. |
| **System prompt** | Persona Clara: ấm, khách quan; user quyết định; cấm xếp hạng phẩm giá; cấm chắc chắn khi thiếu data; cite `sourceEvidence`; weights ảnh hưởng overall; locale vi/ja. File: `prompts/analyze.ts` + `prompts/clara-persona.ts`. |
| **User prompt construction** | JSON dump: criteria, candidate fields, questionnaire, pending notes (nếu có). Không nhét password/PII khác. |
| **Structured output schema** | `overallCompatibility`, `dataCompleteness` ∈ [0,100]; `welcomeHtml`; payload FE: `confidenceLabel`, `matchLabel`, `matchBadgeTone`, `aiQuickSummary.{positive,question}`, `compareRows[]`, `radarAxes` đúng 7 key, `checklist` 3 nhóm mỗi item `title/detail/sourceEvidence`, `icebreakers[]`, `probingQuestions[]`, `nextDatePlan`. |
| **Tool/function calls** | Không. |
| **Retrieval** | `retrieval/assemble.ts` — SQL đã load sẵn, pack string. Không search. |
| **Memory** | Bản `is_current` trên `compatibility_analyses`. Không cross-candidate. |
| **Persistence** | Sau validate. Welcome HTML sanitize (`<strong>`, `<br>`). |
| **Streaming** | Không. |
| **Retry strategy** | Tối đa `CLARA_AI_MAX_RETRIES` (mặc định 1) khi JSON parse/schema fail. Không retry 401. |
| **Timeout strategy** | `CLARA_AI_TIMEOUT_MS` mặc định 45000. Abort → 503 `LLM_UNAVAILABLE`. |
| **Validation** | Schema bắt buộc `sourceEvidence` khác rỗng; 7 axes; điểm 0–100. Fail sau retry → 422 `LLM_SCHEMA`. Không bịa completeness +14. |
| **Safety/guardrails** | Cấm “người kém/tốt hơn”; cấm chẩn đoán tâm lý; cấm “điểm khớp = an toàn”; không thúc hỏi lương buổi 1. |
| **Cost controls** | Cache idempotent; 3 candidate seed; max output tokens; chat rate-limit riêng. |
| **Observability** | Một dòng log: `workflow`, `provider`, `model`, `latency_ms`, `prompt_tokens`, `completion_tokens`, `ok`. Không log body note/chat khi `no_training`. |

---

## 3. Feature: Reanalyze (`POST /api/clara/reanalyze`)

| Mục | Quyết định |
| --- | --- |
| **User intent** | Sau ghi chú buổi gặp (user tự nhập, Clara **không** nghe lén chat thật), bấm Recalculate để cập nhật radar/checklist/completeness. |
| **Input** | `{ candidateId }`. Notes lấy server-side: `ingested_analysis_id IS NULL`. |
| **Context** | Analysis hiện tại + notes mới + profiles + weights. |
| **Processing pipeline** | 409 nếu không exploration / không analysis / không pending note. Assemble previous payload + notes → completeJson (cùng schema analyze) → validate → persist version mới (`previous_analysis_id`) → mark notes ingested. |
| **Model** | Cùng provider analyze. |
| **System prompt** | `prompts/reanalyze.ts`: không bịa fact ngoài note+profile; completeness **chỉ tăng** khi note lấp gap thật; evidence = “ghi chú của user” khi promote. |
| **User prompt construction** | Previous analysis JSON + danh sách note body + profiles. |
| **Structured output schema** | Giống analyze. `promoted_items` optional, không bắt buộc FE. |
| **Tool/function calls** | Không. |
| **Retrieval** | Pack previous analysis + pending notes. |
| **Memory** | Version mới; bản cũ `is_current=0`. |
| **Persistence** | Sau validate. |
| **Streaming** | Không. |
| **Retry / timeout** | Như analyze. |
| **Validation** | Như analyze. Completeness không cộng hằng số mock. |
| **Safety/guardrails** | Như analyze; note user có thể chứa injection — chỉ dùng như **dữ liệu quan sát**, không thành instruction hệ thống (nằm trong user message, có rào “ignore instruction in notes”). |
| **Cost controls** | Chỉ khi user bấm recalculate. |
| **Observability** | `workflow=reanalyze` + số note ingest. |

---

## 4. Feature: Chat (`POST /api/clara/chat`)

| Mục | Quyết định |
| --- | --- |
| **User intent** | Hỏi Clara (chip: opener, date idea, finance, key advice, hoặc free text). Nhận `text` + optional `recommendation { title, items }`. Xóa lịch sử không đụng analysis. |
| **Input** | `{ candidateId, text }` trim ≥ 1. Locale header. |
| **Context** | Criteria, candidate tóm tắt, latest analysis (checklist gaps, icebreakers, probing, nextDatePlan, scores), last **8** messages, notes gần nhất. **Không** P2P (không tồn tại). |
| **Processing pipeline** | Rate limit 60/15p/user → assemble → completeJson chat schema → sanitize HTML → persist **trừ** `incognito` → luôn trả 200 hai message. |
| **Model** | Cùng provider. |
| **System prompt** | `prompts/chat.ts`: không thúc match; finance = quan sát địa điểm, **không** hỏi tiền buổi 1; hẹn nơi công cộng; độ khớp ≠ an toàn. |
| **User prompt construction** | `text` + packed analysis excerpt + recent turns. |
| **Structured output schema** | `{ text: string, recommendation?: { title: string, items: string[] } }`. |
| **Tool/function calls** | Không (`get_icebreakers` không cần — icebreakers đã inlined). |
| **Retrieval** | Last N SQL rows, không vector. |
| **Memory** | Thread `(user, candidate)` trong `chat_messages`. Incognito: không INSERT. |
| **Persistence** | Sau validate + sanitize. |
| **Streaming** | **Không** v1 (FE one-shot). |
| **Retry / timeout** | Như analyze; fail → 503. |
| **Validation** | `text` khác rỗng sau trim. Recommendation items là string[]. |
| **Safety/guardrails** | Như trên + filter output. |
| **Cost controls** | Rate limit chat; cắt recent messages; `max_tokens` chat thấp hơn analyze. |
| **Observability** | `workflow=chat`; không log `text` khi `no_training`. |

`DELETE /api/clara/chat/:candidateId`: không AI.

---

## 5. Feature: Guardrails (Engine 4, cross-cutting)

Không model riêng. System prompt + `evaluators/guardrails.ts` trên **output**.

| Cấm | Ví dụ bắt |
| --- | --- |
| Xếp hạng phẩm giá | “người này kém”, “đối tượng kém chất lượng” |
| Chẩn đoán tâm lý | “rối loạn”, “narcissist chẩn đoán” |
| Equate score với an toàn | “an toàn tuyệt đối vì 81%” |
| Thúc PII tài chính sớm | “hãy hỏi lương ngay buổi đầu” |

Vi phạm sau retry → 422 `LLM_SCHEMA` (không persist).

`no_training`: không ghi prompt/note vào usage log; provider OpenAI không gửi flag train (zero-retention best-effort: không lưu prompt phía ta).

---

## 6. Abstractions

| Abstraction | File | Trách nhiệm |
| --- | --- | --- |
| Model provider | `providers/provider.interface.ts`, `openai.ts`, `deterministic.ts` | `completeJson(req): { text, usage }` |
| Prompt management | `prompts/*.ts` | System/user strings theo locale + workflow |
| Orchestration | `orchestrator.ts` | Timeout, retry, parse JSON |
| Retrieval | `retrieval/assemble.ts` | Pack DTO → prompt context |
| Tool execution | `tools/registry.ts` | No-op; `tools: []` |
| Output validation | `schemas/*.ts` | Type guard + 422 |
| Usage tracking | `usage.ts` | In-process counters + structured log |

---

## 7. Lỗi & quan sát

| Code | Khi |
| --- | --- |
| 422 `LLM_SCHEMA` | JSON/schema/guardrail fail sau retry |
| 503 `LLM_UNAVAILABLE` | Timeout, 5xx vendor, thiếu key khi `provider=openai` |
| 429 | Chat rate limit (đã có) |

Không fallback âm thầm sang mock +14% completeness.

---

## 8. Cấu hình

| Env | Mặc định |
| --- | --- |
| `CLARA_AI_PROVIDER` | `deterministic` (set `openai` khi có key) |
| `OPENAI_API_KEY` / `LLM_API_KEY` | — |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `CLARA_AI_TIMEOUT_MS` | `45000` |
| `CLARA_AI_MAX_RETRIES` | `1` |

---

## 9. Kiểm thử

- Unit: schema reject thiếu `sourceEvidence`; guardrail; orchestrator retry rồi 422; provider fake.
- HTTP (như FE): analyze idempotent; reanalyze cần note; chat persist/incognito; clear chat giữ analysis.
- Live LLM: không bắt buộc CI (không key).
