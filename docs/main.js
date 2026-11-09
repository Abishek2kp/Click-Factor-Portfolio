const RATIO = { wide: 16 / 9, tall: 9 / 16 };
const MIN_ROW_RATIO = 2.2;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
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

function renderCard(video, isLoneTall) {
  const card = el("article", `card card-${video.format}${isLoneTall ? " card-lone" : ""}`);

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
  if (canHover && !reducedMotion) attachPreview(tile, video);

  const caption = el("div", "caption");
  const tags = el("ul", "tags");
  video.tools.forEach((tool) => tags.append(el("li", "", tool)));
  caption.append(
    el("p", "kind", video.kind),
    el("h3", "", video.title),
    el("p", "desc", video.description),
    tags
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
  SECTIONS.forEach((section, index) => {
    const block = el("section", "work");
    block.id = section.id;

    const head = el("div", "work-head");
    const titles = el("div");
    titles.append(el("h2", "", section.title), el("p", "note", section.note));
    const number = String(index + 1).padStart(2, "0");
    const count = section.videos.length;
    head.append(titles, el("p", "label", `${number} / ${count} ${count === 1 ? "film" : "films"}`));
    block.append(head);

    /* On phones a leftover vertical video sits beside its caption. */
    const talls = section.videos.filter((v) => v.format === "tall");
    const loneTall = talls.length % 2 === 1 ? talls[talls.length - 1] : null;

    const grid = el("div", "grid");
    const rows = buildRows(section.videos);
    const fullRatio = RATIO.wide + RATIO.tall;
    rows.forEach((videos) => {
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

/* Hero: pause off screen and run the timecode readout. */
const hero = document.getElementById("heroVideo");
const timecode = document.getElementById("timecode");
const FPS = 30;
const pad = (n) => String(n).padStart(2, "0");
let heroVisible = true;

function tick() {
  if (!heroVisible) return;
  const t = hero.currentTime;
  const seconds = Math.floor(t);
  timecode.textContent = `00:00:${pad(seconds)}:${pad(Math.floor((t - seconds) * FPS))}`;
  requestAnimationFrame(tick);
}

if (reducedMotion) {
  hero.removeAttribute("autoplay");
  hero.pause();
} else {
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    if (heroVisible) {
      hero.play().catch(() => {});
      requestAnimationFrame(tick);
    } else {
      hero.pause();
    }
  }).observe(hero);
}

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
