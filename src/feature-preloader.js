class PageLoadingController {
  constructor(root = document.querySelector("#site-loading")) {
    this.root = root;
    this.label = root?.querySelector("[data-loading-label]");
    this.progress = root?.querySelector("[data-loading-progress]");
    this.bar = root?.querySelector("[data-loading-bar]");
    this.operations = new Map();
    this.visibleSince = performance.now();
    this.bootToken = Symbol("boot");
    this.operations.set(this.bootToken, { timer: 0 });
  }

  begin(label = "正在載入…", { immediate = false } = {}) {
    const token = Symbol(label);
    const show = () => {
      if (!this.operations.has(token)) return;
      this.show(label);
    };
    const timer = immediate ? 0 : window.setTimeout(show, 140);
    this.operations.set(token, { timer });
    if (immediate) show();
    return token;
  }

  show(label) {
    if (!this.root) return;
    this.label.textContent = label;
    this.root.hidden = false;
    this.root.setAttribute("aria-busy", "true");
    window.requestAnimationFrame(() => this.root.classList.add("is-visible"));
    this.visibleSince = performance.now();
  }

  setProgress(loaded, total) {
    if (!this.root || total < 1) return;
    const percentage = Math.round((loaded / total) * 100);
    this.bar.style.width = `${percentage}%`;
    this.progress.textContent = `${loaded} / ${total}`;
  }

  end(token) {
    const operation = this.operations.get(token);
    if (!operation) return;
    const isBootOperation = token === this.bootToken;
    window.clearTimeout(operation.timer);
    this.operations.delete(token);
    if (this.operations.size) return;

    const delay = Math.max(0, 260 - (performance.now() - this.visibleSince));
    window.setTimeout(() => {
      if (this.operations.size || !this.root) return;
      this.root.classList.remove("is-visible");
      this.root.setAttribute("aria-busy", "false");
      window.setTimeout(() => {
        if (!this.operations.size) {
          this.root.hidden = true;
          if (isBootOperation) window.dispatchEvent(new CustomEvent("page-loading:boot-complete"));
        }
      }, 260);
    }, delay);
  }

  finishBoot() {
    this.end(this.bootToken);
  }
}

class ImageLoadingObserver {
  constructor(root = document) {
    this.root = root;
    this.tracked = new WeakSet();
  }

  start() {
    this.scan(this.root);
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") this.markLoading(mutation.target);
        mutation.addedNodes.forEach((node) => this.scan(node));
      });
    });
    this.observer.observe(this.root.documentElement || this.root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });
  }

  scan(node) {
    if (node instanceof HTMLImageElement) this.track(node);
    node.querySelectorAll?.("img").forEach((image) => this.track(image));
  }

  track(image) {
    if (image.hasAttribute("data-frame-animation")) {
      this.markLoading(image);
      return;
    }
    if (!this.tracked.has(image)) {
      this.tracked.add(image);
      image.addEventListener("load", () => this.settle(image, true));
      image.addEventListener("error", () => this.settle(image, false));
    }
    this.markLoading(image);
  }

  markLoading(image) {
    if (!(image instanceof HTMLImageElement) || !image.getAttribute("src")) return;
    if (image.hasAttribute("data-frame-animation")) {
      image.classList.remove("image-loading", "image-loaded", "image-load-error");
      image.setAttribute("aria-busy", "false");
      return;
    }
    image.classList.remove("image-loaded", "image-load-error");
    image.classList.add("image-loading");
    image.setAttribute("aria-busy", "true");
    if (image.complete) window.queueMicrotask(() => this.settle(image, image.naturalWidth > 0));
  }

  settle(image, succeeded) {
    if (image.hasAttribute("data-frame-animation")) {
      image.classList.remove("image-loading", "image-loaded", "image-load-error");
      image.setAttribute("aria-busy", "false");
      return;
    }
    image.classList.remove("image-loading");
    image.classList.toggle("image-loaded", succeeded);
    image.classList.toggle("image-load-error", !succeeded);
    image.setAttribute("aria-busy", "false");
  }
}

class FeaturePreloader {
  constructor({ concurrency = 3, loading = window.pageLoading } = {}) {
    this.concurrency = concurrency;
    this.loading = loading;
    this.cache = new Map();
    this.groups = new Map();
  }

  register(name, { critical = [], deferred = [] }) {
    this.groups.set(name, {
      critical: [...new Set(critical)],
      deferred: [...new Set(deferred)],
    });
  }

  extend(name, paths = []) {
    const group = this.groups.get(name) || { critical: [], deferred: [] };
    group.deferred = [...new Set([...group.deferred, ...paths])]
      .filter((path) => !group.critical.includes(path));
    this.groups.set(name, group);
  }

  loadImage(src, priority = "low") {
    if (!src) return Promise.resolve();
    const resolvedSrc = new URL(src, document.baseURI).href;
    if (this.cache.has(resolvedSrc)) return this.cache.get(resolvedSrc);
    const promise = new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = priority;
      image.onload = async () => {
        try {
          await image.decode?.();
        } catch {
          // The downloaded image remains usable even if explicit decoding fails.
        }
        resolve({ src: resolvedSrc, ok: true });
      };
      image.onerror = () => resolve({ src: resolvedSrc, ok: false });
      image.src = resolvedSrc;
      if (image.complete) resolve({ src: resolvedSrc, ok: image.naturalWidth > 0 });
    });
    this.cache.set(resolvedSrc, promise);
    return promise;
  }

  async loadBatch(paths, priority, onProgress = () => {}) {
    const queue = [...paths];
    let loaded = 0;
    const worker = async () => {
      while (queue.length) {
        await this.loadImage(queue.shift(), priority);
        loaded += 1;
        onProgress(loaded, paths.length);
      }
    };
    await Promise.all(Array.from({ length: Math.min(this.concurrency, queue.length) }, worker));
  }

  async load(name, { criticalOnly = false, showLoading = false, label = "正在載入頁面…" } = {}) {
    const group = this.groups.get(name);
    if (!group) return;
    const paths = criticalOnly ? group.critical : [...group.critical, ...group.deferred];
    const token = showLoading ? this.loading?.begin(label) : null;
    const onProgress = (loaded, total) => this.loading?.setProgress(loaded, total);
    try {
      await this.loadBatch(paths, criticalOnly ? "high" : "low", onProgress);
    } finally {
      if (token) this.loading?.end(token);
    }
  }

  warm(name) {
    const run = () => this.load(name).catch(() => {});
    if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 1800 });
    else window.setTimeout(run, 250);
  }

  onIntent(element, name) {
    if (!element) return;
    const warm = () => this.warm(name);
    element.addEventListener("pointerenter", warm, { once: true, passive: true });
    element.addEventListener("touchstart", warm, { once: true, passive: true });
    element.addEventListener("focus", warm, { once: true, passive: true });
  }
}

window.pageLoading = new PageLoadingController();
window.imageLoadingObserver = new ImageLoadingObserver();
window.imageLoadingObserver.start();
window.FeaturePreloader = FeaturePreloader;
