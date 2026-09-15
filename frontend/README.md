**[🇯🇵 日本語](#日本語) ・ [🇻🇳 Tiếng Việt](#tiếng-việt)**

---

## 日本語

# CLARA · Matching Coach — フロントエンド

**Matching Coach** のフロントエンドです。マッチを決める前に、相手との相性を評価する手助けをするデシジョンサポート・コパイロットです。プロダクトのアイデアは [`docs/ideas/Matching-Coach.md`](../docs/ideas/Matching-Coach.md)、デザインモックアップは [`docs/designs/matching-coach`](../docs/designs/matching-coach) を参照してください。

このフロントエンドは **実際のバックエンド API**（[`../backend`](../backend)）と通信します。開発時は Vite の dev サーバーが `/api` へのリクエストを `http://127.0.0.1:3000` にプロキシするので、**バックエンドも同時に起動する必要があります**（下記「はじめかた」参照）。ユーザー認証、候補者データ、Clara の分析・チャット応答はすべてこのバックエンド経由の本物のデータです。

### 技術スタック

- [Vite](https://vitejs.dev/) 6 + React 19 + TypeScript
- [Ant Design](https://ant.design/)（v6）をメインの UI キットとして使用
- ルーティングに React Router v7

### はじめかた

```bash
# ターミナル1: バックエンド
cd ../backend
npm install
npm run dev        # http://localhost:3000 （DBマイグレーション + デモアカウントを自動seed）

# ターミナル2: フロントエンド
cd frontend
npm install
npm run dev         # 開発サーバーを起動 (http://localhost:5173)
npm run build        # 型チェック + 本番ビルド
npm run lint          # eslint
npm run preview        # ビルド結果をプレビュー
```

ログイン画面の「デモアカウントでログイン」ボタンから `demo@clara.app` / `Demo@1234` ですぐに試せます。

### 主な画面（ルート）

| ルート | 画面 | 説明 |
| --- | --- | --- |
| `/login`, `/register` | ログイン / 登録 | バックエンドのセッションCookie認証 |
| `/`（ログイン後の初期画面） | **CLARAで探す** | チャット形式でエージェントに探している相手の条件を伝えると、システム内の候補プロフィールを分析・提案 |
| `/discover` | プロフィールを探す | 候補者一覧、目的・価値観・ライフスタイルによるフィルター、各カードに表示される AI のクイック要約 |
| `/profile/:candidateId` | プロフィール詳細 | 深い分析に入る前に見る候補者の詳細情報 |
| `/analysis/:candidateId` | 相性分析スペース | 条件の比較、Clara とのチャット（バックエンドのAI/LLM応答）、7軸コンパティビリティマップ（レーダーチャート）、3グループのチェックリスト、「進行中の分析へ保存」「積極的にマッチ＆メッセージ」アクション |
| `/match-chat/:candidateId` | マッチ後のチャット（模擬） | マッチ操作をした相手との1対1チャットUI。エージェントが自動送信したおすすめの一言や、相手からの返信はすべてフロントエンド側の模擬（デモ）であり、実際のメッセージシステムには未接続 |
| `/analyses` | 進行中の分析（My Analyses） | 候補者ごとの進捗管理、会った後のメモ記録、データ充実度を上げる「再分析」、ここからも「マッチ＆メッセージ」に進める |
| `/preferences` | 条件とフィルター | 譲れない条件（Deal-breakers）、レーダーマップの優先重み付け、プライバシー設定 |

アプリ全体に対応した **ライト/ダークテーマ** と **ベトナム語/日本語の多言語対応**あり。

### フォルダ構成

```
src/
  api/              # backend への fetch ラッパー（Accept-Language ヘッダーを自動付与）
  components/       # 共通UI（カード、チャットパネル、レイアウト、アイコンなど）
  i18n/             # vi/ja 翻訳辞書
  pages/            # ルートごとの画面（pages/auth を含む）
  store/            # React Context: テーマ、言語、認証、アプリ状態（すべて backend API 経由）
  theme/            # antd テーマ設定 & デザイントークン
  types/            # Candidate / ChatMessage / UserProfile などの型定義
```

### 現時点の制限事項

- デモ用の候補者データはバックエンドに固定で3件シード済み（Mai Linh / Tuấn Anh / Minh Châu）。増やす場合はバックエンド側のシード/マイグレーションを編集する必要があります。
- `/match-chat/:candidateId` の会話は完全にフロントエンド側の模擬（決まった返信テンプレートを順番に返すだけ）で、実際のメッセージ配信システムには接続されていません。
- 「CLARAで探す」画面の検索は、読み込み済みの候補者データに対するクライアント側の単純なキーワードマッチングであり、追加のLLM呼び出しは行いません。
- 分析内容（要約・チェックリスト・アイスブレイカー・レーダー軸など）はバックエンドが生成します。バックエンドが実際の Claude API を使う設定の場合、稀に指定した言語（ロケール）と異なる言語で返ってくることがあります — これはバックエンド側の制限です（[`../backend/README.md`](../backend/README.md) 参照）。

---

## Tiếng Việt

# CLARA · Matching Coach — Frontend

Frontend cho **Matching Coach**, một decision-support copilot giúp người dùng đánh giá độ phù hợp với một đối tượng hẹn hò trước khi quyết định match. Xem ý tưởng sản phẩm gốc tại [`docs/ideas/Matching-Coach.md`](../docs/ideas/Matching-Coach.md) và bản thiết kế mockup tại [`docs/designs/matching-coach`](../docs/designs/matching-coach).

Frontend này giao tiếp với **backend thật** ([`../backend`](../backend)). Khi chạy dev, Vite sẽ proxy các request `/api` sang `http://127.0.0.1:3000`, vì vậy **bạn cần chạy cả backend song song** (xem phần "Bắt đầu" bên dưới). Xác thực người dùng, dữ liệu ứng viên, phân tích/chat của Clara đều là dữ liệu thật lấy từ backend này.

### Tech stack

- [Vite](https://vitejs.dev/) 6 + React 19 + TypeScript
- [Ant Design](https://ant.design/) (v6) làm UI kit chính
- React Router v7 cho điều hướng

### Bắt đầu

```bash
# Terminal 1: backend
cd ../backend
npm install
npm run dev        # http://localhost:3000 (tự migrate DB + seed tài khoản demo)

# Terminal 2: frontend
cd frontend
npm install
npm run dev       # chạy dev server (http://localhost:5173)
npm run build     # type-check + build production
npm run lint      # eslint
npm run preview   # xem thử bản build
```

Bấm nút "Đăng nhập bằng tài khoản demo" ở màn login để vào ngay với `demo@clara.app` / `Demo@1234`.

### Các màn hình chính (route)

| Route | Màn hình | Mô tả |
| --- | --- | --- |
| `/login`, `/register` | Đăng nhập / Đăng ký | Xác thực qua session cookie của backend |
| `/` (trang chủ sau khi đăng nhập) | **Tìm kiếm cùng CLARA** | Chat kiểu chatbot: mô tả người bạn muốn tìm, Agent phân tích yêu cầu và gợi ý hồ sơ phù hợp trong hệ thống |
| `/discover` | Khám phá hồ sơ | Danh sách ứng viên, bộ lọc theo mục tiêu/giá trị sống/lối sống, tóm tắt nhanh của AI trên mỗi thẻ |
| `/profile/:candidateId` | Xem hồ sơ chi tiết | Thông tin đầy đủ của một ứng viên trước khi vào phân tích sâu |
| `/analysis/:candidateId` | Không gian phân tích | Đối chiếu tiêu chí, chat với Clara (AI/LLM thật từ backend), bản đồ tương thích 7 trục (radar chart), checklist 3 nhóm, hành động "Lưu vào Đang tìm hiểu" / "Chủ động Match & Gửi lời nhắn" |
| `/match-chat/:candidateId` | Chat sau khi match (mô phỏng) | Giao diện nhắn tin 1-1 với đối tượng đã match. Câu mở đầu tự gửi và các phản hồi của đối phương đều được mô phỏng hoàn toàn ở frontend (demo), chưa kết nối hệ thống nhắn tin thật |
| `/analyses` | Đang tìm hiểu (My Analyses) | Theo dõi tiến trình từng ứng viên, tự ghi chú sau buổi gặp, "phân tích lại" để tăng độ đầy đủ dữ liệu, và cũng có thể bấm "Match & Nhắn tin" từ đây |
| `/preferences` | Tiêu chí & Bộ lọc | Deal-breakers, trọng số ưu tiên trên radar map, cài đặt quyền riêng tư |

**Giao diện sáng/tối** và **đa ngôn ngữ Việt/Nhật** cho toàn bộ app.

### Cấu trúc thư mục

```
src/
  api/              # wrapper gọi fetch tới backend (tự gắn header Accept-Language)
  components/       # UI dùng chung (card, chat panel, layout, icon...)
  i18n/             # từ điển dịch vi/ja
  pages/            # các màn hình theo route (kể cả pages/auth)
  store/            # React context: theme, locale, auth, app state (đều gọi API backend)
  theme/            # cấu hình theme antd + design tokens
  types/            # kiểu dữ liệu dùng chung: Candidate, ChatMessage, UserProfile...
```

### Giới hạn hiện tại

- Dữ liệu ứng viên demo hiện cố định 3 hồ sơ được seed sẵn ở backend (Mai Linh, Tuấn Anh, Minh Châu). Muốn thêm ứng viên cần chỉnh seed/migration ở phía backend.
- Cuộc trò chuyện ở `/match-chat/:candidateId` hoàn toàn là mô phỏng phía frontend (xoay vòng vài mẫu phản hồi có sẵn), chưa nối với hệ thống nhắn tin thật.
- Ô tìm kiếm ở màn "Tìm kiếm cùng CLARA" lọc bằng so khớp từ khóa đơn giản trên dữ liệu ứng viên đã tải sẵn ở client, không gọi thêm LLM.
- Nội dung do AI sinh ra (tóm tắt, checklist, icebreaker, các trục radar...) đến từ backend. Khi backend cấu hình dùng Claude thật, đôi khi nội dung vẫn trả về không đúng locale đã chọn — đây là giới hạn phía backend, xem ghi chú tại [`../backend/README.md`](../backend/README.md).
