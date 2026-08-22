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
      keepsakeTabs: [...document.querySelectorAll("[data-keepsake-tab]")],
    };
    this.portraitPointerType = "";

    this.bindEvents();
  }

  bindEvents() {
    this.el.portrait.addEventListener("pointerdown", (event) => {
      this.portraitPointerType = event.pointerType;
    });
    this.el.portrait.addEventListener("pointermove", (event) => {
      if (event.pointerType === "mouse" && (event.movementX || event.movementY)) {
        this.setAncientPortraitVisible(true);
      }
    });
    this.el.portrait.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") this.setAncientPortraitVisible(false);
    });
    this.el.portrait.addEventListener("click", (event) => {
      const isKeyboard = event.detail === 0;
      const isTouch = this.portraitPointerType === "touch" || this.portraitPointerType === "pen";
      if (isKeyboard || isTouch) {
        this.setAncientPortraitVisible(!this.el.portrait.classList.contains("show-ancient"));
      }
      this.portraitPointerType = "";
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
    this.el.keepsakeTabs.forEach((tab, index) => {
      tab.addEventListener("click", () => this.selectKeepsake(index));
      tab.addEventListener("keydown", (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (index + direction + this.el.keepsakeTabs.length) % this.el.keepsakeTabs.length;
        this.selectKeepsake(nextIndex, true);
      });
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

  setAncientPortraitVisible(visible) {
    this.el.portrait.classList.toggle("show-ancient", visible);
    this.el.portrait.setAttribute("aria-label", visible
      ? "目前顯示前世古代照片，離開或再次點擊可返回今生照片"
      : "目前顯示今生現代照片，滑鼠滑過或點擊可查看前世照片");
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
    this.setAncientPortraitVisible(false);
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
    const rocYear = new Date().getFullYear() - 1911;
    const keepsakes = [
      {
        serial: "壹",
        time: "今生",
        period: `民國 ${rocYear} 年`,
        title: this.route.keepsakes?.modernTitle,
        image: `./assets/images/letter/信物-${encodeURIComponent(portraitName)}-現代信物.webp`,
        introduction: this.route.keepsakes?.modern,
        size: this.route.keepsakes?.modernSize,
      },
      {
        serial: "貳",
        time: "前世",
        period: "大封十年",
        title: this.route.keepsakes?.ancientTitle,
        image: `./assets/images/letter/信物-${encodeURIComponent(portraitName)}-古代信物.webp`,
        introduction: this.route.keepsakes?.ancient,
        size: this.route.keepsakes?.ancientSize,
      },
    ];

    this.el.keepsakeList.innerHTML = keepsakes.map((keepsake, index) => `
      <article class="route-keepsake-card ${index === 0 ? "is-modern" : "is-ancient"}">
        <div class="route-keepsake-visual">
          <img src="${keepsake.image}" alt="${this.route.role}與${this.route.name}的${keepsake.time}信物：${keepsake.title}" />
          <div class="route-keepsake-vertical">
            <span class="route-keepsake-serial">${keepsake.serial}</span>
            <h3>${keepsake.title}</h3>
          </div>
        </div>
        <div class="route-keepsake-info">
          <h4><i aria-hidden="true"></i><span>文物簡介</span><i aria-hidden="true"></i></h4>
          <p>${keepsake.introduction || "這件信物承載著一段未斷的前世今生。"}</p>
          <dl>
            <div><dt>類　別</dt><dd>${keepsake.time}信物</dd></div>
            <div><dt>年　　代</dt><dd>${keepsake.period}</dd></div>
            <div><dt>尺　　寸</dt><dd>${keepsake.size || "尺寸不詳"}</dd></div>
            <div><dt>緣　分</dt><dd>${keepsake.time}</dd></div>
          </dl>
        </div>
      </article>
    `).join("");
  }

  openKeepsakes() {
    if (!this.route) return;
    this.selectKeepsake(0);
    this.el.keepsakeModal.hidden = false;
    this.onReveal();
    this.el.keepsakeClose.focus({ preventScroll: true });
  }

  closeKeepsakes() {
    this.el.keepsakeModal.hidden = true;
  }

  selectKeepsake(index, focus = false) {
    const cards = [...this.el.keepsakeList.querySelectorAll('.route-keepsake-card')];
    this.el.keepsakeTabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (focus && selected) tab.focus({ preventScroll: true });
    });
    cards.forEach((card, cardIndex) => {
      card.classList.toggle('is-tab-active', cardIndex === index);
      card.setAttribute('aria-hidden', String(cardIndex !== index));
    });
  }
}

window.LetterFeature = LetterFeature;
