import assert from "node:assert/strict";
import test from "node:test";
import {
  FRAME_END,
  FPS,
  SEGMENTS,
  cameraAt,
  explodeAt,
  frontSteerDeg,
  glassAt,
  linkInAt,
  presentation,
  pulse01,
  rwsAngleDeg,
  segmentAt,
  smoother,
  vectorGate,
  wishboneStripAt,
} from "../timeline.mjs";

test("timeline markers match the 34 second brief", () => {
  assert.equal(FPS, 30);
  assert.equal(FRAME_END, 1020);
  assert.equal(FRAME_END / FPS, 34);
  assert.deepEqual(
    SEGMENTS.map((segment) => [segment.start, segment.end]),
    [
      [0, 150],
      [151, 300],
      [301, 510],
      [511, 750],
      [751, 1020],
    ],
  );
});

test("segment boundaries are inclusive and contiguous", () => {
  assert.equal(segmentAt(0).id, "exoskeleton");
  assert.equal(segmentAt(150).id, "exoskeleton");
  assert.equal(segmentAt(151).id, "steer-by-wire");
  assert.equal(segmentAt(300).id, "steer-by-wire");
  assert.equal(segmentAt(301).id, "ethernet");
  assert.equal(segmentAt(510).id, "ethernet");
  assert.equal(segmentAt(511).id, "rear-steer");
  assert.equal(segmentAt(750).id, "rear-steer");
  assert.equal(segmentAt(751).id, "battery");
  assert.equal(segmentAt(1020).id, "battery");
});

test("explode, wishbones, and glass stay inside their beats", () => {
  assert.equal(smoother(0), 0);
  assert.equal(smoother(1), 1);
  assert.equal(explodeAt(0, 0), 0);
  assert.equal(explodeAt(150, 24), 1);
  assert.equal(wishboneStripAt(151), 0);
  assert.equal(wishboneStripAt(300), 1);
  assert.equal(glassAt(0), 1);
  assert.equal(glassAt(340), 0);
});

test("steer angles stay inside the stated mechanical limits", () => {
  assert.equal(frontSteerDeg(0), 0);
  assert.equal(frontSteerDeg(294), 8);
  assert.equal(frontSteerDeg(1020), 5);
  let peak = 0;
  for (let frame = 511; frame <= 750; frame += 1) {
    const angle = rwsAngleDeg(frame);
    assert.ok(Math.abs(angle) <= 10.0001);
    peak = Math.max(peak, Math.abs(angle));
  }
  assert.ok(peak > 9.9);
  assert.equal(rwsAngleDeg(400), 0);
  assert.equal(rwsAngleDeg(1020), 7);
});

test("battery links and vectors arrive in the final beat", () => {
  assert.equal(linkInAt(751), 0);
  assert.equal(linkInAt(1020), 1);
  assert.equal(vectorGate(800), 0);
  assert.equal(vectorGate(1020), 1);
  assert.equal(pulse01(0), 1);
  const pulsed = pulse01(900);
  assert.ok(pulsed >= 0.45 && pulsed <= 1);
});

test("camera dolly runs down the centerline and stays finite", () => {
  const early = cameraAt(360);
  const later = cameraAt(430);
  assert.ok(later.position[2] < early.position[2]);
  assert.ok(Math.abs(early.position[0]) < 0.05);
  assert.ok(Math.abs(later.position[0]) < 0.05);
  for (let frame = 0; frame <= FRAME_END; frame += 15) {
    const camera = cameraAt(frame);
    for (const value of [...camera.position, ...camera.target, camera.fov]) {
      assert.ok(Number.isFinite(value));
    }
    assert.ok(camera.fov >= 20 && camera.fov <= 55);
    const sample = presentation(frame);
    assert.equal(sample.frame, frame);
  }
});
