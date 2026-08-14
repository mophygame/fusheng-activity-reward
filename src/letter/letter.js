class LetterFeature {
  constructor({ onReveal = () => {} } = {}) {
    this.route = null;
    this.letterPages = [];
    this.letterPageIndex = 0;
    this.onReveal = onReveal;
    this.el = {
      openButton: document.querySelector("#love-letter-button"),
      modal: document.querySelector("#love-letter"),
      closeButton: document.querySelector("#close-letter-button"),
      name: document.querySelector("#letter-name"),
      text: document.querySelector("#letter-text"),
      signature: document.querySelector("#letter-signature"),
      wish: document.querySelector("#letter-wish"),
      authorName: document.querySelector("#letter-author-name"),
      sheet: document.querySelector(".letter-sheet"),
      closing: document.querySelector(".letter-closing"),
      previousPage: document.querySelector("#letter-prev-page"),
      nextPage: document.querySelector("#letter-next-page"),
      pageIndicator: document.querySelector("#letter-page-indicator"),
      pagination: document.querySelector(".letter-pagination"),
      portrait: document.querySelector("#ink-portrait"),
      modernPortrait: document.querySelector("#portrait-modern"),
      ancientPortrait: document.querySelector("#portrait-ancient"),
      modernGlyph: document.querySelector("#portrait-modern-glyph"),
      ancientGlyph: document.querySelector("#portrait-ancient-glyph"),
      keepsakeButton: document.querySelector("#route-keepsake-button"),
      keepsakeModal: document.querySelector("#route-keepsake-modal"),
      keepsakeClose: document.querySelector("#close-route-keepsake-button"),
      keepsakeList: document.querySelector("#route-keepsake-list"),
    };

    this.bindEvents();
  }

  bindEvents() {
    this.el.portrait.addEventListener("click", () => {
      this.el.portrait.classList.toggle("show-ancient");
    });
    this.el.openButton.addEventListener("click", () => this.open());
    this.el.closeButton.addEventListener("click", () => this.close());
    this.el.previousPage.addEventListener("click", () => this.turnLetterPage(-1));
    this.el.nextPage.addEventListener("click", () => this.turnLetterPage(1));
    this.el.keepsakeButton.addEventListener("click", () => this.openKeepsakes());
    this.el.keepsakeClose.addEventListener("click", () => this.closeKeepsakes());
    this.el.keepsakeModal.addEventListener("click", (event) => {
      if (event.target === this.el.keepsakeModal) this.closeKeepsakes();
    });
    window.addEventListener("keydown", (event) => {
      if (!this.el.modal.hidden && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        this.turnLetterPage(event.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (event.key !== "Escape") return;
      if (!this.el.keepsakeModal.hidden) this.closeKeepsakes();
      else if (!this.el.modal.hidden) this.close();
    });
    this.el.keepsakeList.addEventListener("click", (event) => {
      const card = event.target.closest(".route-keepsake-card");
      if (!card) return;
      const expanded = card.getAttribute("aria-expanded") === "true";
      card.setAttribute("aria-expanded", String(!expanded));
    });

    [this.el.modernPortrait, this.el.ancientPortrait].forEach((image) => {
      image.addEventListener("error", () => {
        image.classList.add("is-missing");
        this.el.portrait.classList.remove("uses-photo-assets");
      });
      image.addEventListener("load", () => {
        image.classList.remove("is-missing");
        const imagesReady = [this.el.modernPortrait, this.el.ancientPortrait]
          .every((portrait) => portrait.complete && portrait.naturalWidth > 0);
        this.el.portrait.classList.toggle("uses-photo-assets", imagesReady);
      });
    });
  }

  setRoute(route, sealImagePath, routeNumber = 1) {
    this.route = route;
    this.close();
    this.closeKeepsakes();
    this.el.signature.src = sealImagePath;
    this.el.signature.alt = `${route.name}情箋用印`;
    this.el.modernGlyph.textContent = route.glyph;
    this.el.ancientGlyph.textContent = route.glyph;
    this.el.portrait.style.setProperty("--portrait-tone", route.portraitTone);
    const maskFile = routeNumber % 2 === 0 ? "mask02.webp" : "mask.webp";
    this.el.portrait.style.setProperty("--portrait-mask", `url(\"./assets/images/letter/${maskFile}\")`);
    this.el.portrait.classList.remove("uses-photo-assets");
    this.el.portrait.classList.remove("show-ancient");
    this.el.modernPortrait.classList.remove("is-missing");
    this.el.ancientPortrait.classList.remove("is-missing");

    const portraitName = `${route.role}(${route.name})`;
    this.el.modernPortrait.src = `./assets/images/letter/ch_${encodeURIComponent(`現代_${portraitName}`)}.webp`;
    this.el.ancientPortrait.src = `./assets/images/letter/ch_${encodeURIComponent(portraitName)}.webp`;
    this.el.modernPortrait.alt = `${route.role}今生相片`;
    this.el.ancientPortrait.alt = `${route.name}前世相片`;
    this.renderKeepsakes();
  }

  open() {
    if (!this.route) return;
    this.el.name.textContent = "致　XX";
    this.el.wish.textContent = this.route.wish;
    this.el.authorName.textContent = this.route.name;
    this.letterPages = this.paginateLetter(this.route.letter);
    this.letterPageIndex = 0;
    this.renderLetterPage();
    this.el.modal.hidden = false;
    this.onReveal();
  }

  paginateLetter(text = "") {
    const pageSize = window.matchMedia("(max-width: 760px)").matches ? 70 : 105;
    const characters = Array.from(text.trim());
    const pages = [];
    for (let index = 0; index < characters.length; index += pageSize) {
      pages.push(characters.slice(index, index + pageSize).join(""));
    }
    return pages.length ? pages : [""];
  }

  renderLetterPage(direction = 0) {
    const isLastPage = this.letterPageIndex === this.letterPages.length - 1;
    this.el.text.textContent = this.letterPages[this.letterPageIndex];
    this.el.closing.hidden = !isLastPage;
    this.el.previousPage.disabled = this.letterPageIndex === 0;
    this.el.nextPage.disabled = isLastPage;
    this.el.pageIndicator.textContent = `${this.letterPageIndex + 1} / ${this.letterPages.length}`;
    this.el.pagination.hidden = this.letterPages.length <= 1;
    this.el.sheet.classList.remove("turn-page-forward", "turn-page-backward");
    if (direction) {
      void this.el.sheet.offsetWidth;
      this.el.sheet.classList.add(direction > 0 ? "turn-page-forward" : "turn-page-backward");
    }
  }

  turnLetterPage(direction) {
    const nextIndex = this.letterPageIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.letterPages.length) return;
    this.letterPageIndex = nextIndex;
    this.renderLetterPage(direction);
    this.onReveal();
  }

  close() {
    this.el.modal.hidden = true;
    this.closeKeepsakes();
  }

  renderKeepsakes() {
    if (!this.route) return;
    const portraitName = `${this.route.role}(${this.route.name})`;
    const keepsakes = [
      {
        era: "今生信物",
        title: this.route.keepsakes?.modernTitle,
        image: `./assets/images/letter/信物-${encodeURIComponent(portraitName)}-現代信物.webp`,
        meaning: this.route.keepsakes?.modern,
      },
      {
        era: "前世信物",
        title: this.route.keepsakes?.ancientTitle,
        image: `./assets/images/letter/信物-${encodeURIComponent(portraitName)}-古代信物.webp`,
        meaning: this.route.keepsakes?.ancient,
      },
    ];

    this.el.keepsakeList.innerHTML = keepsakes.map((keepsake) => `
      <button class="route-keepsake-card" type="button" aria-expanded="true">
        <img src="${keepsake.image}" alt="${this.route.role}與${this.route.name}的${keepsake.era}" />
        <span class="route-keepsake-copy">
          <b class="route-keepsake-name">${keepsake.title || keepsake.era}</b>
          <span class="route-keepsake-era">${keepsake.era}</span>
          <i aria-hidden="true"></i>
          <span class="route-keepsake-meaning">${keepsake.meaning || "這件信物承載著一段未斷的前世今生。"}</span>
          <small>點擊收合／展開</small>
        </span>
      </button>
    `).join("");
  }

  openKeepsakes() {
    if (!this.route) return;
    this.el.keepsakeModal.hidden = false;
    this.onReveal();
    this.el.keepsakeClose.focus({ preventScroll: true });
  }

  closeKeepsakes() {
    this.el.keepsakeModal.hidden = true;
    this.el.keepsakeList.querySelectorAll(".route-keepsake-card").forEach((card) => {
      card.setAttribute("aria-expanded", "true");
    });
  }
}

window.LetterFeature = LetterFeature;
