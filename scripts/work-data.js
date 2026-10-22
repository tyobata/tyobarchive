(() => {
  'use strict';
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  function validateFolders(value) {
    if (!Array.isArray(value)) throw new Error('archive/index.js に作品フォルダーの配列を設定してください。');
    const seen = new Set();
    return value.map(id => {
      if (typeof id !== 'string' || !slug.test(id)) throw new Error('フォルダー名は半角小文字・数字・ハイフンで指定してください: ' + String(id));
      if (seen.has(id)) throw new Error('作品フォルダーが重複しています: ' + id);
      seen.add(id);
      return id;
    });
  }

  function validateCategories(value) {
    if (!Array.isArray(value)) throw new Error('カテゴリを配列で設定してください。');
    const seen = new Set();
    return value.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('各カテゴリを { id, name } で指定してください。');
      if (typeof item.id !== 'string' || !slug.test(item.id)) throw new Error('カテゴリIDは半角小文字・数字・ハイフンで指定してください: ' + String(item.id));
      if (item.id === 'all') throw new Error('all は全作品表示用の予約IDです。別のカテゴリIDを使ってください。');
      if (seen.has(item.id)) throw new Error('カテゴリIDが重複しています: ' + item.id);
      if (typeof item.name !== 'string' || !item.name.trim()) throw new Error('カテゴリの表示名 name を入力してください: ' + item.id);
      seen.add(item.id);
      return { id: item.id, name: item.name.trim() };
    });
  }

  function normalizeWork(value, id, scriptUrl, categories) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('work.js の作品情報は { ... } で指定してください。');
    const text = (key, fallback = '') => {
      if (value[key] === undefined || value[key] === null) return fallback;
      if (typeof value[key] !== 'string') throw new Error(key + ' は文字列で指定してください。');
      return value[key].trim();
    };
    const asset = key => {
      const source = text(key);
      if (!source) return '';
      const url = new URL(source, scriptUrl);
      if (!['http:', 'https:', 'file:'].includes(url.protocol)) throw new Error(key + ' に使えないURL形式です。');
      return url.href;
    };
    const title = text('title');
    if (!title) throw new Error('title（作品名）を入力してください。');
    const category = categories.find(item => item.id === value.category);
    if (!category) throw new Error('category「' + String(value.category) + '」は未登録です。archive/categories.js のIDを指定してください。');
    if (value.thumbnailFit !== undefined && !['cover', 'contain'].includes(value.thumbnailFit)) throw new Error('thumbnailFit は cover または contain にしてください。');
    if (value.year !== undefined && !['string', 'number'].includes(typeof value.year)) throw new Error('year は文字列または数値にしてください。');
    const image = asset('image');
    const thumbnail = asset('thumbnail') || image;
    const video = asset('video');
    const youtube = text('youtube');
    if (!thumbnail) throw new Error('thumbnail または image に一覧画像を指定してください。');
    if (!image && !video && !youtube) throw new Error('image・video・youtube のいずれかに詳細用メディアを指定してください。');
    return {
      id, title, category: value.category,
      label: text('label') || category.name,
      year: String(value.year ?? ''),
      description: text('description'),
      content: asset('content'),
      thumbnail, thumbnailAlt: text('thumbnailAlt'), thumbnailFit: value.thumbnailFit || 'cover',
      thumbnailPosition: text('thumbnailPosition', '50% 50%'),
      image, alt: text('alt'), video, youtube,
    };
  }

  globalThis.portfolioData = { validateFolders, validateCategories, normalizeWork };
})();
