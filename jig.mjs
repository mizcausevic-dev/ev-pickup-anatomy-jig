import * as THREE from "three";
import { explodeAt, presentation } from "./timeline.mjs";

const FLOOR = 0x0d0e11;
const STAINLESS = 0x3e424b;
const ICE = 0x00e5ff;
const VOLT = 0xffe600;
const RED = 0xff1744;
const ALUMINUM = 0xd5dbe3;
const FRONT_AXLE = 1.86;
const REAR_AXLE = -1.68;
const TRACK = 0.9;

const _yAxis = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _worldA = new THREE.Vector3();
const _worldB = new THREE.Vector3();

function buildEnvironment(renderer) {
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(
    new THREE.BoxGeometry(24, 14, 24),
    new THREE.MeshBasicMaterial({ color: 0x101318, side: THREE.BackSide }),
  ));
  const card = (w, h, color, x, y, z, lx, ly, lz) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color }));
    mesh.position.set(x, y, z);
    mesh.lookAt(lx, ly, lz);
    envScene.add(mesh);
  };
  card(10, 4, 0xf4f7fb, 0, 6.2, 2.4, 0, 0, 0);
  card(4.5, 7, 0xd5dee8, -8, 2.4, 1, 0, 1, 0);
  card(3, 5, 0x6d7886, 8, 1.5, -2, 0, 1, 0);
  card(8, 2.2, 0x242b33, 0, 1.6, -9, 0, 1, 1);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  return texture;
}

function radialTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(256, 256, 30, 256, 256, 250);
  gradient.addColorStop(0, "rgba(0,0,0,0.55)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(canvas);
}

function gridTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "rgba(62,66,75,0.55)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 1024; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addEdges(mesh, color, opacity) {
  mesh.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 18),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  ));
}

function beam(a, b, thickness, material) {
  const start = new THREE.Vector3(a[0], a[1], a[2]);
  const end = new THREE.Vector3(b[0], b[1], b[2]);
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(dir.length(), 0.001);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, thickness, length), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  dir.multiplyScalar(1 / length);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  return mesh;
}

function pointCylinder(mesh, a, b) {
  _dir.subVectors(b, a);
  const length = _dir.length();
  if (length < 1e-4) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  _mid.copy(a).add(b).multiplyScalar(0.5);
  mesh.position.copy(_mid);
  mesh.scale.set(1, length, 1);
  _dir.multiplyScalar(1 / length);
  mesh.quaternion.setFromUnitVectors(_yAxis, _dir);
}

function makeArrow(color, length) {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  const group = new THREE.Group();
  const shaftLength = length * 0.72;
  const headLength = length * 0.28;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, shaftLength, 8), material);
  shaft.position.y = shaftLength / 2;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.04, headLength, 10), material);
  head.position.y = shaftLength + headLength * 0.45;
  group.add(shaft, head);
  return { group, material };
}

function buildWheel(sign, tireMat, rimMat, faceMat, lugMat) {
  const group = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 32), tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  group.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.27, 24), rimMat);
  rim.rotation.z = Math.PI / 2;
  group.add(rim);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 24), faceMat);
  face.rotation.z = Math.PI / 2;
  face.position.x = sign * 0.135;
  group.add(face);
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.024, 6), lugMat);
    lug.rotation.z = Math.PI / 2;
    lug.position.set(sign * 0.15, Math.sin(angle) * 0.085, Math.cos(angle) * 0.085);
    group.add(lug);
  }
  return group;
}

