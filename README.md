# 記事投稿システム（プロトタイプ）

Next.js + Prisma + MySQLで構築したコンテンツ管理システム（CMS）。

## 技術スタック

- **フロントエンド**: Next.js 16.1.6 (App Router)
- **認証**: NextAuth.js 4.24.13 (2FA対応)
- **データベース**: MySQL 8.0
- **ORM**: Prisma 5.22.0
- **エディタ**: TipTap (リッチテキスト)
- **スタイリング**: Tailwind CSS v4
- **画像処理**: sharp
- **パッケージマネージャー**: pnpm

## 主要機能

- ✅ ユーザー認証（メール/パスワード + 2FA）
- ✅ 記事管理（CRUD、検索、フィルタ、ページネーション）
- ✅ TipTapリッチテキストエディタ
- ✅ 画像アップロード・管理
- ✅ カテゴリ・タグ管理
- ✅ 権限管理（ADMIN, EDITOR, REPORTER）
- ✅ レスポンシブ対応

## セットアップ方法

### 前提条件

- Git
- Docker Desktop

### セットアップ

```bash
git clone https://github.com/t-wazy/cms-next.js.git <任意のディレクトリ名>
cd <任意のディレクトリ名>/docker
docker compose up -d --build
```

起動順序は自動で制御される。

1. `cms_mysql` が起動し、DB の接続準備が完了するまで待機
2. `migrate` コンテナが migration とシードデータの投入を実行して終了
3. `cms_app` が起動（hot reload 付き開発サーバー）

http://localhost:3000 にアクセス

### Prisma Studio（データベースGUI）

```bash
pnpm prisma studio
```

http://localhost:5555 にアクセス

## ディレクトリ構造

```
CMS/
├── docker/                     # Docker関連ファイル
│   ├── docker-compose.yml      # ローカル開発用
│   ├── Dockerfile.nextjs       # Next.js用（本番ビルド）
│   └── Dockerfile.dev          # Next.js用（開発・hot reload）
├── prisma/                     # Prismaスキーマ
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── uploads/                # 画像アップロード先
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認証ページ
│   │   ├── (dashboard)/       # ダッシュボードページ
│   │   └── api/               # APIルート
│   ├── components/             # Reactコンポーネント
│   ├── lib/                    # ユーティリティ
│   └── types/                  # TypeScript型定義
├── .env.example                # 環境変数テンプレート
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json
```

## コマンド一覧

### 開発

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # 本番ビルド
pnpm start        # 本番サーバー起動
pnpm lint         # ESLint実行
```

### Prisma

```bash
pnpm prisma:studio              # Prisma Studio起動
pnpm prisma:migrate             # マイグレーション作成・適用
pnpm prisma:seed                # シードデータ投入
pnpm prisma:generate            # Prisma Client生成
```

### データベースリセット

```bash
pnpm db:reset                   # DBリセット（.envのDATABASE_URL使用）
pnpm db:reset:local             # DBリセット（.env.localを使用、ポート3306）
pnpm db:reset:docker            # DBリセット（.env.dockerを使用、ポート3307）
pnpm db:reset:force             # 確認なしでDBリセット
```

**環境ファイルの使い分け**:
- `.env` - デフォルト設定（通常は.env.localまたは.env.dockerへのシンボリックリンク）
- `.env.local` - ローカルMySQL環境用（ポート3306）
- `.env.docker` - Docker MySQL環境用（ポート3307）

**注意**: `db:reset`系コマンドは以下を実行します：
1. データベース全体をDROP
2. 再作成
3. マイグレーション実行
4. シードデータ自動投入

### Docker

```bash
# 起動（初回・Dockerfile変更時）
cd docker && docker compose up -d --build

# 起動（2回目以降）
cd docker && docker compose up -d

# 停止
cd docker && docker compose down

# DB含めて完全リセット（migration・seed も再実行される）
cd docker && docker compose down -v && docker compose up -d --build

# ログ確認
cd docker && docker compose logs -f app
```

## トラブルシューティング

### ログインできない

DB をリセットしてシードデータを再投入してください：

```bash
cd docker && docker compose down -v && docker compose up -d --build
```

テストユーザー:
- **ADMIN**: admin@example.jp / password123
- **EDITOR**: editor@example.jp / password123
- **REPORTER**: reporter@example.jp / password123

### `migrate` が失敗してアプリが起動しない

ログを確認してください：

```bash
cd docker && docker compose logs migrate
```

再実行する場合：

```bash
cd docker && docker compose down && docker compose up -d --build
```

### Dockerビルドエラー

```bash
cd docker && docker compose down -v && docker compose up -d --build
```

## ライセンス

プロプライエタリ
