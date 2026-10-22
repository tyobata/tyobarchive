// Dependency-free Markdown regression checks: node scripts/test-markdown.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context = vm.createContext({ URL });
for (const name of ['vendor/markdown-it-15.0.3.min.js', 'markdown.js', 'work-data.js']) {
  vm.runInContext(await readFile(new URL(name, import.meta.url), 'utf8'), context, { filename: name, timeout: 1000 });
}
const parse = (source, base = 'https://example.com/tyobarchive/archive/sample/content.md') =>
  context.portfolioMarkdown.parse(source, base);

test('standard Markdown, Japanese text, tables and fenced code', () => {
  const source = ['## 作品について', '', '**光**と*影*', '', '- 一枚目', '- 二枚目', '', '> 引用', '',
    '| 名前 | 内容 |', '| --- | --- |', '| 素材 | 写真 |', '',
    '```html', '<b>literal code</b>', '```'].join('\n');
  const { html } = parse(source);
  for (const expected of ['<h2>作品について</h2>', '<strong>光</strong>', '<em>影</em>', '<ul>', '<blockquote>', '<table>',
    'class="markdown-table"', '&lt;b&gt;literal code&lt;/b&gt;']) assert.ok(html.includes(expected), expected);
});

test('relative URLs use the Markdown location, including nested folders and reference links', () => {
  const { html, images } = parse([
    '![写真](../images/photo%20one.jpg "光")', '',
    '[資料](notes.pdf) [節](#project-title) [連絡](mailto:hello@example.com)', '',
    '![参照][image]', '', '[image]: ./two.png',
  ].join('\n'), 'https://example.com/tyobarchive/archive/sample/text/content.md');
  assert.deepEqual(Array.from(images), [
    'https://example.com/tyobarchive/archive/sample/images/photo%20one.jpg',
    'https://example.com/tyobarchive/archive/sample/text/two.png',
  ]);
  assert.ok(html.includes('href="https://example.com/tyobarchive/archive/sample/text/notes.pdf"'));
  assert.ok(html.includes('href="#project-title"'));
  assert.ok(html.includes('href="mailto:hello@example.com"'));
});

test('raw HTML and active URL schemes never become executable markup', () => {
  const { html, images } = parse([
    '<script>window.bad = true</script>',
    '<img src=x onerror="window.bad = true">',
    '<iframe src="https://example.com/"></iframe>', '',
    '[bad](javascript:alert%281%29)',
    '[encoded](jav&#x61;script:alert%281%29)',
    '![bad](data:text/html,attack)',
    '![svg](data:image/svg+xml,attack)',
    '![custom](custom:attack)',
    '[custom](custom:attack)',
    '![title](image.jpg "&quot; onerror=&quot;alert(1)")',
  ].join('\n'));
  assert.doesNotMatch(html, /<(script|iframe)\b/i);
  assert.doesNotMatch(html, /(?:href|src)="(?:javascript|data|custom):/i);
  assert.doesNotMatch(html, /<img[^>]*" onerror="/i);
  assert.equal(images.length, 1);
});

test('file URLs resolve for the publish checker; empty content is empty', () => {
  assert.equal(parse('').html, '');
  assert.deepEqual(Array.from(parse('![写真](image.jpg)', 'file:///site/archive/sample/content.md').images),
    ['file:///site/archive/sample/image.jpg']);
});

test('content remains optional and follows work.js-relative path rules', () => {
  const base = { title: '作品', category: 'photo', thumbnail: 'thumb.jpg', image: 'image.jpg' };
  const normalize = value => context.portfolioData.normalizeWork(value, 'sample', 'https://example.com/tyobarchive/archive/sample/work.js', context.portfolioData.validateCategories([{ id: 'photo', name: 'Photography' }]));
  assert.equal(normalize(base).content, '');
  assert.equal(normalize({ ...base, content: 'content.md' }).content, 'https://example.com/tyobarchive/archive/sample/content.md');
  assert.throws(() => normalize({ ...base, content: 1 }), /content/);
  assert.throws(() => normalize({ ...base, content: 'javascript:alert(1)' }), /content/);
});
