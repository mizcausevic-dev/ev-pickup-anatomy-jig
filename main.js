import { createJig } from "./jig.mjs";
import { FRAME_END, FPS, SEGMENTS } from "./timeline.mjs";

const canvas = document.querySelector("#stage");
const playBtn = document.querySelector("#play");
const scrub = document.querySelector("#scrub");
const frameEl = document.querySelector("#frame");
const timeEl = document.querySelector("#time");
const chapterEl = document.querySelector("#chapter");
const detailEl = document.querySelector("#detail");
const metricEl = document.querySelector("#metric");
const chaptersEl = document.querySelector("#chapters");
const noteEl = document.querySelector("#note");
const failEl = document.querySelector("#fail");

const params = new URLSearchParams(location.search);
const capture = params.has("capture");
const reduced = !capture && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (capture) document.body.dataset.capture = "1";
if (reduced) {
  document.body.dataset.reduced = "1";
  noteEl.hidden = false;
}

const chapterButtons = SEGMENTS.map((segment) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = `0${segment.index} ${segment.title}`;
  button.title = `Frames ${segment.start} to ${segment.end}`;
  button.addEventListener("click", () => {
    playing = false;
    playBtn.textContent = "Play";
    seek(segment.start);
  });
  chaptersEl.append(button);
  return button;
});

let jig;
try {
  jig = createJig(canvas);
} catch (error) {
  const message = String(error && error.message ? error.message : error);
  failEl.hidden = false;
  failEl.textContent = message;
  window.__jig = { ready: false, error: message };
  throw error;
}

function resize() {
  jig.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", resize);
resize();

let frame = 0;
let playing = false;
let acc = 0;
let last = performance.now();

function metricFor(sample) {
  const id = sample.segment.id;
  if (id === "rear-steer") return `Road wheel ${sample.rwsAngleDeg.toFixed(1)} deg`;
  if (id === "steer-by-wire") return `Front road wheel ${sample.frontSteerDeg.toFixed(1)} deg`;
  if (id === "ethernet") return "Zonal controllers F, C, R";
  if (id === "battery") return `Structural link ${Math.round(sample.linkIn * 100)} percent`;
  return "Surface normal explode";
}

function paint(sample) {
  frameEl.textContent = String(sample.frame).padStart(4, "0");
  timeEl.textContent = `${sample.time.toFixed(2)}s`;
  chapterEl.textContent = sample.segment.title;
  detailEl.textContent = sample.segment.detail;
  metricEl.textContent = metricFor(sample);
  scrub.value = String(sample.frame);
  chapterButtons.forEach((button, index) => {
    button.setAttribute("aria-pressed", SEGMENTS[index].id === sample.segment.id ? "true" : "false");
  });
}

function seek(next) {
  frame = Math.max(0, Math.min(FRAME_END, next));
  const sample = jig.seek(frame);
  paint(sample);
  return sample;
}

playBtn.addEventListener("click", () => {
  if (frame >= FRAME_END) frame = 0;
  playing = !playing;
  acc = 0;
  last = performance.now();
  playBtn.textContent = playing ? "Pause" : "Play";
  if (playing) noteEl.hidden = true;
});

scrub.addEventListener("input", () => {
  playing = false;
  acc = 0;
  seek(Number(scrub.value));
  playBtn.textContent = frame >= FRAME_END ? "Replay" : "Play";
});

window.addEventListener("keydown", (event) => {
  if (event.target.closest("input, button")) return;
  if (event.code === "Space") {
    event.preventDefault();
    playBtn.click();
  } else if (event.code === "ArrowRight") {
    playing = false;
    seek(frame + (event.shiftKey ? 30 : 1));
    playBtn.textContent = "Play";
  } else if (event.code === "ArrowLeft") {
    playing = false;
    seek(frame - (event.shiftKey ? 30 : 1));
    playBtn.textContent = "Play";
  } else if (event.code === "Home") {
    playing = false;
    seek(0);
    playBtn.textContent = "Play";
  } else if (event.code === "End") {
    playing = false;
    seek(FRAME_END);
    playBtn.textContent = "Replay";
  } else if (event.code >= "Digit1" && event.code <= "Digit5") {
    playing = false;
    seek(SEGMENTS[Number(event.code.slice(5)) - 1].start);
    playBtn.textContent = "Play";
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    playing = false;
    playBtn.textContent = frame >= FRAME_END ? "Replay" : "Play";
  }
  last = performance.now();
  acc = 0;
});

function tick(now) {
  if (playing) {
    acc += Math.min(100, now - last);
    const step = 1000 / FPS;
    while (acc >= step && playing) {
      acc -= step;
      frame += 1;
      if (frame >= FRAME_END) {
        frame = FRAME_END;
        playing = false;
        playBtn.textContent = "Replay";
        break;
      }
    }
    jig.seek(frame);
    paint(jig.lastSample);
  }
  last = now;
  requestAnimationFrame(tick);
}

try {
  seek(reduced ? 1000 : 0);
  window.__jig = {
    ready: true,
    endFrame: FRAME_END,
    seek(next) {
      playing = false;
      return seek(next);
    },
  };
} catch (error) {
  const message = String(error && error.message ? error.message : error);
  failEl.hidden = false;
  failEl.textContent = message;
  window.__jig = { ready: false, error: message };
}

if (!capture && !reduced) {
  playing = true;
  playBtn.textContent = "Pause";
}
if (!capture) requestAnimationFrame(tick);
