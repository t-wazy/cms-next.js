FROM node:20-alpine

WORKDIR /app

# pnpmインストール
RUN npm install -g pnpm

# 依存関係のコピーとインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# ソースコードのコピー
COPY . .

# Prisma Clientの生成
RUN pnpm prisma generate

EXPOSE 3000

CMD ["pnpm", "dev"]
