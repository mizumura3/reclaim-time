# Reclaim Time - Chrome拡張機能

指定した時間までウェブサイトへのアクセスをブロックして、時間を取り戻すChrome拡張機能です。

## 機能

- 🚫 指定したウェブサイトへのアクセスをブロック
- ⏰ サイトごとに解除時刻を設定可能
- 📋 複数のサイトを個別に管理
- ⏱️ ブロック画面でリアルタイムカウントダウン表示
- 💡 有効/無効の切り替えが可能

## インストール方法

1. このリポジトリをクローンまたはダウンロード
```bash
git clone https://github.com/mizumura3/reclaim-time.git
```

2. Chromeで拡張機能ページを開く
   - `chrome://extensions/` にアクセス
   - または、メニュー → その他のツール → 拡張機能

3. デベロッパーモードを有効にする
   - ページ右上の「デベロッパーモード」をONにする

4. 拡張機能を読み込む
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `reclaim-time`ディレクトリを選択

## 使い方

1. **サイトの追加**
   - 拡張機能アイコンをクリックしてポップアップを開く
   - サイトのURL（例：youtube.com）を入力
   - 解除時刻を設定
   - 「追加」ボタンをクリック

2. **ブロックの動作**
   - 登録したサイトにアクセスすると自動的にブロック画面が表示される
   - 残り時間がカウントダウン表示される
   - 設定した時刻になると自動的にアクセス可能になる

3. **サイトの管理**
   - ポップアップから登録済みサイトの一覧を確認
   - トグルスイッチで有効/無効を切り替え
   - ゴミ箱アイコンでサイトを削除

## URLパターンの例

- `youtube.com` - YouTubeをブロック
- `twitter.com` または `x.com` - Twitter/Xをブロック
- `*.netflix.com` - Netflixの全サブドメインをブロック
- `facebook.com` - Facebookをブロック

## 開発

### ディレクトリ構成

```
reclaim-time/
├── manifest.json          # 拡張機能の設定
├── src/
│   ├── background/       # Service Worker
│   ├── popup/           # ポップアップUI
│   ├── blocked/         # ブロック画面
│   └── utils/           # 共通ユーティリティ
└── assets/
    └── icons/           # アイコンファイル
```

### 技術スタック

- Chrome Extension Manifest V3
- Vanilla JavaScript
- Chrome Storage API
- Chrome Tabs API

## 作者

[@mizumura3](https://github.com/mizumura3)