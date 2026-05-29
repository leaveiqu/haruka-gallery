/**
 * ═══════════════════════════════════════════════════════════════
 *  Haruka's Gallery — main.js  (v2 — corrected)
 *  A birthday gift virtual art gallery featuring Shiho (VRM)
 *  Theme: More More Jump! × 桐谷遙
 * ═══════════════════════════════════════════════════════════════
 *
 *  ★ KEY CUSTOMIZATION POINTS ARE MARKED WITH ★ STAR COMMENTS ★
 *
 *  1) MODEL REPLACEMENT  → search "★ MODEL REPLACEMENT ★"
 *  2) ARTWORK INFO       → search "★ ARTWORK DATA ★"
 *
 * ═══════════════════════════════════════════════════════════════
 */

import * as THREE from 'three';
import { GLTFLoader }        from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

// ─────────────────────────────────────────────────────────────────
//  SCENE CONSTANTS
// ─────────────────────────────────────────────────────────────────
const ROOM_W  = 28;   // gallery width
const ROOM_D  = 44;   // gallery depth
const ROOM_H  = 5.6;  // ceiling height
const WALL_T  = 0.25; // wall thickness

// Colors
const C_WALL   = 0xf5f0e8;  // warm ivory
const C_CEIL   = 0xe8e4dc;
const C_METAL  = 0x1a1a1a;  // black metal trim
const C_GREEN  = 0x88dd44;  // MMJ green
const C_BLUE   = 0x99ccff;  // Haruka blue
const C_GOLD   = 0xc9a96e;

// ─────────────────────────────────────────────────────────────────
//  ★ ARTWORK DATA ★
//  Each entry defines one framed painting on the gallery walls.
//  HOW TO EDIT:
//    • title  — artwork title shown in the info panel
//    • desc   — description paragraph shown in the panel
//    • meta   — medium / year line shown at the bottom
//    • color  — canvas fill color (hex number) as placeholder art
//    • accent — a tinted overlay color for the canvas
//    • pos    — [x, y, z] world position of the frame centre
//    • rotY   — rotation around Y axis (radians).
//               0           = painting faces –Z (back wall)
//               Math.PI     = painting faces +Z (front wall)
//               Math.PI/2   = painting faces –X (left / east wall)
//              -Math.PI/2   = painting faces +X (right / west wall)
//    • size   — [width, height] of the painting in world units
//
//  ★ TO SHOW A REAL IMAGE instead of a flat color:
//    1. Put your image in the  images/  subfolder.
//    2. Add a field:  tex: 'images/my-painting.jpg'
//    The buildArtworks() function will pick it up automatically.
// ─────────────────────────────────────────────────────────────────
const ARTWORKS = [
  {
    title: '春風ひとひら',
    desc:  '四月の校庭。散りゆく桜の花びらが風に乗って舞い上がり、遥の笑顔を縁取る。「また来年も一緒に見ようね」——あの約束は、今も胸の中で咲き続けている。',
    meta:  'Digital · 2024',
    color: 0xffe4e8,
    accent: C_BLUE,
    pos:  [-10, 2.3, -ROOM_D / 2 + 0.35],
    rotY: 0,
    size: [2.8, 1.9],
  },
  {
    title: 'Clover Stage',
    desc:  'スポットライトの下、緑のクローバーが三つ葉を広げる。More More Jump! の舞台は今日も満員。「みんなの笑顔がわたしのエネルギー！」',
    meta:  'Digital · 2024',
    color: 0xd4f5b0,
    accent: C_GREEN,
    pos:  [0, 2.3, -ROOM_D / 2 + 0.35],
    rotY: 0,
    size: [2.8, 1.9],
  },
  {
    title: '夜の水族館',
    desc:  '閉館後の水族館、二人きり。水槽の青い光が遥の横顔を照らす。ペンギンたちが泳ぎ回る中、時間だけが静かに溶けていった。',
    meta:  'Digital · 2024',
    color: 0xb8e0ff,
    accent: C_BLUE,
    pos:  [10, 2.3, -ROOM_D / 2 + 0.35],
    rotY: 0,
    size: [2.8, 1.9],
  },
  {
    title: '四葉のお守り',
    desc:  '手のひらに乗った小さな四葉のクローバー。「これ、きみに」——あの日渡されたお守りは、今でも財布の中で光り続けている。',
    meta:  'Digital · 2024',
    color: 0xc8f0a0,
    accent: C_GREEN,
    pos:  [-ROOM_W / 2 + 0.35, 2.3, 0],
    rotY:  Math.PI / 2,
    size: [2.4, 1.7],
  },
  {
    title: 'Blue Horizon',
    desc:  '遥かな水平線。水色と白だけで描かれた世界に、ひとつの星が瞬く。「どんなに遠くても、同じ空の下にいるから大丈夫」',
    meta:  'Digital · 2024',
    color: 0xd0ecff,
    accent: C_BLUE,
    pos:  [-ROOM_W / 2 + 0.35, 2.3, 10],
    rotY:  Math.PI / 2,
    size: [2.4, 1.7],
  },
  {
    title: 'Happy Birthday, 遥',
    desc:  '今日という特別な日に、あなたへ届けたい言葉がある。いつも笑顔をありがとう。これからもずっと、あなたの隣で応援し続けるよ。🎂💚',
    meta:  'With Love · 2024',
    color: 0xfff0d0,
    accent: C_GOLD,
    pos:  [ROOM_W / 2 - 0.35, 2.3, 0],
    rotY: -Math.PI / 2,
    size: [3.0, 2.0],
  },
  {
    title: 'Penguin Parade',
    desc:  '桐谷遙の愛するペンギンたち。よちよち歩きのフォルムが愛らしく、見ているだけで心がほっこりする。「ねぇ、一番右の子が一番かわいくない？」',
    meta:  'Digital · 2024',
    color: 0xe0f4ff,
    accent: C_BLUE,
    pos:  [ROOM_W / 2 - 0.35, 2.3, 10],
    rotY: -Math.PI / 2,
    size: [2.4, 1.7],
  },
];

