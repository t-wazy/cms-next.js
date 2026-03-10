# 記事投稿システム

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

- Node.js 20以上
- pnpm
- Docker & Docker Compose

### 環境変数設定

プロジェクトルートに`.env`ファイルを作成してください：

```bash
cp .env.example .env
```

`.env`ファイルを編集し、以下の環境変数を設定してください：

```env
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**重要**: `NEXTAUTH_SECRET`は以下のコマンドで生成してください：

```bash
openssl rand -base64 32
```

### Docker Composeで起動（推奨）

```bash
cd docker
docker compose up -d --build
```

初回起動時のみ、データベースのマイグレーションとシードデータ投入が必要です：

```bash
docker compose exec app pnpm prisma migrate deploy
docker compose exec app pnpm prisma db seed
```

### ローカル開発環境

MySQLのみDockerで起動し、Next.jsはローカルで実行する場合：

```bash
# MySQLコンテナ起動
cd docker
docker compose up -d db

# 依存関係インストール
cd ..
pnpm install

# データベースマイグレーション
pnpm prisma migrate deploy
pnpm prisma db seed

# Next.js開発サーバー起動
pnpm dev
```

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
│   ├── docker-compose.yml      # 本番用
│   ├── docker-compose.dev.yml  # 開発用
│   ├── Dockerfile.nextjs       # Next.js用（本番）
│   └── Dockerfile.dev          # Next.js用（開発）
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
pnpm prisma studio              # Prisma Studio起動
pnpm prisma migrate dev         # マイグレーション作成・適用
pnpm prisma migrate deploy      # マイグレーション適用（本番）
pnpm prisma db seed             # シードデータ投入
pnpm prisma generate            # Prisma Client生成
```

### Docker

```bash
# 本番環境
cd docker && docker compose up -d --build

# 開発環境（ホットリロード）
cd docker && docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# ログ確認
docker compose logs -f app

# コンテナ停止
docker compose down

# ボリューム含めて削除
docker compose down -v
```

## トラブルシューティング

### Prismaマイグレーションエラー

```bash
# Prisma Clientを再生成
pnpm prisma generate

# データベースをリセット（開発環境のみ）
pnpm prisma migrate reset
```

### Dockerビルドエラー

```bash
# キャッシュをクリアして再ビルド
docker compose build --no-cache app
```

### ホットリロードが動作しない

開発環境で`docker-compose.dev.yml`を使用しているか確認：

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## ライセンス

プロプライエタリ
