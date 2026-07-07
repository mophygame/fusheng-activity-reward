const GAME_STATE = Object.freeze({
  TITLE: "title",
  DIALOGUE: "dialogue",
  SELECT: "select",
  READER: "reader",
  VIDEO: "video",
  CHAPTER: "chapter",
});

class StoryLoader {
  static async load(manifestPath = "./data/manifest.json") {
    const manifest = await this.fetchJson(manifestPath);
    const routes = await this.fetchJson(manifest.routes);
    const chapterEntries = await Promise.all(
      Object.entries(manifest.chapters).map(async ([id, path]) => [id, await this.fetchJson(path)]),
    );

    const chapters = Object.fromEntries(chapterEntries);
    return {
      manifest,
      routes,
      chapters,
      currentChapter: chapters[manifest.startChapter],
    };
  }

  static async fetchJson(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Cannot load ${path}`);
    return response.json();
  }
}

class AudioDirector {
  constructor() {
    this.context = null;
    this.muted = false;
    this.musicMuted = false;
    this.musicStarted = false;
    this.music = new Audio("./assets/musics/浮生_伴奏.mp3");
    this.music.loop = true;
    this.music.preload = "auto";
    this.music.volume = 0.42;
  }

  ensureContext() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = AudioContext ? new AudioContext() : null;
    }
    if (this.context?.state === "suspended") this.context.resume();
  }

  tone(frequency, duration, type = "sine", volume = 0.04, delay = 0) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.context) return;

    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  enter() {
    this.tone(196, 1.3, "sine", 0.05);
    this.tone(293.66, 1.7, "sine", 0.035, 0.13);
    this.tone(440, 1.8, "triangle", 0.018, 0.27);
  }

  tap() {
    this.tone(620, 0.12, "sine", 0.018);
  }

  reveal() {
    this.tone(220, 0.8, "triangle", 0.035);
    this.tone(329.63, 1.2, "sine", 0.022, 0.08);
  }

  toggle() {
    this.muted = !this.muted;
    if (!this.muted) this.tap();
    return this.muted;
  }

  async startMusic() {
    if (this.musicStarted || this.musicMuted) return;
    try {
      await this.music.play();
      this.musicStarted = true;
    } catch (error) {
      console.warn("背景音樂無法播放", error);
    }
  }

  async toggleMusic() {
    this.musicMuted = !this.musicMuted;
    if (!this.musicStarted) return this.musicMuted;

    if (this.musicMuted) {
      this.music.pause();
    } else {
      try {
        await this.music.play();
        this.musicStarted = true;
      } catch (error) {
        console.warn("背景音樂無法播放", error);
      }
    }
    return this.musicMuted;
  }

  pauseMusic() {
    this.music.pause();
  }

  async resumeMusic() {
    if (this.musicMuted || !this.musicStarted) return;
    try {
      await this.music.play();
    } catch (error) {
      console.warn("背景音樂無法恢復", error);
    }
  }
}

class OtomeGame {
  constructor() {
    this.state = GAME_STATE.TITLE;
    this.story = null;
    this.currentChapter = null;
    this.routes = [];
    this.scripts = {};
    this.dialogueIndex = 0;
    this.dialogueScript = [];
    this.onDialogueComplete = () => this.showScrollSelect();
    this.lastSpeaker = "mian";
    this.selectedRoute = null;
    this.viewedRoutes = this.loadViewedRoutes();
    this.booksUnlocked = localStorage.getItem("booksUnlocked") === "true";
    this.typeTimer = null;
    this.audio = new AudioDirector();

    this.el = {
      scene: document.querySelector("#scene"),
      sceneBg: document.querySelector(".scene-bg"),
      title: document.querySelector("#title-screen"),
      story: document.querySelector("#story-screen"),
      enter: document.querySelector("#enter-button"),
      sound: document.querySelector("#sound-toggle"),
      music: document.querySelector("#music-toggle"),
      books: document.querySelector("#books-toggle"),
      shopkeepers: document.querySelector("#shopkeepers"),
      characterStage: document.querySelector("#character-stage"),
      chapter: document.querySelector("#chapter-card"),
      panel: document.querySelector("#dialogue-panel"),
      speaker: document.querySelector("#speaker-name"),
      text: document.querySelector("#dialogue-text"),
      progress: document.querySelector("#progress-mark"),
      next: document.querySelector("#dialogue-next"),
      askHistory: document.querySelector("#ask-history-button"),
      select: document.querySelector("#scroll-select"),
      grid: document.querySelector("#scroll-grid"),
      shelveBooks: document.querySelector("#shelve-books-button"),
      reader: document.querySelector("#scroll-reader"),
      closeScroll: document.querySelector("#close-scroll-button"),
      loveLetterButton: document.querySelector("#love-letter-button"),
      loveLetter: document.querySelector("#love-letter"),
      closeLetter: document.querySelector("#close-letter-button"),
      letterName: document.querySelector("#letter-name"),
      letterText: document.querySelector("#letter-text"),
      letterSignature: document.querySelector("#letter-signature"),
      letterWish: document.querySelector("#letter-wish"),
      letterAuthorName: document.querySelector("#letter-author-name"),
      inkPortrait: document.querySelector("#ink-portrait"),
      portraitModern: document.querySelector("#portrait-modern"),
      portraitAncient: document.querySelector("#portrait-ancient"),
      portraitModernGlyph: document.querySelector("#portrait-modern-glyph"),
      portraitAncientGlyph: document.querySelector("#portrait-ancient-glyph"),
      readerBookTitle: document.querySelector("#reader-book-title"),
      readerName: document.querySelector("#reader-name"),
      readerSeal: document.querySelector("#reader-seal"),
      readerModernRole: document.querySelector("#reader-modern-role"),
      readerAncientRole: document.querySelector("#reader-ancient-role"),
      readerLine: document.querySelector("#reader-line"),
      readerBackground: document.querySelector("#reader-background"),
      historyChoice: document.querySelector("#history-choice"),
      enterHistory: document.querySelector("#enter-history-button"),
      laterHistory: document.querySelector("#later-history-button"),
      historyVideoScreen: document.querySelector("#history-video-screen"),
      historyVideo: document.querySelector("#history-video"),
      transition: document.querySelector("#transition"),
      embers: document.querySelector("#embers"),
    };
  }

  async start() {
    try {
      this.story = await StoryLoader.load();
      this.currentChapter = this.story.currentChapter;
      this.routes = this.story.routes;
      this.scripts = this.currentChapter.scripts;
      this.dialogueScript = this.scripts.intro;
    } catch (error) {
      console.error("劇情資料載入失敗", error);
      this.showLoadError();
      return;
    }

    this.createEmbers();
    this.createScrolls();
    this.bindEvents();
    this.el.books.hidden = true;
    this.updateReadingProgress();
  }

  showLoadError() {
    this.el.enter.disabled = true;
    this.el.enter.querySelector("span").textContent = "資料未載入";
    this.el.enter.querySelector("small").textContent = "請用 npm start 或 GitHub Pages 開啟";
  }

  loadViewedRoutes() {
    try {
      const savedRoutes = JSON.parse(localStorage.getItem("viewedRoutes") || "[]");
      return new Set(Array.isArray(savedRoutes) ? savedRoutes : []);
    } catch {
      return new Set();
    }
  }

  bindEvents() {
    this.el.enter.addEventListener("click", () => this.enterStory());
    this.el.next.addEventListener("click", () => this.nextDialogue());
    this.el.askHistory.addEventListener("click", () => {
      this.el.askHistory.hidden = true;
      this.startDialogue(this.scripts.historyIntro, () => this.playHistoryVideo());
    });
    this.el.panel.addEventListener("click", (event) => {
      if (!event.target.closest("button")) this.nextDialogue();
    });
    this.el.sound.addEventListener("click", () => {
      const muted = this.audio.toggle();
      this.el.sound.classList.toggle("is-muted", muted);
      this.el.sound.setAttribute("aria-label", muted ? "開啟音效" : "關閉音效");
    });
    this.el.music.addEventListener("click", async () => {
      const muted = await this.audio.toggleMusic();
      this.el.music.classList.add("music-started");
      this.el.music.classList.toggle("music-muted", muted);
      this.el.music.setAttribute("aria-label", muted ? "開啟背景音樂" : "關閉背景音樂");
    });
    this.el.books.addEventListener("click", () => this.showScrollSelect());
    this.el.shelveBooks.addEventListener("click", () => this.shelveBooks());
    this.el.closeScroll.addEventListener("click", () => this.closeScroll());
    this.el.inkPortrait.addEventListener("click", () => {
      this.el.inkPortrait.classList.toggle("show-ancient");
    });
    this.el.loveLetterButton.addEventListener("click", () => {
      if (!this.selectedRoute) return;
      this.el.letterName.textContent = "致　XX";
      this.el.letterText.textContent = this.selectedRoute.letter;
      this.el.letterWish.textContent = this.selectedRoute.wish;
      this.el.letterAuthorName.textContent = this.selectedRoute.name;
      this.el.loveLetter.hidden = false;
      this.audio.reveal();
    });
    this.el.closeLetter.addEventListener("click", () => {
      this.el.loveLetter.hidden = true;
    });
    this.el.enterHistory.addEventListener("click", () => {
      this.el.historyChoice.hidden = true;
      this.startDialogue(this.scripts.historyIntro, () => this.playHistoryVideo());
    });
    this.el.laterHistory.addEventListener("click", () => {
      this.el.historyChoice.hidden = true;
      this.startDialogue(this.scripts.booksReturnedAgain, () => this.showHistoryPrompt());
    });
    this.el.historyVideo.addEventListener("ended", () => this.finishHistoryVideo());
    [this.el.portraitModern, this.el.portraitAncient].forEach((image) => {
      image.addEventListener("error", () => image.classList.add("is-missing"));
      image.addEventListener("load", () => image.classList.remove("is-missing"));
    });
    window.addEventListener("keydown", (event) => {
      if ((event.key === " " || event.key === "Enter") && this.state === GAME_STATE.DIALOGUE) {
        event.preventDefault();
        this.nextDialogue();
      }
    });
  }

  createEmbers() {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 22; index += 1) {
      const ember = document.createElement("i");
      ember.className = "ember";
      ember.style.left = `${Math.random() * 100}%`;
      ember.style.setProperty("--duration", `${7 + Math.random() * 9}s`);
      ember.style.setProperty("--delay", `${Math.random() * -12}s`);
      ember.style.setProperty("--drift", `${-35 + Math.random() * 70}px`);
      fragment.appendChild(ember);
    }
    this.el.embers.appendChild(fragment);
  }

  createScrolls() {
    this.routes.forEach((route, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scroll-card";
      button.dataset.routeId = route.id;
      button.style.setProperty("--tone", route.tone);
      button.innerHTML = `
        <span class="scroll-number">卷之 ${String(index + 1).padStart(2, "0")}</span>
        <b class="scroll-glyph">${route.glyph}</b>
        <h3>${route.title}</h3>
        <p>${route.role}</p>
        <span class="seal">${route.seal}<br>之印</span>
      `;
      button.addEventListener("click", () => this.chooseRoute(route));
      this.el.grid.appendChild(button);
    });
  }

  async enterStory() {
    this.audio.startMusic();
    this.el.music.classList.add("music-started");
    this.audio.enter();
    this.el.transition.classList.add("active");
    await this.wait(900);
    this.state = GAME_STATE.DIALOGUE;
    this.el.title.hidden = true;
    this.el.story.hidden = false;
    this.el.scene.classList.remove("scene-title");
    this.el.scene.classList.add("scene-shop");
    this.el.books.hidden = !this.booksUnlocked;
    await this.wait(550);
    this.el.transition.classList.remove("active");
    await this.wait(2900);
    this.el.chapter.hidden = true;
    this.el.scene.classList.add("dialogue-active");
    this.el.panel.hidden = false;
    this.showDialogue();
  }

  showDialogue() {
    const line = this.dialogueScript[this.dialogueIndex];
    this.el.askHistory.hidden = true;
    this.el.next.hidden = false;
    this.applyLineDirectives(line);
    this.applyDialogueScene(line.scene);
    if (line.character) this.lastSpeaker = line.character;
    this.el.scene.classList.toggle("speaker-mu", line.character === "mu");
    this.el.scene.classList.toggle("speaker-mian", line.character === "mian");
    this.el.scene.classList.toggle("speaker-neutral", !line.character);
    this.el.scene.classList.toggle("last-speaker-mu", this.lastSpeaker === "mu");
    this.el.scene.classList.toggle("last-speaker-mian", this.lastSpeaker === "mian");
    this.applySpeakerPosition(line);
    this.renderStoryCharacters(line);
    this.el.speaker.textContent = line.speaker;
    this.el.progress.textContent = `${String(this.dialogueIndex + 1).padStart(2, "0")} / ${String(this.dialogueScript.length).padStart(2, "0")}`;
    this.typeText(line.text);
  }

  typeText(content) {
    window.clearInterval(this.typeTimer);
    this.el.text.textContent = "";
    const chars = Array.from(content);
    let index = 0;
    this.typeTimer = window.setInterval(() => {
      this.el.text.textContent += chars[index] ?? "";
      index += 1;
      if (index >= chars.length) window.clearInterval(this.typeTimer);
    }, 34);
  }

  nextDialogue() {
    if (this.state !== GAME_STATE.DIALOGUE) return;

    const current = this.dialogueScript[this.dialogueIndex].text;
    if (this.el.text.textContent.length < Array.from(current).length) {
      window.clearInterval(this.typeTimer);
      this.el.text.textContent = current;
      return;
    }

    this.audio.tap();
    if (this.dialogueIndex < this.dialogueScript.length - 1) {
      this.dialogueIndex += 1;
      this.showDialogue();
      return;
    }
    this.onDialogueComplete();
  }

  startDialogue(script, onComplete) {
    if (!script?.length) return;
    this.state = GAME_STATE.DIALOGUE;
    this.dialogueScript = script;
    this.dialogueIndex = 0;
    this.onDialogueComplete = onComplete;
    this.el.select.hidden = true;
    this.el.reader.hidden = true;
    this.el.historyChoice.hidden = true;
    this.el.panel.hidden = false;
    this.el.askHistory.hidden = true;
    this.el.next.hidden = false;
    this.el.scene.classList.remove("scroll-select-active");
    this.el.scene.classList.add("dialogue-active");
    this.showDialogue();
  }

  applyDialogueScene(scene) {
    if (!scene) return;
    this.el.scene.classList.toggle("scene-chapter-city", scene === "city");
    this.el.scene.classList.toggle("scene-chapter-shop", scene === "shop");

    const sceneData = this.currentChapter?.scenes?.[scene];
    if (sceneData?.background) {
      this.el.sceneBg.style.backgroundImage = `url("${sceneData.background}")`;
    }
  }

  applyLineDirectives(line) {
    this.clearMomentEffects();

    if (line.background) {
      this.el.sceneBg.style.backgroundImage = `url("${line.background}")`;
    }

    (line.effects || []).forEach((effect) => {
      const type = typeof effect === "string" ? effect : effect.type;
      if (type) this.el.scene.classList.add(`effect-${type}`);
    });

    const shake = line.camera?.shake;
    if (shake) {
      this.el.scene.classList.add(`shake-${shake}`);
      window.setTimeout(() => this.el.scene.classList.remove(`shake-${shake}`), 520);
    }
  }

  clearMomentEffects() {
    this.el.scene.classList.remove(
      "effect-rain",
      "effect-flash",
      "shake-soft",
      "shake-medium",
      "shake-strong",
      "speaker-position-left",
      "speaker-position-right",
      "speaker-position-center",
    );
  }

  applySpeakerPosition(line) {
    const position = line.position || "center";
    this.el.scene.classList.add(`speaker-position-${position}`);
  }

  renderStoryCharacters(line) {
    const actors = line.actors || line.characters || (line.portrait ? [{
      id: line.character,
      name: line.speaker,
      portrait: line.portrait,
      position: line.position || "center",
      speaking: true,
    }] : []);

    if (!actors.length) {
      this.el.characterStage.hidden = true;
      this.el.characterStage.querySelectorAll(".story-character").forEach((node) => {
        node.hidden = true;
      });
      return;
    }

    this.el.characterStage.hidden = false;
    this.el.characterStage.querySelectorAll(".story-character").forEach((node) => {
      node.hidden = true;
      node.classList.remove("is-speaking");
    });

    actors.forEach((actor) => {
      const id = actor.id || actor.name || "character";
      let image = this.el.characterStage.querySelector(`[data-character-id="${id}"]`);
      if (!image) {
        image = document.createElement("img");
        image.className = "story-character";
        image.dataset.characterId = id;
        this.el.characterStage.appendChild(image);
      }

      image.src = actor.src || actor.portrait;
      image.alt = actor.name || id;
      image.hidden = false;
      image.className = `story-character story-character-${actor.position || "center"}`;
      image.classList.toggle("is-speaking", actor.speaking !== false);
    });
  }

  showScrollSelect() {
    this.state = GAME_STATE.SELECT;
    window.clearInterval(this.typeTimer);
    this.el.scene.classList.remove("speaker-mu", "speaker-mian", "speaker-neutral");
    this.el.scene.classList.add("scroll-select-active");
    this.el.panel.hidden = true;
    this.el.historyChoice.hidden = true;
    this.el.reader.hidden = true;
    this.el.select.hidden = false;
    this.updateReadingProgress();
    this.audio.reveal();
  }

  async chooseRoute(route) {
    this.audio.reveal();
    this.el.transition.classList.add("active");
    await this.wait(500);
    this.selectedRoute = route;
    this.el.scene.classList.remove("scroll-select-active");
    this.el.select.hidden = true;
    this.openScroll();
    await this.wait(220);
    this.el.transition.classList.remove("active");
  }

  openScroll() {
    if (!this.selectedRoute) return;
    const route = this.selectedRoute;
    this.viewedRoutes.add(route.id);
    localStorage.setItem("viewedRoutes", JSON.stringify([...this.viewedRoutes]));
    this.updateReadingProgress();
    this.state = GAME_STATE.READER;
    this.audio.reveal();
    this.el.reader.hidden = false;
    this.el.loveLetter.hidden = true;
    this.el.readerBookTitle.textContent = `${route.glyph}${route.title} • ${route.era} [${route.role}] `;
    this.el.readerName.textContent = route.name;
    const sealImagePath = `./assets/images/用印-${encodeURIComponent(route.name)}.webp`;
    this.el.readerSeal.src = sealImagePath;
    this.el.readerSeal.alt = `${route.name}用印`;
    this.el.letterSignature.src = sealImagePath;
    this.el.letterSignature.alt = `${route.name}情箋用印`;
    this.el.readerModernRole.textContent = route.modernRole;
    this.el.readerAncientRole.textContent = route.ancientRole;
    this.el.readerLine.textContent = route.line;
    this.el.readerBackground.textContent = route.background;
    this.el.portraitModernGlyph.textContent = route.glyph;
    this.el.portraitAncientGlyph.textContent = route.glyph;
    this.el.inkPortrait.style.setProperty("--portrait-tone", route.portraitTone);
    this.el.inkPortrait.classList.remove("show-ancient");
    this.el.portraitModern.classList.remove("is-missing");
    this.el.portraitAncient.classList.remove("is-missing");
    this.el.portraitModern.src = `./assets/images/routes/${route.id}-modern.webp`;
    this.el.portraitAncient.src = `./assets/images/routes/${route.id}-ancient.webp`;
    this.el.portraitModern.alt = `${route.title}男主今生人設`;
    this.el.portraitAncient.alt = `${route.title}男主前世人設`;
  }

  closeScroll() {
    this.el.loveLetter.hidden = true;
    this.showScrollSelect();
  }

  updateReadingProgress() {
    this.routes.forEach((route) => {
      const card = this.el.grid.querySelector(`[data-route-id="${route.id}"]`);
      card?.classList.toggle("is-viewed", this.viewedRoutes.has(route.id));
    });
    this.el.shelveBooks.hidden = this.viewedRoutes.size < this.routes.length;
  }

  shelveBooks() {
    if (this.viewedRoutes.size < this.routes.length) return;
    if (this.booksUnlocked) {
      this.startDialogue(this.scripts.booksReturnedAgain, () => this.showHistoryPrompt());
      return;
    }
    this.booksUnlocked = true;
    localStorage.setItem("booksUnlocked", "true");
    this.el.books.hidden = false;
    this.startDialogue(this.scripts.booksReturned, () => this.showHistoryPrompt());
  }

  showHistoryChoice() {
    this.state = GAME_STATE.CHAPTER;
    this.el.panel.hidden = true;
    this.el.historyChoice.hidden = false;
    this.applyDialogueScene("shop");
  }

  showHistoryPrompt() {
    this.state = GAME_STATE.DIALOGUE;
    window.clearInterval(this.typeTimer);
    this.el.next.hidden = true;
    this.el.askHistory.hidden = false;
    this.el.panel.hidden = false;
    this.el.historyChoice.hidden = true;
  }

  async playHistoryVideo() {
    this.state = GAME_STATE.VIDEO;
    this.el.historyChoice.hidden = true;
    this.el.historyVideoScreen.hidden = false;
    this.audio.pauseMusic();
    this.el.historyVideo.currentTime = 0;
    try {
      await this.el.historyVideo.play();
    } catch (error) {
      console.warn("歷史影片無法播放", error);
      this.finishHistoryVideo();
    }
  }

  finishHistoryVideo() {
    this.el.historyVideo.pause();
    this.el.historyVideoScreen.hidden = true;
    this.audio.resumeMusic();
    this.startDialogue(this.scripts.chapterStart, () => {
      this.state = GAME_STATE.CHAPTER;
      this.el.panel.hidden = false;
    });
  }

  wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }
}

new OtomeGame().start();
