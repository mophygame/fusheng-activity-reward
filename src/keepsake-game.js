class KeepsakeMatchGame {
  constructor(container, config, options = {}) {
    this.container = container;
    this.config = config;
    this.onComplete = options.onComplete || (() => {});
    this.onFeedback = options.onFeedback || (() => {});
    this.onClose = options.onClose || (() => {});
    this.selectedItemId = null;
    this.matches = new Map();
  }

  start() {
    this.selectedItemId = null;
    this.matches.clear();
    this.render();
  }

  render() {
    this.container.className = "keepsake-game";
    this.container.hidden = false;
    this.container.innerHTML = `
      <div class="keepsake-inner">
        <button class="keepsake-close overlay-close" type="button" aria-label="關閉信物配對">×</button>
        <header class="keepsake-header">
          <p>${this.config.subtitle || ""}</p>
          <h2>${this.config.title}</h2>
          <div class="keepsake-hint">${this.config.hint || ""}</div>
        </header>
        <div class="keepsake-board">
          <div class="keepsake-targets" aria-label="五位命定之人"></div>
          <div class="keepsake-items" aria-label="五件現代信物"></div>
        </div>
        <p class="keepsake-status" role="status"></p>
      </div>
    `;

    this.targetsEl = this.container.querySelector(".keepsake-targets");
    this.itemsEl = this.container.querySelector(".keepsake-items");
    this.statusEl = this.container.querySelector(".keepsake-status");
    this.container.querySelector(".keepsake-close").addEventListener("click", () => this.onClose());
    this.renderTargets();
    this.renderItems();
    this.updateStatus("請先選擇一件信物。");
  }

  renderTargets() {
    this.targetsEl.innerHTML = "";
    this.config.targets.forEach((target) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "keepsake-target";
      button.dataset.targetId = target.id;
      button.innerHTML = `
        <img src="${target.image}" alt="${target.modernName || target.name}" />
        <b>${target.name}</b>
        <span>${target.modernName || ""}</span>
        <em class="keepsake-drop">等待信物歸位</em>
      `;
      button.addEventListener("click", () => this.tryMatch(target.id));
      button.addEventListener("dragover", (event) => {
        event.preventDefault();
        button.classList.add("is-waiting");
      });
      button.addEventListener("dragleave", () => button.classList.remove("is-waiting"));
      button.addEventListener("drop", (event) => {
        event.preventDefault();
        button.classList.remove("is-waiting");
        const itemId = event.dataTransfer.getData("text/plain");
        if (itemId) {
          this.selectedItemId = itemId;
          this.tryMatch(target.id);
        }
      });
      this.targetsEl.appendChild(button);
    });
  }

  renderItems() {
    this.itemsEl.innerHTML = "";
    this.config.items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "keepsake-item";
      button.dataset.itemId = item.id;
      button.draggable = true;
      button.setAttribute("aria-label", item.label);
      button.title = item.label;
      button.innerHTML = `
        <img src="${item.image}" alt="${item.label}" />
      `;
      button.addEventListener("click", () => this.selectItem(item.id));
      button.addEventListener("dragstart", (event) => {
        this.selectItem(item.id);
        event.dataTransfer.setData("text/plain", item.id);
      });
      this.itemsEl.appendChild(button);
    });
  }

  selectItem(itemId) {
    if (this.matches.has(itemId)) return;
    this.selectedItemId = itemId;
    this.container.querySelectorAll(".keepsake-item").forEach((node) => {
      node.classList.toggle("is-selected", node.dataset.itemId === itemId);
    });
    this.container.querySelectorAll(".keepsake-target:not(.is-matched)").forEach((node) => {
      node.classList.add("is-waiting");
    });
    this.updateStatus("再點選要交付的男人。");
  }

  tryMatch(targetId) {
    if (!this.selectedItemId) {
      this.updateStatus("請先選擇一件信物。");
      return;
    }

    const item = this.config.items.find((entry) => entry.id === this.selectedItemId);
    const target = this.config.targets.find((entry) => entry.id === targetId);
    if (!item || !target || this.matches.has(item.id)) return;

    if (item.match !== target.id) {
      this.markWrong(target.id);
      this.updateStatus("這件信物的氣息不屬於他，再試一次。");
      this.onFeedback("wrong");
      return;
    }

    this.matches.set(item.id, target.id);
    this.markMatched(item, target);
    this.selectedItemId = null;
    this.onFeedback("correct");

    if (this.matches.size >= this.config.items.length) {
      this.complete();
    } else {
      this.updateStatus(`已歸位 ${this.matches.size} / ${this.config.items.length}，繼續尋找下一件信物。`);
    }
  }

  markMatched(item, target) {
    const itemNode = this.container.querySelector(`[data-item-id="${item.id}"]`);
    const targetNode = this.container.querySelector(`[data-target-id="${target.id}"]`);
    itemNode?.classList.remove("is-selected");
    itemNode?.classList.add("is-used");
    if (itemNode) itemNode.draggable = false;

    if (targetNode) {
      targetNode.classList.remove("is-waiting", "is-wrong");
      targetNode.classList.add("is-matched");
      targetNode.querySelector(".keepsake-drop").textContent = item.label;
    }

    this.container.querySelectorAll(".keepsake-target").forEach((node) => {
      node.classList.remove("is-waiting");
    });
  }

  markWrong(targetId) {
    const targetNode = this.container.querySelector(`[data-target-id="${targetId}"]`);
    if (!targetNode) return;
    targetNode.classList.remove("is-wrong");
    window.requestAnimationFrame(() => targetNode.classList.add("is-wrong"));
  }

  complete() {
    this.container.classList.add("is-complete");
    this.updateStatus(this.config.successText || "信物歸位，陣法已成。");
    this.showFormation();
    window.setTimeout(() => this.onComplete(this.config.onSuccess), 3600);
  }

  showFormation() {
    const oldFormation = this.container.querySelector(".formation-overlay");
    oldFormation?.remove();

    const overlay = document.createElement("div");
    overlay.className = "formation-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="formation-core">
        <i class="formation-ring formation-ring-a"></i>
        <i class="formation-ring formation-ring-b"></i>
        <i class="formation-star"></i>
        <i class="formation-flash"></i>
      </div>
    `;

    this.config.items.forEach((item, index) => {
      const token = document.createElement("img");
      token.className = `formation-token formation-token-${index + 1}`;
      token.src = item.image;
      token.alt = "";
      token.style.setProperty("--order", index);
      overlay.appendChild(token);
    });

    this.container.appendChild(overlay);
  }

  updateStatus(message) {
    this.statusEl.textContent = message;
  }
}

window.KeepsakeMatchGame = KeepsakeMatchGame;
