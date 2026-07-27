const GAME_STATE = Object.freeze({
  TITLE: "title",
  HOME: "home",
  DIALOGUE: "dialogue",
  SELECT: "select",
  READER: "reader",
  MINIGAME: "minigame",
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
    const minigameEntries = await Promise.all(
      Object.entries(manifest.minigames || {}).map(async ([id, path]) => [id, await this.fetchJson(path)]),
    );

    const chapters = Object.fromEntries(chapterEntries);
    const minigames = Object.fromEntries(minigameEntries);
    return {
      manifest,
      routes,
      chapters,
      minigames,
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
    this.minigames = {};
    this.currentMinigame = null;
    this.afterVideoAction = null;
    this.dialogueIndex = 0;
    this.dialogueScript = [];
    this.onDialogueComplete = () => this.showHome();
    this.lastSpeaker = "mian";
    this.selectedRoute = null;
    this.booksReviewMode = false;
    this.beforeBooksState = null;
    this.returnHomeAfterBooks = false;
    this.returnHomeAfterMiniGame = false;
    this.chapterInProgress = null;
    this.viewedRoutes = this.loadViewedRoutes();
    this.booksUnlocked = localStorage.getItem("booksUnlocked") === "true";
    this.keepsakeMatchCompleted = localStorage.getItem("keepsakeMatchCompleted") === "true";
    this.player = this.loadPlayerState();
    this.typeTimer = null;
    this.audio = new AudioDirector();
    this.taskGameModal = null;
    this.skyLanternGame = null;
    this.touhuGame = null;
    this.memorialGame = null;
    this.stillGallery = null;

    this.el = {
      scene: document.querySelector("#scene"),
      sceneBg: document.querySelector(".scene-bg"),
      storyEffects: document.querySelector("#story-effects"),
      storyItems: document.querySelector("#story-items"),
      title: document.querySelector("#title-screen"),
      home: document.querySelector("#home-screen"),
      story: document.querySelector("#story-screen"),
      enter: document.querySelector("#enter-button"),
      music: document.querySelector("#music-toggle"),
      keepsake: document.querySelector("#keepsake-toggle"),
      playerNickname: document.querySelector("#player-nickname"),
      playerLevel: document.querySelector("#player-level"),
      playerProgress: document.querySelector("#player-progress"),
      lanternCount: document.querySelector("#lantern-count"),
      galleryLanternCount: document.querySelector("#gallery-lantern-count"),
      loginReward: document.querySelector("#login-reward-button"),
      loginCalendar: document.querySelector("#login-reward-calendar"),
      loginCalendarTitle: document.querySelector("#login-calendar-title"),
      loginCalendarDays: document.querySelector("#login-calendar-days"),
      closeLoginCalendar: document.querySelector("#close-login-calendar-button"),
      claimCalendarReward: document.querySelector("#claim-calendar-reward-button"),
      homeActions: document.querySelector(".home-actions"),
      homeMinigame: document.querySelector("#home-minigame-button"),
      homeBooks: document.querySelector("#home-books-button"),
      homeStory: document.querySelector("#home-story-button"),
      homeGallery: document.querySelector("#home-gallery-button"),
      minigameMenu: document.querySelector("#minigame-menu"),
      closeMinigameMenu: document.querySelector("#close-minigame-menu-button"),
      startKeepsakeGame: document.querySelector("#start-keepsake-game-button"),
      storyMenu: document.querySelector("#story-menu"),
      closeStoryMenu: document.querySelector("#close-story-menu-button"),
      chapterList: document.querySelector("#chapter-list"),
      chapterButtons: [...document.querySelectorAll("[data-chapter-id]")],
      chapterRoute: document.querySelector("#chapter-route"),
      chapterHorse: document.querySelector("#chapter-horse"),
      storyProgressText: document.querySelector("#story-progress-text"),
      storyProgressBar: document.querySelector("#story-progress-bar"),
      galleryShop: document.querySelector("#gallery-shop"),
      closeGallery: document.querySelector("#close-gallery-button"),
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
      closeBooks: document.querySelector("#close-books-button"),
      grid: document.querySelector("#scroll-grid"),
      shelveBooks: document.querySelector("#shelve-books-button"),
      reader: document.querySelector("#scroll-reader"),
      closeScroll: document.querySelector("#close-scroll-button"),
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
      keepsakeGame: document.querySelector("#keepsake-game"),
      transition: document.querySelector("#transition"),
      embers: document.querySelector("#embers"),
    };
    this.letter = new window.LetterFeature({ onReveal: () => this.audio.reveal() });
  }

  async start() {
    try {
      this.story = await StoryLoader.load();
      this.currentChapter = this.story.currentChapter;
      this.routes = this.story.routes;
      this.scripts = this.currentChapter.scripts;
      this.minigames = this.story.minigames;
      this.dialogueScript = this.scripts.intro;
    } catch (error) {
      console.error("劇情資料載入失敗", error);
      this.showLoadError();
      return;
    }

    this.createEmbers();
    this.createScrolls();
    this.bindEvents();
    this.bindHomeCarousel();
    this.el.keepsake.hidden = !this.keepsakeMatchCompleted;
    this.renderHome();
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

  loadPlayerState() {
    const fallback = {
      nickname: "破關者暱稱",
      lanterns: 0,
      level: 1,
      experience: 0,
      claimedLoginDate: "",
      loginRewardHistory: {},
      clearedChapters: [],
      lastStoryChapter: "",
    };

    try {
      const saved = JSON.parse(localStorage.getItem("fushengPlayerState") || "{}");
      return {
        ...fallback,
        ...saved,
        nickname: !saved.nickname || saved.nickname === "旅人" ? fallback.nickname : saved.nickname,
        lanterns: Number.isFinite(saved.lanterns) ? saved.lanterns : fallback.lanterns,
        level: Number.isFinite(saved.level) ? Math.max(1, Math.min(99, Math.floor(saved.level))) : fallback.level,
        experience: Number.isFinite(saved.experience) ? Math.max(0, Math.floor(saved.experience)) : fallback.experience,
        loginRewardHistory: saved.loginRewardHistory && typeof saved.loginRewardHistory === "object"
          ? saved.loginRewardHistory
          : fallback.loginRewardHistory,
        clearedChapters: Array.isArray(saved.clearedChapters) ? saved.clearedChapters : [],
        lastStoryChapter: ["prologue", "chapter1", "chapter2", "chapter3", "chapter4", "chapter5"].includes(saved.lastStoryChapter)
          ? saved.lastStoryChapter
          : fallback.lastStoryChapter,
      };
    } catch {
      return fallback;
    }
  }

  savePlayerState() {
    localStorage.setItem("fushengPlayerState", JSON.stringify(this.player));
  }

  experienceRequired(level = this.player.level) {
    return level >= 99 ? 0 : 80 + (level - 1) * 20;
  }

  grantRewards({ lanterns = 0, experience = 0 } = {}) {
    this.player.lanterns += Math.max(0, Math.floor(lanterns));
    let remainingExperience = Math.max(0, Math.floor(experience));
    const previousLevel = this.player.level;

    while (this.player.level < 99 && this.player.experience >= this.experienceRequired()) {
      this.player.experience -= this.experienceRequired();
      this.player.level += 1;
    }

    while (remainingExperience > 0 && this.player.level < 99) {
      const required = this.experienceRequired();
      const needed = required - this.player.experience;
      const gained = Math.min(needed, remainingExperience);
      this.player.experience += gained;
      remainingExperience -= gained;

      if (this.player.experience >= required) {
        this.player.level += 1;
        this.player.experience = 0;
      }
    }

    if (this.player.level >= 99) {
      this.player.level = 99;
      this.player.experience = 0;
    }

    this.savePlayerState();
    this.renderHome();
    return this.player.level > previousLevel;
  }

  getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  }

  getDateKey(year, monthIndex, day) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  getDailyLoginReward(dateKey, day) {
    const seed = [...dateKey].reduce((total, character, index) => total + character.charCodeAt(0) * (index + 3), 0);
    const base = 5 + (seed % 6);
    const [year, month, date] = dateKey.split("-").map(Number);
    const isSunday = new Date(year, month - 1, date).getDay() === 0;
    if (!isSunday) return { amount: base, multiplier: 1 };
    const multiplier = 1.5 + ((seed >> 2) % 4) * 0.5;
    return { amount: Math.round(base * multiplier), multiplier };
  }

  hasClaimedLoginReward(dateKey) {
    return Object.prototype.hasOwnProperty.call(this.player.loginRewardHistory, dateKey)
      || this.player.claimedLoginDate === dateKey;
  }

  renderHome() {
    if (!this.el.home) return;
    this.el.playerNickname.textContent = this.player.nickname || "破關者暱稱";
    this.el.playerLevel.textContent = String(this.player.level);
    const requiredExperience = this.experienceRequired();
    const progress = this.player.level >= 99 ? 100 : (this.player.experience / requiredExperience) * 100;
    this.el.playerProgress.querySelector("b").style.width = `${Math.min(100, progress)}%`;
    this.el.playerProgress.setAttribute("aria-label", this.player.level >= 99
      ? "已達最高等級 99"
      : `升級進度 ${this.player.experience} / ${requiredExperience}`);
    this.el.lanternCount.textContent = String(this.player.lanterns);
    this.el.galleryLanternCount.textContent = String(this.player.lanterns);
    const claimedToday = this.hasClaimedLoginReward(this.getTodayKey());
    this.el.loginReward.classList.toggle("is-claimed", claimedToday);
    this.el.loginReward.querySelector("span").textContent = "登入獎勵";
    this.el.loginReward.setAttribute("aria-label", claimedToday ? "登入獎勵，今日已領取" : "領取登入獎勵");
    this.renderStoryMenu();
  }

  isChapterCleared(chapterId) {
    return this.player.clearedChapters.includes(chapterId);
  }

  isChapterUnlocked(chapterId) {
    const order = ["prologue", "chapter1", "chapter2", "chapter3", "chapter4", "chapter5"];
    const index = order.indexOf(chapterId);
    return index === 0 || (index > 0 && this.isChapterCleared(order[index - 1]));
  }

  renderStoryMenu() {
    const clearedCount = this.el.chapterButtons.filter((button) => this.isChapterCleared(button.dataset.chapterId)).length;
    this.el.storyProgressText.textContent = `${clearedCount} / ${this.el.chapterButtons.length}`;
    this.el.storyProgressBar.style.width = `${(clearedCount / this.el.chapterButtons.length) * 100}%`;

    this.el.chapterButtons.forEach((button) => {
      const chapterId = button.dataset.chapterId;
      const unlocked = this.isChapterUnlocked(chapterId);
      const cleared = this.isChapterCleared(chapterId);
      button.disabled = !unlocked;
      button.classList.toggle("is-locked", !unlocked);
      button.classList.toggle("is-cleared", cleared);
      button.querySelector(".chapter-status").textContent = cleared ? "已讀 · 重溫" : unlocked ? "可閱讀" : "未解鎖";
      button.setAttribute("aria-label", `${button.querySelector(".chapter-number").textContent} ${button.querySelector("b").textContent}，${cleared ? "已讀，可重新閱讀" : unlocked ? "可閱讀" : "尚未解鎖"}`);
    });
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
    this.el.music.addEventListener("click", async () => {
      const muted = await this.audio.toggleMusic();
      this.el.music.classList.add("music-started");
      this.el.music.classList.toggle("music-muted", muted);
      this.el.music.setAttribute("aria-label", muted ? "開啟背景音樂" : "關閉背景音樂");
      this.el.music.querySelector(".music-label").textContent = muted ? "開啟音樂" : "關閉音樂";
    });
    this.el.keepsake.addEventListener("click", () => this.openMiniGameFromHome());
    this.el.loginReward.addEventListener("click", () => this.openLoginRewardCalendar());
    this.el.closeLoginCalendar.addEventListener("click", () => this.closeLoginRewardCalendar());
    this.el.claimCalendarReward.addEventListener("click", () => this.claimLoginReward());
    this.el.loginCalendar.addEventListener("click", (event) => {
      if (event.target === this.el.loginCalendar) this.closeLoginRewardCalendar();
      if (event.target.closest("[data-claim-today]")) this.claimLoginReward();
    });
    this.el.homeMinigame.addEventListener("click", () => this.openMiniGameMenu());
    this.el.closeMinigameMenu.addEventListener("click", () => this.closeMiniGameMenu());
    this.el.startKeepsakeGame.addEventListener("click", () => this.openMiniGameFromHome());
    this.el.homeBooks.addEventListener("click", () => this.openBooksFromHome());
    this.el.homeStory.addEventListener("click", () => this.openStoryMenu());
    this.el.homeGallery.addEventListener("click", () => this.openGalleryShop());
    this.el.closeStoryMenu.addEventListener("click", () => this.closeStoryMenu());
    this.el.closeGallery.addEventListener("click", () => this.closeGalleryShop());
    this.el.chapterList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-chapter-id]");
      if (!button || button.disabled) return;
      this.travelToStoryChapter(button.dataset.chapterId);
    });
    this.el.closeBooks.addEventListener("click", () => this.closeBookReview());
    this.el.shelveBooks.addEventListener("click", () => this.shelveBooks());
    this.el.closeScroll.addEventListener("click", () => this.closeScroll());
    this.el.enterHistory.addEventListener("click", () => {
      this.el.historyChoice.hidden = true;
      this.startDialogue(this.scripts.historyIntro, () => this.playHistoryVideo());
    });
    this.el.laterHistory.addEventListener("click", () => {
      this.el.historyChoice.hidden = true;
      this.showHome();
    });
    this.el.historyVideo.addEventListener("ended", () => this.finishHistoryVideo());
    window.addEventListener("keydown", (event) => {
      if ((event.key === " " || event.key === "Enter") && this.state === GAME_STATE.DIALOGUE) {
        event.preventDefault();
        this.nextDialogue();
      }
    });
    let storyMapResizeFrame = 0;
    window.addEventListener("resize", () => {
      window.cancelAnimationFrame(storyMapResizeFrame);
      storyMapResizeFrame = window.requestAnimationFrame(() => {
        this.updateChapterRoute();
        this.placeChapterHorse();
      });
    });
  }

  bindHomeCarousel() {
    const cards = [...this.el.homeActions.querySelectorAll(".home-action-button")];
    const previousButton = document.querySelector(".home-swipe-arrow.is-prev");
    const nextButton = document.querySelector(".home-swipe-arrow.is-next");
    const dots = [...document.querySelectorAll(".home-swipe-dots i")];
    let frame = 0;
    let selectedIndex = 0;

    const updateControls = () => {
      dots.forEach((dot, index) => dot.classList.toggle("is-active", index === selectedIndex));
      previousButton.disabled = selectedIndex === 0;
      nextButton.disabled = selectedIndex === cards.length - 1;
    };

    const goToCard = (index) => {
      selectedIndex = Math.max(0, Math.min(cards.length - 1, index));
      const card = cards[selectedIndex];
      const left = card.offsetLeft - (this.el.homeActions.clientWidth - card.offsetWidth) / 2;
      const previousScrollBehavior = this.el.homeActions.style.scrollBehavior;
      const previousScrollSnapType = this.el.homeActions.style.scrollSnapType;
      this.el.homeActions.style.scrollBehavior = "auto";
      this.el.homeActions.style.scrollSnapType = "none";
      this.el.homeActions.scrollLeft = left;
      updateControls();
      requestAnimationFrame(() => {
        this.el.homeActions.style.scrollBehavior = previousScrollBehavior;
        this.el.homeActions.style.scrollSnapType = previousScrollSnapType;
        selectNearestCard();
      });
    };

    const selectNearestCard = () => {
      frame = 0;
      if (!window.matchMedia("(max-width: 1024px)").matches || this.el.home.hidden) {
        cards.forEach((card) => card.classList.remove("is-selected"));
        return;
      }

      const listBounds = this.el.homeActions.getBoundingClientRect();
      const listCenter = listBounds.left + listBounds.width / 2;
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
      selectedIndex = cards.indexOf(selectedCard);
      updateControls();
    };

    this.el.homeActions.addEventListener("scroll", () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(selectNearestCard);
    }, { passive: true });

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        if (!window.matchMedia("(max-width: 1024px)").matches) return;
        goToCard(cards.indexOf(card));
      });
    });

    previousButton.addEventListener("click", () => goToCard(selectedIndex - 1));
    nextButton.addEventListener("click", () => goToCard(selectedIndex + 1));

    window.addEventListener("resize", selectNearestCard);
    updateControls();
    this.updateHomeCarouselSelection = selectNearestCard;
  }

  createEmbers() {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 54; index += 1) {
      const ember = document.createElement("i");
      ember.className = "ember";
      ember.style.left = `${Math.random() * 100}%`;
      ember.style.setProperty("--duration", `${5 + Math.random() * 10}s`);
      ember.style.setProperty("--delay", `${Math.random() * -15}s`);
      ember.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
      ember.style.setProperty("--size", `${1 + Math.random() * 4}px`);
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
    this.showHome();
    await this.wait(550);
    this.el.transition.classList.remove("active");
  }

  showHome() {
    this.state = GAME_STATE.HOME;
    window.clearInterval(this.typeTimer);
    this.clearMomentEffects();
    this.returnHomeAfterBooks = false;
    this.returnHomeAfterMiniGame = false;
    this.el.title.hidden = true;
    this.el.home.hidden = false;
    this.el.story.hidden = true;
    this.el.scene.classList.remove(
      "scene-title",
      "scene-shop",
      "scene-home",
      "scene-chapter-city",
      "scene-chapter-shop",
      "dialogue-active",
      "scroll-select-active",
      "speaker-mu",
      "speaker-mian",
      "speaker-neutral",
    );
    this.el.scene.classList.add("scene-home");
    this.el.sceneBg.style.backgroundImage = "";
    this.el.keepsake.hidden = !this.keepsakeMatchCompleted;
    this.hideHomeModals();
    this.hideStoryOverlays();
    this.renderHome();
    requestAnimationFrame(() => this.updateHomeCarouselSelection?.());
  }

  hideHomeModals() {
    this.el.loginCalendar.hidden = true;
    this.el.minigameMenu.hidden = true;
    this.el.storyMenu.hidden = true;
    this.el.galleryShop.hidden = true;
  }

  hideStoryOverlays() {
    this.el.chapter.hidden = true;
    this.el.panel.hidden = true;
    this.el.select.hidden = true;
    this.el.reader.hidden = true;
    this.letter.close();
    this.el.historyChoice.hidden = true;
    this.el.historyVideoScreen.hidden = true;
    this.el.keepsakeGame.hidden = true;
    this.el.characterStage.hidden = true;
    this.el.askHistory.hidden = true;
  }

  prepareStoryScene() {
    this.el.home.hidden = true;
    this.el.story.hidden = false;
    this.el.scene.classList.remove("scene-title", "scene-home");
    this.el.scene.classList.add("scene-shop");
    this.applyDialogueScene("shop");
  }

  openStoryMenu() {
    this.hideHomeModals();
    this.renderStoryMenu();
    this.el.storyMenu.hidden = false;
    window.requestAnimationFrame(() => {
      this.updateChapterRoute();
      this.placeChapterHorse();
    });
    this.audio.tap();
  }

  getHorseChapterId() {
    const order = ["prologue", "chapter1", "chapter2", "chapter3", "chapter4", "chapter5"];
    if (order.includes(this.player.lastStoryChapter)) return this.player.lastStoryChapter;
    return [...order].reverse().find((id) => this.isChapterCleared(id)) || "prologue";
  }

  placeChapterHorse(chapterId = this.getHorseChapterId(), animate = false) {
    const target = this.el.chapterButtons.find((button) => button.dataset.chapterId === chapterId);
    if (!target || !this.el.chapterHorse) return;
    const mapRect = this.el.chapterList.getBoundingClientRect();
    const nodeRect = target.querySelector(".chapter-node").getBoundingClientRect();
    const x = nodeRect.left - mapRect.left + nodeRect.width / 2;
    const y = nodeRect.top - mapRect.top + nodeRect.height / 2;
    this.el.chapterHorse.classList.toggle("is-travelling", animate);
    this.el.chapterHorse.style.setProperty("--horse-x", `${x}px`);
    this.el.chapterHorse.style.setProperty("--horse-y", `${y}px`);
  }

  updateChapterRoute() {
    if (!this.el.chapterRoute || !this.el.chapterList) return;
    const mapRect = this.el.chapterList.getBoundingClientRect();
    if (!mapRect.width || !mapRect.height) return;

    const points = this.el.chapterButtons.map((button) => {
      const nodeRect = button.querySelector(".chapter-node").getBoundingClientRect();
      return {
        x: nodeRect.left - mapRect.left + nodeRect.width / 2,
        y: nodeRect.top - mapRect.top + nodeRect.height / 2,
      };
    });
    if (points.length < 2) return;

    const commands = [`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];
    for (let index = 0; index < points.length - 1; index += 1) {
      const previous = points[index - 1] || points[index];
      const current = points[index];
      const next = points[index + 1];
      const following = points[index + 2] || next;
      const controlOne = {
        x: current.x + (next.x - previous.x) / 6,
        y: current.y + (next.y - previous.y) / 6,
      };
      const controlTwo = {
        x: next.x - (following.x - current.x) / 6,
        y: next.y - (following.y - current.y) / 6,
      };
      commands.push(
        `C ${controlOne.x.toFixed(1)} ${controlOne.y.toFixed(1)}, `
        + `${controlTwo.x.toFixed(1)} ${controlTwo.y.toFixed(1)}, `
        + `${next.x.toFixed(1)} ${next.y.toFixed(1)}`,
      );
    }

    this.el.chapterRoute.setAttribute("viewBox", `0 0 ${mapRect.width} ${mapRect.height}`);
    this.el.chapterRoute.querySelectorAll("path").forEach((path) => {
      path.setAttribute("d", commands.join(" "));
    });
  }

  async travelToStoryChapter(chapterId) {
    const button = this.el.chapterButtons.find((entry) => entry.dataset.chapterId === chapterId);
    if (!button || button.disabled || this.el.chapterHorse.classList.contains("is-travelling")) return;
    this.el.chapterButtons.forEach((entry) => { entry.disabled = true; });
    this.placeChapterHorse(chapterId, true);
    this.audio.enter();
    await this.wait(1050);
    this.el.chapterHorse.classList.remove("is-travelling");
    if (chapterId === "prologue") await this.startPrologueFromHome();
    else this.startStoryChapter(chapterId);
  }

  openMiniGameMenu() {
    this.hideHomeModals();
    if (window.TaskGameModal) {
      if (!this.taskGameModal) {
        this.taskGameModal = new window.TaskGameModal(this.el.minigameMenu, {
          onClose: () => this.closeMiniGameMenu(),
          onStart: (gameId) => {
            if (gameId === "touhu") this.openTouhuGame();
            if (gameId === "skyLantern") this.openSkyLanternGame();
            if (gameId === "memorial") this.openMemorialGame();
          },
        });
      }
      this.taskGameModal.open();
    } else {
      this.el.minigameMenu.hidden = false;
    }
    this.audio.tap();
  }

  closeMiniGameMenu() {
    if (this.taskGameModal) {
      this.taskGameModal.close();
    } else {
      this.el.minigameMenu.hidden = true;
    }
    this.audio.tap();
  }

  openSkyLanternGame() {
    if (!window.SkyLanternGame) {
      console.warn("天燈遊戲尚未載入");
      return;
    }
    this.closeMiniGameMenu();
    this.skyLanternGame = new window.SkyLanternGame({
      onReward: (reward) => {
        this.grantRewards({ lanterns: reward, experience: 20 + reward * 6 });
        this.audio.reveal();
      },
      onClose: () => {
        this.skyLanternGame = null;
        this.renderHome();
        this.el.homeMinigame.focus({ preventScroll: true });
      },
    });
    this.skyLanternGame.mount();
    this.audio.reveal();
  }

  openTouhuGame() {
    if (!window.TouhuGame) {
      console.warn("投壺遊戲尚未載入");
      return;
    }
    this.closeMiniGameMenu();
    this.touhuGame = new window.TouhuGame({
      onReward: (reward) => {
        this.grantRewards({ lanterns: reward, experience: 20 + reward * 6 });
        this.audio.reveal();
      },
      onClose: () => {
        this.touhuGame = null;
        this.renderHome();
        this.el.homeMinigame.focus({ preventScroll: true });
      },
      onFinish: () => {
        this.touhuGame = null;
        this.renderHome();
        this.openMiniGameMenu();
      },
    });
    this.touhuGame.mount();
    this.audio.reveal();
  }

  openMemorialGame() {
    if (!window.MemorialGame) {
      console.warn("批奏摺遊戲尚未載入");
      return;
    }
    this.closeMiniGameMenu();
    this.memorialGame = new window.MemorialGame({
      onReward: (reward) => {
        this.grantRewards({ lanterns: reward, experience: 20 + reward * 6 });
        this.audio.reveal();
      },
      onClose: () => {
        this.memorialGame = null;
        this.renderHome();
        this.el.homeMinigame.focus({ preventScroll: true });
      },
      onFinish: () => {
        this.memorialGame = null;
        this.renderHome();
        this.openMiniGameMenu();
      },
    });
    this.memorialGame.mount();
    this.audio.reveal();
  }

  closeStoryMenu() {
    this.el.storyMenu.hidden = true;
    this.audio.tap();
  }

  openGalleryShop() {
    this.hideHomeModals();
    this.renderHome();
    this.el.galleryShop.hidden = false;
    if (window.StillGallery && !this.stillGallery) {
      this.stillGallery = new window.StillGallery({
        root: this.el.galleryShop,
        getLanterns: () => this.player.lanterns,
        spendLanterns: (amount) => {
          if (this.player.lanterns < amount) return false;
          this.player.lanterns -= amount;
          this.savePlayerState();
          this.renderHome();
          return true;
        },
        onUnlock: () => this.audio.reveal(),
      });
    }
    this.stillGallery?.open();
    this.audio.tap();
  }

  closeGalleryShop() {
    this.el.galleryShop.hidden = true;
    this.audio.tap();
  }

  claimLoginReward() {
    const today = this.getTodayKey();
    if (this.hasClaimedLoginReward(today)) {
      this.renderLoginRewardCalendar();
      this.audio.tap();
      return;
    }

    const now = new Date();
    const reward = this.getDailyLoginReward(today, now.getDate());
    this.player.claimedLoginDate = today;
    this.player.loginRewardHistory[today] = reward.amount;
    this.grantRewards({ lanterns: reward.amount, experience: 10 });
    this.renderLoginRewardCalendar();
    this.audio.reveal();
  }

  openLoginRewardCalendar() {
    this.hideHomeModals();
    this.renderLoginRewardCalendar();
    this.el.loginCalendar.hidden = false;
    this.el.closeLoginCalendar.focus({ preventScroll: true });
    this.audio.tap();
  }

  closeLoginRewardCalendar() {
    this.el.loginCalendar.hidden = true;
    this.el.loginReward.focus({ preventScroll: true });
    this.audio.tap();
  }

  renderLoginRewardCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const today = now.getDate();
    const todayKey = this.getTodayKey();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    this.el.loginCalendarTitle.textContent = `${year} 年 ${monthIndex + 1} 月登入獎勵`;
    this.el.loginCalendarDays.innerHTML = "";

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = this.getDateKey(year, monthIndex, day);
      const reward = this.getDailyLoginReward(dateKey, day);
      const claimed = this.hasClaimedLoginReward(dateKey);
      const isToday = dateKey === todayKey;
      const isPast = day < today;
      const isFuture = day > today;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "login-day";
      button.disabled = !isToday || claimed;
      button.classList.toggle("is-today", isToday);
      button.classList.toggle("is-claimed", claimed);
      button.classList.toggle("is-missed", isPast && !claimed);
      button.classList.toggle("is-future", isFuture);
      button.classList.toggle("is-bonus", reward.multiplier > 1);
      if (isToday && !claimed) button.dataset.claimToday = "true";
      const status = claimed ? "已領" : isPast ? "漏領" : isFuture ? "未開放" : "今日可領";
      button.setAttribute("aria-label", `${monthIndex + 1} 月 ${day} 日，${reward.amount} 盞，${status}`);
      button.innerHTML = `<span>${day}</span><b><img src="./assets/images/index/icon_light.webp" alt="">${reward.amount}</b>${reward.multiplier > 1 ? `<em>×${reward.multiplier}</em>` : ""}<small>${status}</small>`;
      this.el.loginCalendarDays.appendChild(button);
    }

    const claimedToday = this.hasClaimedLoginReward(todayKey);
    const todayReward = this.getDailyLoginReward(todayKey, today);
    this.el.claimCalendarReward.disabled = claimedToday;
    this.el.claimCalendarReward.textContent = claimedToday ? "今日已領取" : `領取今日 ${todayReward.amount} 盞`;
  }

  markChapterCleared(chapterId, options = {}) {
    if (!chapterId || this.player.clearedChapters.includes(chapterId)) return;
    this.player.clearedChapters.push(chapterId);
    if (options.award !== false) {
      this.grantRewards({ lanterns: 3, experience: 60 });
    } else {
      this.savePlayerState();
      this.renderHome();
    }
  }

  async startPrologueFromHome() {
    this.closeStoryMenu();
    this.prepareStoryScene();
    this.currentChapter = this.story.chapters.prologue;
    this.scripts = this.currentChapter.scripts;
    this.state = GAME_STATE.DIALOGUE;
    this.dialogueScript = this.scripts.intro;
    this.dialogueIndex = 0;
    this.onDialogueComplete = () => this.finishStoryChapter("prologue");
    this.el.chapter.hidden = false;
    await this.wait(2900);
    this.el.chapter.hidden = true;
    this.el.scene.classList.add("dialogue-active");
    this.el.panel.hidden = false;
    this.showDialogue();
  }

  startStoryChapter(chapterId) {
    if (!this.isChapterUnlocked(chapterId)) {
      this.renderStoryMenu();
      this.audio.tap();
      return;
    }

    this.closeStoryMenu();
    this.prepareStoryScene();
    this.startChapter(chapterId);
  }

  finishStoryChapter(chapterId) {
    this.markChapterCleared(chapterId);
    this.player.lastStoryChapter = chapterId;
    this.savePlayerState();
    this.chapterInProgress = null;
    this.showHome();
    this.openStoryMenu();
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
    const dialogue = Array.isArray(script) ? script : script?.lines;
    if (!dialogue?.length) return;
    this.state = GAME_STATE.DIALOGUE;
    this.dialogueScript = dialogue;
    this.dialogueIndex = 0;
    this.onDialogueComplete = onComplete || (() => this.runAction(script?.onComplete));
    this.el.select.hidden = true;
    this.el.reader.hidden = true;
    this.el.keepsakeGame.hidden = true;
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
      if (!type) return;
      const layer = document.createElement("i");
      layer.className = `story-effect is-${type}`;
      this.el.storyEffects.appendChild(layer);
    });

    (line.items || []).forEach((item) => {
      const config = typeof item === "string" ? { src: item } : item;
      if (!config?.src) return;
      const image = document.createElement("img");
      image.className = `story-item is-${config.position || "center"} is-${config.size || "medium"}`;
      image.src = config.src;
      image.alt = config.alt || "";
      if (config.rotate) image.style.setProperty("--item-rotate", config.rotate);
      this.el.storyItems.appendChild(image);
    });

    const shake = line.camera?.shake;
    if (shake) {
      this.el.scene.classList.add(`shake-${shake}`);
      window.setTimeout(() => this.el.scene.classList.remove(`shake-${shake}`), 520);
    }
  }

  clearMomentEffects() {
    this.el.storyEffects?.replaceChildren();
    this.el.storyItems?.replaceChildren();
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

  openBooksFromHome() {
    this.prepareStoryScene();
    this.showScrollSelect({ review: true, returnHome: true });
  }

  openMiniGameFromHome() {
    this.closeMiniGameMenu();
    this.prepareStoryScene();
    this.showMiniGame("keepsakeMatch", { replay: true, returnHome: true });
  }

  showScrollSelect(options = {}) {
    this.booksReviewMode = options.review === true;
    this.returnHomeAfterBooks = options.returnHome === true;
    this.beforeBooksState = this.booksReviewMode && !this.beforeBooksState ? {
      state: this.state,
      homeHidden: this.el.home.hidden,
      storyHidden: this.el.story.hidden,
      panelHidden: this.el.panel.hidden,
      askHistoryHidden: this.el.askHistory.hidden,
      nextHidden: this.el.next.hidden,
    } : this.beforeBooksState;
    if (!this.booksReviewMode) this.beforeBooksState = null;
    this.state = GAME_STATE.SELECT;
    this.booksUnlocked = true;
    localStorage.setItem("booksUnlocked", "true");
    window.clearInterval(this.typeTimer);
    this.el.scene.classList.remove("speaker-mu", "speaker-mian", "speaker-neutral");
    this.el.scene.classList.add("scroll-select-active");
    this.el.panel.hidden = true;
    this.el.historyChoice.hidden = true;
    this.el.reader.hidden = true;
    this.el.keepsakeGame.hidden = true;
    this.el.select.hidden = false;
    this.el.closeBooks.hidden = !this.booksReviewMode;
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
    const isFirstRead = !this.viewedRoutes.has(route.id);
    this.viewedRoutes.add(route.id);
    localStorage.setItem("viewedRoutes", JSON.stringify([...this.viewedRoutes]));
    if (isFirstRead) this.grantRewards({ lanterns: 2, experience: 35 });
    this.updateReadingProgress();
    this.state = GAME_STATE.READER;
    this.audio.reveal();
    this.el.reader.hidden = false;
    this.letter.close();
    this.el.readerBookTitle.textContent = `${route.glyph}${route.title} • ${route.era} [${route.role}] `;
    this.el.readerName.textContent = route.name;
    const sealImagePath = `./assets/images/用印-${encodeURIComponent(route.name)}.webp`;
    this.el.readerSeal.src = sealImagePath;
    this.el.readerSeal.alt = `${route.name}用印`;
    this.el.readerModernRole.textContent = route.modernRole;
    this.el.readerAncientRole.textContent = route.ancientRole;
    this.el.readerLine.textContent = route.line;
    this.el.readerBackground.textContent = route.background;
    this.letter.setRoute(route, sealImagePath, this.routes.indexOf(route) + 1);
  }

  closeScroll() {
    this.letter.close();
    this.showScrollSelect({ review: this.booksReviewMode, returnHome: this.returnHomeAfterBooks });
  }

  updateReadingProgress() {
    this.routes.forEach((route) => {
      const card = this.el.grid.querySelector(`[data-route-id="${route.id}"]`);
      card?.classList.toggle("is-viewed", this.viewedRoutes.has(route.id));
    });
    this.el.shelveBooks.hidden = !this.booksReviewMode && this.viewedRoutes.size < this.routes.length;
  }

  shelveBooks() {
    if (this.booksReviewMode) {
      this.closeBookReview();
      return;
    }
    this.showHome();
  }

  closeBookReview() {
    const shouldReturnHome = this.returnHomeAfterBooks;
    this.booksReviewMode = false;
    this.returnHomeAfterBooks = false;
    this.el.select.hidden = true;
    this.el.closeBooks.hidden = true;
    this.el.reader.hidden = true;
    this.letter.close();
    this.el.scene.classList.remove("scroll-select-active");

    if (shouldReturnHome) {
      this.beforeBooksState = null;
      this.showHome();
    } else if (this.beforeBooksState) {
      this.state = this.beforeBooksState.state;
      this.el.home.hidden = this.beforeBooksState.homeHidden;
      this.el.story.hidden = this.beforeBooksState.storyHidden;
      this.el.panel.hidden = this.beforeBooksState.panelHidden;
      this.el.askHistory.hidden = this.beforeBooksState.askHistoryHidden;
      this.el.next.hidden = this.beforeBooksState.nextHidden;
      this.beforeBooksState = null;
    } else {
      this.state = GAME_STATE.CHAPTER;
    }
  }

  runAction(action) {
    if (!action) return;

    if (action.type === "miniGame") {
      this.showMiniGame(action.id);
      return;
    }

    if (action.type === "video") {
      this.playHistoryVideo(action.after);
      return;
    }

    if (action.type === "chapter") {
      this.startChapter(action.id, action.script || "chapterStart");
      return;
    }

    if (action.type === "dialogue") {
      this.startDialogue(this.scripts[action.id]);
    }
  }

  startChapter(chapterId, scriptId = "chapterStart") {
    const chapter = this.story.chapters[chapterId];
    if (!chapter) {
      console.warn("章節資料尚未載入", chapterId);
      return;
    }

    this.currentChapter = chapter;
    this.scripts = chapter.scripts;
    this.chapterInProgress = chapterId;
    this.startDialogue(this.scripts[scriptId], () => this.finishStoryChapter(chapterId));
  }

  showMiniGame(id, options = {}) {
    const config = this.minigames[id];
    if (!config || !window.KeepsakeMatchGame) {
      console.warn("小遊戲資料尚未載入", id);
      return;
    }

    this.state = GAME_STATE.MINIGAME;
    this.returnHomeAfterMiniGame = options.returnHome === true;
    window.clearInterval(this.typeTimer);
    if (id === "keepsakeMatch") this.el.keepsake.hidden = false;
    this.el.panel.hidden = true;
    this.el.select.hidden = true;
    this.el.reader.hidden = true;
    this.el.historyChoice.hidden = true;
    this.el.select.hidden = true;
    this.el.keepsakeGame.hidden = false;
    this.el.scene.classList.remove("scroll-select-active");
    this.el.scene.classList.add("dialogue-active");
    this.applyDialogueScene("shop");

    this.currentMinigame = new window.KeepsakeMatchGame(this.el.keepsakeGame, config, {
      onFeedback: (result) => {
        if (result === "correct") this.audio.reveal();
        if (result === "wrong") this.audio.tap();
      },
      onClose: () => this.closeMiniGame(),
      onComplete: (nextAction) => {
        if (id === "keepsakeMatch") {
          this.grantRewards({ lanterns: 3, experience: 45 });
          this.keepsakeMatchCompleted = true;
          localStorage.setItem("keepsakeMatchCompleted", "true");
          this.el.keepsake.hidden = false;
        }
        this.audio.enter();
        this.el.keepsakeGame.hidden = true;
        this.returnHomeAfterMiniGame = false;
        if (options.replay) {
          if (options.returnHome) {
            this.showHome();
          } else {
            this.state = GAME_STATE.CHAPTER;
          }
          return;
        }
        this.runAction(nextAction);
      },
    });
    this.currentMinigame.start();
  }

  closeMiniGame() {
    this.el.keepsakeGame.hidden = true;
    if (this.returnHomeAfterMiniGame) {
      this.returnHomeAfterMiniGame = false;
      this.showHome();
      return;
    }
    this.state = GAME_STATE.CHAPTER;
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

  async playHistoryVideo(afterAction = null) {
    this.state = GAME_STATE.VIDEO;
    this.afterVideoAction = afterAction;
    this.el.historyChoice.hidden = true;
    this.el.keepsakeGame.hidden = true;
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
    if (this.afterVideoAction) {
      const nextAction = this.afterVideoAction;
      this.afterVideoAction = null;
      this.runAction(nextAction);
      return;
    }

    this.startChapter("chapter1");
  }

  wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }
}

new OtomeGame().start();
