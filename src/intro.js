(() => {
  const intro = document.querySelector("#dream-intro");
  const skip = document.querySelector("#skip-dream-intro");
  const butterfly = intro?.querySelector(".dream-butterfly img");
  if (!intro) return;

  const butterflyFrames = Array.from(
    { length: 12 },
    (_, index) => `./assets/images/enter/butterfly_${String(index + 1).padStart(2, "0")}.webp`,
  );
  const preloadFrame = (src) => new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
    if (image.complete) resolve();
  });
  const preloadFrames = async () => {
    const queue = butterflyFrames.slice(1);
    const worker = async () => {
      while (queue.length) await preloadFrame(queue.shift());
    };
    await Promise.all(Array.from({ length: Math.min(3, queue.length) }, worker));
  };

  let butterflyAnimation = 0;
  let lastButterflyFrame = -1;
  let butterflyStartedAt = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animateButterfly = (time) => {
    if (!butterflyStartedAt) butterflyStartedAt = time;
    const frame = Math.floor((time - butterflyStartedAt) / 78) % butterflyFrames.length;
    if (butterfly && frame !== lastButterflyFrame) {
      butterfly.src = butterflyFrames[frame];
      lastButterflyFrame = frame;
    }
    butterflyAnimation = window.requestAnimationFrame(animateButterfly);
  };
  if (!reducedMotion) {
    preloadFrames().then(() => {
      if (!finished) butterflyAnimation = window.requestAnimationFrame(animateButterfly);
    });
  }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.cancelAnimationFrame(butterflyAnimation);
    intro.classList.add("is-leaving");
    document.body.classList.remove("intro-active");
    window.setTimeout(() => intro.remove(), 900);
  };

  skip?.addEventListener("click", finish);
  intro.addEventListener("animationend", (event) => {
    if (event.animationName === "dream-wash") finish();
  });
  window.setTimeout(finish, 7200);
})();
