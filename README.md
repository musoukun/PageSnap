# PageSnap (PDF to Image Converter) - Webアプリケーション

## 概要
PDFファイルを高品質な画像（PNG/JPEG）に変換するWebアプリケーションです。
Docker環境で動作し、複数のPDFファイルの同時処理、非同期変換、進捗管理に対応しています。

## 主な機能
- 📤 **ドラッグ&ドロップアップロード**: 複数PDFファイルの簡単アップロード
- 🔄 **非同期変換処理**: 複数ユーザーの同時利用に対応
- 📊 **リアルタイム進捗表示**: 変換状況をリアルタイムで確認
- 🆔 **永続的なジョブ管理**: 変換IDでブラウザ再起動後も状況確認可能
- 📦 **ZIP一括ダウンロード**: 変換済み画像をまとめてダウンロード
- 🗑️ **自動クリーンアップ**: 設定可能な保持期間（デフォルト2日）
- 🎨 **高品質変換**: 300 DPI、PNG/JPEG形式対応

## セットアップ

### 必要条件
- Docker & Docker Compose

### セットアップ
```bash
# Docker環境構築・起動
docker-compose up -d --build
```

## 使用方法

1. **アクセス**: http://localhost:3000
2. **アップロード**: PDFファイルをドラッグ&ドロップまたは選択
3. **変換ID保存**: 表示された変換IDを必ず保存
4. **変換開始**: 出力形式を選択して変換開始
5. **進捗確認**: リアルタイムで変換進捗を確認
6. **ダウンロード**: 完了後にZIPファイルをダウンロード

### 変換IDでの状況確認
- ブラウザを閉じても変換IDで状況確認可能
- 「ID入力」タブから変換IDを入力
- LocalStorageに自動保存される

## API エンドポイント

### アップロード
```
POST /api/upload
Content-Type: multipart/form-data
```

### 変換開始
```
POST /api/convert
Content-Type: application/json
{
  "conversionId": "uuid",
  "format": "png|jpeg"
}
```

### 状況確認
```
GET /api/status/[id]
```

### ダウンロード
```
GET /api/download/[id]
```

### クリーンアップ（手動）
```
POST /api/cleanup
```

## 設定

### 環境変数（.envの例）
```bash
# PDF変換設定
PDF_RETENTION_DAYS=2
UPLOAD_MAX_SIZE=10485760
CONCURRENT_JOBS=1000
ENABLE_CLEANUP=true         # 自動クリーンアップ有効化
# 開発環境設定
NODE_ENV=production
```

## ディレクトリ構成
```
pdf2img/
├── docker-compose.yml      # Docker Compose設定
├── web/                    # Next.jsアプリケーション
│   ├── Dockerfile          # Webアプリコンテナ（ImageMagick内蔵）
│   ├── app/                # Next.js App Router
│   │   ├── api/            # APIルート
│   │   └── page.tsx        # メインページ
│   ├── components/         # Reactコンポーネント
│   │   ├── FileUpload.tsx
│   │   ├── ConversionStatus.tsx
│   │   └── IdInput.tsx
│   ├── lib/                # ユーティリティ
│   │   ├── pdf-converter.ts # PDF変換ライブラリ
│   │   └── cleanup.ts      # クリーンアップ機能
│   └── uploads/            # アップロードファイル
└── README.md               # このファイル
```

## 管理コマンド

### アプリケーション管理
```bash
# 起動
docker-compose up -d --build

# 停止
docker-compose down

# 状況確認
docker-compose ps

# ログ確認
docker-compose logs web
```

### データ管理
```bash
# 手動クリーンアップ実行
curl -X POST http://localhost:3000/api/cleanup

# アップロードディレクトリ確認
ls -la ./web/uploads/
```

## トラブルシューティング

### よくある問題

1. **ポート3000が使用中**
   ```bash
   # 使用中のプロセスを確認
   lsof -i :3000
   # または
   netstat -tulpn | grep :3000
   ```

2. **Docker コンテナが起動しない**
   ```bash
   # ログを確認
   docker-compose logs
   
   # 強制再構築
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **変換が失敗する**
   - Webアプリのログを確認: `docker-compose logs web`
   - アップロードファイルのパーミッションを確認
   - ImageMagickが正しくインストールされているか確認

4. **ファイルが見つからない**
   - ボリュームマッピングを確認
   - `./web/uploads/` ディレクトリの存在確認

### サポート
問題が解決しない場合は、以下の情報と共にご連絡ください：
- エラーメッセージ
- `docker-compose logs` の出力
- 使用環境（OS、Dockerバージョン等）

## 技術スタック
- **フロントエンド**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **PDF変換**: poppler-utils (pdftoppm)
- **コンテナ**: Docker, Docker Compose
- **通知**: Sonner (Toast)
- **ファイル管理**: Archiver (ZIP作成)

---
pdf2img