// ─────────────────────────────────────────────────────────────────
//  ★ MODEL REPLACEMENT ★
//  Change the path below to swap the character model.
//
//  Required file structure:
//    project/
//      index.html
//      main.js
//      style.css
//      models/
//        Shiho.vrm    ← your VRM file here
//
//  • Rename 'Shiho.vrm' if your file has a different name.
//  • For a plain GLB/GLTF (non-VRM) see the comment inside
//    loadCharacter() below.
// ─────────────────────────────────────────────────────────────────
const VRM_PATH = 'models/Shiho.vrm';

// ─────────────────────────────────────────────────────────────────
//  DOM REFS
// ─────────────────────────────────────────────────────────────────
const canvas      = document.getElementById('canvas');
const loadScreen  = document.getElementById('loading-screen');
const loadBar     = document.getElementById('loading-bar');
const loadText    = document.getElementById('loading-text');
const hud         = document.getElementById('hud');
const panel       = document.getElementById('artwork-panel');
const panelTitle  = document.getElementById('panel-title');
const panelDesc   = document.getElementById('panel-desc');
const panelMeta   = document.getElementById('panel-meta');
const panelClose  = document.getElementById('panel-close');

// ─────────────────────────────────────────────────────────────────
//  RENDERER
// ─────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled    = true;
renderer.shadowMap.type       = THREE.PCFSoftShadowMap;
renderer.toneMapping          = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure  = 1.1;
renderer.outputColorSpace     = THREE.SRGBColorSpace;

// ─────────────────────────────────────────────────────────────────
//  SCENE & CAMERA
// ─────────────────────────────────────────────────────────────────
const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.fog        = new THREE.FogExp2(0x1a1410, 0.020);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 2.4, 6);

// ─────────────────────────────────────────────────────────────────
//  CLOCK & STATE
// ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

const state = {
  vrm:            null,
  mixer:          null,
  idleAction:     null,
  walkAction:     null,
  isWalking:      false,
  keys:           {},
  charPos:        new THREE.Vector3(0, 0, 4),
  charAngle:      Math.PI,
  camYaw:         Math.PI,
  camPitch:       0.3,
  camDist:        4.5,
  // Mouse drag — also used to suppress click after drag
  mouseDragging:  false,
  mouseHasMoved:  false,   // ← NEW: true if cursor moved since mousedown
  lastMX:         0,
  lastMY:         0,
  artworkMeshes:  [],
  focusedArtwork: null,
  camFocusTarget: null,
  camFocusOrigin: null,
  camLerpT:       1,
  needle: document.getElementById('compass-needle'),
};

// ─────────────────────────────────────────────────────────────────
//  LOADING MANAGER
//  We manually drive the progress bar from the VRM xhr callback
//  because LoadingManager.onLoad fires as soon as the queue is
//  empty — which can happen before the heavy VRM binary is decoded.
//  We call finishLoading() ourselves once VRM is fully ready.
// ─────────────────────────────────────────────────────────────────
const manager = new THREE.LoadingManager();
manager.onProgress = (url, loaded, total) => {
  const pct = Math.round((loaded / total) * 100);
  loadBar.style.width  = pct + '%';
  loadText.textContent = `正在前往畫展... ${pct}%`;
};

function finishLoading() {
  loadText.textContent = '歡迎蒞臨！';
  loadBar.style.width  = '100%';
  setTimeout(() => {
    loadScreen.classList.add('fade-out');
    hud.classList.add('visible');
  }, 700);
}

