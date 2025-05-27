FROM node:18-alpine

# ImageMagickとその依存関係をインストール
RUN apk add --no-cache \
    imagemagick \
    imagemagick-dev \
    ghostscript \
    poppler-utils

# ImageMagickのポリシー設定を更新（PDFの読み取りを許可）
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-7/policy.xml

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# アプリケーションコードをコピー
COPY . .

# uploadsディレクトリを作成
RUN mkdir -p uploads

# ポート3000を公開
EXPOSE 3000

# 環境に応じてコマンドを実行
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm run build && npm start; else npm run dev; fi"]

