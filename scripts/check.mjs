// Run before publishing: node scripts/check.mjs
import { readFile, readdir, stat, realpath } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute, sep, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const errors = [];
const shared = vm.createContext({ URL });
shared.window = shared;
for (const name of ['work-data.js', 'media.js', 'vendor/markdown-it-15.0.3.min.js', 'markdown.js']) {
  const filename = join(root, 'scripts', name);
  vm.runInContext(await readFile(filename, 'utf8'), shared, { filename, timeout: 1000 });
}

async function exactFile(path) {
  const part = relative(root, path);
  if (part === '..' || part.startsWith('..' + sep) || isAbsolute(part)) throw new Error('素材はサイトのフォルダー内に置いてください: ' + path);
  let cursor = root;
  for (const segment of part.split(sep)) {
    const entries = await readdir(cursor);
    if (!entries.includes(segment)) throw new Error('ファイルがありません（大文字・小文字も区別します）: ' + part);
    cursor = join(cursor, segment);
  }
  if (!(await stat(cursor)).isFile()) throw new Error('ファイルを指定してください: ' + part);
}

let categories = null;
try {
  const filename = join(root, 'works', 'categories.js');
  await exactFile(filename);
  const config = vm.createContext({});
  config.window = config;
  vm.runInContext(await readFile(filename, 'utf8'), config, { filename, timeout: 1000 });
  categories = shared.portfolioData.validateCategories(config.portfolioCategories);
} catch (error) {
  errors.push('works/categories.js: ' + error.message);
}

let folders = [];
try {
  const filename = join(root, 'works', 'index.js');
  const manifest = vm.createContext({});
  manifest.window = manifest;
  vm.runInContext(await readFile(filename, 'utf8'), manifest, { filename, timeout: 1000 });
  folders = shared.portfolioData.validateFolders(manifest.portfolioWorkFolders);
} catch (error) {
  errors.push('works/index.js: ' + error.message);
}

let checked = 0;
const assets = new Set();
let remoteCount = 0;
for (const id of (categories === null ? [] : folders)) {
  const filename = join(root, 'works', id, 'work.js');
  try {
    await exactFile(filename);
    let calls = 0;
    let data;
    const context = vm.createContext({ registerPortfolioWork(value) { calls += 1; data = value; } });
    context.window = context;
    vm.runInContext(await readFile(filename, 'utf8'), context, { filename, timeout: 1000 });
    if (calls !== 1) throw new Error('registerPortfolioWork を1回だけ呼び出してください。');
    const project = shared.portfolioData.normalizeWork(data, id, pathToFileURL(filename).href, categories);
    if (project.youtube && !shared.portfolioMedia.parseYouTubeURL(project.youtube)) throw new Error('YouTubeのURL形式を確認してください。');
    for (const key of ['thumbnail', 'image', 'video', 'content']) {
      if (!project[key]) continue;
      const url = new URL(project[key]);
      if (url.protocol === 'file:') assets.add(fileURLToPath(url));
      else remoteCount += 1;
    }
    if (project.content && new URL(project.content).protocol === 'file:') {
      const bodyPath = fileURLToPath(project.content);
      await exactFile(bodyPath);
      const body = shared.portfolioMarkdown.parse(await readFile(bodyPath, 'utf8'), project.content);
      for (const image of body.images) {
        const url = new URL(image);
        if (url.protocol === 'file:') assets.add(fileURLToPath(url));
        else remoteCount += 1;
      }
    }
    checked += 1;
  } catch (error) {
    errors.push('works/' + id + '/work.js: ' + error.message);
  }
}
for (const path of assets) {
  try { await exactFile(path); }
  catch (error) { errors.push(error.message); }
}
if (errors.length) {
  console.error(errors.map(error => '- ' + error).join('\n'));
  process.exitCode = 1;
} else {
  console.log(checked + '件の作品情報と' + assets.size + '件のローカル素材を確認しました。');
  if (remoteCount) console.log('外部メディア・本文URLの到達性は確認していません。');
}