// ─────────────────────────────────────────────────────────────────
//  LIGHTING
// ─────────────────────────────────────────────────────────────────
function buildLighting() {
  // Warm ambient fill
  scene.add(new THREE.AmbientLight(0xfff5e8, 0.55));

  // Main shadow-casting directional (overhead softbox)
  const dir = new THREE.DirectionalLight(0xfff8f0, 1.2);
  dir.position.set(0, ROOM_H - 0.5, 0);
  dir.castShadow            = true;
  dir.shadow.mapSize.width  = 2048;
  dir.shadow.mapSize.height = 2048;
  dir.shadow.camera.near    = 0.5;
  dir.shadow.camera.far     = 60;
  dir.shadow.camera.left    = -16;
  dir.shadow.camera.right   = 16;
  dir.shadow.camera.top     = 24;
  dir.shadow.camera.bottom  = -24;
  dir.shadow.bias           = -0.0005;
  scene.add(dir);

  // Ceiling spot-grid
  const spotGrid = [
    [-9, -18], [0, -18], [9, -18],
    [-9,   0], [0,   0], [9,   0],
    [-9,  16], [0,  16], [9,  16],
  ];
  spotGrid.forEach(([x, z]) => {
    const spot = new THREE.SpotLight(0xffe8cc, 0.9, 18, Math.PI / 8, 0.55, 1.8);
    spot.position.set(x, ROOM_H - 0.1, z);
    spot.target.position.set(x, 0, z);
    spot.castShadow = false;
    scene.add(spot, spot.target);
  });

  // MMJ green accent glow
  const gf = new THREE.PointLight(C_GREEN, 0.35, 8);
  gf.position.set(0, 2, 19);
  scene.add(gf);

  // Haruka blue accent glow
  const bf = new THREE.PointLight(C_BLUE, 0.3, 10);
  bf.position.set(-11, 2, 0);
  scene.add(bf);
}

// ─────────────────────────────────────────────────────────────────
//  PROCEDURAL MATERIALS
// ─────────────────────────────────────────────────────────────────
function makeWallMat() {
  return new THREE.MeshStandardMaterial({ color: C_WALL, roughness: 0.88, metalness: 0.0 });
}

