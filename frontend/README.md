**[🇯🇵 日本語](#日本語) ・ [🇻🇳 Tiếng Việt](#tiếng-việt)**

---

## 日本語

# CLARA · Matching Coach — フロントエンド

**Matching Coach** のフロントエンドです。マッチを決める前に、相手との相性を評価する手助けをするデシジョンサポート・コパイロットです。プロダクトのアイデアは [`docs/ideas/Matching-Coach.md`](../docs/ideas/Matching-Coach.md)、デザインモックアップは [`docs/designs/matching-coach`](../docs/designs/matching-coach) を参照してください。

これは **フロントエンドのみ** の実装です。ユーザーデータ、Clara の応答、認証状態はすべて **ブラウザ上で動くモックデータ** であり、実際のバックエンド/LLM とはまだ接続されていません。

### 技術スタック

- [Vite](https://vitejs.dev/) + React 19 + TypeScript
- [Ant Design](https://ant.design/)（v6）をメインの UI キットとして使用
- ルーティングに React Router v7

### はじめかた

```bash
npm install
npm run dev       # 開発サーバーを起動 (http://localhost:5173)
npm run build     # 型チェック + 本番ビルド
npm run lint      # eslint
npm run preview   # ビルド結果をプレビュー
```

### 主な機能

- **プロフィールを探す** — 候補者一覧、目的・価値観・ライフスタイルによるフィルター、各カードに表示される AI のクイック要約。
- **プロフィール詳細** — 深い分析に入る前に見る候補者の詳細情報。
- **相性分析スペース** — 条件の比較、Clara とのシミュレーションチャット、7軸コンパティビリティマップ（レーダーチャート）、3グループのチェックリスト（適合／要確認／要検討）。
- **進行中の分析（My Analyses）** — 候補者ごとの進捗管理、会った後のメモ記録、データ充実度を上げる「再分析」。
- **条件とフィルター** — 譲れない条件（Deal-breakers）、レーダーマップの優先重み付け、プライバシー設定。
- **ログイン／登録** — 実サーバーを持たないモック認証フロー。すぐ試せるデモアカウント付き。
- アプリ全体（候補者のモックコンテンツも含む）に対応した **ライト/ダークテーマ** と **ベトナム語/日本語の多言語対応**。

### フォルダ構成

```
src/
  components/       # 共通UI（カード、チャットパネル、レイアウト、アイコンなど）
  i18n/             # vi/ja 翻訳辞書
  mock/             # 候補者データとユーザープロフィールのサンプル
  pages/            # ルートごとの画面（pages/auth を含む）
  store/            # React Context: テーマ、言語、認証、アプリ状態
  theme/            # antd テーマ設定 & デザイントークン
  utils/            # Clara のチャット応答シミュレーションロジック
```

### 現時点の制限事項

- 実際のバックエンド/APIはありません — ログイン、メモの保存、再分析、Claraとのチャットなど、すべての操作はクライアント側でモック処理され、`localStorage` に一時保存されます。
- 3人のサンプル候補者のモックコンテンツ（自己紹介文、チャット、チェックリストなど）は両言語分を手動で作成しています。候補者を追加する場合は `mock/data.ts` と `mock/data.ja.ts` の両方を更新してください。
- アカウント登録では実際のパスワードは保存されません。次回ログイン時に正しい名前を表示するため、メールアドレスに紐づく表示名だけを記憶します。

---

## Tiếng Việt

# CLARA · Matching Coach — Frontend

Frontend cho **Matching Coach**, một decision-support copilot giúp người dùng đánh giá độ phù hợp với một đối tượng hẹn hò trước khi quyết định match. Xem ý tưởng sản phẩm gốc tại [`docs/ideas/Matching-Coach.md`](../docs/ideas/Matching-Coach.md) và bản thiết kế mockup tại [`docs/designs/matching-coach`](../docs/designs/matching-coach).

Đây là bản dựng **frontend-only**: toàn bộ dữ liệu ứng viên, phản hồi của Clara và trạng thái xác thực đều là **mock data chạy trong trình duyệt**, chưa kết nối backend/LLM thật.

### Tech stack

- [Vite](https://vitejs.dev/) + React 19 + TypeScript
- [Ant Design](https://ant.design/) (v6) làm UI kit chính
- React Router v7 cho điều hướng

### Bắt đầu

```bash
npm install
npm run dev       # chạy dev server (http://localhost:5173)
npm run build     # type-check + build production
npm run lint      # eslint
npm run preview   # xem thử bản build
```

### Tính năng chính

- **Khám phá hồ sơ** — danh sách ứng viên, bộ lọc theo mục tiêu/giá trị sống/lối sống, tóm tắt nhanh của AI trên mỗi thẻ.
- **Xem hồ sơ chi tiết** — thông tin đầy đủ của một ứng viên trước khi vào phân tích sâu.
- **Không gian phân tích** — đối chiếu tiêu chí, chat mô phỏng với Clara, bản đồ tương thích 7 trục (radar chart), checklist 3 nhóm (phù hợp / cần xác nhận / cần cân nhắc).
- **Đang tìm hiểu (My Analyses)** — theo dõi tiến trình từng ứng viên, tự ghi chú sau buổi gặp và "phân tích lại" để tăng độ đầy đủ dữ liệu.
- **Tiêu chí & Bộ lọc** — deal-breakers, trọng số ưu tiên trên radar map, cài đặt quyền riêng tư.
- **Đăng nhập / Đăng ký** — luồng xác thực mock (không có backend thật), có sẵn tài khoản demo để đăng nhập nhanh.
- **Giao diện sáng/tối** và **đa ngôn ngữ Việt/Nhật** cho toàn bộ app, kể cả nội dung mock của ứng viên.

### Cấu trúc thư mục

```
src/
  components/       # UI dùng chung (card, chat panel, layout, icon...)
  i18n/             # từ điển dịch vi/ja
  mock/             # dữ liệu ứng viên & hồ sơ người dùng mẫu
  pages/            # các màn hình theo route (kể cả pages/auth)
  store/            # React context: theme, locale, auth, app state
  theme/            # cấu hình theme antd + design tokens
  utils/            # logic mô phỏng phản hồi chat của Clara
```

### Giới hạn hiện tại

- Không có backend/API thật — mọi thao tác (đăng nhập, lưu ghi chú, phân tích lại, chat với Clara) đều xử lý mock ở client và lưu tạm trong `localStorage`.
- Nội dung mock (bio, chat, checklist...) của 3 ứng viên mẫu được viết tay cho cả 2 ngôn ngữ; thêm ứng viên mới cần cập nhật cả `mock/data.ts` và `mock/data.ja.ts`.
- Đăng ký tài khoản không lưu mật khẩu thật, chỉ ghi nhớ tên hiển thị theo email để lần đăng nhập sau hiển thị đúng tên.
