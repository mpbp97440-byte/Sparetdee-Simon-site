(() => {
  'use strict';

  const githubPagesBase = '/MPBP440-V12-Preview';
  const rawPreviewHost = ['raw.githack.com', 'rawcdn.githack.com'].includes(location.hostname);
  const rawPreviewMatch = rawPreviewHost && location.pathname.match(/^\/[^/]+\/[^/]+\/[^/]+/);
  const previewBase = rawPreviewMatch ? rawPreviewMatch[0] : githubPagesBase;
  const isPreview = Boolean(rawPreviewMatch) || (location.hostname.endsWith('github.io') && location.pathname.startsWith(`${previewBase}/`));
  if (!isPreview) return;

  const rebase = value => {
    if (!value || value.startsWith('#') || value.startsWith('//') || !value.startsWith('/')) return value;
    return value === previewBase || value.startsWith(`${previewBase}/`) ? value : `${previewBase}${value}`;
  };

  const rewritePaths = root => {
    root.querySelectorAll?.('a[href], link[href], script[src], img[src], source[src], video[poster]').forEach(element => {
      const attribute = element.hasAttribute('href') ? 'href' : element.hasAttribute('poster') ? 'poster' : 'src';
      const value = element.getAttribute(attribute);
      const resolved = rebase(value);
      if (resolved !== value) element.setAttribute(attribute, resolved);
    });
  };

  if (rawPreviewHost && typeof window.fetch === 'function') {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, options) => nativeFetch(typeof input === 'string' ? rebase(input) : input, options);
  }

  const start = () => {
    rewritePaths(document);
    new MutationObserver(records => {
      records.forEach(record => {
        if (record.type === 'attributes') rewritePaths(record.target.parentElement || document);
        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches?.('a[href], link[href], script[src], img[src], source[src], video[poster]')) rewritePaths(node.parentElement || document);
            rewritePaths(node);
          }
        });
      });
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'src', 'poster'] });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
