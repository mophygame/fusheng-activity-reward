class SkyLanternGame {
  constructor(options = {}) {
    this.onClose = options.onClose || (() => {});
    this.onReward = options.onReward || (() => {});
    this.distance = 0;
    this.reward = 0;
    this.rewardClaimed = false;
    this.running = false;
    this.lit = false;
    this.lanternX = 50;
    this.lanternY = 12;
    this.velocityX = 0;
    this.velocityY = 0;
    this.obstacles = [];
    this.lastTime = 0;
    this.spawnTimer = 0;
    this.animationFrame = 0;
    this.invincibleUntil = 0;
    this.keys = new Set();
    this.rewardTiers = Array.from({ length: 64 }, (_, index) => this.createRewardTier(index));
    this.rewardPreviewKey = "";
    this.obstacleKinds = [
      { className: "kite-01", glyph: "", width: 82, height: 62 },
      { className: "kite-02", glyph: "", width: 82, height: 62 },
      { className: "wildgoose", glyph: "", width: 92, height: 62, motion: "horizontal" },
      { className: "banner", glyph: "平安", width: 48, height: 92, pickup: "shield" },
      { className: "cloud-01", glyph: "", width: 136, height: 60, motion: "drift" },
      { className: "cloud-02", glyph: "", width: 136, height: 60, motion: "drift" },
    ];
    this.boundKeyDown = (event) => this.handleKey(event, true);
    this.boundKeyUp = (event) => this.handleKey(event, false);
  }

  mount() {
    this.root = document.createElement("div");
    this.root.className = "skylantern-modal";
    this.root.innerHTML = `
      <section class="skylantern-game" role="dialog" aria-modal="true" aria-labelledby="skylantern-title">
        <button class="skylantern-close" type="button" aria-label="關閉天燈遊戲">×</button>
        <header class="skylantern-hud">
          <span>當前高度</span>
          <strong><b class="skylantern-distance">0</b> 丈</strong>
        </header>
        <div class="skylantern-sky">
          <div class="skylantern-sky-bg" aria-hidden="true"></div>
          <div class="skylantern-moon" aria-hidden="true"></div>
          <div class="skylantern-embers" aria-hidden="true"></div>
          <aside class="skylantern-altimeter" aria-label="目前飛行高度">
            <div class="skylantern-altimeter-track">
              <i class="skylantern-altimeter-fill"></i>
              <b class="skylantern-altimeter-marker" aria-hidden="true">◆</b>
              <span>500</span><span>1000</span><span>1500</span>
              <span>2000</span><span>2500</span><span>3000</span>
            </div>
            <output class="skylantern-altimeter-value">0 丈</output>
          </aside>
          <div class="skylantern-obstacles" aria-hidden="true"></div>
          <div class="skylantern-player" aria-label="祈福天燈"><span>祈</span><i></i></div>
          <output class="skylantern-shield-status" hidden>平安護佑 <b>5.0</b> 秒</output>
          <div class="skylantern-intro">
            <p>寫下心願，燃起此燈</p>
            <button class="skylantern-light" type="button">點燃天燈</button>
            <small>桌面：方向鍵或 WASD　·　移動裝置：四向拖曳</small>
          </div>
          <div class="skylantern-result" hidden>
            <p>天燈飛抵</p>
            <strong><b class="skylantern-final-distance">0</b> 丈</strong>
            <span>獲得燈盞 × <b class="skylantern-final-reward">0</b></span>
            <div><button class="skylantern-retry" type="button">再放一盞</button><button class="skylantern-finish" type="button">收下獎勵</button></div>
          </div>
        </div>
        <footer class="skylantern-rewards" aria-label="高度獎勵預覽"></footer>
      </section>
    `;
    document.body.appendChild(this.root);
    this.sky = this.root.querySelector(".skylantern-sky");
    this.player = this.root.querySelector(".skylantern-player");
    this.obstacleLayer = this.root.querySelector(".skylantern-obstacles");
    this.emberLayer = this.root.querySelector(".skylantern-embers");
    this.distanceEl = this.root.querySelector(".skylantern-distance");
    this.altimeterFill = this.root.querySelector(".skylantern-altimeter-fill");
    this.altimeterMarker = this.root.querySelector(".skylantern-altimeter-marker");
    this.altimeterValue = this.root.querySelector(".skylantern-altimeter-value");
    this.altimeterTicks = [...this.root.querySelectorAll(".skylantern-altimeter-track span")];
    this.shieldStatus = this.root.querySelector(".skylantern-shield-status");
    this.shieldTimeEl = this.shieldStatus.querySelector("b");
    this.intro = this.root.querySelector(".skylantern-intro");
    this.result = this.root.querySelector(".skylantern-result");
    this.renderRewardTiers();
    this.createFireEffects();
    this.renderAltimeter();
    this.bindEvents();
    this.root.querySelector(".skylantern-light").focus({ preventScroll: true });
  }

  bindEvents() {
    this.root.querySelector(".skylantern-close").addEventListener("click", () => this.close());
    this.root.querySelector(".skylantern-light").addEventListener("click", () => this.light());
    this.root.querySelector(".skylantern-retry").addEventListener("click", () => this.reset());
    this.root.querySelector(".skylantern-finish").addEventListener("click", () => this.finish());
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
    this.sky.addEventListener("pointerdown", (event) => this.moveByPointer(event));
    this.sky.addEventListener("pointermove", (event) => {
      if (event.buttons || event.pointerType === "touch") this.moveByPointer(event);
    });
  }

  handleKey(event, pressed) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "A", "d", "D", "w", "W", "s", "S", "Escape"].includes(event.key)) return;
    if (event.key === "Escape") return this.close();
    event.preventDefault();
    if (pressed) this.keys.add(event.key.toLowerCase());
    else this.keys.delete(event.key.toLowerCase());
  }

  moveByPointer(event) {
    if (!this.running) return;
    const bounds = this.sky.getBoundingClientRect();
    this.lanternX = Math.max(9, Math.min(91, ((event.clientX - bounds.left) / bounds.width) * 100));
    this.lanternY = Math.max(5, Math.min(30, 100 - ((event.clientY - bounds.top) / bounds.height) * 100));
    this.renderPlayer();
  }

  light() {
    if (this.lit) return;
    this.lit = true;
    this.player.classList.add("is-lit");
    this.root.querySelector(".skylantern-light").textContent = "火光漸明…";
    window.setTimeout(() => {
      this.intro.hidden = true;
      this.running = true;
      this.lastTime = performance.now();
      this.animationFrame = requestAnimationFrame((time) => this.tick(time));
    }, 850);
  }

  tick(time) {
    if (!this.running) return;
    const delta = Math.min((time - this.lastTime) / 1000, 0.04);
    this.lastTime = time;
    const left = this.keys.has("arrowleft") || this.keys.has("a");
    const right = this.keys.has("arrowright") || this.keys.has("d");
    const up = this.keys.has("arrowup") || this.keys.has("w");
    const down = this.keys.has("arrowdown") || this.keys.has("s");
    this.velocityX += ((right ? 1 : 0) - (left ? 1 : 0)) * 185 * delta;
    this.velocityY += ((up ? 1 : 0) - (down ? 1 : 0)) * 185 * delta;
    this.velocityX *= Math.pow(0.08, delta);
    this.velocityY *= Math.pow(0.08, delta);
    this.velocityX = Math.max(-72, Math.min(72, this.velocityX));
    this.velocityY = Math.max(-72, Math.min(72, this.velocityY));
    this.lanternX = Math.max(9, Math.min(91, this.lanternX + this.velocityX * delta));
    this.lanternY = Math.max(5, Math.min(30, this.lanternY + this.velocityY * delta));
    this.distance += delta * (115 + Math.min(this.distance / 18, 95));
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) this.spawnObstacle();
    this.updateObstacles(delta);
    this.updateShield(time);
    this.renderPlayer();
    this.distanceEl.textContent = Math.floor(this.distance);
    this.renderAltimeter();
    this.renderRewardTiers();
    this.root.style.setProperty("--sky-drift-x", `${Math.cos(this.distance / 260) * 9}px`);
    this.root.style.setProperty("--sky-drift-y", `${Math.sin(this.distance / 180) * 24}px`);
    this.root.style.setProperty("--mountain-shift", `${Math.min(this.distance * 0.14, 110)}%`);
    this.root.style.setProperty("--mountain-opacity", Math.max(0, 1 - this.distance / 720).toFixed(3));
    this.animationFrame = requestAnimationFrame((nextTime) => this.tick(nextTime));
  }

  spawnObstacle() {
    const kind = this.obstacleKinds[Math.floor(Math.random() * this.obstacleKinds.length)];
    const element = document.createElement("div");
    element.className = `skylantern-obstacle is-${kind.className}`;
    element.textContent = kind.glyph;
    const isHorizontal = kind.motion === "horizontal" || kind.motion === "drift";
    const isCloud = kind.motion === "drift";
    const direction = Math.random() < 0.5 ? 1 : -1;
    const obstacle = {
      element,
      motion: kind.motion || "falling",
      x: isHorizontal ? (direction > 0 ? -12 : 112) : 8 + Math.random() * 84,
      y: kind.motion === "horizontal"
        ? 5 + Math.random() * 86
        : isCloud
          ? 17 + Math.random() * 55
          : -16,
      baseY: 0,
      direction,
      age: Math.random() * 2,
      frame: -1,
      pickup: kind.pickup || "",
      width: kind.width,
      height: kind.height,
      speed: isCloud
        ? 3.5 + Math.random() * 3.5
        : isHorizontal
          ? 13 + Math.random() * 10 + Math.min(this.distance / 650, 8)
        : 18 + Math.random() * 13 + Math.min(this.distance / 220, 18),
    };
    obstacle.baseY = obstacle.y;
    element.style.left = `${obstacle.x}%`;
    element.style.top = `${obstacle.y}%`;
    element.style.width = `${kind.width}px`;
    element.style.height = `${kind.height}px`;
    if (kind.motion === "horizontal") {
      element.classList.add("is-wildgoose-01");
      element.style.setProperty("--goose-facing", direction > 0 ? "1" : "-1");
    }
    this.obstacleLayer.appendChild(element);
    this.obstacles.push(obstacle);
    this.spawnTimer = Math.max(0.68, 1.5 - this.distance / 5000) + Math.random() * 0.65;
  }

  updateObstacles(delta) {
    const playerRect = this.player.getBoundingClientRect();
    this.obstacles = this.obstacles.filter((obstacle) => {
      if (obstacle.motion === "horizontal" || obstacle.motion === "drift") {
        obstacle.age += delta;
        obstacle.x += obstacle.direction * obstacle.speed * delta;
        obstacle.y = obstacle.motion === "drift"
          ? obstacle.baseY + Math.sin(obstacle.age * 1.35) * 0.45
          : obstacle.baseY + Math.sin(obstacle.age * 8.5) * 1.05 + Math.sin(obstacle.age * 2.7) * 0.55;
        obstacle.element.style.left = `${obstacle.x}%`;
        obstacle.element.style.top = `${obstacle.y}%`;

        if (obstacle.motion === "horizontal") {
          const nextFrame = Math.floor(obstacle.age * 8) % 3;
          if (nextFrame !== obstacle.frame) {
            obstacle.element.classList.remove("is-wildgoose-01", "is-wildgoose-02", "is-wildgoose-03");
            obstacle.element.classList.add(`is-wildgoose-0${nextFrame + 1}`);
            obstacle.frame = nextFrame;
          }
        }
      } else {
        obstacle.y += obstacle.speed * delta;
        obstacle.element.style.top = `${obstacle.y}%`;
      }

      const isOutside = obstacle.motion === "horizontal" || obstacle.motion === "drift"
        ? obstacle.x < -18 || obstacle.x > 118
        : obstacle.y > 112;
      if (isOutside) {
        obstacle.element.remove();
        return false;
      }
      const rect = obstacle.element.getBoundingClientRect();
      const padding = 9;
      const hit = rect.left + padding < playerRect.right - padding && rect.right - padding > playerRect.left + padding
        && rect.top + padding < playerRect.bottom - padding && rect.bottom - padding > playerRect.top + padding;
      if (hit && obstacle.pickup === "shield") {
        obstacle.element.remove();
        this.activateShield();
        return false;
      }
      if (hit && this.isInvincible()) {
        obstacle.element.classList.add("is-repelled");
        window.setTimeout(() => obstacle.element.remove(), 180);
        return false;
      }
      if (hit) this.gameOver();
      return true;
    });
  }

  activateShield() {
    const now = performance.now();
    this.invincibleUntil = Math.max(this.invincibleUntil, now) + 5000;
    this.player.classList.add("is-shielded");
    this.shieldStatus.hidden = false;
    this.shieldTimeEl.textContent = ((this.invincibleUntil - now) / 1000).toFixed(1);
  }

  updateShield(time = performance.now()) {
    const remaining = Math.max(0, this.invincibleUntil - time);
    if (remaining > 0) {
      this.shieldTimeEl.textContent = (remaining / 1000).toFixed(1);
      return;
    }
    this.deactivateShield();
  }

  deactivateShield() {
    this.invincibleUntil = 0;
    this.player.classList.remove("is-shielded");
    if (this.shieldStatus) this.shieldStatus.hidden = true;
  }

  isInvincible(time = performance.now()) {
    return time < this.invincibleUntil;
  }

  gameOver() {
    if (!this.running) return;
    this.running = false;
    this.deactivateShield();
    cancelAnimationFrame(this.animationFrame);
    this.reward = this.getRewardForDistance();
    this.claimReward();
    this.root.querySelector(".skylantern-final-distance").textContent = Math.floor(this.distance);
    this.root.querySelector(".skylantern-final-reward").textContent = this.reward;
    this.player.classList.add("is-hit");
    this.destroyTimer = window.setTimeout(() => {
      this.player.classList.add("is-destroyed", "is-falling");
    }, 320);
    this.resultTimer = window.setTimeout(() => {
      this.result.hidden = false;
      this.root.querySelector(".skylantern-finish").focus({ preventScroll: true });
    }, 1580);
  }

  reset() {
    this.running = false;
    this.lit = false;
    this.distance = 0;
    this.reward = 0;
    this.rewardClaimed = false;
    this.lanternX = 50;
    this.lanternY = 12;
    this.velocityX = 0;
    this.velocityY = 0;
    this.spawnTimer = 0;
    this.deactivateShield();
    this.keys.clear();
    this.obstacles.forEach(({ element }) => element.remove());
    this.obstacles = [];
    this.distanceEl.textContent = "0";
    this.root.style.setProperty("--sky-drift-x", "0px");
    this.root.style.setProperty("--sky-drift-y", "0px");
    this.root.style.setProperty("--mountain-shift", "0%");
    this.root.style.setProperty("--mountain-opacity", "1");
    this.renderAltimeter();
    this.rewardPreviewKey = "";
    this.renderRewardTiers();
    this.result.hidden = true;
    this.intro.hidden = false;
    window.clearTimeout(this.destroyTimer);
    window.clearTimeout(this.resultTimer);
    this.player.classList.remove("is-lit", "is-hit", "is-destroyed", "is-falling", "is-shielded");
    this.root.querySelector(".skylantern-light").textContent = "點燃天燈";
    this.renderPlayer();
  }

  renderPlayer() {
    this.player.style.left = `${this.lanternX}%`;
    this.player.style.bottom = `${this.lanternY}%`;
  }

  renderAltimeter() {
    const height = Math.floor(this.distance);
    const requiredStep = Math.max(500, (height + 500) / this.altimeterTicks.length);
    const magnitude = 10 ** Math.floor(Math.log10(requiredStep));
    const normalized = requiredStep / magnitude;
    const niceFactor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    const step = Math.max(500, niceFactor * magnitude);
    const scaleMax = step * this.altimeterTicks.length;
    const progress = Math.min(height / scaleMax, 1) * 100;

    this.altimeterTicks.forEach((tick, index) => {
      tick.textContent = String(step * (index + 1));
      tick.style.setProperty("--height-level", `${((index + 1) / this.altimeterTicks.length) * 100}%`);
    });
    this.altimeterFill.style.height = `${progress}%`;
    this.altimeterMarker.style.bottom = `${progress}%`;
    this.altimeterValue.style.bottom = `${Math.max(0, Math.min(94, progress))}%`;
    this.altimeterValue.textContent = `${height} 丈`;
  }

  createRewardTier(index) {
    const rawDistance = 500 * (1.62 ** index);
    const roundingUnit = 10 ** Math.max(1, Math.floor(Math.log10(rawDistance)) - 1);
    return {
      index,
      distance: Math.round(rawDistance / roundingUnit) * roundingUnit,
      reward: Math.ceil(1.5 ** index),
    };
  }

  getRewardForDistance(distance = this.distance) {
    return [...this.rewardTiers].reverse().find((tier) => distance >= tier.distance)?.reward || 0;
  }

  renderRewardTiers() {
    let reachedIndex = -1;
    for (let index = 0; index < this.rewardTiers.length; index += 1) {
      if (this.distance < this.rewardTiers[index].distance) break;
      reachedIndex = index;
    }

    const startIndex = Math.max(0, reachedIndex);
    const previewKey = `${startIndex}:${reachedIndex}`;
    if (previewKey === this.rewardPreviewKey) return;
    this.rewardPreviewKey = previewKey;

    const visibleTiers = this.rewardTiers.slice(startIndex, startIndex + 6);
    this.root.querySelector(".skylantern-rewards").innerHTML = visibleTiers.map((tier) => {
      const stateClass = tier.index <= reachedIndex
        ? "is-reached"
        : tier.index === reachedIndex + 1
          ? "is-next"
          : "";
      return `<span class="${stateClass}"><b>${tier.distance.toLocaleString("zh-TW")}</b><i>燈</i><small>×${tier.reward.toLocaleString("zh-TW")}</small></span>`;
    }).join("");
  }

  createFireEffects() {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 28; index += 1) {
      const ember = document.createElement("i");
      ember.className = `is-fire-${(index % 3) + 1}`;
      ember.style.setProperty("--ember-left", `${Math.random() * 100}%`);
      ember.style.setProperty("--ember-delay", `${Math.random() * -9}s`);
      ember.style.setProperty("--ember-duration", `${5 + Math.random() * 5}s`);
      ember.style.setProperty("--ember-drift", `${-45 + Math.random() * 90}px`);
      ember.style.setProperty("--ember-size", `${7 + Math.random() * 12}px`);
      fragment.appendChild(ember);
    }
    this.emberLayer.appendChild(fragment);
  }

  claimReward() {
    if (this.rewardClaimed || this.reward <= 0) return;
    this.rewardClaimed = true;
    this.onReward(this.reward, Math.floor(this.distance));
  }

  settleCurrentReward() {
    if (this.rewardClaimed) return;
    this.reward = Math.max(this.reward, this.getRewardForDistance());
    this.claimReward();
  }

  finish() {
    this.claimReward();
    this.close();
  }

  close() {
    this.settleCurrentReward();
    this.running = false;
    this.deactivateShield();
    cancelAnimationFrame(this.animationFrame);
    window.clearTimeout(this.destroyTimer);
    window.clearTimeout(this.resultTimer);
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    this.root?.remove();
    this.onClose();
  }
}

window.SkyLanternGame = SkyLanternGame;
