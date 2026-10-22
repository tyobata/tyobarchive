(async () => {
  'use strict';
  const { projects, errors } = await window.portfolioReady;
  const errorBox = document.querySelector('#project-data-error');
  if (errors.length) {
    errorBox.textContent = '作品データを確認してください。\n' + errors.map(error => error.message).join('\n');
    errorBox.hidden = false;
  }
  const id = new URLSearchParams(location.search).get('id');
  const index = projects.findIndex(project => project.id === id);
  document.querySelector('#current-year').textContent = new Date().getFullYear();
  if (index < 0) {
    if (errors.some(error => error.id === id || error.id === null)) {
      document.title = 'Work unavailable — tyobarchive';
      return;
    }
    document.querySelector('#project-not-found').hidden = false;
    document.title = 'Work not found — tyobarchive';
    return;
  }
  const project = projects[index];
  const content = document.querySelector('#project-content');
  const media = document.querySelector('#project-media');
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const setText = (selector, text) => { document.querySelector(selector).textContent = text; };
  const mediaError = message => media.replaceChildren(create('p', 'media-error', message));
  setText('#project-title', project.title);
  setText('#project-description', project.description || '');
  document.querySelector('#project-description').hidden = !project.description;
  setText('#project-year', project.year);
  setText('#project-kind', project.label);
  setText('#project-index', String(index + 1).padStart(2, '0') + ' / ' + String(projects.length).padStart(2, '0'));
  document.title = project.title + ' — tyobarchive';
  document.querySelector('meta[name="description"]').content = project.description || project.title;
  content.hidden = false;

  const youtube = window.portfolioMedia.parseYouTubeURL(project.youtube || project.video);
  if (youtube) {
    if (['http:', 'https:'].includes(location.protocol)) {
      const frame = create('div', 'youtube-frame');
      const iframe = create('iframe');
      iframe.title = project.title + ' — YouTube 動画';
      iframe.src = youtube.embedUrl;
      iframe.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.append(iframe);
      media.append(frame);
    } else {
      const placeholder = create('div', 'youtube-placeholder');
      const poster = create('img');
      poster.src = project.image || project.thumbnail;
      poster.alt = project.alt || project.title;
      poster.addEventListener('error', () => poster.remove(), { once: true });
      placeholder.append(poster, create('p', 'youtube-note', 'YouTube の埋め込みはローカルサーバーまたは公開サイトで表示されます。'));
      media.append(placeholder);
    }
    const links = create('div', 'youtube-links');
    const watch = create('a', 'youtube-watch', 'YouTubeで見る ↗');
    watch.href = youtube.watchUrl;
    watch.target = '_blank';
    watch.rel = 'noopener noreferrer';
    links.append(watch, create('p', 'youtube-note', '再生できない場合は、YouTubeでご覧ください。'));
    media.append(links);
  } else if (project.youtube) {
    mediaError('YouTube のURLを確認してください。通常の視聴URL・共有URL・ShortsのURLを設定できます。');
  } else if (project.video) {
    const video = create('video', 'detail-video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    if (project.image) video.poster = project.image;
    video.src = project.video;
    video.setAttribute('aria-label', project.title);
    video.append(document.createTextNode('お使いのブラウザーは動画の再生に対応していません。'));
    video.addEventListener('error', () => mediaError('動画を読み込めませんでした。ファイルの場所や形式を確認してください。'), { once: true });
    media.append(video);
  } else if (project.image) {
    const image = create('img', 'detail-image');
    image.src = project.image;
    image.alt = project.alt || project.title;
    image.addEventListener('error', () => mediaError('画像を読み込めませんでした。ファイルの場所を確認してください。'), { once: true });
    media.append(image);
  } else {
    mediaError('この作品のメディアはまだ登録されていません。');
  }

  function navigation(selector, target) {
    const link = document.querySelector(selector);
    if (target) {
      link.href = 'work.html?id=' + encodeURIComponent(target.id);
      link.setAttribute('aria-label', (selector.includes('previous') ? '前の作品：' : '次の作品：') + target.title);
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
    }
  }
  navigation('#previous-project', projects[index - 1]);
  navigation('#next-project', projects[index + 1]);

  // Body loading is optional and never blocks the main media or navigation.
  if (!project.content) return;
  const body = document.querySelector('#project-body');
  const status = document.querySelector('#project-body-status');
  status.hidden = false;
  if (location.protocol === 'file:') {
    status.textContent = '本文はローカルプレビュー（node scripts/preview.mjs）または公開サイトで表示されます。';
    return;
  }
  status.textContent = '本文を読み込んでいます…';
  body.setAttribute('aria-busy', 'true');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(project.content, { signal: controller.signal });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const source = await response.text();
    const rendered = window.portfolioMarkdown.parse(source, response.url || project.content);
    body.innerHTML = rendered.html;
    body.hidden = !rendered.html.trim();
    status.hidden = true;
  } catch {
    status.textContent = '本文を読み込めませんでした。ページを再読み込みしてください。';
  } finally {
    clearTimeout(timer);
    body.removeAttribute('aria-busy');
  }
})();
