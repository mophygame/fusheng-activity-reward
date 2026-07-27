class TaskGameModal {
  constructor(container, options = {}) {
    this.container = container;
    this.onClose = options.onClose || (() => {});
    this.onStart = options.onStart || (() => {});
    this.previouslyFocusedElement = null;
    this.games = options.games || [
      {
        id: "touhu",
        status: "已開放",
        title: "投壺",
        description: "瞄準壺口，投出箭矢，考驗你的準度。",
        image: "./assets/images/taskgame/btn_touhu.webp",
        available: true,
      },
      {
        id: "skyLantern",
        status: "已開放",
        title: "天燈遊戲",
        description: "點亮天燈，寫下心願，看它帶著祝福升空。",
        image: "./assets/images/taskgame/btn_skylantern.webp",
        available: true,
      },
      {
        id: "memorial",
        status: "已開放",
        title: "批奏摺",
        description: "御前代批，辨明軍民稅務，將正確印章落於朱框。",
        image: "./assets/images/taskgame/btn_throne.webp",
        available: true,
      },
    ];
    this.boundKeydown = (event) => {
      if (event.key === "Escape" && !this.container.hidden) this.onClose();
    };
    this.render();
  }

  render() {
    this.container.className = "home-modal taskgame-modal";
    this.container.hidden = true;
    this.container.innerHTML = `
      <section class="taskgame-panel" role="dialog" aria-modal="true" aria-labelledby="taskgame-title">
        <button class="taskgame-close" type="button" aria-label="關閉古風小遊戲">×</button>
        <header class="taskgame-header">
          <p class="taskgame-kicker">古代雅戲 · 百藝試煉</p>
          <h2 id="taskgame-title" class="taskgame-title">百藝一覽</h2>
          <div class="taskgame-rule" aria-hidden="true">請擇一試煉</div>
        </header>
        <div class="taskgame-list" aria-label="百藝試煉列表"></div>
        <footer class="taskgame-footer">燈火未熄，試煉常開</footer>
      </section>
    `;

    this.listEl = this.container.querySelector(".taskgame-list");
    this.container.querySelector(".taskgame-close").addEventListener("click", () => this.onClose());
    this.container.addEventListener("click", (event) => {
      if (event.target === this.container) this.onClose();
    });
    this.renderCards();
    this.bindCardCarousel();
    window.addEventListener("keydown", this.boundKeydown);
  }

  renderCards() {
    this.listEl.innerHTML = "";
    this.games.forEach((game) => {
      const card = document.createElement("article");
      card.className = `taskgame-card${game.available ? "" : " is-locked"}`;
      card.innerHTML = `
        <img class="taskgame-card-bg" src="${game.image}" alt="" aria-hidden="true" />
        <div class="taskgame-card-content">
          <button class="taskgame-start" type="button" ${game.available ? "" : "disabled"}
            aria-label="${game.available ? `開始${game.title}` : `${game.title}尚未開放`}">
          </button>
        </div>
      `;
      if (game.available) {
        card.querySelector(".taskgame-start").addEventListener("click", () => this.onStart(game.id));
      }
      this.listEl.appendChild(card);
    });
  }

  bindCardCarousel() {
    const cards = [...this.listEl.querySelectorAll(".taskgame-card")];
    let frame = 0;

    const selectNearestCard = () => {
      frame = 0;
      if (!window.matchMedia("(max-width: 900px)").matches) {
        cards.forEach((card) => card.classList.remove("is-selected"));
        return;
      }

      const listCenter = this.listEl.getBoundingClientRect().left + this.listEl.clientWidth / 2;
      let selectedCard = cards[0];
      let nearestDistance = Infinity;

      cards.forEach((card) => {
        const bounds = card.getBoundingClientRect();
        const distance = Math.abs(bounds.left + bounds.width / 2 - listCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          selectedCard = card;
        }
      });

      cards.forEach((card) => card.classList.toggle("is-selected", card === selectedCard));
    };

    this.listEl.addEventListener("scroll", () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(selectNearestCard);
    }, { passive: true });

    cards.forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest(".taskgame-start")) return;
        if (!window.matchMedia("(max-width: 900px)").matches) return;
        card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
    });

    window.addEventListener("resize", selectNearestCard);
    requestAnimationFrame(selectNearestCard);
    this.updateCarouselSelection = selectNearestCard;
  }

  open() {
    this.previouslyFocusedElement = document.activeElement;
    this.container.hidden = false;
    this.container.querySelector(".taskgame-panel")?.scrollTo({ top: 0 });
    this.listEl.scrollTo({ left: 0 });
    requestAnimationFrame(() => this.updateCarouselSelection?.());
    this.container.querySelector(".taskgame-close")?.focus({ preventScroll: true });
  }

  close() {
    if (this.container.hidden) return;
    this.container.hidden = true;
    if (this.previouslyFocusedElement instanceof HTMLElement) {
      this.previouslyFocusedElement.focus({ preventScroll: true });
    }
    this.previouslyFocusedElement = null;
  }
}

window.TaskGameModal = TaskGameModal;
