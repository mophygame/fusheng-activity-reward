class TouhuGame {
  constructor(options = {}) {
    this.onClose = options.onClose || (() => {});
    this.onFinish = options.onFinish || this.onClose;
    this.onReward = options.onReward || (() => {});
    const bottleTypes = [
      { name: "廣口陶壺", mouth: 7.2, type: 1 },
      { name: "青銅方壺", mouth: 5.8, type: 2 },
      { name: "長頸梅瓶", mouth: 4.7, type: 3 },
      { name: "雙耳細口壺", mouth: 3.9, type: 4 },
      { name: "玄紋窄口壺", mouth: 3.2, type: 5 },
      { name: "御前投壺", mouth: 2.6, type: 6 },
      { name: "鎏金盤口壺", mouth: 4.4, type: 7 },
      { name: "雲雷雙耳壺", mouth: 3.6, type: 8 },
      { name: "九轉細頸壺", mouth: 2.9, type: 9 },
    ];
    this.bottleTypes = bottleTypes;
    // 五位男主每人 10 句，共 50 句乙女風投壺台詞。
    this.hosts = [
      {
        id: "huang-yize", name: "黃奕澤", ancientName: "魏諍", image: "./assets/images/taskgame/touhu/ch_黃奕澤.webp",
        invite: [
          "難得今日清閒，陪我投一局可好？輸了也無妨，我不會笑妳。",
          "妳再辭，我可要以主人之禮再請一回了。不過……我倒很想看妳投中時的樣子。",
          "箭壺皆備，這是第三請。給我一個陪妳過招的機會，嗯？",
          "風會變，我的心意可不會。妳只管瞄準，剩下的交給我。",
        ],
        roundWin: ["這局是我贏了。別皺眉，下一局我可以再靠近些教妳。", "輸我一局而已，怎麼像受了委屈？來，這杯我陪妳飲。"],
        roundLose: ["好箭。看來我得認真些，免得妳以後笑我這主人徒有虛名。", "妳贏了。罰酒我認，不過要妳親手奉來。"],
        finalWin: ["承讓了。慶功酒留在後頭，先答應我，下次還要來。"],
        finalLose: ["是妳贏了。今日的勝者想要什麼賞？若是我能給的，都算數。"],
      },
      {
        id: "chu-yanshi", name: "褚晏時", ancientName: "上官映雪", image: "./assets/images/taskgame/touhu/ch_褚晏時.webp",
        invite: [
          "來投壺吧。妳投箭的姿勢，說不定會是我今日最想畫下的一幕。",
          "第二次還要拒絕我？真講究古禮。好吧，那我便再請得真心一點。",
          "三請已到。妳若還不答應，我可要懷疑妳是怕贏了我。",
          "這院裡的光很好，風也好。只差妳站到壺前，這幅畫才算完整。",
        ],
        roundWin: ["箭的落點不錯，可惜這一局的構圖，還是我略勝一籌。", "別瞪我，是風先動的手。當然，我也不打算把勝局還回去。"],
        roundLose: ["妳剛才那一箭很漂亮。完了，我大概會記得比勝負還久。", "我輸了，但這個角度看妳笑，似乎也不算處在下風。"],
        finalWin: ["畫的結尾是我贏，但我更喜歡妳不服輸的那一筆。"],
        finalLose: ["勝負已定，我卻不想收筆。再陪我一會兒，當作勝者的要求？"],
      },
      {
        id: "bai-ji", name: "白霽", ancientName: "魏猙", image: "./assets/images/taskgame/touhu/ch_白霽.webp",
        invite: [
          "姑娘可願賞臉投壺？先說好，我的目光很挑，但對妳可以例外。",
          "辭得如此好聽，害我都想再多請幾次。不過古禮只許三請，可惜了。",
          "最後一請。箭我替妳挑好了，風也替妳看過了，還要我怎樣哄妳？",
          "別緊張，壺口雖小，妳在我眼裡可從來不會失手。",
        ],
        roundWin: ["哎呀，我贏了。妳這副不甘心的樣子，倒比罰酒更令人心醉。", "這一局我略高幾分。要我教妳嗎？再靠近一點，我才好握著妳的手調整。"],
        roundLose: ["好一個有初。妳是想贏罰酒，還是故意贏我的目光？", "這局妳勝。酒我會喝，至於奉酒的人……可不可以別這麼快收回手？"],
        finalWin: ["三局禮成。妳雖輸了箭，卻已經害我一整場都移不開眼。"],
        finalLose: ["妳贏得很漂亮。來，勝者靠近些，我親自替妳斟慶功酒。"],
      },
      {
        id: "qi-lie", name: "祁烈", ancientName: "霍驍", image: "./assets/images/taskgame/touhu/ch_祁烈.webp",
        invite: [
          "投壺，來不來？……啊，還得讓妳辭兩次。這古禮比練功還麻煩。",
          "第二請。妳就當給我個面子，不然我這雙手都不知道該往哪擺了。",
          "第三次了。這次不許辭。妳站在我身邊，風再大也用不著怕。",
          "我不會說好聽話。反正妳若肯來，我就會很高興。這樣夠不夠？",
        ],
        roundWin: ["我贏了。妳要是不服，就再來。反正今日我有的是時間陪妳。", "別光看我，看風向。……算了，想看就看，我又沒說不許。"],
        roundLose: ["妳投中了！咳，我是說……還不錯。別笑，我只是替妳高興。", "輸就輸了，我飲酒。不過妳手裡那杯，得親自送過來。"],
        finalWin: ["我贏了比賽，但妳別真生氣。慶功酒給妳，我喝水就行。"],
        finalLose: ["妳是勝者。誰敢不服，先來跟我比。至於妳……只要笑就好。"],
      },
      {
        id: "ma-weiji", name: "馬唯冀", ancientName: "疾風", image: "./assets/images/taskgame/touhu/ch_馬唯冀.webp",
        invite: [
          "投壺跟騎馬一樣，別光顧著看目標，還得相信自己。怎樣，敢不敢跟我玩？",
          "還辭？我知道，古人說要三請。可妳再這麼笑，我要請到第三十次了。",
          "好，第三請！騎馬我讓妳半圈，投壺可不讓。除非……妳再求我一下？",
          "風大才有意思。妳只管投，箭飛偏了算風的，投中了就算妳厲害。",
        ],
        roundWin: ["這局我贏！放心，我不會嘲笑妳……除非妳剛剛那箭真的歪得太可愛。", "看見沒，穩住手腕就是這樣。要不要我從後面教？咦，妳臉紅什麼？"],
        roundLose: ["妳贏了？行，我認。但妳剛才投箭前是不是偷看我了？", "罰酒拿來！先說好，我這是輸得起，不是想跟妳多喝一杯。"],
        finalWin: ["二勝到手！不過我今日最得意的，是成功讓妳陪我玩了這麼久。"],
        finalLose: ["好吧，勝者是妳。下次換騎馬，我保證讓妳贏……或者讓妳一直待在我懷裡。"],
      },
    ];
    this.host = this.pick(this.hosts);
    this.maxThrows = 4;
    this.rounds = Array.from({ length: this.maxThrows }, (_, index) => bottleTypes[index]);
    this.round = 0;
    this.score = 0;
    this.matchRound = 1;
    this.guestWins = 0;
    this.hostWins = 0;
    this.roundOutcomes = [];
    this.totalHits = 0;
    this.pointValues = [10, 5, 5, 20];
    this.inviteStep = 0;
    this.lastInviteLine = "";
    this.aimX = 50;
    this.flying = false;
    this.animationFrame = 0;
    this.nextTimer = 0;
    this.flightAngle = 0;
    this.reward = 0;
    this.rewardClaimed = false;
    this.boundEscape = (event) => { if (event.key === "Escape") this.close(); };
  }

  mount() {
    this.root = document.createElement("div");
    this.root.className = "touhu-modal";
    this.root.innerHTML = `
      <section class="touhu-game" role="dialog" aria-modal="true" aria-labelledby="touhu-title">
        <button class="touhu-close" type="button" aria-label="關閉投壺遊戲">×</button>
        <header class="touhu-header"><p>古代雅戲</p><h2 id="touhu-title">投 壺</h2></header>
        <div class="touhu-status"><span>第 <b class="touhu-match-round">1</b> / 3 局　·　第 <b class="touhu-round">1</b> / 4 箭</span><span>主人 <b class="touhu-host-wins">0</b>　賓客 <b class="touhu-guest-wins">0</b></span><span>得分 <b class="touhu-score">0</b></span></div>
        <div class="touhu-field">
          <div class="touhu-wind"><span>風向</span><b class="touhu-wind-value">無風</b><i class="touhu-wind-arrow" aria-hidden="true"></i></div>
          <div class="touhu-wind-particles" aria-hidden="true"></div>
          <div class="touhu-bottle-stage"><p class="touhu-bottle-name"></p><div class="touhu-bottle"><i></i><span class="touhu-landed-arrow" aria-hidden="true"></span><span class="touhu-shot-effect" aria-hidden="true"></span></div></div>
          <div class="touhu-positions" aria-hidden="true"><span>主人 · 左</span><b>司射</b><span>賓客 · 右</span></div>
          <div class="touhu-guide" aria-hidden="true"></div>
          <button class="touhu-arrow" type="button" aria-label="投出箭矢"><i></i></button>
          <div class="touhu-arrow-stock" aria-label="剩餘箭矢"></div>
          <p class="touhu-rule-note">距壺二箭半 · 尊者置箭於地，投一拾一；卑者抱箭於身</p>
          <p class="touhu-hint">移動滑鼠或手勢瞄準，點擊箭矢投出</p>
          <strong class="touhu-feedback" aria-live="polite"></strong>
          <div class="touhu-ritual"><figure class="touhu-host-figure"><img class="touhu-host-image" alt=""><figcaption><b class="touhu-host-name"></b><span class="touhu-host-ancient-name"></span></figcaption></figure><div class="touhu-dialogue-panel"><p class="touhu-ritual-role">主人第一請</p><h3 class="touhu-ritual-text"></h3><button class="touhu-invite-action" type="button">禮辭不敢</button><small>古禮：主人三請，賓客先辭讓兩次</small></div></div>
          <div class="touhu-round-result" hidden><figure class="touhu-host-figure"><img class="touhu-host-image" alt=""><figcaption><b class="touhu-host-name"></b><span class="touhu-host-ancient-name"></span></figcaption></figure><div class="touhu-dialogue-panel"><p>司射核算此局</p><h3>主人 <b class="touhu-host-score">0</b>　·　賓客 <b class="touhu-guest-score">0</b></h3><blockquote class="touhu-host-line"></blockquote><span class="touhu-wine-order"></span><button class="touhu-next-round" type="button">受禮續局</button></div></div>
          <div class="touhu-result" hidden><figure class="touhu-host-figure"><img class="touhu-host-image" alt=""><figcaption><b class="touhu-host-name"></b><span class="touhu-host-ancient-name"></span></figcaption></figure><div class="touhu-dialogue-panel"><p>司正宣告</p><h3 class="touhu-final-title">三局禮成</h3><blockquote class="touhu-host-line"></blockquote><span class="touhu-final-record"></span><em>獲得燈盞 × <b>0</b></em><div><button class="touhu-retry" type="button">再行一禮</button><button class="touhu-finish" type="button">飲慶功酒</button></div></div></div>
        </div>
      </section>`;
    document.body.appendChild(this.root);
    this.field = this.root.querySelector(".touhu-field");
    this.arrow = this.root.querySelector(".touhu-arrow");
    this.bottle = this.root.querySelector(".touhu-bottle");
    this.guide = this.root.querySelector(".touhu-guide");
    this.feedback = this.root.querySelector(".touhu-feedback");
    this.result = this.root.querySelector(".touhu-result");
    this.ritual = this.root.querySelector(".touhu-ritual");
    this.roundResult = this.root.querySelector(".touhu-round-result");
    this.windParticles = this.root.querySelector(".touhu-wind-particles");
    this.shotEffect = this.root.querySelector(".touhu-shot-effect");
    this.landedArrow = this.root.querySelector(".touhu-landed-arrow");
    this.stock = this.root.querySelector(".touhu-arrow-stock");
    this.stock.innerHTML = Array.from({ length: this.maxThrows }, (_, index) => `<i data-arrow-index="${index}"></i>`).join("");
    this.bindEvents();
    this.renderHost();
    this.setInvitationLine();
    this.prepareRound();
    this.arrow.disabled = true;
    this.root.querySelector(".touhu-invite-action").focus({ preventScroll: true });
  }

  bindEvents() {
    this.root.querySelector(".touhu-close").addEventListener("click", () => this.close());
    this.root.querySelector(".touhu-retry").addEventListener("click", () => this.reset());
    this.root.querySelector(".touhu-finish").addEventListener("click", () => this.finish());
    this.root.querySelector(".touhu-invite-action").addEventListener("click", () => this.advanceInvitation());
    this.root.querySelector(".touhu-next-round").addEventListener("click", () => this.advanceRound());
    this.arrow.addEventListener("click", () => this.shoot());
    this.field.addEventListener("pointermove", (event) => this.aim(event));
    this.field.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".touhu-arrow, button")) this.aim(event);
    });
    window.addEventListener("keydown", this.boundEscape);
  }

  pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  renderHost() {
    this.root.querySelectorAll(".touhu-host-image").forEach((image) => {
      image.src = this.host.image;
      image.alt = `主人 ${this.host.name}`;
    });
    this.root.querySelectorAll(".touhu-host-name").forEach((name) => { name.textContent = this.host.name; });
    this.root.querySelectorAll(".touhu-host-ancient-name").forEach((name) => { name.textContent = `前世 · ${this.host.ancientName}`; });
  }

  setInvitationLine() {
    const lineIndex = Math.min(this.inviteStep, 2);
    const candidates = [this.host.invite[lineIndex], this.host.invite[3]].filter((line) => line !== this.lastInviteLine);
    const line = this.pick(candidates);
    this.lastInviteLine = line;
    this.root.querySelector(".touhu-ritual-text").textContent = line;
    this.root.querySelector(".touhu-ritual-role").textContent = `主人第${["一", "二", "三"][lineIndex]}請`;
  }

  renderWindEffects() {
    const strength = Math.abs(this.wind);
    const directionClass = this.wind < 0 ? "is-west" : "is-east";
    const leafCount = this.wind === 0 ? 2 : Math.min(9, 3 + Math.ceil(strength));
    const leaves = Array.from({ length: leafCount }, (_, index) => {
      const leafNumber = (index % 5) + 1;
      const top = 12 + Math.random() * 68;
      const duration = Math.max(4.2, 10.5 - strength * 1.15 + Math.random() * 2.5);
      const delay = -(Math.random() * duration);
      const scale = (.55 + Math.random() * .8).toFixed(2);
      const spin = Math.round(180 + Math.random() * 560);
      return `<span class="touhu-wind-leaf" style="--leaf-image:url('../../assets/images/taskgame/touhu/wind_leaf0${leafNumber}.webp');--leaf-top:${top.toFixed(1)}%;--leaf-duration:${duration.toFixed(2)}s;--leaf-delay:${delay.toFixed(2)}s;--leaf-scale:${scale};--leaf-spin:${spin}deg"></span>`;
    }).join("");
    const dustCount = strength < 1.6 ? 0 : Math.min(3, Math.ceil(strength / 1.6));
    const dust = Array.from({ length: dustCount }, (_, index) => {
      const top = 58 + index * 10 + Math.random() * 5;
      const duration = Math.max(3.8, 8.5 - strength + Math.random());
      const delay = -(Math.random() * duration);
      return `<i class="touhu-wind-dust" style="--dust-top:${top.toFixed(1)}%;--dust-duration:${duration.toFixed(2)}s;--dust-delay:${delay.toFixed(2)}s"></i>`;
    }).join("");
    this.windParticles.className = `touhu-wind-particles ${directionClass}${this.wind === 0 ? " is-calm" : ""}`;
    this.windParticles.innerHTML = leaves + dust;
  }

  playShotEffect(type) {
    this.shotEffect.classList.remove("is-hit-effect", "is-miss-effect");
    void this.shotEffect.offsetWidth;
    this.shotEffect.classList.add(type === "hit" ? "is-hit-effect" : "is-miss-effect");
  }

  aim(event) {
    if (this.flying || this.arrow.disabled || !this.result.hidden || !this.roundResult.hidden || !this.ritual.hidden) return;
    const bounds = this.field.getBoundingClientRect();
    this.aimX = Math.max(8, Math.min(92, ((event.clientX - bounds.left) / bounds.width) * 100));
    this.renderAim();
  }

  prepareRound() {
    const config = this.bottleTypes[((this.matchRound - 1) * this.maxThrows + this.round) % this.bottleTypes.length];
    this.wind = (Math.random() * 8 - 4);
    if (Math.abs(this.wind) < 0.65) this.wind = 0;
    this.bottleX = 30 + Math.random() * 40;
    this.aimX = 50;
    this.flying = false;
    this.feedback.textContent = "";
    this.feedback.className = "touhu-feedback";
    this.shotEffect.classList.remove("is-hit-effect", "is-miss-effect");
    this.landedArrow.classList.remove("is-visible");
    this.arrow.classList.remove("is-embedded");
    this.arrow.classList.remove("is-grounded");
    this.root.querySelector(".touhu-round").textContent = this.round + 1;
    this.root.querySelector(".touhu-match-round").textContent = this.matchRound;
    this.root.querySelector(".touhu-host-wins").textContent = this.hostWins;
    this.root.querySelector(".touhu-guest-wins").textContent = this.guestWins;
    this.root.querySelector(".touhu-score").textContent = this.score;
    this.renderArrowStock();
    this.root.querySelector(".touhu-bottle-name").textContent = config.name;
    this.bottle.className = `touhu-bottle is-bottle-${config.type}`;
    this.bottle.style.left = `${this.bottleX}%`;
    this.bottle.style.setProperty("--mouth-width", `${config.mouth * 4.5}px`);
    const windValue = this.root.querySelector(".touhu-wind-value");
    windValue.textContent = this.wind === 0 ? "無風" : `${this.wind > 0 ? "東風" : "西風"} ${Math.abs(this.wind).toFixed(1)}`;
    const windArrow = this.root.querySelector(".touhu-wind-arrow");
    windArrow.style.opacity = this.wind === 0 ? ".25" : "1";
    windArrow.style.transform = `scaleX(${this.wind >= 0 ? 1 : -1})`;
    this.renderWindEffects();
    this.renderAim();
  }

  renderAim() {
    this.arrow.style.left = `${this.aimX}%`;
    this.arrow.style.top = "82%";
    this.arrow.style.transform = "translate(-50%,-50%)";
    this.guide.style.left = `${this.aimX}%`;
  }

  shoot() {
    if (this.flying || this.arrow.disabled || !this.result.hidden || !this.roundResult.hidden || !this.ritual.hidden) return;
    this.flying = true;
    this.renderArrowStock(this.round);
    this.arrow.disabled = true;
    const start = performance.now();
    const startX = this.aimX;
    const endX = startX + this.wind * 2.25;
    const fieldBounds = this.field.getBoundingClientRect();
    const bottleBounds = this.bottle.getBoundingClientRect();
    const startY = 82;
    const bottleInsertionY = bottleBounds.top + bottleBounds.height * .03;
    const endY = Math.max(15, Math.min(36, ((bottleInsertionY - fieldBounds.top) / fieldBounds.height) * 100));
    const controlX = startX + (endX - startX) * .38;
    const controlY = 3;
    const duration = 1050;
    const durationSeconds = duration / 1000;
    // 保留拋物線末端速度，讓完全落空時能無縫接續自由落體。
    this.flightVelocityX = 2 * (endX - controlX) / durationSeconds;
    this.flightVelocityY = 2 * (endY - controlY) / durationSeconds;
    const animate = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const inverse = 1 - progress;
      const x = inverse * inverse * startX + 2 * inverse * progress * controlX + progress * progress * endX;
      const y = inverse * inverse * startY + 2 * inverse * progress * controlY + progress * progress * endY;
      const tangentX = 2 * inverse * (controlX - startX) + 2 * progress * (endX - controlX);
      const tangentY = 2 * inverse * (controlY - startY) + 2 * progress * (endY - controlY);
      const angle = Math.atan2(tangentX, -tangentY) * 180 / Math.PI;
      this.flightAngle = angle;
      this.arrow.style.left = `${x}%`;
      this.arrow.style.top = `${y}%`;
      this.arrow.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
      if (progress < 1) return this.animationFrame = requestAnimationFrame(animate);
      this.resolveShot(endX);
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  resolveShot(finalX) {
    const config = this.bottleTypes[((this.matchRound - 1) * this.maxThrows + this.round) % this.bottleTypes.length];
    const offset = Math.abs(finalX - this.bottleX);
    const hit = offset <= config.mouth;
    const fieldWidth = Math.max(1, this.field.getBoundingClientRect().width);
    const arrowWidth = this.arrow.getBoundingClientRect().width;
    const usesTouchGrazeRange = window.matchMedia("(max-width: 1024px), (pointer: coarse)").matches;
    // 觸控裝置的瞄準精度較低，擦壺容許範圍較桌面版寬；得分用的壺口範圍維持不變。
    const grazePixels = usesTouchGrazeRange
      ? Math.min(30, arrowWidth * .85)
      : Math.min(20, arrowWidth * .55);
    const grazeMargin = grazePixels / fieldWidth * 100;
    let outcome = "miss";
    let points = 0;
    if (hit && Math.abs(this.wind) > 3.25 && offset > config.mouth * 0.68) {
      outcome = "reverse";
      this.playShotEffect("miss");
      this.feedback.textContent = "倒中 · 不計分";
      this.feedback.className = "touhu-feedback is-miss";
    } else if (hit) {
      outcome = "hit";
      points = this.pointValues[this.round];
      this.score += points;
      this.totalHits += 1;
      this.playShotEffect("hit");
      this.arrow.classList.add("is-embedded");
      this.landedArrow.classList.add("is-visible");
      this.bottle.classList.add("has-landed-arrow");
      this.bottle.classList.add("is-hit");
      this.feedback.textContent = this.round === 0 ? `有初 · ${points} 分` : this.round === 3 ? `有終 · ${points} 分` : `中壺 · ${points} 分`;
      this.feedback.className = "touhu-feedback is-success";
    } else if (offset <= config.mouth + grazeMargin) {
      outcome = "lean";
      this.playShotEffect("miss");
      this.feedback.textContent = "倚竿 · 不計分";
      this.feedback.className = "touhu-feedback is-miss";
    } else {
      // 完全沒有碰到壺時不播放擦撞光效或未中文字，箭矢直接依重力落地。
      this.feedback.textContent = "未觸壺身，箭矢落地";
      this.feedback.className = "touhu-feedback";
    }
    this.roundOutcomes.push(outcome);
    this.root.querySelector(".touhu-score").textContent = this.score;
    const proceed = () => {
      this.arrow.disabled = false;
      this.round += 1;
      if (this.round >= this.maxThrows) this.finishAncientRound();
      else this.prepareRound();
    };
    if (outcome === "hit") {
      this.nextTimer = window.setTimeout(proceed, 1350);
    } else {
      this.animateMissedArrow(finalX, outcome, () => {
        this.nextTimer = window.setTimeout(proceed, 450);
      });
    }
  }

  animateMissedArrow(finalX, outcome, onSettled) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ricochet = outcome === "lean" || outcome === "reverse";
    const groundY = 76;
    let x = finalX;
    let y = Number.parseFloat(this.arrow.style.top) || 28;
    const away = finalX >= this.bottleX ? 1 : -1;
    let velocityX = ricochet
      ? away * (13 + Math.abs(this.wind) * 1.8) + this.wind * .8
      : (Number.isFinite(this.flightVelocityX) ? this.flightVelocityX : this.wind * 1.35);
    let velocityY = ricochet
      ? -34
      : Math.max(12, Number.isFinite(this.flightVelocityY) ? this.flightVelocityY : 24);
    const gravity = 78;
    let angle = Number.isFinite(this.flightAngle) ? this.flightAngle : 180;
    let angularVelocity = ricochet ? away * 520 : 0;
    let bounces = 0;
    let previousTime = 0;
    const maxBounces = ricochet ? 2 : 0;

    if (reducedMotion) {
      this.arrow.style.top = `${groundY}%`;
      this.arrow.style.transform = `translate(-50%,-50%) rotate(${away * 88}deg)`;
      this.arrow.classList.add("is-grounded");
      this.nextTimer = window.setTimeout(onSettled, 320);
      return;
    }

    const fall = (time) => {
      if (!previousTime) previousTime = time;
      const delta = Math.min((time - previousTime) / 1000, .034);
      previousTime = time;
      velocityY += gravity * delta;
      x += velocityX * delta;
      y += velocityY * delta;
      if (ricochet) angle += angularVelocity * delta;
      else angle = Math.atan2(velocityX, -velocityY) * 180 / Math.PI;

      if (x < 4 || x > 96) {
        x = Math.max(4, Math.min(96, x));
        if (ricochet) {
          velocityX *= -.55;
          angularVelocity *= -.72;
        } else {
          velocityX = 0;
        }
      }

      if (y >= groundY) {
        y = groundY;
        if (bounces < maxBounces && Math.abs(velocityY) > 12) {
          velocityY *= -.34;
          velocityX *= .7;
          angularVelocity *= .62;
          bounces += 1;
        } else {
          if (!ricochet) angle = away * 88;
          this.arrow.style.left = `${x}%`;
          this.arrow.style.top = `${groundY}%`;
          this.arrow.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
          this.arrow.classList.add("is-grounded");
          onSettled();
          return;
        }
      }

      this.arrow.style.left = `${x}%`;
      this.arrow.style.top = `${y}%`;
      this.arrow.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
      this.animationFrame = requestAnimationFrame(fall);
    };
    this.animationFrame = requestAnimationFrame(fall);
  }

  finishAncientRound() {
    this.arrow.disabled = true;
    if (this.roundOutcomes[0] !== "hit" && this.roundOutcomes.slice(1).every((item) => item === "hit")) {
      this.score += 1;
      this.feedback.textContent = "散箭 · 加一分";
    }
    const hostOutcomes = this.pointValues.map(() => Math.random() < 0.52);
    let hostScore = hostOutcomes.reduce((total, hit, index) => total + (hit ? this.pointValues[index] : 0), 0);
    if (!hostOutcomes[0] && hostOutcomes.slice(1).every(Boolean)) hostScore += 1;
    let guestWon;
    if (this.score > hostScore) guestWon = true;
    else if (hostScore > this.score) guestWon = false;
    else guestWon = Math.random() < .5;
    if (guestWon) this.guestWins += 1;
    else this.hostWins += 1;
    this.root.querySelector(".touhu-host-score").textContent = hostScore;
    this.root.querySelector(".touhu-guest-score").textContent = this.score;
    this.root.querySelector(".touhu-wine-order").textContent = guestWon
      ? "酌者斟酒，賓客奉酒於主人；主人當跪受罰。"
      : "酌者斟酒，主人奉酒於賓客；賓客當跪受罰。";
    this.roundResult.querySelector(".touhu-host-line").textContent = this.pick(guestWon ? this.host.roundLose : this.host.roundWin);
    this.roundResult.hidden = false;
    this.root.querySelector(".touhu-next-round").focus({ preventScroll: true });
  }

  advanceRound() {
    this.roundResult.hidden = true;
    if (this.guestWins >= 2 || this.hostWins >= 2 || this.matchRound >= 3) return this.showResult();
    this.matchRound += 1;
    this.round = 0;
    this.score = 0;
    this.roundOutcomes = [];
    this.arrow.disabled = false;
    this.prepareRound();
    this.arrow.focus({ preventScroll: true });
  }

  showResult() {
    const guestWon = this.guestWins > this.hostWins;
    this.reward = guestWon ? (this.guestWins === 2 && this.hostWins === 0 ? 8 : 5) : 1;
    this.claimReward();
    this.root.querySelector(".touhu-final-title").textContent = guestWon ? "賓客勝 · 全席共飲慶功酒" : "主人勝 · 全席共飲慶功酒";
    this.root.querySelector(".touhu-final-record").textContent = `主人 ${this.hostWins} 局　·　賓客 ${this.guestWins} 局`;
    this.result.querySelector(".touhu-host-line").textContent = this.pick(guestWon ? this.host.finalLose : this.host.finalWin);
    this.result.querySelector("em b").textContent = this.reward;
    this.result.hidden = false;
    this.root.querySelector(".touhu-finish").focus({ preventScroll: true });
  }

  reset() {
    this.round = 0;
    this.score = 0;
    this.matchRound = 1;
    this.guestWins = 0;
    this.hostWins = 0;
    this.roundOutcomes = [];
    this.totalHits = 0;
    this.inviteStep = 0;
    this.lastInviteLine = "";
    this.host = this.pick(this.hosts);
    this.reward = 0;
    this.rewardClaimed = false;
    this.result.hidden = true;
    this.roundResult.hidden = true;
    this.ritual.hidden = false;
    this.root.querySelector(".touhu-invite-action").textContent = "禮辭不敢";
    this.renderHost();
    this.setInvitationLine();
    this.arrow.disabled = true;
    this.prepareRound();
  }

  advanceInvitation() {
    this.inviteStep += 1;
    const action = this.root.querySelector(".touhu-invite-action");
    if (this.inviteStep === 1) {
      action.textContent = "再辭不敏";
    } else if (this.inviteStep === 2) {
      action.textContent = "恭敬從命";
    } else {
      this.ritual.hidden = true;
      this.arrow.disabled = false;
      this.arrow.focus({ preventScroll: true });
    }
    if (this.inviteStep < 3) this.setInvitationLine();
  }

  renderArrowStock(consumedIndex = -1) {
    [...this.stock.children].forEach((arrow, index) => {
      arrow.classList.toggle("is-used", index < this.round || index === consumedIndex);
    });
    const remaining = Math.max(0, this.maxThrows - this.round - (consumedIndex === this.round ? 1 : 0));
    this.stock.setAttribute("aria-label", `剩餘箭矢 ${remaining} 支`);
  }

  claimReward() {
    if (this.rewardClaimed || this.reward <= 0) return;
    this.rewardClaimed = true;
    this.onReward(this.reward, this.score);
  }

  settleCurrentReward() {
    if (this.rewardClaimed) return;
    const progressReward = this.totalHits > 0 || this.guestWins > 0
      ? Math.min(5, this.totalHits + this.guestWins)
      : 0;
    this.reward = Math.max(this.reward, progressReward);
    this.claimReward();
  }

  finish() {
    this.claimReward();
    this.close(this.onFinish);
  }

  close(onClosed = this.onClose) {
    this.settleCurrentReward();
    cancelAnimationFrame(this.animationFrame);
    window.clearTimeout(this.nextTimer);
    window.removeEventListener("keydown", this.boundEscape);
    this.root?.remove();
    onClosed();
  }
}

window.TouhuGame = TouhuGame;
