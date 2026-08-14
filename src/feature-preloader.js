class FeaturePreloader {
  constructor({ concurrency = 3 } = {}) {
    this.concurrency = concurrency;
    this.cache = new Map();
    this.groups = new Map();
  }

  register(name, { critical = [], deferred = [] }) {
    this.groups.set(name, {
      critical: [...new Set(critical)],
      deferred: [...new Set(deferred)],
    });
  }

  loadImage(src, priority = "low") {
    if (!src) return Promise.resolve();
    if (this.cache.has(src)) return this.cache.get(src);

    const promise = new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = priority;
      image.onload = async () => {
        try {
          await image.decode?.();
        } catch {
          // A decoded image is an optimization; the browser cache is still usable.
        }
        resolve();
      };
      image.onerror = resolve;
      image.src = src;
      if (image.complete) resolve();
    });
    this.cache.set(src, promise);
    return promise;
  }

  async loadBatch(paths, priority) {
    const queue = [...paths];
    const worker = async () => {
      while (queue.length) await this.loadImage(queue.shift(), priority);
    };
    await Promise.all(Array.from({ length: Math.min(this.concurrency, queue.length) }, worker));
  }

  async load(name, { criticalOnly = false } = {}) {
    const group = this.groups.get(name);
    if (!group) return;
    await this.loadBatch(group.critical, "high");
    if (!criticalOnly) await this.loadBatch(group.deferred, "low");
  }

  warm(name) {
    const run = () => this.load(name).catch(() => {});
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout: 1800 });
    } else {
      window.setTimeout(run, 250);
    }
  }

  onIntent(element, name) {
    if (!element) return;
    const warm = () => this.warm(name);
    element.addEventListener("pointerenter", warm, { once: true, passive: true });
    element.addEventListener("touchstart", warm, { once: true, passive: true });
    element.addEventListener("focus", warm, { once: true, passive: true });
  }
}

window.FeaturePreloader = FeaturePreloader;
