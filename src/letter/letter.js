class LetterFeature {
  constructor({ onReveal = () => {} } = {}) {
    this.route = null;
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
      portrait: document.querySelector("#ink-portrait"),
      modernPortrait: document.querySelector("#portrait-modern"),
      ancientPortrait: document.querySelector("#portrait-ancient"),
      modernGlyph: document.querySelector("#portrait-modern-glyph"),
      ancientGlyph: document.querySelector("#portrait-ancient-glyph"),
    };

    this.bindEvents();
  }

  bindEvents() {
    this.el.portrait.addEventListener("click", () => {
      this.el.portrait.classList.toggle("show-ancient");
    });
    this.el.openButton.addEventListener("click", () => this.open());
    this.el.closeButton.addEventListener("click", () => this.close());

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
  }

  open() {
    if (!this.route) return;
    this.el.name.textContent = "致　XX";
    this.el.text.textContent = this.route.letter;
    this.el.wish.textContent = this.route.wish;
    this.el.authorName.textContent = this.route.name;
    this.el.modal.hidden = false;
    this.onReveal();
  }

  close() {
    this.el.modal.hidden = true;
  }
}

window.LetterFeature = LetterFeature;
