# tyobarchive

画像・動画を並べる、GitHub Pages向けのポートフォリオです。
**1作品＝1フォルダー**で管理します。本文はMarkdownで編集できます。
ビルドやパッケージのインストールは不要です。

## 普段編集する場所

```text
tyobarchive/
├─ index.html                  一覧・About・関連サイト
├─ work.html                   作品詳細の共通レイアウト
├─ styles.css                  色・文字・レイアウト
├─ archive/
│  ├─ index.js                 掲載するフォルダー名と表示順
│  ├─ categories.js            カテゴリのID・表示名・並び順
│  ├─ _template/               新しい作品を作るときのコピー元
│  │  ├─ work.js               作品名・短い概要・素材ファイル名
│  │  ├─ content.md            Markdownの本文
│  │  ├─ thumbnail.svg         一覧画像の仮素材
│  │  └─ image.svg             詳細画像の仮素材
│  ├─ stillness/               写真作品の例
│  │  ├─ work.js
│  │  ├─ content.md            Markdown本文の例
│  │  └─ image.jpg             一覧と詳細で同じ画像を使用
│  ├─ motion/                  ローカル動画作品の例
│  │  ├─ work.js
│  │  ├─ thumbnail.svg
│  │  ├─ poster.svg
│  │  └─ video.mp4
│  ├─ youtube-demo/            YouTube作品の例
│  │  ├─ work.js
│  │  └─ thumbnail.svg         動画本体はYouTube上
│  └─ …                       ほかの作品フォルダー
├─ assets/
│  ├─ site/
│  │  ├─ header.jpg            ヘッダー背景
│  │  └─ about.png             About画像
│  ├─ favicon.svg              ブラウザーのアイコン
│  └─ CREDITS.md               同梱デモ素材の出典
└─ scripts/                    表示処理・確認用ツール（通常は編集不要）
```

ヘッダー・Aboutの画像は作品フォルダーから独立しています。
作品を削除・差し替えしても共通画像は変わりません。
既存の作品詳細URL（例：`work.html?id=stillness`）もそのまま使えます。

## カテゴリを追加・変更する

カテゴリは `archive/categories.js` でまとめて管理します。
たとえば「Animation」を追加する場合は、次の2か所を編集します。既存のカテゴリ行を残して追加してください。

1. `archive/categories.js` の配列にカテゴリを追加します。

```js
window.portfolioCategories = [
  { id: 'photo', name: 'Photography' },
  { id: 'film', name: 'Film' },
  { id: 'fan-art', name: 'Fan Art' },
  { id: 'animation', name: 'Animation' },
];
```

2. その分類に入れたい作品の `work.js` で、登録したIDを指定します。

```js
category: 'animation',
// label: 'Motion graphics', // 詳細ページだけ別の名称にしたい場合
```

これで一覧に「Animation」ボタンが自動で追加され、その作品を絞り込めます。
HTMLや表示処理の変更は不要です。

| 設定 | 役割 |
| --- | --- |
| `id` | 作品の `category` と対応する識別名。例：`animation`、`motion-graphics` |
| `name` | 一覧のボタン名。日本語の `'アニメーション'` なども使えます |
| 作品の `label` | 詳細ページの「Category」に表示する任意の名称。未指定または空欄なら、登録カテゴリの `name` を表示します |

IDは半角英小文字・数字を使い、単語の区切りにハイフンを使えます。重複するIDや、全件表示に使う `all` は登録できません。
一覧のボタンは配列の順に並び、作品が0件のカテゴリも表示します。「All」は自動で付きます。
表示名の変更は `name`、並び替えは配列内の行を移動するだけです。
作品側に `label` を書いている場合、詳細ページではその指定を優先します。

カテゴリを削除したりIDを変更したりするときは、そのカテゴリに所属する作品の `category` も更新してください。
未登録のIDを指定した作品は設定エラーになります。
絞り込み状態は `index.html?type=animation` のようなURLでも開けます。

カテゴリとメディアの種類は独立しています。
`animation` など任意のカテゴリでも、`image`・`video`・`youtube` の指定に応じて写真や動画を表示します。

