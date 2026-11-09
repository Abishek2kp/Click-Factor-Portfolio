const RATIO = { wide: 16 / 9, tall: 9 / 16 };
const MIN_ROW_RATIO = 2.2;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
const useCursor = canHover && !reducedMotion;
const allVideos = SECTIONS.flatMap((s) => s.videos);

/* Group videos into rows whose tiles share one height. */
function buildRows(videos) {
  const rows = [];
  let row = [];
  let total = 0;
  for (const video of videos) {
    row.push(video);
    total += RATIO[video.format];
    if (total >= MIN_ROW_RATIO) {
      rows.push(row);
      row = [];
      total = 0;
    }
  }
  if (row.length) rows.push(row);
  return rows;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* Custom "Play" cursor over videos on devices with a mouse. */
let cursor;
if (useCursor) {
  document.documentElement.classList.add("has-cursor");
  cursor = el("div", "cursor");
  cursor.setAttribute("aria-hidden", "true");
  cursor.append(el("span", "", "Play"));
  document.body.append(cursor);
  addEventListener("pointermove", (event) => {
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
  }, { passive: true });
}

function renderCard(video, isLoneTall) {
  const card = el("article", `card card-${video.format}${isLoneTall ? " card-lone" : ""}`);
  if (video.tint) card.dataset.tint = video.tint;

  const tile = el("button", `tile${video.bright ? " tile-bright" : ""}`);
  tile.type = "button";
  tile.style.setProperty("--r", RATIO[video.format]);
  tile.setAttribute("aria-label", `Play ${video.title}`);

  const img = el("img");
  img.src = `assets/posters/${video.slug}.jpg`;
  img.alt = "";
  img.loading = "lazy";
  img.decoding = "async";

  const play = el("span", "play");
  play.setAttribute("aria-hidden", "true");
  const runtime = el("span", "runtime", video.runtime);

  tile.append(img, play, runtime);
  tile.addEventListener("click", () => openViewer(video));
  if (useCursor) {
    tile.addEventListener("mouseenter", () => cursor.classList.add("on"));
    tile.addEventListener("mouseleave", () => cursor.classList.remove("on"));
  }
  if (canHover && !reducedMotion) attachPreview(tile, video);

  const caption = el("div", "caption");
  caption.append(
    el("p", "kind", video.kind),
    el("h3", "", video.title),
    el("p", "desc", video.description),
    el("p", "tools", video.tools.join(" / "))
  );

  card.append(tile, caption);
  return card;
}

function attachPreview(tile, video) {
  let preview;
  tile.addEventListener("mouseenter", () => {
    if (!preview) {
      preview = el("video", "preview");
      preview.src = `assets/previews/${video.slug}.mp4`;
      preview.muted = true;
      preview.loop = true;
      preview.playsInline = true;
      preview.addEventListener("playing", () => {
        if (tile.matches(":hover")) preview.classList.add("on");
      });
      tile.insertBefore(preview, tile.querySelector(".play"));
    }
    preview.play().catch(() => {});
  });
  tile.addEventListener("mouseleave", () => {
    if (!preview) return;
    preview.classList.remove("on");
    preview.pause();
    preview.currentTime = 0;
  });
}

function renderSections() {
  const work = document.getElementById("work");
  SECTIONS.forEach((section) => {
    const block = el("section", "work");
    block.id = section.id;

    const head = el("div", "work-head");
    const title = el("h2", "mask");
    title.append(el("span", "", section.title));
    head.append(title, el("p", "note reveal", section.note));
    block.append(head);

    /* On phones a leftover vertical video sits beside its caption. */
    const talls = section.videos.filter((v) => v.format === "tall");
    const loneTall = talls.length % 2 === 1 ? talls[talls.length - 1] : null;

    const grid = el("div", "grid");
    const fullRatio = RATIO.wide + RATIO.tall;
    buildRows(section.videos).forEach((videos) => {
      const row = el("div", "row");
      const sum = videos.reduce((total, v) => total + RATIO[v.format], 0);
      const columns = videos.map((v) => `${RATIO[v.format]}fr`);
      if (sum < fullRatio) columns.push(`${fullRatio - sum}fr`);
      row.style.setProperty("--columns", columns.join(" "));
      videos.forEach((v) => row.append(renderCard(v, v === loneTall)));
      grid.append(row);
    });
    block.append(grid);
    work.append(block);
  });
}

/* Full-screen player */
const viewer = document.getElementById("viewer");
const viewerVideo = document.getElementById("viewerVideo");
const viewerTitle = document.getElementById("viewerTitle");
const viewerStage = document.getElementById("viewerStage");
let currentIndex = 0;

function loadInViewer(video) {
  currentIndex = allVideos.indexOf(video);
  viewerTitle.textContent = video.title;
  viewerVideo.style.setProperty("--r", RATIO[video.format]);
  viewerVideo.poster = `assets/posters/${video.slug}.jpg`;
  viewerVideo.src = `assets/video/${video.slug}.mp4`;
  viewerVideo.play().catch(() => {});
}

function openViewer(video) {
  if (cursor) cursor.classList.remove("on");
  viewer.showModal();
  loadInViewer(video);
}

function step(direction) {
  const next = (currentIndex + direction + allVideos.length) % allVideos.length;
  loadInViewer(allVideos[next]);
}

document.getElementById("viewerClose").addEventListener("click", () => viewer.close());
document.getElementById("viewerPrev").addEventListener("click", () => step(-1));
document.getElementById("viewerNext").addEventListener("click", () => step(1));
viewerStage.addEventListener("click", (event) => {
  if (event.target === viewerStage) viewer.close();
});
viewer.addEventListener("close", () => {
  viewerVideo.pause();
  viewerVideo.removeAttribute("src");
  viewerVideo.load();
});

/* Hero video only plays while it is on screen. */
const hero = document.getElementById("heroVideo");
if (reducedMotion) {
  hero.removeAttribute("autoplay");
  hero.pause();
} else {
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) hero.play().catch(() => {});
    else hero.pause();
  }).observe(hero);
}

