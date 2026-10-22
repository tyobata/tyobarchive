(() => {
  'use strict';
  // Only recognized YouTube hosts and validated video IDs become iframe URLs.
  const hosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);
  const shortHosts = new Set(['youtu.be', 'www.youtu.be']);
  function parseTime(value) {
    if (!value) return 0;
    if (/^\d+$/.test(value)) return Math.min(Number(value), 86400);
    const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
    return match ? Math.min((Number(match[1]) || 0) * 3600 + (Number(match[2]) || 0) * 60 + (Number(match[3]) || 0), 86400) : 0;
  }
  function parseYouTubeURL(input) {
    if (typeof input !== 'string' || !input.trim()) return null;
    let url;
    try { url = new URL(input.trim()); } catch { return null; }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    let id;
    if (shortHosts.has(url.hostname) && parts.length === 1) id = parts[0];
    else if (hosts.has(url.hostname)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else if (['embed', 'shorts', 'live'].includes(parts[0]) && parts.length === 2) id = parts[1];
    }
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    const embed = new URL('https://www.youtube-nocookie.com/embed/' + id);
    embed.searchParams.set('playsinline', '1');
    embed.searchParams.set('rel', '0');
    const start = parseTime(url.searchParams.get('start') || url.searchParams.get('t'));
    const watch = new URL('https://www.youtube.com/watch');
    watch.searchParams.set('v', id);
    if (start) {
      embed.searchParams.set('start', String(start));
      watch.searchParams.set('t', String(start));
    }
    return { id, embedUrl: embed.href, watchUrl: watch.href };
  }
  window.portfolioMedia = { parseYouTubeURL };
})();

