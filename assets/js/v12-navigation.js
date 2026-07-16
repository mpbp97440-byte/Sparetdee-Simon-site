(() => {
  "use strict";

  const header = document.querySelector("[data-v12-header]");
  const menuButton = document.querySelector("[data-v12-menu-toggle]");
  const mobileMenu = document.querySelector("[data-v12-mobile-menu]");
  const mobileDialog = mobileMenu?.querySelector('[role="dialog"]');
  const closeButton = mobileMenu?.querySelector("[data-v12-menu-close]");
  const moreButton = document.querySelector("[data-v12-more-toggle]");
  const moreMenu = document.querySelector("[data-v12-more-menu]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileNavigation = window.matchMedia("(max-width: 980px)");
  let menuReturnFocus = null;
  let moreReturnFocus = null;
  let scrollFrame = 0;
  let hashLayoutObserver = null;
  let hashLayoutTimer = 0;

  if (!header || !menuButton || !mobileMenu || !mobileDialog || !closeButton) return;

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])'
  ].join(",");

  const visibleFocusable = (root) => Array.from(root.querySelectorAll(focusableSelector))
    .filter((element) => !element.hidden && element.getClientRects().length > 0);

  const normalizedPath = (pathname) => {
    const withoutIndex = pathname.replace(/\/index\.html$/, "/");
    return withoutIndex.length > 1 ? withoutIndex.replace(/\/$/, "") : "/";
  };

  const closeMore = ({ restoreFocus = false } = {}) => {
    if (!moreButton || !moreMenu || moreMenu.hidden) return;
    moreMenu.hidden = true;
    moreButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) (moreReturnFocus || moreButton).focus();
    moreReturnFocus = null;
  };

  const openMore = () => {
    if (!moreButton || !moreMenu || !moreMenu.hidden) return;
    closeMobileMenu({ restoreFocus: false });
    moreReturnFocus = document.activeElement;
    moreMenu.hidden = false;
    moreButton.setAttribute("aria-expanded", "true");
    visibleFocusable(moreMenu)[0]?.focus();
  };

  const syncMenuState = (open) => {
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("v12-menu-open", open);
    document.body.classList.toggle("menu-open", open);
  };

  function closeMobileMenu({ restoreFocus = true } = {}) {
    if (mobileMenu.hidden) return;
    mobileMenu.hidden = true;
    syncMenuState(false);
    if (restoreFocus) (menuReturnFocus || menuButton).focus();
    menuReturnFocus = null;
  }

  const openMobileMenu = () => {
    if (!mobileNavigation.matches || !mobileMenu.hidden) return;
    closeMore({ restoreFocus: false });
    menuReturnFocus = document.activeElement;
    mobileMenu.hidden = false;
    syncMenuState(true);
    window.requestAnimationFrame(() => closeButton.focus());
  };

  const scrollToHashTarget = (hash, updateHistory = false) => {
    if (!hash || hash === "#") return false;
    let id;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch (error) {
      return false;
    }
    const target = document.getElementById(id);
    if (!target) return false;
    closeMobileMenu({ restoreFocus: false });
    closeMore({ restoreFocus: false });
    if (updateHistory) history.pushState(null, "", hash);
    target.scrollIntoView({
      block: "start",
      behavior: reduceMotion.matches ? "auto" : "smooth"
    });
    return true;
  };

  const stopHashLayoutObserver = () => {
    hashLayoutObserver?.disconnect();
    hashLayoutObserver = null;
    if (hashLayoutTimer) window.clearTimeout(hashLayoutTimer);
    hashLayoutTimer = 0;
  };

  const stabilizeHashAfterAsyncLayout = (hash) => {
    stopHashLayoutObserver();
    if (!hash || !("ResizeObserver" in window)) return;
    let frame = 0;
    hashLayoutObserver = new ResizeObserver(() => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (window.location.hash === hash) scrollToHashTarget(hash, false);
      });
    });
    hashLayoutObserver.observe(document.body);
    hashLayoutTimer = window.setTimeout(stopHashLayoutObserver, 2500);
  };

  const setCurrentLinks = () => {
    const currentPath = normalizedPath(window.location.pathname);
    document.querySelectorAll("[data-v12-navigation] a[href]").forEach((link) => {
      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (error) {
        return;
      }
      const linkPath = normalizedPath(url.pathname);
      const isHomeLink = linkPath === "/" && (!url.hash || url.hash === "#home");
      const current = linkPath === currentPath
        && (currentPath !== "/" || isHomeLink)
        && (!url.hash || url.hash === window.location.hash || (url.hash === "#home" && !window.location.hash));
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  const updateCompactHeader = () => {
    scrollFrame = 0;
    header.classList.toggle("is-compact", window.scrollY > 48 && !mobileNavigation.matches);
  };

  menuButton.addEventListener("click", () => {
    if (mobileMenu.hidden) openMobileMenu();
    else closeMobileMenu();
  });

  closeButton.addEventListener("click", () => closeMobileMenu());

  mobileMenu.addEventListener("click", (event) => {
    if (event.target === mobileMenu) closeMobileMenu();
    if (event.target.closest("a[href]")) closeMobileMenu({ restoreFocus: false });
  });

  if (moreButton && moreMenu) {
    moreButton.addEventListener("click", () => {
      if (moreMenu.hidden) openMore();
      else closeMore({ restoreFocus: true });
    });
    moreMenu.addEventListener("click", (event) => {
      if (event.target.closest("a[href]")) closeMore({ restoreFocus: false });
    });
  }

  header.addEventListener("click", (event) => {
    if (event.target.closest("#mpbpNotificationsButton")) {
      closeMobileMenu({ restoreFocus: false });
      closeMore({ restoreFocus: false });
    }
  });

  document.addEventListener("click", (event) => {
    if (moreMenu && !moreMenu.hidden && !event.target.closest(".v12-more")) {
      closeMore({ restoreFocus: false });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!mobileMenu.hidden) {
        event.preventDefault();
        closeMobileMenu();
        return;
      }
      if (moreMenu && !moreMenu.hidden) {
        event.preventDefault();
        closeMore({ restoreFocus: true });
      }
      return;
    }

    if (event.key !== "Tab" || mobileMenu.hidden) return;
    const focusable = visibleFocusable(mobileDialog);
    if (!focusable.length) {
      event.preventDefault();
      closeButton.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("[data-v12-navigation] a[href*='#']");
    if (!link) return;
    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (error) {
      return;
    }
    if (url.origin !== window.location.origin || normalizedPath(url.pathname) !== normalizedPath(window.location.pathname)) return;
    if (!document.getElementById(decodeURIComponent(url.hash.slice(1)))) return;
    event.preventDefault();
    event.stopPropagation();
    scrollToHashTarget(url.hash, true);
    setCurrentLinks();
  }, true);

  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateCompactHeader);
  }, { passive: true });

  window.addEventListener("hashchange", () => {
    scrollToHashTarget(window.location.hash, false);
    stabilizeHashAfterAsyncLayout(window.location.hash);
    setCurrentLinks();
  });

  window.addEventListener("load", async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.requestAnimationFrame(() => {
      scrollToHashTarget(window.location.hash, false);
      stabilizeHashAfterAsyncLayout(window.location.hash);
    });
  }, { once: true });

  mobileNavigation.addEventListener("change", (event) => {
    if (!event.matches) closeMobileMenu({ restoreFocus: false });
    updateCompactHeader();
  });

  syncMenuState(false);
  setCurrentLinks();
  updateCompactHeader();
})();
