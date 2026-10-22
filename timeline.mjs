// Frame clock for the anatomy jig.
// Frame 0 is t = 0. Frame 1020 is t = 34.0s at 30 fps.
// An export of frames 0 through 1019 is 1,020 images. Frame 1020 is the end hold.

export const FPS = 30;
export const FRAME_END = 1020;

export const SEGMENTS = [
  {
    id: "exoskeleton",
    index: 1,
    start: 0,
    end: 150,
    title: "Stainless exoskeleton",
    detail: "Skin panels leave along their surface normals. Aluminum castings stay bare.",
  },
  {
    id: "steer-by-wire",
    index: 2,
    start: 151,
    end: 300,
    title: "Steer-by-wire",
    detail: "Dual redundant electromechanical motors on the front axle. Wishbones stripped.",
  },
  {
    id: "ethernet",
    index: 3,
    start: 301,
    end: 510,
    title: "48V zonal ethernet",
    detail: "Packet bursts move between front, cabin, and rear controllers.",
  },
  {
    id: "rear-steer",
    index: 4,
    start: 511,
    end: 750,
    title: "Rear-wheel steering",
    detail: "Actuator linkages pivot up to 10 degrees. Tie rods and drive nuts in red.",
  },
  {
    id: "battery",
    index: 5,
    start: 751,
    end: 1020,
    title: "Structural battery",
    detail: "The pack links into both megacastings. Chassis vectors pulse together.",
  },
];

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function smoother(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function segmentAt(frame) {
  const f = clamp(frame, 0, FRAME_END);
  for (const segment of SEGMENTS) {
    if (f >= segment.start && f <= segment.end) return segment;
  }
  return SEGMENTS[SEGMENTS.length - 1];
}

export function explodeAt(frame, stagger = 0) {
  return smoother((frame - 16 - stagger) / 96);
}

export function wishboneStripAt(frame) {
  return smoother((frame - 175) / 80);
}

export function glassAt(frame) {
  return 1 - smoother((frame - 280) / 50);
}

export function frontSteerDeg(frame) {
  if (frame < 268) return 0;
  if (frame < 320) return Math.sin(((frame - 268) / 52) * Math.PI) * 8;
  return 5;
}

export function rwsAngleDeg(frame) {
  if (frame < 511) return 0;
  if (frame > 750) return 7;
  return Math.sin(((frame - 511) / (750 - 511)) * Math.PI * 2) * 10;
}

export function linkInAt(frame) {
  return smoother((frame - 770) / 130);
}

export function vectorGate(frame) {
  return smoother((frame - 860) / 70);
}

export function pulse01(frame) {
  if (frame < 860) return 1;
  const wave = 0.5 + 0.5 * Math.sin((frame / FPS) * Math.PI);
  return 0.45 + 0.55 * wave;
}

function window01(frame, start, end, fade) {
  const fadeIn = smoother((frame - start) / fade);
  const fadeOut = 1 - smoother((frame - (end - fade)) / fade);
  return clamp(fadeIn * fadeOut, 0, 1);
}

export function heroAt(frame, start, end) {
  return window01(frame, start, end, 18);
}

export function sbwFocus(frame) {
  return clamp(window01(frame, 151, 345, 26) + smoother((frame - 830) / 70) * 0.85, 0, 1);
}

export function busFocus(frame) {
  return clamp(window01(frame, 310, 530, 24) + smoother((frame - 840) / 70) * 0.85, 0, 1);
}

export function rwsFocus(frame) {
  return clamp(window01(frame, 520, 770, 28) + smoother((frame - 840) / 70) * 0.9, 0, 1);
}

const CAMERA_KEYS = [
  { f: 0, p: [3.15, 1.35, 4.15], t: [0.1, 0.85, 0.4], fov: 34, ease: "smooth" },
  { f: 150, p: [3.85, 1.95, 4.55], t: [0.0, 0.78, 0.15], fov: 32, ease: "smooth" },
  { f: 210, p: [0.2, 5.6, 1.9], t: [0.0, 0.42, 1.86], fov: 32, ease: "smooth" },
  { f: 300, p: [1.15, 2.35, 2.85], t: [0.0, 0.5, 1.86], fov: 30, ease: "smooth" },
  { f: 352, p: [0.0, 0.95, 1.42], t: [0.0, 0.55, 0.05], fov: 50, ease: "smooth" },
  { f: 510, p: [0.0, 0.82, -1.08], t: [0.0, 0.48, -2.25], fov: 50, ease: "linear" },
  { f: 575, p: [1.15, 2.45, -3.15], t: [0.0, 0.4, -1.68], fov: 36, ease: "smooth" },
  { f: 750, p: [0.72, 1.32, -2.72], t: [0.05, 0.36, -1.68], fov: 28, ease: "smooth" },
  { f: 880, p: [3.15, 2.15, -3.35], t: [0.0, 0.62, -0.2], fov: 32, ease: "smooth" },
  { f: 990, p: [6.35, 3.7, 6.2], t: [0.0, 0.78, 0.08], fov: 34, ease: "smooth" },
  { f: 1020, p: [6.35, 3.7, 6.2], t: [0.0, 0.78, 0.08], fov: 34, ease: "smooth" },
];

function lerp(a, b, u) {
  return a + (b - a) * u;
}

function sampleKeys(frame, pick) {
  const keys = CAMERA_KEYS;
  if (frame <= keys[0].f) return pick(keys[0]);
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const u = (frame - a.f) / (b.f - a.f);
      const s = b.ease === "linear" ? u : u * u * (3 - 2 * u);
      const av = pick(a);
      const bv = pick(b);
      if (typeof av === "number") return lerp(av, bv, s);
      return av.map((value, index) => lerp(value, bv[index], s));
    }
  }
  return pick(keys[keys.length - 1]);
}

export function cameraAt(frame) {
  const f = clamp(frame, 0, FRAME_END);
  return {
    position: sampleKeys(f, (key) => key.p),
    target: sampleKeys(f, (key) => key.t),
    fov: sampleKeys(f, (key) => key.fov),
  };
}

export function presentation(frame) {
  const f = clamp(frame, 0, FRAME_END);
  const segment = segmentAt(f);
  return {
    frame: f,
    time: f / FPS,
    segment,
    explode: explodeAt(f, 0),
    wishboneStrip: wishboneStripAt(f),
    glass: glassAt(f),
    frontSteerDeg: frontSteerDeg(f),
    rwsAngleDeg: rwsAngleDeg(f),
    linkIn: linkInAt(f),
    vectorGate: vectorGate(f),
    pulse: pulse01(f),
    sbwFocus: sbwFocus(f),
    busFocus: busFocus(f),
    rwsFocus: rwsFocus(f),
    sbwHero: heroAt(f, 175, 325),
    busHero: heroAt(f, 330, 500),
    rwsHero: heroAt(f, 560, 745),
    camera: cameraAt(f),
  };
}
