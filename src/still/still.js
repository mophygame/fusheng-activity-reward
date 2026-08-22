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
  const STILL_FILES = Object.freeze({
    "01": "0ac1549894e0b426eb5fc04ff708af6f422023784bd97a0783439086da630dfc.webp",
    "02": "cb1e6f67be9b0e6c643827fcc637e827621029a34dd880e344d563a82707f641.webp",
    "03": "45db8032eb3baeeb4ae99d97f91a7a079df1a51e9c1960730123d53440bdd9bc.webp",
    "04": "c5a02010e1d679534bb21754c2ea8e0652b2be01ae1f493108ad0f1b573951cf.webp",
    "05": "79c8a9eea77dadb91f9461892d5e9a31303addfc50101ea61bac9c3926679543.webp",
    "06": "9cd1ddb66d25baed1d016653295587154ed49938a0c377e9828430e677b55c27.webp",
    "07": "c83961be75b13fa855f140d35fc1c6fb4767575ff6b69b8686870fb3ea817652.webp",
    "08": "5e350c69a70315e248e2edf83693eeea6f025f9505bcf7df088a316adb71f5c8.webp",
    "09": "d855a789af362bbc7629ff2bbe18934d11ecf18d4ad01f80a163985e4fe08d63.webp",
    "10": "c676e66ceebf31b98fb2e87ac661dc6a34873dbf2a0851f2abd7bfd6fee15e46.webp",
    "11": "98dfb26d9c17cad0164fb0b52027092006744bf2cd4d746335e4a7cdcf988359.webp",
    "12": "b7cc8ce9e805ec234887a62abe247cf9336830abe59e57115179d1f9ac560497.webp",
    "13": "fb6f991716d4fc8125427442df47635fdff2aad35be018a3912252d4d9d1b59f.webp",
    "14": "c3100c9827e7269ba015e787c0f60e663687117040396f33097178e7932ef146.webp",
    "15": "1e642959dff756d1ffd709471e95c3e7121ec3ee9e7eae0f5d782b00e8fa805e.webp",
    "16": "36d4ed066689b0f4ee3222b82b184aa559cd26a9c6bbc0069a5a5925e5c49b47.webp",
    "17": "5a473e851078e51f1c8cf7dbac237bda902ba4f7e1eec3ad24ae95655cfc69e8.webp",
    "18": "1bf93221209106e0d9471f396ab362bf3058e175a74cf2e85dcd5ebeae8588f8.webp",
    "19": "3f1b39a416639a7458f07280db82a79501dcf892ab02cf067921a8bf12e8dba5.webp",
    "20": "1a1ab62b3399cf4021e00f45f6608915f329db9f297b4638bb9cf36a6b804627.webp",
  });
  const STILLS = Array.from({ length: STILL_COUNT }, (_, index) => {
    const id = String(index + 1).padStart(2, "0");
    return {
      id,
      title: STILL_TITLES[index] || `珍藏劇照 ${id}`,
    };
  });

  const getStillSource = (id) => STILL_FILES[id]
    ? `./assets/images/still/CP/${STILL_FILES[id]}`
    : "";

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
      this.prompt = this.createPrompt();
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
      const available = Boolean(getStillSource(still.id));
      const unlocked = available && this.unlocked.has(still.id);
      const card = document.createElement("article");
      card.className = `still-card${unlocked ? " is-unlocked" : " is-locked"}${available ? "" : " is-unavailable"}`;
      card.innerHTML = `
        <span class="still-number">${still.id}</span>
        <div class="still-picture">${unlocked
          ? `<img src="${getStillSource(still.id)}" alt="${still.title}" loading="lazy">`
          : '<span class="still-image-placeholder" aria-hidden="true"></span>'}<span class="still-lock" aria-hidden="true"></span></div>
        <h3>${still.title}</h3>
        <button type="button"${available ? "" : " disabled"}><i></i>${available ? (unlocked ? "已解鎖" : COST) : "尚未開放"}</button>`;
      const image = card.querySelector("img");
      image?.addEventListener("error", () => card.classList.add("is-missing"));
      if (available) card.querySelector("button").addEventListener("click", () => unlocked ? this.showViewer(still) : this.unlock(still));
      image?.addEventListener("click", () => { if (this.unlocked.has(still.id)) this.showViewer(still); });
      return card;
    }

    async unlock(still) {
      if (!getStillSource(still.id)) return;
      if (this.getLanterns() < COST) {
        this.root.classList.remove("still-no-funds");
        void this.root.offsetWidth;
        this.root.classList.add("still-no-funds");
        await this.showPrompt({
          tone: "warning",
          title: "燈盞不足",
          message: "可前往參加「百藝試煉」，或閱讀「大封舊事」蒐集燈盞，再回來解鎖珍藏劇照。",
          confirmText: "我知道了",
        });
        return;
      }
      const confirmed = await this.showPrompt({
        title: "解鎖珍藏劇照",
        message: `消耗 ${COST} 盞燈，永久解鎖「${still.title}」？`,
        confirmText: "永久解鎖",
        cancelText: "暫且保留",
      });
      if (!confirmed) return;
      if (!this.spendLanterns(COST)) return;
      this.unlocked.add(still.id);
      this.saveUnlocked();
      this.onUnlock?.(still);
      this.render();
    }

    createPrompt() {
      const prompt = document.createElement("div");
      prompt.className = "still-prompt";
      prompt.hidden = true;
      prompt.setAttribute("role", "alertdialog");
      prompt.setAttribute("aria-modal", "true");
      prompt.setAttribute("aria-labelledby", "still-prompt-title");
      prompt.setAttribute("aria-describedby", "still-prompt-message");
      prompt.innerHTML = `
        <section class="still-prompt-panel">
          <span class="still-prompt-kicker">燈 絮 記 憶</span>
          <h3 id="still-prompt-title"></h3>
          <p id="still-prompt-message"></p>
          <div class="still-prompt-actions">
            <button class="still-prompt-cancel" type="button"></button>
            <button class="still-prompt-confirm" type="button"></button>
          </div>
        </section>`;
      this.root.appendChild(prompt);
      return prompt;
    }

    showPrompt({ tone = "confirm", title, message, confirmText, cancelText = "" }) {
      const titleElement = this.prompt.querySelector("#still-prompt-title");
      const messageElement = this.prompt.querySelector("#still-prompt-message");
      const confirmButton = this.prompt.querySelector(".still-prompt-confirm");
      const cancelButton = this.prompt.querySelector(".still-prompt-cancel");
      titleElement.textContent = title;
      messageElement.textContent = message;
      confirmButton.textContent = confirmText;
      cancelButton.textContent = cancelText;
      cancelButton.hidden = !cancelText;
      this.prompt.classList.toggle("is-warning", tone === "warning");
      this.prompt.hidden = false;

      return new Promise((resolve) => {
        const finish = (accepted) => {
          this.prompt.hidden = true;
          confirmButton.onclick = null;
          cancelButton.onclick = null;
          this.prompt.onclick = null;
          resolve(accepted);
        };
        confirmButton.onclick = () => finish(true);
        cancelButton.onclick = () => finish(false);
        this.prompt.onclick = (event) => {
          if (event.target === this.prompt) finish(false);
        };
        window.requestAnimationFrame(() => confirmButton.focus());
      });
    }

    createViewer() {
      const viewer = document.createElement("div");
      viewer.className = "still-viewer";
      viewer.hidden = true;
      viewer.innerHTML = `
        <button class="still-viewer-close" type="button" aria-label="關閉大圖">×</button>
        <img alt="">
        <p></p>
        <a class="still-viewer-download" role="button" aria-label="下載這張劇照">
          <span aria-hidden="true">⇩</span>下載圖片
        </a>`;
      viewer.querySelector(".still-viewer-close").addEventListener("click", () => { viewer.hidden = true; });
      viewer.addEventListener("click", (event) => { if (event.target === viewer) viewer.hidden = true; });
      this.root.appendChild(viewer);
      return viewer;
    }

    showViewer(still) {
      if (!this.unlocked.has(still.id)) return;
      this.viewer.querySelector("img").src = getStillSource(still.id);
      this.viewer.querySelector("img").alt = still.title;
      this.viewer.querySelector("p").textContent = still.title;
      const download = this.viewer.querySelector(".still-viewer-download");
      download.href = getStillSource(still.id);
      download.download = `${still.id}-${still.title}.webp`;
      this.viewer.hidden = false;
    }
  }
  window.StillGallery = StillGallery;
})();
