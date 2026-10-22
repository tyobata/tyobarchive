// このフォルダーをコピーし、archive/index.js にコピー先のフォルダー名を追加します。
// 画像・動画のパスは「この work.js と同じフォルダー」を基準に書きます。
window.registerPortfolioWork({
  title: '作品タイトル',
  category: 'photo', // ../categories.js に登録したカテゴリID
  // label: 'Landscape', // 詳細の表示名を変える場合。省略するとカテゴリの表示名を使用
  year: '2026',
  thumbnail: 'thumbnail.svg', // 一覧に使う任意の画像
  thumbnailAlt: '一覧画像の説明',
  thumbnailFit: 'cover', // cover: 正方形に切り取り / contain: 全体を表示
  thumbnailPosition: '50% 50%',
  image: 'image.svg', // 写真本体、または動画の再生前ポスター
  alt: '作品画像の説明',
  description: '作品についての短い概要。',
  content: 'content.md', // 詳しい本文はこのMarkdownファイルで編集します
  // video: 'video.mp4', // ローカル動画を使う場合
  // youtube: 'https://www.youtube.com/watch?v=動画ID', // YouTubeを使う場合
});
