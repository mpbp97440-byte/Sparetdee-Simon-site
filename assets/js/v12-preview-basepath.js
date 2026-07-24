(() => {
  'use strict';

  const previewBase = '/MPBP440-V12-Preview';
  const isPreview = location.hostname.endsWith('github.io') && location.pathname.startsWith(`${previewBase}/`);
  if (!isPreview) return;

  const rebase = value => {
    if (!value || value.startsWith('#') || value.startsWith('//') || !value.startsWith('/')) return value;
    return value === previewBase || value.startsWith(`${previewBase}/`) ? value : `${previewBase}${value}`;
  };

  const rewriteLinks = root => {
    root.querySelectorAll?.('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      const resolved = rebase(href);
      if (resolved !== href) link.setAttribute('href', resolved);
    });
  };

  const start = () => {
    rewriteLinks(document);
    new MutationObserver(records => {
      records.forEach(record => {
        if (record.type === 'attributes') rewriteLinks(record.target.parentElement || document);
        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches?.('a[href]')) rewriteLinks(node.parentElement || document);
            rewriteLinks(node);
          }
        });
      });
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
