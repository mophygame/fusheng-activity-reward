(() => {
  const STORAGE_KEY = "fushengUnlockedStills";
  const COST = 50;
  const STILL_COUNT = 20;
  const STILL_TITLES = [
    "燈影初逢", "絮語心動", "指尖溫度", "一夜長明", "共賞星河",
    "風花雪月", "執手天涯", "不負相思", "情深不渝", "餘燼與君",
    "月下同遊", "故夢重逢", "咫尺相依", "流光寄情", "朝暮相守",
    "花間私語", "歲歲長安", "心有靈犀", "此生不換", "與君同歸",
  ];
  const STILLS = Array.from({ length: STILL_COUNT }, (_, index) => {
    const id = String(index + 1).padStart(2, "0");
    return {
      id,
      title: STILL_TITLES[index] || `珍藏劇照 ${id}`,
      src: `./assets/images/still/CP/${id}.webp`,
    };
  });

  class StillGallery {
    constructor({ root, getLanterns, spendLanterns, onUnlock }) {
      this.root = root;
      this.grid = root.querySelector("#still-grid");
      this.balance = root.querySelector("#gallery-lantern-count");
      this.getLanterns = getLanterns;
      this.spendLanterns = spendLanterns;
      this.onUnlock = onUnlock;
      this.unlocked = this.loadUnlocked();
      this.viewer = this.createViewer();
      this.render();
    }

    loadUnlocked() {
      try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return new Set(Array.isArray(value) ? value : []);
      } catch { return new Set(); }
    }

    saveUnlocked() { localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.unlocked])); }
    open() { this.updateBalance(); this.render(); }
    updateBalance() { this.balance.textContent = String(this.getLanterns()); }

    render() {
      this.updateBalance();
      this.grid.innerHTML = "";
      STILLS.forEach((still) => this.grid.appendChild(this.createCard(still)));
    }

    createCard(still) {
      const unlocked = this.unlocked.has(still.id);
      const card = document.createElement("article");
      card.className = `still-card${unlocked ? " is-unlocked" : " is-locked"}`;
      card.innerHTML = `
        <span class="still-number">${still.id}</span>
        <div class="still-picture"><img src="${still.src}" alt="${still.title}" loading="lazy"><span class="still-lock" aria-hidden="true"></span></div>
        <h3>${still.title}</h3>
        <button type="button"><i></i>${unlocked ? "已解鎖" : COST}</button>`;
      const image = card.querySelector("img");
      image.addEventListener("error", () => card.classList.add("is-missing"));
      card.querySelector("button").addEventListener("click", () => unlocked ? this.showViewer(still) : this.unlock(still));
      image.addEventListener("click", () => { if (this.unlocked.has(still.id)) this.showViewer(still); });
      return card;
    }

    unlock(still) {
      if (this.getLanterns() < COST) {
        this.root.classList.remove("still-no-funds");
        void this.root.offsetWidth;
        this.root.classList.add("still-no-funds");
        return;
      }
      if (!window.confirm(`消耗 ${COST} 盞燈，永久解鎖「${still.title}」？`)) return;
      if (!this.spendLanterns(COST)) return;
      this.unlocked.add(still.id);
      this.saveUnlocked();
      this.onUnlock?.(still);
      this.render();
    }

    createViewer() {
      const viewer = document.createElement("div");
      viewer.className = "still-viewer";
      viewer.hidden = true;
      viewer.innerHTML = '<button type="button" aria-label="關閉大圖">×</button><img alt=""><p></p>';
      viewer.querySelector("button").addEventListener("click", () => { viewer.hidden = true; });
      viewer.addEventListener("click", (event) => { if (event.target === viewer) viewer.hidden = true; });
      this.root.appendChild(viewer);
      return viewer;
    }

    showViewer(still) {
      this.viewer.querySelector("img").src = still.src;
      this.viewer.querySelector("img").alt = still.title;
      this.viewer.querySelector("p").textContent = still.title;
      this.viewer.hidden = false;
    }
  }
  window.StillGallery = StillGallery;
})();
