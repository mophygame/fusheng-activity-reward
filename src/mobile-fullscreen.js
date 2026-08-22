(() => {
  const isMobile = window.matchMedia("(max-width: 900px) and (pointer: coarse)").matches;
  if (!isMobile) return;

  document.documentElement.classList.add("is-mobile-device");
  const isStandalone = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches
    || window.navigator.standalone === true;
  if (isStandalone) document.documentElement.classList.add("is-standalone");

  const requestFullscreen = async () => {
    window.scrollTo({ top: 1, behavior: "instant" });
    if (isStandalone || document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    try {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } catch (_) {
      /* iOS Safari 僅支援加入主畫面後的 standalone 模式。 */
    }
  };

  window.addEventListener("pointerup", requestFullscreen, { once: true, passive: true });
})();
