(() => {
  'use strict';

  // Raw HTML stays disabled. Only Markdown-generated markup enters the page.
  function parse(source, sourceUrl) {
    const parser = new globalThis.markdownit({ html: false, breaks: false, linkify: false, typographer: false });
    const environment = {};
    const tokens = parser.parse(source, environment);
    const images = [];
    const base = new URL(sourceUrl);

    function visit(items) {
      for (const token of items) {
        const isImage = token.type === 'image';
        const attribute = isImage ? 'src' : token.type === 'link_open' ? 'href' : null;
        if (attribute) {
          const original = token.attrGet(attribute);
          if (original !== null && !(attribute === 'href' && original.startsWith('#'))) {
            try {
              const url = new URL(original, base);
              const allowed = ['http:', 'https:'];
              if (base.protocol === 'file:') allowed.push('file:');
              if (!isImage) allowed.push('mailto:', 'tel:');
              if (!allowed.includes(url.protocol)) throw new Error('Unsupported URL');
              token.attrSet(attribute, url.href);
              if (isImage) images.push(url.href);
            } catch {
              token.attrs = token.attrs.filter(([name]) => name !== attribute);
            }
          }
          if (isImage) {
            token.attrSet('loading', 'lazy');
            token.attrSet('decoding', 'async');
          }
        }
        if (token.children) visit(token.children);
      }
    }
    visit(tokens);

    // Confine wide tables to their own keyboard-accessible scroll region.
    parser.renderer.rules.table_open = () => '<div class="markdown-table" tabindex="0" role="region" aria-label="表"><table>\n';
    parser.renderer.rules.table_close = () => '</table></div>\n';
    return { html: parser.renderer.render(tokens, parser.options, environment), images };
  }

  globalThis.portfolioMarkdown = { parse };
})();