function makeFloorMat() {
  const size = 512;
  const cv   = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#7a5c12';
  ctx.fillRect(0, 0, size, size);
  const pw = size / 6;
  for (let i = 0; i < 6; i++) {
    const x = i * pw;
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
    for (let g = 0; g < 14; g++) {
      const y = g * (size / 14) + Math.random() * 6;
      ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? 180 : 100},90,20,0.08)`;
      ctx.lineWidth = 0.6 + Math.random();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + pw, y + (Math.random() - 0.5) * 18); ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(ROOM_W / 4, ROOM_D / 4);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0.0 });
}

function makeMetalMat() {
  return new THREE.MeshStandardMaterial({ color: C_METAL, roughness: 0.3, metalness: 0.85 });
}

function makeGoldMat() {
  return new THREE.MeshStandardMaterial({ color: C_GOLD, roughness: 0.25, metalness: 0.9 });
}

// ─────────────────────────────────────────────────────────────────
//  THREE-LEAF CLOVER HELPERS
//
//  A proper More More Jump! clover:
//   • Three heart-shaped lobes, each rotated 120° around the stem
//   • Hearts are oriented with their POINT facing the center
//
//  We build each heart as a 2D canvas path, bake it into a
//  CanvasTexture, then map it onto a thin PlaneGeometry.
//  The result sits flat (scale.y squished) for floor inlays,
//  or upright for pedestal sculptures.
// ─────────────────────────────────────────────────────────────────

/**
 * Draws one heart on a square CanvasRenderingContext2D.
 * The heart's POINT is at the bottom (towards the canvas center
 * when the plane is rotated to place the tip inward).
 */
function makeHeartTexture(color = '#88dd44', size = 128) {
  const cv  = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const s = size;
  ctx.fillStyle = color;
  ctx.beginPath();
  // Heart centred at (s/2, s*0.42), tip pointing DOWN
  const x = s / 2, y = s * 0.44, w = s * 0.38, h = s * 0.36;
  ctx.moveTo(x, y + h);                            // tip (bottom)
  ctx.bezierCurveTo(x - w * 1.6, y + h * 0.55,
                    x - w * 1.6, y - h * 0.85,
                    x,           y - h * 0.35);    // left lobe top
  ctx.bezierCurveTo(x + w * 1.6, y - h * 0.85,
                    x + w * 1.6, y + h * 0.55,
                    x,           y + h);            // back to tip
  ctx.closePath();
  ctx.fill();
  return cv;
}

/**
 * Adds a three-leaf clover to the scene.
 * @param {number} cx - world X of clover centre
 * @param {number} cy - world Y of clover base
 * @param {number} cz - world Z of clover centre
 * @param {number} scale - overall scale (default 1)
 * @param {boolean} flat - true = floor inlay (horizontal), false = upright sculpture
 */
function buildClover(cx, cy, cz, scale = 1, flat = true) {
  const heartCanvas = makeHeartTexture('#88dd44', 256);
  const tex = new THREE.CanvasTexture(heartCanvas);
  tex.needsUpdate = true;

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    roughness: flat ? 0.65 : 0.3,
    metalness: flat ? 0.0 : 0.15,
    emissive: new THREE.Color(C_GREEN),
    emissiveMap: tex,
    emissiveIntensity: 0.12,
    side: THREE.DoubleSide,
    alphaTest: 0.05,
  });

  const leafRadius = 0.22 * scale;   // distance from centre to lobe
  const leafSize   = 0.32 * scale;   // plane geometry size

  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;   // 0°, 120°, 240°

    // Offset: lobe centre sits leafRadius away from origin
    const ox = Math.sin(angle) * leafRadius;
    const oz = Math.cos(angle) * leafRadius;

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(leafSize, leafSize), mat);

    if (flat) {
      // Lie flat on floor, rotate so heart TIP points toward centre
      plane.rotation.x = -Math.PI / 2;
      plane.rotation.z = angle;          // tip faces origin
      plane.position.set(cx + ox, cy + 0.005, cz + oz);
    } else {
      // Upright sculpture on pedestal, tip points inward (down = toward stem base)
      plane.rotation.y = -angle;         // face outward
      plane.rotation.z = Math.PI;        // flip so tip is at bottom / inward
      plane.position.set(cx + ox, cy, cz + oz);
    }

    scene.add(plane);
  }

  // Stem (thin cylinder)
  const stemMat = new THREE.MeshStandardMaterial({
    color: C_GREEN, roughness: 0.5, metalness: 0.1,
    emissive: new THREE.Color(C_GREEN), emissiveIntensity: 0.1,
  });
  const stemH = flat ? 0.008 : 0.22 * scale;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02 * scale, 0.025 * scale, stemH, 8),
    stemMat
  );
  stem.position.set(cx, cy + stemH / 2, cz);
  scene.add(stem);
}

// ─────────────────────────────────────────────────────────────────
//  GALLERY ARCHITECTURE
// ─────────────────────────────────────────────────────────────────
function buildGallery() {
  const wallMat  = makeWallMat();
  const floorMat = makeFloorMat();
  const ceilMat  = new THREE.MeshStandardMaterial({ color: C_CEIL, roughness: 0.9 });
  const metalMat = makeMetalMat();
  const goldMat  = makeGoldMat();

  const box = (w, h, d, mat, x, y, z, shadow = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (shadow) { m.castShadow = true; m.receiveShadow = true; }
    scene.add(m);
    return m;
  };

  // ── Room shell ──
  box(ROOM_W, 0.15, ROOM_D, floorMat, 0, -0.075, 0);
  box(ROOM_W, 0.15, ROOM_D, ceilMat,  0, ROOM_H + 0.075, 0, false);
  box(ROOM_W, ROOM_H, WALL_T, wallMat, 0, ROOM_H / 2, -ROOM_D / 2);
  box(ROOM_W, ROOM_H, WALL_T, wallMat, 0, ROOM_H / 2,  ROOM_D / 2);
  box(WALL_T, ROOM_H, ROOM_D, wallMat, -ROOM_W / 2, ROOM_H / 2, 0);
  box(WALL_T, ROOM_H, ROOM_D, wallMat,  ROOM_W / 2, ROOM_H / 2, 0);

  // ── Black metal skirting boards ──
  box(ROOM_W, 0.12, 0.06, metalMat, 0, 0.06, -ROOM_D / 2 + 0.13);
  box(ROOM_W, 0.12, 0.06, metalMat, 0, 0.06,  ROOM_D / 2 - 0.13);
  box(0.06, 0.12, ROOM_D, metalMat, -ROOM_W / 2 + 0.13, 0.06, 0);
  box(0.06, 0.12, ROOM_D, metalMat,  ROOM_W / 2 - 0.13, 0.06, 0);

  // ── Ceiling picture rail ──
  const rH = ROOM_H - 0.08;
  box(ROOM_W, 0.06, 0.06, metalMat, 0, rH, -ROOM_D / 2 + 0.15);
  box(ROOM_W, 0.06, 0.06, metalMat, 0, rH,  ROOM_D / 2 - 0.15);
  box(0.06, 0.06, ROOM_D, metalMat, -ROOM_W / 2 + 0.15, rH, 0);
  box(0.06, 0.06, ROOM_D, metalMat,  ROOM_W / 2 - 0.15, rH, 0);

  // ── Central black pillar with MMJ green stripe ──
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.8 });
  box(0.22, ROOM_H, 0.22, pillarMat, 0, ROOM_H / 2, 0);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: C_GREEN, roughness: 0.4,
    emissive: new THREE.Color(C_GREEN), emissiveIntensity: 0.18,
  });
  box(0.24, 0.04, 0.24, stripeMat, 0, 1.2, 0, false);
  box(0.24, 0.04, 0.24, stripeMat, 0, 2.5, 0, false);

  // ── Benches ──
  buildBench(metalMat, goldMat, -5.5,  2);
  buildBench(metalMat, goldMat,  5.5,  2);
  buildBench(metalMat, goldMat, -5.5, -12);
  buildBench(metalMat, goldMat,  5.5, -12);

  // ── Pedestals with clover sculpture ──
  buildPedestal(metalMat, goldMat, 0,   0);
  buildPedestal(metalMat, goldMat, 0, -14);

  // ── Ceiling light fixtures ──
  buildCeilingFixtures(metalMat);

  // ── Penguin corner decorations (Haruka motif) ──
  buildPenguin(-ROOM_W / 2 + 1.2,  0,  ROOM_D / 2 - 1.5);
  buildPenguin(-ROOM_W / 2 + 1.2,  0, -ROOM_D / 2 + 1.5);
  buildPenguin( ROOM_W / 2 - 1.2,  0,  ROOM_D / 2 - 1.5);

  // ── Three-leaf clover floor inlays (MMJ motif) ──
  buildClover(0, 0,   0, 1.6, true);
  buildClover(0, 0, -14, 1.6, true);
}

function buildBench(metalMat, goldMat, x, z) {
  const b = (w,h,d,mat,px,py,pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    m.position.set(px,py,pz);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  };
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.85 });
  b(1.8, 0.08, 0.55, cushionMat, x, 0.45, z);
  [[x-0.75,z-0.2],[x+0.75,z-0.2],[x-0.75,z+0.2],[x+0.75,z+0.2]].forEach(([px,pz]) => {
    b(0.04, 0.45, 0.04, metalMat, px, 0.225, pz);
  });
  b(1.84, 0.015, 0.57, goldMat, x, 0.49, z);
}

function buildPedestal(metalMat, goldMat, x, z) {
  const b = (w,h,d,mat,px,py,pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    m.position.set(px,py,pz);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  };
  const bMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.7 });
  b(0.55, 1.1, 0.55, bMat, x, 0.55, z);
  b(0.65, 0.04, 0.65, goldMat, x, 1.12, z);
  b(0.45, 0.04, 0.45, goldMat, x, 0.01, z);

  // ── Three-leaf clover sculpture on top (upright, hearts pointing inward) ──
  buildClover(x, 1.22, z, 0.9, false);
}

function buildCeilingFixtures(metalMat) {
  const rGeo = new THREE.TorusGeometry(0.12, 0.025, 8, 24);
  const dGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff0cc,
    emissive: new THREE.Color(0xfff0cc), emissiveIntensity: 1.2,
  });
  const spots = [
    [-9,-18],[0,-18],[9,-18],
    [-9,0],[0,0],[9,0],
    [-9,16],[0,16],[9,16],
  ];
  spots.forEach(([x, z]) => {
    const ring = new THREE.Mesh(rGeo, metalMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, ROOM_H - 0.05, z);
    scene.add(ring);
    const disc = new THREE.Mesh(dGeo, metalMat);
    disc.position.set(x, ROOM_H - 0.05, z);
    scene.add(disc);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), bulbMat);
    bulb.position.set(x, ROOM_H - 0.1, z);
    scene.add(bulb);
  });
}

function buildPenguin(x, yBase, z) {
  const darkMat   = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
  const whiteMat  = new THREE.MeshStandardMaterial({ color: 0xedf2f7, roughness: 0.7 });
  const blueMat   = new THREE.MeshStandardMaterial({ color: C_BLUE, roughness: 0.4, emissive: new THREE.Color(C_BLUE), emissiveIntensity: 0.06 });
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xfd9800, roughness: 0.5 });

  const add = (geo, mat, ox, oy, oz, rx=0, ry=0, rz=0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x + ox, yBase + oy, z + oz);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    scene.add(m);
  };

  add(new THREE.SphereGeometry(0.22, 12, 10, 0, Math.PI*2, 0, Math.PI*0.75), darkMat,  0, 0.30,  0);
  add(new THREE.SphereGeometry(0.13, 10,  8), whiteMat,  0, 0.34,  0.10);
  add(new THREE.SphereGeometry(0.14, 10,  8), darkMat,   0, 0.62,  0);
  add(new THREE.SphereGeometry(0.025, 6, 5), whiteMat,  -0.055, 0.68, 0.10);
  add(new THREE.SphereGeometry(0.025, 6, 5), whiteMat,   0.055, 0.68, 0.10);
  add(new THREE.SphereGeometry(0.015, 6, 5), darkMat,   -0.055, 0.68, 0.118);
  add(new THREE.SphereGeometry(0.015, 6, 5), darkMat,    0.055, 0.68, 0.118);
  add(new THREE.ConeGeometry(0.03, 0.08, 6), orangeMat,  0, 0.64, 0.14, Math.PI/2, 0, 0);
  add(new THREE.TorusGeometry(0.135, 0.02, 6, 16), blueMat, 0, 0.55, 0, Math.PI/2, 0, 0);
  add(new THREE.BoxGeometry(0.07, 0.02, 0.12), orangeMat, -0.08, 0.02, 0.04);
  add(new THREE.BoxGeometry(0.07, 0.02, 0.12), orangeMat,  0.08, 0.02, 0.04);
}

// ─────────────────────────────────────────────────────────────────
//  ARTWORK FRAMES
// ─────────────────────────────────────────────────────────────────
function buildArtworks() {
  const texLoader = new THREE.TextureLoader(manager);

  ARTWORKS.forEach((art) => {
    const [aw, ah] = art.size;
    const group = new THREE.Group();
    group.position.set(...art.pos);
    group.rotation.y = art.rotY;
    group.userData   = { artwork: art };

    // ── Black thin frame ──
    const frameT   = 0.045;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.35, metalness: 0.6 });
    const barH  = new THREE.Mesh(new THREE.BoxGeometry(aw + frameT*2, frameT, 0.04), frameMat);
    const barHb = barH.clone();
    barH.position.y  =  ah/2 + frameT/2;
    barHb.position.y = -ah/2 - frameT/2;
    group.add(barH, barHb);
    const barV  = new THREE.Mesh(new THREE.BoxGeometry(frameT, ah, 0.04), frameMat);
    const barVr = barV.clone();
    barV.position.x  = -aw/2 - frameT/2;
    barVr.position.x =  aw/2 + frameT/2;
    group.add(barV, barVr);

    // ── Canvas face ──
    //
    // ★ IMAGE TEXTURE SUPPORT ★
    // If the artwork entry has a 'tex' field (e.g. tex: 'images/spring.jpg'),
    // we load it via TextureLoader. Otherwise we use the flat color.
    //
    let canvasMat;
    if (art.tex) {
      const t = texLoader.load(art.tex);
      canvasMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.88 });
    } else {
      canvasMat = new THREE.MeshStandardMaterial({ color: art.color, roughness: 0.9 });
    }
    const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(aw, ah), canvasMat);
    canvasMesh.position.z = 0.021;
    group.add(canvasMesh);

    // Subtle accent overlay (painted-canvas feel)
    const overlayMat = new THREE.MeshStandardMaterial({
      color: art.accent || 0xffffff,
      transparent: true, opacity: 0.06, roughness: 1.0,
    });
    const overlay = new THREE.Mesh(new THREE.PlaneGeometry(aw * 0.6, ah * 0.6), overlayMat);
    overlay.position.set(aw * 0.15, -ah * 0.15, 0.022);
    group.add(overlay);

    // Gold nameplate below frame
    const plateMat = new THREE.MeshStandardMaterial({ color: C_GOLD, roughness: 0.2, metalness: 0.95 });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.012), plateMat);
    plate.position.set(0, -ah/2 - 0.22, 0.01);
    group.add(plate);

    // Wall-mount wire detail
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.8 });
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 4), wireMat);
    wire.position.set(0, ah/2 + 0.13, -0.02);
    group.add(wire);

    group.castShadow    = true;
    group.receiveShadow = true;
    scene.add(group);

    // Register for raycasting
    state.artworkMeshes.push({ group, face: canvasMesh, art });
  });
}

// ─────────────────────────────────────────────────────────────────
//  VRM CHARACTER LOADER
// ─────────────────────────────────────────────────────────────────
function loadCharacter() {
  /**
   * ★ MODEL REPLACEMENT — DETAILED NOTES ★
   *
   * VRM LOADING FLOW:
   *   1. GLTFLoader.load(VRM_PATH)  → binary fetch + GLTF parse
   *   2. VRMLoaderPlugin processes VRM metadata (bones, blendshapes, etc.)
   *   3. gltf.userData.vrm  → the VRM instance
   *   4. We search gltf.animations for 'idle' / 'walk' clips by name.
   *      If found, AnimationMixer blends between them.
   *      If not found, a gentle Y-bob runs in updateCharacter() instead.
   *
   * TO SWAP TO A PLAIN GLB (non-VRM):
   *   1. Remove the  loader.register(...)  line.
   *   2. Replace the gltf.userData.vrm block with:
   *        state.vrm = { scene: gltf.scene, update: () => {} };
   *        scene.add(gltf.scene);
   *        setupVRMPosition();
   *   The rest (animation, movement) works unchanged.
   *
   * NOTE: VRMUtils.removeUnnecessaryVertices was removed in
   *   @pixiv/three-vrm v2. Only removeUnnecessaryJoints is called.
   */

  const loader = new GLTFLoader(manager);
  loader.register((parser) => new VRMLoaderPlugin(parser));

  loader.load(
    VRM_PATH,
    (gltf) => {
      const vrm = gltf.userData.vrm;

      if (!vrm) {
        // Fallback: treat as regular GLTF/GLB
        console.warn('[Gallery] No VRM metadata — loading as plain GLTF');
        gltf.scene.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        scene.add(gltf.scene);
        state.vrm = { scene: gltf.scene, update: () => {} };
        setupAnimations(gltf);
        setupVRMPosition();
        finishLoading();
        return;
      }

      // ── VRM-specific cleanup (v2 API) ──
      VRMUtils.removeUnnecessaryJoints(gltf.scene);
      // Note: removeUnnecessaryVertices was removed in three-vrm v2; do NOT call it.

      vrm.scene.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      state.vrm = vrm;
      scene.add(vrm.scene);
      setupAnimations(gltf);
      setupVRMPosition();
      finishLoading();
    },
    (progress) => {
      if (progress.total > 0) {
        const pct = Math.round((progress.loaded / progress.total) * 100);
        loadBar.style.width  = Math.min(pct, 99) + '%';
        loadText.textContent = `正在前往畫展... ${pct}%`;
      }
    },
    (err) => {
      console.error('[Gallery] VRM load failed:', err);
      // Stand-in capsule so the scene is still usable
      const dummy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 1.4, 12),
        new THREE.MeshStandardMaterial({ color: C_GREEN })
      );
      dummy.position.copy(state.charPos);
      dummy.position.y = 0.7;
      scene.add(dummy);
      state.vrm = { scene: dummy, update: () => {} };
      setupVRMPosition();
      finishLoading();
    }
  );
}

function setupAnimations(gltf) {
  if (!gltf.animations || gltf.animations.length === 0) return;
  const root  = state.vrm ? state.vrm.scene : gltf.scene;
  state.mixer = new THREE.AnimationMixer(root);

  const find = (kw) => gltf.animations.find(a => a.name.toLowerCase().includes(kw));

  const idleClip = find('idle') || find('stand') || gltf.animations[0];
  const walkClip = find('walk') || find('run');

  if (idleClip) {
    state.idleAction = state.mixer.clipAction(idleClip);
    state.idleAction.play();
  }
  if (walkClip) {
    state.walkAction = state.mixer.clipAction(walkClip);
    state.walkAction.setEffectiveWeight(0);
    state.walkAction.play();
  }
}

function setupVRMPosition() {
  if (!state.vrm) return;
  state.vrm.scene.position.copy(state.charPos);
  state.vrm.scene.rotation.y = state.charAngle;
}

// ─────────────────────────────────────────────────────────────────
//  INPUT HANDLERS
// ─────────────────────────────────────────────────────────────────
window.addEventListener('keydown', e => { state.keys[e.code] = true; });
window.addEventListener('keyup',   e => { state.keys[e.code] = false; });

window.addEventListener('mousedown', e => {
  if (e.button === 0 || e.button === 2) {
    state.mouseDragging = true;
    state.mouseHasMoved = false;   // reset move-flag on each press
    state.lastMX = e.clientX;
    state.lastMY = e.clientY;
  }
});
window.addEventListener('mouseup', () => { state.mouseDragging = false; });
window.addEventListener('mousemove', e => {
  if (!state.mouseDragging) return;
  const dx = e.clientX - state.lastMX;
  const dy = e.clientY - state.lastMY;
  // Only count as drag if cursor moved > 4px (suppresses accidental artwork open)
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.mouseHasMoved = true;
  state.lastMX = e.clientX;
  state.lastMY = e.clientY;
  state.camYaw   -= dx * 0.003;
  state.camPitch  = Math.max(-0.25, Math.min(0.6, state.camPitch + dy * 0.003));
});

// Touch
window.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    state.mouseDragging = true;
    state.mouseHasMoved = false;
    state.lastMX = e.touches[0].clientX;
    state.lastMY = e.touches[0].clientY;
  }
}, { passive: true });
window.addEventListener('touchend', () => { state.mouseDragging = false; });
window.addEventListener('touchmove', e => {
  if (!state.mouseDragging || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - state.lastMX;
  const dy = e.touches[0].clientY - state.lastMY;
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.mouseHasMoved = true;
  state.lastMX = e.touches[0].clientX;
  state.lastMY = e.touches[0].clientY;
  state.camYaw   -= dx * 0.004;
  state.camPitch  = Math.max(-0.25, Math.min(0.6, state.camPitch + dy * 0.004));
}, { passive: true });

// ── Artwork click (skip if pointer dragged) ──
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();
window.addEventListener('click', e => {
  if (state.mouseHasMoved) return;   // suppress after camera drag
  pointer.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(state.artworkMeshes.map(a => a.face), false);
  if (hits.length > 0) {
    const found = state.artworkMeshes.find(a => a.face === hits[0].object);
    if (found) openArtworkPanel(found);
  }
});

panelClose.addEventListener('click', closeArtworkPanel);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────────────────────────────
//  ARTWORK PANEL
// ─────────────────────────────────────────────────────────────────
function openArtworkPanel(found) {
  const { art, group } = found;
  panelTitle.textContent = art.title;
  panelDesc.textContent  = art.desc;
  panelMeta.textContent  = art.meta;
  panel.classList.remove('hidden');

  // Camera: approach from in front of the painting
  const worldPos = new THREE.Vector3();
  group.getWorldPosition(worldPos);
  // "In front of" = offset in the direction the painting faces
  const fwd = new THREE.Vector3(Math.sin(group.rotation.y), 0, Math.cos(group.rotation.y))
    .multiplyScalar(2.8);

  state.camFocusOrigin = camera.position.clone();
  state.camFocusTarget = worldPos.clone().add(new THREE.Vector3(fwd.x, 0.3, fwd.z));
  state.camLerpT       = 0;
  state.focusedArtwork = found;
}

function closeArtworkPanel() {
  panel.classList.add('hidden');
  state.focusedArtwork = null;
  state.camFocusTarget = null;
}

// ─────────────────────────────────────────────────────────────────
//  CHARACTER MOVEMENT
// ─────────────────────────────────────────────────────────────────
const SPEED  = 4.5;
const HALF_W = ROOM_W / 2 - 0.55;
const HALF_D = ROOM_D / 2 - 0.55;

function updateCharacter(dt) {
  if (!state.vrm) return;

  const moveDir = new THREE.Vector3();
  if (state.keys['KeyW'] || state.keys['ArrowUp'])    moveDir.z -= 1;
  if (state.keys['KeyS'] || state.keys['ArrowDown'])  moveDir.z += 1;
  if (state.keys['KeyA'] || state.keys['ArrowLeft'])  moveDir.x -= 1;
  if (state.keys['KeyD'] || state.keys['ArrowRight']) moveDir.x += 1;

  const moving = moveDir.lengthSq() > 0;

  if (moving) {
    moveDir.normalize();
    const sin = Math.sin(state.camYaw), cos = Math.cos(state.camYaw);
    const world = new THREE.Vector3(
      moveDir.x * cos - moveDir.z * sin,
      0,
      moveDir.x * sin + moveDir.z * cos
    );
    state.charPos.addScaledVector(world, SPEED * dt);
    state.charPos.x = Math.max(-HALF_W, Math.min(HALF_W, state.charPos.x));
    state.charPos.z = Math.max(-HALF_D, Math.min(HALF_D, state.charPos.z));

    const ta = Math.atan2(world.x, world.z);
    let da = ta - state.charAngle;
    while (da >  Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    state.charAngle += da * Math.min(1, 10 * dt);
  }

  state.vrm.scene.position.x = state.charPos.x;
  state.vrm.scene.position.z = state.charPos.z;
  state.vrm.scene.position.y = state.charPos.y + Math.sin(clock.elapsedTime * 1.8) * 0.003;
  state.vrm.scene.rotation.y = state.charAngle;

  // Blend idle ↔ walk
  if (state.mixer && moving !== state.isWalking) {
    state.isWalking = moving;
    state.walkAction?.setEffectiveWeight(moving ? 1 : 0);
    state.idleAction?.setEffectiveWeight(moving ? 0 : 1);
  }

  state.vrm.update(dt);
}

// ─────────────────────────────────────────────────────────────────
//  THIRD-PERSON CAMERA
// ─────────────────────────────────────────────────────────────────
function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

function updateCamera(dt) {
  // Artwork focus mode
  if (state.camFocusTarget && state.camLerpT < 1) {
    state.camLerpT = Math.min(1, state.camLerpT + dt * 1.4);
    camera.position.lerpVectors(state.camFocusOrigin, state.camFocusTarget, easeInOut(state.camLerpT));
    const wp = new THREE.Vector3();
    state.focusedArtwork?.group.getWorldPosition(wp);
    camera.lookAt(wp.x, wp.y, wp.z);
    return;
  }

  // Standard third-person follow
  const d  = state.camDist;
  const px = state.charPos.x + d * Math.sin(state.camYaw) * Math.cos(state.camPitch);
  const py = state.charPos.y + 1.5 + d * Math.sin(state.camPitch);
  const pz = state.charPos.z + d * Math.cos(state.camYaw) * Math.cos(state.camPitch);

  const cx = Math.max(-HALF_W + 0.2, Math.min(HALF_W - 0.2, px));
  const cz = Math.max(-HALF_D + 0.2, Math.min(HALF_D - 0.2, pz));

  camera.position.lerp(new THREE.Vector3(cx, Math.max(0.4, py), cz), 0.12);
  camera.lookAt(state.charPos.x, state.charPos.y + 1.2, state.charPos.z);

  if (state.needle) {
    state.needle.setAttribute(
      'transform',
      `rotate(${(-state.camYaw * 180 / Math.PI).toFixed(1)}, 18, 18)`
    );
  }
}

// ─────────────────────────────────────────────────────────────────
//  RENDER LOOP
// ─────────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (state.mixer) state.mixer.update(dt);
  updateCharacter(dt);
  updateCamera(dt);
  renderer.render(scene, camera);
}

// ─────────────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────────────
function init() {
  buildLighting();
  buildGallery();
  buildArtworks();
  loadCharacter();
  animate();
}

init();
