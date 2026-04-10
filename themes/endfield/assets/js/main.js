const root = document.documentElement;
const enterClass = 'is-entering';
const leaveClass = 'is-leaving';
const transitionDurationMs = 220;
const prefetchedUrls = new Set();

function removeEnterState() {
  requestAnimationFrame(() => {
    root.classList.remove(enterClass);
  });
}

function isPrefetchableInternalLink(anchor) {
  if (!anchor || !anchor.href) {
    return false;
  }

  if (anchor.target && anchor.target !== '_self') {
    return false;
  }

  if (anchor.hasAttribute('download')) {
    return false;
  }

  if (anchor.getAttribute('rel')?.includes('external')) {
    return false;
  }

  const url = new URL(anchor.href, window.location.origin);
  const isSameOrigin = url.origin === window.location.origin;
  const isSamePathAndHash = url.pathname === window.location.pathname && url.search === window.location.search && url.hash;

  return isSameOrigin && !isSamePathAndHash;
}

function prefetchDocument(url) {
  if (prefetchedUrls.has(url)) {
    return;
  }

  prefetchedUrls.add(url);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'document';
  link.href = url;
  document.head.appendChild(link);
}

function handlePrefetchEvent(event) {
  const anchor = event.target.closest('a[href]');
  if (!isPrefetchableInternalLink(anchor)) {
    return;
  }

  prefetchDocument(anchor.href);
}

function shouldHandleTransitionNavigation(event, anchor) {
  if (event.defaultPrevented) {
    return false;
  }

  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  if (!anchor || !anchor.href) {
    return false;
  }

  if (anchor.target && anchor.target !== '_self') {
    return false;
  }

  if (anchor.hasAttribute('download')) {
    return false;
  }

  const href = anchor.getAttribute('href') || '';
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
    return false;
  }

  const url = new URL(anchor.href, window.location.origin);
  if (url.origin !== window.location.origin) {
    return false;
  }

  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false;
  }

  return true;
}

function handleTransitionNavigation(event) {
  const anchor = event.target.closest('a[href]');
  if (!shouldHandleTransitionNavigation(event, anchor)) {
    return;
  }

  event.preventDefault();
  root.classList.remove(enterClass);
  root.classList.add(leaveClass);

  window.setTimeout(() => {
    window.location.href = anchor.href;
  }, transitionDurationMs);
}

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) {
    return;
  }

  themeToggle.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (isDark) {
      root.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      return;
    }

    root.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  removeEnterState();
  document.addEventListener('click', handleTransitionNavigation);
  document.addEventListener('mouseenter', handlePrefetchEvent, true);
  document.addEventListener('focusin', handlePrefetchEvent);
  document.addEventListener('touchstart', handlePrefetchEvent, { passive: true, capture: true });
});

window.addEventListener('pageshow', () => {
  root.classList.remove(leaveClass);
  removeEnterState();
});
