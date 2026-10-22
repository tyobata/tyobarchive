// Run: node scripts/test-categories.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context = vm.createContext({ URL });
vm.runInContext(await readFile(new URL('work-data.js', import.meta.url), 'utf8'), context, { timeout: 1000 });
const { validateCategories, normalizeWork } = context.portfolioData;
const valid = [
  { id: 'photo', name: 'Photography' },
  { id: 'fan-art', name: 'Fan Art' },
  { id: 'animation', name: 'アニメーション' },
];
const categories = validateCategories(valid);
const work = { title: 'Example', category: 'animation', thumbnail: 'thumb.jpg', youtube: 'https://youtu.be/M7lc1UVf-VE' };
const normalize = value => normalizeWork(value, 'sample', 'https://example.com/tyobarchive/archive/sample/work.js', categories);

test('custom category IDs, names, order and an empty list are supported', () => {
  assert.deepEqual(Array.from(categories, item => ({ ...item })), valid);
  assert.equal(validateCategories([]).length, 0);
  assert.equal(validateCategories([{ id: '3d-art', name: '  立体作品  ' }])[0].name, '立体作品');
});

test('reserved or duplicate IDs and malformed entries are rejected', () => {
  for (const invalid of [undefined, {}, [null], [[]], [{ id: 'Fan Art', name: 'Fan Art' }],
    [{ id: 'all', name: 'All' }], [{ id: 'photo', name: ' ' }], [{ id: 'photo', name: 1 }],
    [{ id: 'photo', name: 'A' }, { id: 'photo', name: 'B' }]]) {
    assert.throws(() => validateCategories(invalid));
  }
});

test('registered categories work with either images or videos', () => {
  assert.equal(normalize(work).category, 'animation');
  assert.equal(normalize(work).youtube, work.youtube);
  const photo = normalize({ ...work, category: 'fan-art', youtube: '', image: 'image.jpg' });
  assert.equal(photo.category, 'fan-art');
  assert.equal(photo.image, 'https://example.com/tyobarchive/archive/sample/image.jpg');
});

test('unregistered category IDs identify the settings file', () => {
  assert.throws(() => normalize({ ...work, category: 'missing' }), /archive\/categories\.js/);
  assert.throws(() => normalize({ ...work, category: 'all' }), /未登録/);
});

test('details use the category name by default and preserve custom labels', () => {
  assert.equal(normalize(work).label, 'アニメーション');
  assert.equal(normalize({ ...work, label: '' }).label, 'アニメーション');
  assert.equal(normalize({ ...work, label: '  ' }).label, 'アニメーション');
  assert.equal(normalize({ ...work, label: 'Motion study' }).label, 'Motion study');
});
