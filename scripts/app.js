(async () => {
  'use strict';
  const { projects, categories, errors } = await window.portfolioReady;
  const errorBox = document.querySelector('#project-data-error');
  if (errors.length) {
    errorBox.textContent = '作品データを確認してください。\n' + errors.map(error => error.message).join('\n');
    errorBox.hidden = false;
  }
  const grid = document.querySelector('#project-grid');
  const filterList = document.querySelector('.filter-list');
  const status = document.querySelector('#filter-status');
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };


  const filters = [{ id: 'all', name: 'All' }, ...categories].map(category => {
    const button = create('button', 'filter');
    button.type = 'button';
    button.dataset.filter = category.id;
    const name = create('span', 'filter-name', category.name);
    const count = create('span');
    count.dataset.count = category.id;
    button.append(name, count);
    return button;
  });
  filterList.replaceChildren(...filters);

  function card(project) {
    const article = create('article', 'project-card');
    const link = create('a', 'project-link');
    link.href = 'work.html?id=' + encodeURIComponent(project.id);
    link.setAttribute('aria-label', project.title + ' — 作品詳細');
    const visual = create('span', 'tile-visual');
    const frame = create('span', 'tile-image');
    const image = create('img');
    image.src = project.thumbnail || project.image;
    image.alt = project.thumbnailAlt || project.alt || project.title;
    image.width = 320;
    image.height = 320;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.style.objectFit = project.thumbnailFit === 'contain' ? 'contain' : 'cover';
    image.style.objectPosition = project.thumbnailPosition || '50% 50%';
    // Decorative copies follow the custom thumbnail's crop and position.
    const ambient = create('span', 'tile-ambient');
    ambient.setAttribute('aria-hidden', 'true');
    const ambientImage = image.cloneNode();
    ambientImage.alt = '';
    ambientImage.draggable = false;
    ambientImage.addEventListener('error', () => { ambient.hidden = true; }, { once: true });
    ambient.append(ambientImage);
    const reflection = create('span', 'tile-reflection');
    reflection.setAttribute('aria-hidden', 'true');
    const reflectedImage = image.cloneNode();
    reflectedImage.alt = '';
    reflectedImage.draggable = false;
    reflectedImage.addEventListener('error', () => { reflection.hidden = true; }, { once: true });
    reflection.append(reflectedImage);
    image.addEventListener('error', () => {
      image.hidden = true;
      ambient.hidden = true;
      reflection.hidden = true;
      frame.append(create('span', 'tile-fallback', project.title));
    }, { once: true });
    frame.append(image);
    visual.append(ambient, frame, reflection);
    const title = create('h2', 'tile-title', project.title);
    link.append(visual, title);
    article.append(link);
    return article;
  }

  function render(category, announce) {
    const visible = projects.filter(project => category === 'all' || project.category === category);
    grid.replaceChildren(...visible.map(card));
    if (!visible.length) grid.append(create('p', 'empty-note', 'この分類の作品はまだありません。'));
    filters.forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    status.textContent = announce ? visible.length + '件の作品を表示しています。' : '';
  }

  const initial = new URLSearchParams(location.search).get('type');
  const category = categories.some(item => item.id === initial) ? initial : 'all';
  filters.forEach(button => {
    const type = button.dataset.filter;
    const count = projects.filter(project => type === 'all' || project.category === type).length;
    button.querySelector('[data-count]').textContent = String(count).padStart(2, '0');
    button.addEventListener('click', () => {
      // Keep a shareable filter URL on HTTP previews and GitHub Pages.
      if (location.protocol !== 'file:') {
        const url = new URL(location.href);
        if (type === 'all') url.searchParams.delete('type');
        else url.searchParams.set('type', type);
        history.replaceState(null, '', url);
      }
      render(type, true);
    });
  });
  document.querySelector('#current-year').textContent = new Date().getFullYear();
  render(category, false);
})();