/* Never leave the headline hidden if its entrance animation fails to start. */
setTimeout(() => {
  document.getAnimations().forEach((animation) => {
    if (animation.pending || animation.currentTime === 0) animation.finish();
  });
}, 1800);

/* Slide the nav away while scrolling down, bring it back when scrolling up. */
const nav = document.querySelector(".nav");
let lastScrollY = scrollY;
addEventListener("scroll", () => {
  const y = scrollY;
  if (Math.abs(y - lastScrollY) < 6) return;
  nav.classList.toggle("nav-hidden", y > lastScrollY && y > innerHeight * 0.5);
  lastScrollY = y;
}, { passive: true });

/* Copy email */
const copyButton = document.getElementById("copyEmail");
copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("clickfactor0@gmail.com");
    copyButton.textContent = "Copied";
  } catch {
    copyButton.textContent = "Press and hold the address to copy";
  }
  setTimeout(() => (copyButton.textContent = "Copy email"), 2500);
});

document.getElementById("year").textContent = new Date().getFullYear();
renderSections();

/* Reveal elements once as they scroll into view. */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("in");
    revealObserver.unobserve(entry.target);
  });
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
document.querySelectorAll(".reveal, .mask, .card").forEach((node) => revealObserver.observe(node));

/* Grade the page background to the video in the middle of the screen. */
const inFocus = new Set();
const focusObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) inFocus.add(entry.target);
    else inFocus.delete(entry.target);
  });
  const cards = [...inFocus];
  const lead = cards.find((card) => card.classList.contains("card-wide")) || cards[0];
  document.body.style.backgroundColor = lead ? lead.dataset.tint : "";
}, { rootMargin: "-45% 0px -45% 0px" });
document.querySelectorAll(".card[data-tint]").forEach((card) => focusObserver.observe(card));