export function createJig(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  if (!renderer.getContext()) throw new Error("WebGL context unavailable");
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(1);
  renderer.setClearColor(FLOOR, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FLOOR);
  scene.fog = new THREE.Fog(FLOOR, 18, 40);
  scene.environment = buildEnvironment(renderer);
  scene.environmentIntensity = 1.2;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.06, 80);
  const root = new THREE.Group();
  scene.add(root);

  const matPanel = new THREE.MeshStandardMaterial({ color: STAINLESS, metalness: 0.56, roughness: 0.3, envMapIntensity: 1.25 });
  const matMono = new THREE.MeshStandardMaterial({
    color: STAINLESS, metalness: 0.48, roughness: 0.36, transparent: true, opacity: 0.62, envMapIntensity: 1.1,
  });
  const matAlu = new THREE.MeshStandardMaterial({ color: ALUMINUM, metalness: 0.84, roughness: 0.42, envMapIntensity: 1.05 });
  const matSteel = new THREE.MeshStandardMaterial({ color: 0x8e97a3, metalness: 0.78, roughness: 0.38 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x14171c, metalness: 0.45, roughness: 0.62 });
  const matTire = new THREE.MeshStandardMaterial({ color: 0x121418, roughness: 0.96, metalness: 0.02 });
  const matRim = new THREE.MeshStandardMaterial({ color: 0x2a3038, metalness: 0.8, roughness: 0.35 });
  const matRimFace = new THREE.MeshStandardMaterial({ color: 0x3e4650, metalness: 0.85, roughness: 0.28 });
  const matLug = new THREE.MeshStandardMaterial({ color: 0xc5ccd4, metalness: 0.9, roughness: 0.25 });
  const matGlass = new THREE.MeshStandardMaterial({
    color: 0x8aa4b2, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.38, envMapIntensity: 1.4,
  });
  const matWish = new THREE.MeshStandardMaterial({
    color: 0x6e7784, metalness: 0.7, roughness: 0.42, transparent: true, opacity: 1,
  });
  const matIce = new THREE.MeshStandardMaterial({
    color: 0x08343c, emissive: ICE, emissiveIntensity: 0.25, metalness: 0.62, roughness: 0.28,
  });
  const matIceShell = new THREE.MeshBasicMaterial({
    color: ICE, transparent: true, opacity: 0.08, depthWrite: false, toneMapped: false,
  });
  const matVolt = new THREE.MeshStandardMaterial({
    color: 0x3a3408, emissive: VOLT, emissiveIntensity: 0.35, metalness: 0.35, roughness: 0.4,
  });
  const matVoltFace = new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, opacity: 0.3, toneMapped: false });
  const matRed = new THREE.MeshStandardMaterial({
    color: 0x3a0614, emissive: RED, emissiveIntensity: 0.2, metalness: 0.55, roughness: 0.32,
  });
  const matRedShell = new THREE.MeshBasicMaterial({
    color: RED, transparent: true, opacity: 0.06, depthWrite: false, toneMapped: false,
  });
  const matLink = new THREE.MeshStandardMaterial({
    color: ALUMINUM, emissive: 0xe7eef6, emissiveIntensity: 0.05, metalness: 0.82, roughness: 0.34,
  });
  const matCell = new THREE.MeshStandardMaterial({
    color: 0x1a2228, emissive: 0x062820, emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.55,
  });
  const matPackTop = new THREE.MeshStandardMaterial({
    color: 0x101418, transparent: true, opacity: 0.28, metalness: 0.3, roughness: 0.45, depthWrite: false,
  });
  const trailMats = [0, 1, 2, 3].map((index) => new THREE.MeshBasicMaterial({
    color: VOLT, transparent: true, opacity: 0.95 - index * 0.22, depthWrite: false, toneMapped: false,
  }));

  const key = new THREE.DirectionalLight(0xfff6ee, 4.4);
  key.position.set(6.5, 8.5, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 28;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.bias = -0.00035;
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xb7c4d2, 0.55));
  const fill = new THREE.DirectionalLight(0xc5d4e2, 1.15);
  fill.position.set(-6, 3, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xe7eef5, 2.2);
  rim.position.set(-5, 4, -6);
  scene.add(rim);
  const iceLight = new THREE.PointLight(ICE, 0, 5, 2);
  iceLight.position.set(0, 0.9, FRONT_AXLE);
  scene.add(iceLight);
  const busLights = [0, 1, 2].map(() => new THREE.PointLight(VOLT, 0, 2.4, 2));
  scene.add(...busLights);
  const redLight = new THREE.PointLight(RED, 0, 3.2, 2);
  redLight.position.set(0.2, 0.55, REAR_AXLE);
  scene.add(redLight);
  const tunnelLight = new THREE.PointLight(0xd7dde6, 0, 4.5, 2);
  tunnelLight.position.set(0, 1.15, 0.1);
  scene.add(tunnelLight);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 72),
    new THREE.MeshStandardMaterial({ color: FLOOR, roughness: 0.96, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.Mesh(
    new THREE.CircleGeometry(9.5, 64),
    new THREE.MeshBasicMaterial({ map: gridTexture(), transparent: true, opacity: 0.18, depthWrite: false }),
  );
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.004;
  scene.add(grid);
  const stageRing = new THREE.Mesh(
    new THREE.TorusGeometry(6.4, 0.012, 8, 80),
    new THREE.MeshBasicMaterial({ color: 0x2a3038 }),
  );
  stageRing.rotation.x = Math.PI / 2;
  stageRing.position.y = 0.008;
  scene.add(stageRing);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 3.4),
    new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.006, 0.1);
  scene.add(shadow);

  const cage = (a, b, thickness = 0.046) => root.add(beam(a, b, thickness, matMono));
  cage([-0.74, 0.5, -2.4], [-0.74, 0.5, 2.5], 0.07);
  cage([0.74, 0.5, -2.4], [0.74, 0.5, 2.5], 0.07);
  cage([-0.74, 0.5, 2.35], [0.74, 0.5, 2.35], 0.06);
  cage([-0.74, 0.5, 1.15], [0.74, 0.5, 1.15], 0.05);
  cage([-0.74, 0.5, -0.55], [0.74, 0.5, -0.55], 0.05);
  cage([-0.74, 0.5, -2.25], [0.74, 0.5, -2.25], 0.06);
  cage([-0.62, 1.68, 0.78], [0.62, 1.68, 0.78], 0.04);
  cage([-0.62, 1.68, 0.78], [-0.62, 1.68, -0.5], 0.04);
  cage([0.62, 1.68, 0.78], [0.62, 1.68, -0.5], 0.04);
  cage([-0.62, 1.68, -0.5], [0.62, 1.68, -0.5], 0.04);
  cage([-0.7, 0.55, 1.22], [-0.6, 1.66, 0.8], 0.045);
  cage([0.7, 0.55, 1.22], [0.6, 1.66, 0.8], 0.045);
  cage([-0.72, 0.55, -0.5], [-0.6, 1.66, -0.5], 0.045);
  cage([0.72, 0.55, -0.5], [0.6, 1.66, -0.5], 0.045);
  cage([-0.72, 0.55, 0.15], [-0.64, 1.66, 0.15], 0.04);
  cage([0.72, 0.55, 0.15], [0.64, 1.66, 0.15], 0.04);
  cage([-0.86, 0.78, -0.75], [-0.86, 0.78, -2.35], 0.05);
  cage([0.86, 0.78, -0.75], [0.86, 0.78, -2.35], 0.05);
  cage([-0.86, 1.22, -0.75], [-0.86, 1.22, -2.35], 0.04);
  cage([0.86, 1.22, -0.75], [0.86, 1.22, -2.35], 0.04);
  cage([-0.16, 0.47, -1.2], [-0.16, 0.47, 1.25], 0.035);
  cage([0.16, 0.47, -1.2], [0.16, 0.47, 1.25], 0.035);

  function castingBox(w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matAlu);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    addEdges(mesh, 0xe7edf3, 0.4);
    root.add(mesh);
  }
  castingBox(1.28, 0.2, 0.92, 0, 0.32, 2.04);
  castingBox(0.16, 0.56, 0.22, -0.48, 0.62, 1.92);
  castingBox(0.16, 0.56, 0.22, 0.48, 0.62, 1.92);
  castingBox(1.08, 0.07, 0.16, 0, 0.9, 1.92);
  castingBox(0.04, 0.16, 0.72, -0.24, 0.42, 2.04);
  castingBox(0.04, 0.16, 0.72, 0.24, 0.42, 2.04);
  castingBox(0.04, 0.16, 0.72, 0, 0.42, 2.04);
  castingBox(0.86, 0.1, 0.08, 0, 0.4, 2.46);
  castingBox(0.72, 0.07, 0.34, 0, 0.48, 2.08);
  castingBox(1.22, 0.18, 0.86, 0, 0.3, -1.98);
  castingBox(0.14, 0.42, 0.2, -0.46, 0.52, -1.9);
  castingBox(0.14, 0.42, 0.2, 0.46, 0.52, -1.9);
  castingBox(1.0, 0.06, 0.14, 0, 0.72, -1.9);
  castingBox(0.04, 0.14, 0.66, -0.22, 0.38, -1.98);
  castingBox(0.04, 0.14, 0.66, 0.22, 0.38, -1.98);
  castingBox(0.9, 0.08, 0.08, 0, 0.36, -2.38);

  for (const [a, b] of [
    [[-0.52, 0.24, -1.2], [0.52, 0.24, -1.2]],
    [[-0.52, 0.24, 1.25], [0.52, 0.24, 1.25]],
    [[-0.52, 0.24, -1.2], [-0.52, 0.24, 1.25]],
    [[0.52, 0.24, -1.2], [0.52, 0.24, 1.25]],
    [[-0.52, 0.4, -1.2], [-0.52, 0.4, 1.25]],
    [[0.52, 0.4, -1.2], [0.52, 0.4, 1.25]],
  ]) root.add(beam(a, b, 0.035, matAlu));

  const cells = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.1, 0.2), matCell, 40);
  const dummy = new THREE.Object3D();
  let cellIndex = 0;
  for (let iz = 0; iz < 10; iz += 1) {
    for (let ix = 0; ix < 4; ix += 1) {
      dummy.position.set(-0.3 + ix * 0.2, 0.31, -1.0 + iz * 0.23);
      dummy.updateMatrix();
      cells.setMatrixAt(cellIndex, dummy.matrix);
      cellIndex += 1;
    }
  }
  cells.instanceMatrix.needsUpdate = true;
  cells.frustumCulled = false;
  root.add(cells);
  const packTop = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.012, 2.32), matPackTop);
  packTop.position.set(0, 0.405, 0.02);
  root.add(packTop);

  const linkGroups = [];
  function addLink(x, originZ, direction) {
    const group = new THREE.Group();
    group.position.set(x, 0.5, originZ);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.7), matLink);
    mesh.position.z = direction * 0.35;
    group.add(mesh);
    group.scale.z = 0.001;
    root.add(group);
    linkGroups.push(group);
  }
  addLink(-0.28, 1.2, 1);
  addLink(0.28, 1.2, 1);
  addLink(-0.28, -1.2, -1);
  addLink(0.28, -1.2, -1);

  const explodePivots = [];
  function addPanel(spec, material) {
    const pivot = new THREE.Group();
    pivot.position.set(spec.x, spec.y, spec.z);
    pivot.rotation.set(spec.rx || 0, spec.ry || 0, spec.rz || 0);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(spec.w, spec.h, spec.d), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (spec.edges !== false) addEdges(mesh, 0xc5ced6, 0.2);
    pivot.add(mesh);
    pivot.userData.base = new THREE.Vector3(spec.x, spec.y, spec.z);
    pivot.userData.normal = new THREE.Vector3(...spec.normal).normalize();
    pivot.userData.distance = spec.distance;
    pivot.userData.stagger = spec.stagger || 0;
    explodePivots.push(pivot);
    root.add(pivot);
    return pivot;
  }

  const panels = [
    { w: 1.58, h: 0.05, d: 1.28, x: 0, y: 1.14, z: 1.82, rx: -0.14, normal: [0, 0.42, 1], distance: 1.65, stagger: 0 },
    { w: 1.88, h: 0.56, d: 0.06, x: 0, y: 0.72, z: 2.64, normal: [0, 0.08, 1], distance: 0.62, stagger: 4 },
    { w: 0.12, h: 0.34, d: 1.32, x: -0.98, y: 1.02, z: 1.72, normal: [-0.86, 0.35, 0.28], distance: 0.72, stagger: 8 },
    { w: 0.12, h: 0.34, d: 1.32, x: 0.98, y: 1.02, z: 1.72, normal: [0.86, 0.35, 0.28], distance: 0.72, stagger: 8 },
    { w: 0.06, h: 0.76, d: 1.42, x: -1.02, y: 1.18, z: 0.12, normal: [-1, 0.12, 0], distance: 0.88, stagger: 12 },
    { w: 0.06, h: 0.76, d: 1.42, x: 1.02, y: 1.18, z: 0.12, normal: [1, 0.12, 0], distance: 0.88, stagger: 12 },
    { w: 1.5, h: 0.045, d: 1.38, x: 0, y: 1.74, z: 0.12, normal: [0.04, 1, -0.12], distance: 1.2, stagger: 20 },
    { w: 1.46, h: 0.62, d: 0.05, x: 0, y: 1.34, z: -0.58, normal: [0, 1, -0.2], distance: 1.35, stagger: 16 },
    { w: 0.05, h: 0.46, d: 1.68, x: -0.9, y: 1.08, z: -1.55, normal: [-1, 0.15, 0], distance: 1.45, stagger: 14 },
    { w: 0.05, h: 0.46, d: 1.68, x: 0.9, y: 1.08, z: -1.55, normal: [1, 0.15, 0], distance: 1.45, stagger: 14 },
    { w: 1.72, h: 0.5, d: 0.05, x: 0, y: 1.02, z: -2.44, normal: [0, 0.2, -1], distance: 1.9, stagger: 10 },
    { w: 1.55, h: 0.04, d: 1.5, x: 0, y: 0.8, z: -1.55, normal: [0, 1, 0], distance: 1.15, stagger: 18 },
    { w: 1.4, h: 0.035, d: 1.5, x: 0, y: 0.72, z: 0.2, normal: [0, 1, 0], distance: 0.48, stagger: 22 },
    { w: 0.05, h: 0.26, d: 2.15, x: -1.0, y: 0.58, z: 0.15, normal: [-1, 0.05, 0], distance: 0.5, stagger: 6 },
    { w: 0.05, h: 0.26, d: 2.15, x: 1.0, y: 0.58, z: 0.15, normal: [1, 0.05, 0], distance: 0.5, stagger: 6 },
  ];
  addPanel(
    { w: 1.38, h: 0.03, d: 0.72, x: 0, y: 1.42, z: 0.98, rx: -0.58, normal: [0, 0.48, 0.88], distance: 0.9, stagger: 2, edges: false },
    matGlass,
  );
  const doorPivots = [];
  for (const spec of panels) {
    const pivot = addPanel(spec, matPanel);
    if (Math.abs(spec.x) > 0.9 && spec.h > 0.7 && spec.y > 1) doorPivots.push(pivot);
  }
  for (const pivot of doorPivots) {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.42, 0.72), matGlass);
    glass.position.set(pivot.position.x > 0 ? -0.02 : 0.02, 0.08, -0.05);
    pivot.add(glass);
  }
  const fascia = explodePivots.find((pivot) => pivot.userData.base.z > 2.5);
  if (fascia) {
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 0.02), matDark);
    grille.position.set(0, -0.06, 0.04);
    fascia.add(grille);
    for (const x of [-0.68, 0.68]) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.02), matDark);
      lamp.position.set(x, 0.14, 0.04);
      fascia.add(lamp);
    }
  }

  const leftArms = new THREE.Group();
  const rightArms = new THREE.Group();
  root.add(leftArms, rightArms);
  function addArms(group, side, axleZ) {
    const xIn = side * 0.32;
    const xOut = side * 0.78;
    group.add(beam([xIn, 0.28, axleZ - 0.16], [xOut, 0.3, axleZ], 0.038, matWish));
    group.add(beam([xIn, 0.28, axleZ + 0.16], [xOut, 0.3, axleZ], 0.038, matWish));
    group.add(beam([xIn * 0.9, 0.64, axleZ - 0.1], [xOut, 0.58, axleZ], 0.03, matWish));
    group.add(beam([xIn * 0.9, 0.64, axleZ + 0.1], [xOut, 0.58, axleZ], 0.03, matWish));
    group.add(beam([side * 0.5, 0.3, axleZ], [side * 0.5, 0.82, axleZ], 0.045, matWish));
  }
  addArms(leftArms, -1, FRONT_AXLE);
  addArms(rightArms, 1, FRONT_AXLE);
  addArms(leftArms, -1, REAR_AXLE);
  addArms(rightArms, 1, REAR_AXLE);

  function buildKnuckle(side, axleZ, armMaterial) {
    const group = new THREE.Group();
    group.position.set(side * TRACK, 0.4, axleZ);
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.08), matSteel);
    upright.castShadow = true;
    group.add(upright);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.028, 0.2), armMaterial);
    arm.position.set(0, -0.02, -0.1);
    group.add(arm);
    const anchor = new THREE.Object3D();
    anchor.position.set(0, -0.02, -0.2);
    group.add(anchor);
    group.add(buildWheel(side, matTire, matRim, matRimFace, matLug));
    root.add(group);
    return { group, anchor };
  }
  const frontKnuckles = [buildKnuckle(-1, FRONT_AXLE, matSteel), buildKnuckle(1, FRONT_AXLE, matSteel)];
  const rearKnuckles = [buildKnuckle(-1, REAR_AXLE, matRed), buildKnuckle(1, REAR_AXLE, matRed)];

  const frontRack = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.04, 0.04), matSteel);
  frontRack.position.set(0, 0.42, FRONT_AXLE);
  root.add(frontRack);
  const rearRack = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.045, 0.045), matSteel);
  rearRack.position.set(0, 0.36, REAR_AXLE);
  root.add(rearRack);

  function makeNut(x, y, z, material) {
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.06, 6), material);
    nut.rotation.z = Math.PI / 2;
    nut.position.set(x, y, z);
    nut.userData.baseX = x;
    root.add(nut);
    return nut;
  }
  const frontNuts = [makeNut(-0.36, 0.42, FRONT_AXLE, matSteel), makeNut(0.36, 0.42, FRONT_AXLE, matSteel)];
  const rearNuts = [makeNut(-0.38, 0.36, REAR_AXLE, matRed), makeNut(0.38, 0.36, REAR_AXLE, matRed)];
  for (const nut of rearNuts) nut.scale.set(1.35, 1.35, 1.35);

  function makeRod(material, radius = 0.014) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 8), material);
    root.add(mesh);
    return mesh;
  }
  const frontRods = [makeRod(matSteel), makeRod(matSteel)];
  const rearRods = [makeRod(matRed, 0.02), makeRod(matRed, 0.02)];
  const rearCranks = [];
  for (const side of [-1, 1]) {
    const crank = new THREE.Group();
    crank.position.set(side * 0.38, 0.4, REAR_AXLE);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.036), matRed);
    plate.position.x = side * 0.12;
    crank.add(plate);
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.06), matRedShell);
    shell.position.x = side * 0.08;
    crank.add(shell);
    root.add(crank);
    rearCranks.push(crank);
    const actuator = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 18), matRed);
    actuator.rotation.z = Math.PI / 2;
    actuator.position.set(side * 0.16, 0.36, REAR_AXLE - 0.08);
    actuator.castShadow = true;
    root.add(actuator);
    const actuatorShell = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 16), matRedShell);
    actuatorShell.rotation.z = Math.PI / 2;
    actuatorShell.position.copy(actuator.position);
    root.add(actuatorShell);
  }
  const rearLinkRods = [makeRod(matRed), makeRod(matRed)];
  const rearLinkAnchors = [-1, 1].map((side) => {
    const anchor = new THREE.Object3D();
    anchor.position.set(side * 0.16, 0.4, REAR_AXLE - 0.08);
    root.add(anchor);
    return anchor;
  });

  const rotors = [];
  for (const side of [-1, 1]) {
    const motor = new THREE.Group();
    motor.position.set(side * 0.2, 0.6, FRONT_AXLE + 0.18);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 24), matIce);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    motor.add(body);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.26, 20), matIceShell);
    shell.rotation.x = Math.PI / 2;
    motor.add(shell);
    for (let fin = 0; fin < 6; fin += 1) {
      const angle = (fin / 6) * Math.PI;
      const finMesh = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.16, 0.012), matIce);
      finMesh.position.set(Math.cos(angle) * 0.1, 0, Math.sin(angle) * 0.04);
      motor.add(finMesh);
    }
    const spinner = new THREE.Group();
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.16, 0.012), matIceShell);
    rotor.position.z = 0.12;
    spinner.add(rotor);
    motor.add(spinner);
    rotors.push(spinner);
    root.add(motor);
    root.add(beam([side * 0.2, 0.6, FRONT_AXLE + 0.05], [side * 0.08, 0.46, FRONT_AXLE], 0.03, matIce));
  }

  const controllers = [
    new THREE.Vector3(0.26, 0.66, 1.28),
    new THREE.Vector3(0.26, 0.64, 0.05),
    new THREE.Vector3(-0.24, 0.62, -1.55),
  ];
  for (const position of controllers) {
    const group = new THREE.Group();
    group.position.copy(position);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.12), matAlu);
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.045, 0.012), matVoltFace);
    face.position.set(0, 0.015, 0.062);
    group.add(body, face);
    root.add(group);
  }
  busLights.forEach((light, index) => light.position.copy(controllers[index]));

  function loopCurve(points) {
    return new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.15);
  }
  const loops = [
    loopCurve([controllers[0].clone(), new THREE.Vector3(0.34, 0.68, 0.7), controllers[1].clone(), new THREE.Vector3(-0.12, 0.52, 0.72)]),
    loopCurve([controllers[1].clone(), new THREE.Vector3(0.22, 0.66, -0.7), controllers[2].clone(), new THREE.Vector3(-0.16, 0.5, -0.75)]),
    loopCurve([
      new THREE.Vector3(0.42, 0.47, 1.15),
      new THREE.Vector3(0.42, 0.47, -1.05),
      new THREE.Vector3(-0.42, 0.47, -1.05),
      new THREE.Vector3(-0.42, 0.47, 1.15),
    ]),
  ];
  for (const curve of loops) root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 70, 0.009, 6, true), matVolt));
  const spurMat = matVolt.clone();
  spurMat.transparent = true;
  spurMat.opacity = 0.75;
  for (const [a, b] of [
    [controllers[0], new THREE.Vector3(-0.2, 0.6, FRONT_AXLE + 0.1)],
    [controllers[0], new THREE.Vector3(0.2, 0.6, FRONT_AXLE + 0.1)],
    [controllers[2], new THREE.Vector3(-0.2, 0.4, REAR_AXLE)],
    [controllers[2], new THREE.Vector3(0.2, 0.4, REAR_AXLE)],
  ]) {
    const curve = new THREE.CatmullRomCurve3([a.clone(), b.clone()]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.007, 5, false), spurMat));
  }

  const packets = [];
  for (const curve of loops) {
    for (let i = 0; i < 5; i += 1) {
      for (let trail = 0; trail < 4; trail += 1) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(trail === 0 ? 0.026 : 0.015, 10, 8), trailMats[trail]);
        root.add(mesh);
        packets.push({ mesh, curve, phase: i / 5, trail });
      }
    }
  }

  const iceArrows = [-1, 1].map((side) => {
    const arrow = makeArrow(ICE, 0.7);
    arrow.group.position.set(side * 0.2, 0.95, FRONT_AXLE + 0.05);
    arrow.group.rotation.x = -Math.PI / 2;
    root.add(arrow.group);
    return arrow;
  });
  const busArrows = [0.55, -0.45].map((z) => {
    const arrow = makeArrow(VOLT, 0.75);
    arrow.group.position.set(0, 0.78, z);
    arrow.group.rotation.x = Math.PI / 2;
    root.add(arrow.group);
    return arrow;
  });
  const redArrows = [-1, 1].map((side) => {
    const arrow = makeArrow(RED, 0.62);
    arrow.group.position.set(side * 0.55, 0.72, REAR_AXLE);
    arrow.group.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    root.add(arrow.group);
    return arrow;
  });
  const linkArrows = [];
  for (const direction of [1, -1]) {
    for (const x of [-0.28, 0.28]) {
      const arrow = makeArrow(0xe7eef6, 0.4);
      arrow.group.position.set(x, 0.68, direction > 0 ? 1.55 : -1.55);
      arrow.group.rotation.x = direction > 0 ? -Math.PI / 2 : Math.PI / 2;
      root.add(arrow.group);
      linkArrows.push(arrow);
    }
  }

  let lastSample = presentation(0);

  function resize(width, height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }

  function seek(frame) {
    const sample = presentation(frame);
    lastSample = sample;
    const pulse = sample.pulse;
    for (const pivot of explodePivots) {
      const amount = explodeAt(sample.frame, pivot.userData.stagger);
      pivot.position.copy(pivot.userData.base).addScaledVector(pivot.userData.normal, pivot.userData.distance * amount);
    }
    const strip = sample.wishboneStrip;
    leftArms.position.x = -0.85 * strip;
    rightArms.position.x = 0.85 * strip;
    leftArms.visible = strip < 0.98;
    rightArms.visible = strip < 0.98;
    matWish.opacity = 1 - strip;
    matGlass.opacity = 0.4 * sample.glass;

    const frontAngle = THREE.MathUtils.degToRad(sample.frontSteerDeg);
    const rearAngle = THREE.MathUtils.degToRad(sample.rwsAngleDeg);
    for (const knuckle of frontKnuckles) knuckle.group.rotation.y = frontAngle;
    for (const knuckle of rearKnuckles) knuckle.group.rotation.y = rearAngle;
    for (const crank of rearCranks) crank.rotation.y = rearAngle;
    const frontSlide = -0.18 * Math.sin(frontAngle);
    const rearSlide = -0.18 * Math.sin(rearAngle);
    for (const nut of frontNuts) nut.position.x = nut.userData.baseX + frontSlide;
    for (const nut of rearNuts) nut.position.x = nut.userData.baseX + rearSlide;
    for (const rotor of rotors) rotor.rotation.z = sample.frame * 0.45 * sample.sbwFocus;

    root.updateMatrixWorld(true);
    for (const [nuts, knuckles, rods] of [[frontNuts, frontKnuckles, frontRods], [rearNuts, rearKnuckles, rearRods]]) {
      for (let i = 0; i < 2; i += 1) {
        nuts[i].getWorldPosition(_worldA);
        knuckles[i].anchor.getWorldPosition(_worldB);
        root.worldToLocal(_worldA);
        root.worldToLocal(_worldB);
        pointCylinder(rods[i], _worldA, _worldB);
      }
    }
    for (let i = 0; i < 2; i += 1) {
      rearLinkAnchors[i].getWorldPosition(_worldA);
      rearNuts[i].getWorldPosition(_worldB);
      root.worldToLocal(_worldA);
      root.worldToLocal(_worldB);
      pointCylinder(rearLinkRods[i], _worldA, _worldB);
    }

    const speed = 0.004 + sample.busFocus * 0.03;
    for (const packet of packets) {
      let u = (packet.phase + sample.frame * speed - packet.trail * 0.012) % 1;
      if (u < 0) u += 1;
      packet.mesh.position.copy(packet.curve.getPointAt(u));
      packet.mesh.scale.setScalar((packet.trail === 0 ? 1 : 0.7) * (0.65 + sample.busFocus * 0.7));
    }
    for (let i = 0; i < trailMats.length; i += 1) {
      trailMats[i].opacity = sample.busFocus * (1 - i * 0.22) * pulse;
    }
    matIce.emissiveIntensity = sample.sbwFocus * 1.25 * pulse;
    matIceShell.opacity = sample.sbwFocus * 0.18 * pulse;
    matVolt.emissiveIntensity = sample.busFocus * 0.85 * pulse;
    matVoltFace.opacity = sample.busFocus * pulse;
    matRed.emissiveIntensity = sample.rwsFocus * 1.15 * pulse;
    matRedShell.opacity = sample.rwsFocus * 0.12 * pulse;
    matLink.emissiveIntensity = (0.02 + sample.linkIn * 0.85) * pulse;
    for (const group of linkGroups) group.scale.z = Math.max(sample.linkIn, 0.001);
    const vectorOpacity = sample.vectorGate * (0.35 + 0.65 * pulse);
    for (const arrow of iceArrows) arrow.material.opacity = vectorOpacity * sample.sbwFocus;
    for (const arrow of busArrows) arrow.material.opacity = vectorOpacity * sample.busFocus;
    for (const arrow of redArrows) arrow.material.opacity = vectorOpacity * sample.rwsFocus;
    for (const arrow of linkArrows) arrow.material.opacity = vectorOpacity * sample.linkIn;
    iceLight.intensity = sample.sbwFocus * 18;
    for (const light of busLights) light.intensity = sample.busFocus * 7;
    redLight.intensity = sample.rwsFocus * 10;
    tunnelLight.intensity = sample.busFocus * 8;

    const shot = sample.camera;
    camera.position.set(shot.position[0], shot.position[1], shot.position[2]);
    camera.up.set(0, 1, 0);
    camera.lookAt(shot.target[0], shot.target[1], shot.target[2]);
    camera.fov = shot.fov;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    return sample;
  }

  return { renderer, resize, seek, get lastSample() { return lastSample; } };
}