## 新しい作品を追加する

1. `archive/_template/` を `archive/` 内へコピーします。
2. コピー先を `my-new-work` などに改名します。**半角小文字・数字・ハイフン**を使い、ほかの作品と重複させないでください。
3. 画像・動画をそのフォルダーへ入れます。
4. フォルダー内の `work.js` で作品名・カテゴリ・短い概要・素材ファイル名を編集します。`category` は `archive/categories.js` に登録したIDを指定します。
5. `content.md` に詳しい本文を書きます。本文が不要なら `work.js` の `content` 行を削除します。
6. `archive/index.js` の配列へフォルダー名を1行追加します。
7. `node scripts/preview.mjs` でローカルサーバーを起動し、[プレビュー](http://127.0.0.1:4173/)で一覧・詳細を確認します。

```js
// archive/index.js — 上から順に表示されます。
window.portfolioWorkFolders = [
  'my-new-work',
  'stillness',
  'forms',
  // ほかの作品…
];
```

フォルダーを置くだけでは掲載されません。`archive/index.js` への追加が必要です。
`_template` はコピー用なので掲載リストへ入れません。

### 写真作品の work.js

素材名は**その作品フォルダーからの相対パス**です。
`archive/my-new-work/` などの接頭辞を付ける必要はありません。

```js
window.registerPortfolioWork({
  title: '光の記録',
  category: 'photo', // archive/categories.js に登録したID
  // label: 'Landscape', // 詳細ページだけ別名にする場合
  year: '2026',
  thumbnail: 'thumbnail.jpg',
  thumbnailAlt: '窓辺の光を切り取ったサムネイル',
  thumbnailFit: 'cover',
  thumbnailPosition: '50% 50%',
  image: 'image.jpg',
  alt: '夕方の光が差し込む窓辺',
  description: '窓辺に差し込む光を記録した写真作品です。',
  content: 'content.md', // 詳しい本文。不要ならこの行を省略
});
```

一覧と詳細に同じ画像を使う場合は、`thumbnail` と `image` を両方 `'image.jpg'` にします。
一覧だけ別の画像にしたい場合は、`thumbnail` を別ファイルへ変更してください。
ファイル名は任意です。拡張子と大文字・小文字を実際のファイルに合わせます。
`media/image.jpg` のような作品フォルダー内のサブフォルダーも使えます。

### ローカル動画

`video: 'video.mp4'` を追加します。下の例では `film` に分類していますが、登録済みの任意のカテゴリを指定できます。
`image` は再生前のポスター、`thumbnail` は一覧画像です。

```js
category: 'film',
thumbnail: 'thumbnail.jpg',
image: 'poster.jpg',
video: 'video.mp4',
```

### YouTube動画

`youtube` に視聴・共有URLを設定します。下の例では `film` に分類していますが、登録済みの任意のカテゴリを指定できます。
動画ファイルを作品フォルダーへ入れる必要はありません。一覧画像は自由に設定できます。

```js
category: 'film',
thumbnail: 'thumbnail.jpg',
image: 'thumbnail.jpg',
youtube: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
```

上記URLは同梱デモにも使う[公式プレーヤーのサンプル](https://developers.google.com/youtube/player_parameters)です。ご自身の動画URLへ差し替えてください。
通常の視聴URL・共有URL・Shorts・埋め込み・ライブURLに対応します。
`youtube` と `video` が両方ある場合はYouTubeを優先します。

### 本文をMarkdownで書く

`work.js` の `description` は短い概要として表示され、ページの説明にも使われます。
長い文章・追加画像・リンクなどは、同じ作品フォルダーの `content.md` に書きます。
`content: 'content.md'` を設定した作品だけ本文を読み込みます。ファイル名は変更できます。

ひな形の `archive/_template/content.md` と、写真作品の `archive/stillness/content.md` が記入例です。
ほかの同梱作品は `content` 未指定のため、従来どおり概要とメディアを表示します。

```markdown
## この作品について

制作の背景を書きます。段落の間には空行を入れます。

**大切にしたこと**を太字に、*作品の雰囲気*を斜体にできます。

### 制作メモ

- 撮影した場所
- 制作に使った道具
- 見てほしいところ

![夕方の光が差し込む窓辺](image.jpg)

[関連するページ](https://example.com/)

> 作品に添えたい言葉や引用。

| 項目 | 内容 |
| --- | --- |
| 制作年 | 2026 |
```

見出し・段落・箇条書き・番号付きリスト・引用・強調・リンク・画像・表・コードに対応します。
コードはバッククォート1つで囲み、複数行は3つで囲みます。
ページ上部に作品タイトルがあるので、本文の見出しは `##` から始めると階層が揃います。

- 画像や相対リンクの基準は **そのMarkdownファイルがあるフォルダー** です。同じ場所の画像は `![説明](image.jpg)`、配下の画像は `![説明](media/detail.jpg)` と書きます。
- GitHub Pagesのプロジェクト配下でも使えるよう、作品内の素材には先頭が `/` のパスではなく相対パスを使います。
- `#project-title` のようなリンクは今のページ内へのリンクとして維持します。ただし、本文の見出しIDは自動生成しません。
- HTMLタグやJavaScript、`iframe` は本文では実行・解釈しません。動画の埋め込みは、上の例にある `work.js` の `video`・`youtube` を使います。本文のYouTubeリンクは通常のリンクになります。
- 外部サイトに置いたMarkdownの読み込みには、そのサイトのCORS許可が必要です。通常は同じ作品フォルダーへ置いてください。

Markdown本文はHTTPのローカルプレビューと公開後のGitHub Pagesで表示します。
`file://` でHTMLを直接開くと、ブラウザーの制約により本文は読み込めず、プレビュー方法の案内が出ます。
`content` が未指定の作品では、本文も案内も表示しません。

## 差し替え・並び替え・一覧からの除外

| 作業 | 編集する場所 |
| --- | --- |
| 作品名・短い概要・年度を変更 | その作品の `work.js` |
| 作品のカテゴリを変更 | その作品の `work.js` の `category` |
| カテゴリの追加・表示名・並び順を変更 | `archive/categories.js` |
| 詳しい本文を変更 | その作品の `content.md`（ファイル名は `work.js` の `content` で指定） |
| 画像・動画を差し替え | その作品フォルダー。同名ならファイルの置き換えだけで反映 |
| 素材ファイル名を変更 | ファイル名と `work.js`・`content.md` 内の参照を変更 |
| 表示順を変更 | `archive/index.js` の行を移動 |
| 一覧から一時的に外す | `archive/index.js` の該当行を削除、または `//` でコメントアウト |
| 作品を完全に削除 | 掲載リストから外し、作品フォルダーも削除して公開先へ反映 |

フォルダー名が作品IDになります。公開後に改名すると詳細URLも変わるため、通常は名前を変えずに中身を更新してください。
一覧から外しても公開先に残っている素材ファイルのURLはアクセスできるため、ファイル自体を公開したくない場合はフォルダーも公開先から削除します。

Aboutの紹介文も、ご自身の内容へ更新してください。
デモ素材の出典は [assets/CREDITS.md](assets/CREDITS.md) にあります。

## 確認する

写真とローカル動画は、`index.html` を直接開いて確認できます。
**Markdown本文とYouTubeの埋め込みまで確認する場合は、下記のローカルサーバーを使ってください。**
読み込み時に作品情報の誤りが見つかった場合は、ページ上に対象ファイル名を表示します。

Node.jsがある環境では、公開前に次を実行できます。

```sh
node scripts/check.mjs
```

カテゴリの書式・IDの重複・未登録カテゴリの指定、掲載リストの重複、作品情報の書式、素材ファイルの有無、大文字・小文字の間違いを確認します。
`content` で指定したMarkdownファイルと、本文に書いたローカル画像も確認します。
確認対象は掲載リストにある作品です。本文のリンク先ファイルの有無や外部URLの到達性は検査しません。
リンクの移動先やYouTubeの再生可否はブラウザーでも確認してください。

ローカルサーバーは次で起動します。

```sh
node scripts/preview.mjs
```

[ローカルプレビュー](http://127.0.0.1:4173/) または
[GitHub Pagesの階層を再現したプレビュー](http://127.0.0.1:4173/tyobarchive/)を開きます。
終了はターミナルで `Ctrl+C` です。

`file://` で直接開いた場合、YouTubeはポスターと外部リンクを表示し、Markdown本文の代わりにプレビュー方法を案内します。
本文と埋め込みはHTTPのプレビューまたは公開サイトで表示します。
公開範囲や埋め込み許可によって再生できない場合は「YouTubeで見る」から開けます。

表示処理を変更した場合は、Markdownの変換・相対パス・HTML無効化を次のコマンドでも確認できます。

```sh
node scripts/test-markdown.mjs
node scripts/test-categories.mjs
```

## サイト共通部分を更新する

- ヘッダー背景：`assets/site/header.jpg` を差し替えます。別名を使う場合は `styles.css` の `--header-image` も変更します。`--header-image-position` で切り取り位置、`--header-image: none;` で背景なしにできます。
- About画像：`assets/site/about.png` を差し替えます。別名や説明文を使う場合は `index.html` の `class="about-image"` の `src`・`alt` を変更します。
- Aboutの文章・関連サイト4件：`index.html` の `id="about"` 内を編集します。関連サイトは `href` と表示名を変更します。
- サイト名・ヘッダー文言：`index.html` と `work.html` を編集します。ブラウザーの詳細ページタイトルは `scripts/detail.js` にも設定があります。

## タイトル横のロゴを設定する

トップと作品詳細の共通ヘッダーに、タイトル文字の左側へロゴ画像を表示します。初期設定は既存の `assets/favicon.svg` です。

1. ロゴ画像を `assets/site/` に置きます。例：`assets/site/logo.png`。PNG・SVG・WebP・JPEGなど、ブラウザーで表示できる画像を使えます。
2. `styles.css` 上部の `:root` にある設定を変更します。HTMLの変更は不要です。

```css
--site-logo-image: url("assets/site/logo.png");
--site-logo-size: 1.1em;
--site-logo-display: block;
```

`--site-logo-size` は正方形の表示枠の大きさです。初期値の `1.1em` はタイトルの文字サイズに連動し、スマートフォンでも自動で小さくなります。`40px` などの指定もできます。画像は縦横比を保って枠内に収まり、切り取られません。余白の少ない、背景が透明な正方形のロゴがおすすめです。

ロゴを非表示にする場合は `--site-logo-display: none;` にします。画像と文字の間の余白も消えます。
画像を差し替えたら、その画像ファイルと `styles.css` を一緒にコミットしてください。ロゴ専用画像の指定は、ブラウザーのファビコンには影響しません。

## 表示の設定

| 設定 | 内容 |
| --- | --- |
| `thumbnailFit: 'cover'` | 一覧の正方形いっぱいに切り取り（初期値） |
| `thumbnailFit: 'contain'` | ロゴなど画像全体を表示 |
| `thumbnailPosition` | 切り取り位置。例：`'50% 30%'` |
| `--tile-size` | CSSのパネルサイズ。PCは最大136px、スマートフォンは最大128px |
| `--reflection-height` / `--reflection-opacity` | 鏡面反射の長さ・濃さ |
| `--tile-caption-gap` | パネルとタイトルの間隔。反射の長さとは独立 |
| `--ambient-opacity` / `--ambient-blur` | ホバー時の光の濃さ・ぼかし |

PCは5列、画面幅760px以下は3列、560px以下は2列です。
About画像はPCで正方形、狭い画面では説明文の高さに合わせて表示します。

## GitHub Pagesへ反映する

更新後は、掲載リスト・作品フォルダー・共通ファイルをまとめてリポジトリへコミット・プッシュします。
初回の公開元設定はGitHubの **Settings → Pages** で、ソースを **Deploy from a branch**、公開元を `main` / `/(root)` にします。
このフォルダー構成はビルド不要で、そのまま配信できます。

想定公開先は [tyobarchive](https://tyobata.github.io/tyobarchive/) です。
詳しい設定は [GitHub公式ガイド](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) を参照してください。
この作業だけでは公開・プッシュされません。
