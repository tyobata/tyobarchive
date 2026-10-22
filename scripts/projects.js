(() => {
  'use strict';
  // Classic scripts keep both file:// previews and GitHub Pages working without a build.
  const archiveRoot = new URL('../archive/', document.currentScript.src);
  const pending = new Map();
  let categories = [];
  window.portfolioProjects = [];

  window.registerPortfolioWork = data => {
    const script = document.currentScript;
    const id = script?.dataset.portfolioWork;
    const record = pending.get(id);
    if (!record || record.script !== script) return;
    if (record.called) {
      record.error = 'registerPortfolioWork は1ファイルにつき1回だけ呼び出してください。';
      return;
    }
    record.called = true;
    try {
      record.project = window.portfolioData.normalizeWork(data, id, script.src, categories);
    } catch (error) {
      record.error = error.message;
    }
  };

  function loadWork(id) {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = new URL(id + '/work.js', archiveRoot).href;
      script.dataset.portfolioWork = id;
      const record = { script, called: false, project: null, error: null };
      pending.set(id, record);
      let settled = false;
      const finish = error => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        pending.delete(id);
        script.remove();
        const message = error || record.error || (!record.project ? '作品情報を登録できませんでした。work.js の書式を確認してください。' : '');
        resolve(message ? { error: { id, message: 'archive/' + id + '/work.js: ' + message } } : { project: record.project });
      };
      const timer = setTimeout(() => finish('読み込みがタイムアウトしました。再読み込みしてください。'), 15000);
      script.onload = () => finish();
      script.onerror = () => finish('ファイルを読み込めません。フォルダー名・ファイル名を確認してください。');
      document.head.append(script);
    });
  }

  window.portfolioReady = (async () => {
    try {
      categories = window.portfolioData.validateCategories(window.portfolioCategories);
    } catch (error) {
      return { projects: [], categories: [], errors: [{ id: null, message: 'archive/categories.js: ' + error.message }] };
    }
    let folders;
    try {
      folders = window.portfolioData.validateFolders(window.portfolioWorkFolders);
    } catch (error) {
      return { projects: [], categories, errors: [{ id: null, message: error.message }] };
    }
    const results = await Promise.all(folders.map(loadWork));
    // Promise.all preserves the order in archive/index.js, regardless of load order.
    const projects = results.flatMap(result => result.project ? [result.project] : []);
    const errors = results.flatMap(result => result.error ? [result.error] : []);
    window.portfolioProjects = projects;
    return { projects, categories, errors };
  })();
})();
