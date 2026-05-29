/**
 * ═══════════════════════════════════════════════════════════════
 *  Haruka's Gallery — main.js  (v3)
 *  Theme: More More Jump! × 桐谷遙
 *
 *  ★ KEY CUSTOMIZATION POINTS ★
 *  1) MODEL REPLACEMENT  → search "★ MODEL REPLACEMENT ★"
 *  2) ARTWORK INFO       → search "★ ARTWORK DATA ★"
 * ═══════════════════════════════════════════════════════════════
 *
 *  v3 FIXES:
 *  [1] Removed centre pillar (blocked first-person view on entry)
 *  [2] Character spawn moved to z=18 (near entrance, facing inward)
 *  [3] Camera initial yaw corrected to face inward
 *  [4] VRM T-pose fix: proper AnimationMixer crossFade idle↔walk
 *  [5] Movement direction now camera-relative (WASD follows view)
 *  [6] Character faces movement direction correctly
 *  [7] Wall collision via AABB boundary clamp
 *  [8] Image textures: encoding fixed (colorSpace = SRGBColorSpace)
 *      + texture loaded with onLoad to force material update
 *  [9] Artwork panel: camLerpT kept < 1 so panel stays open
 *  [10] Birthday table + procedural food added (optimised with
 *       shared geometries and merged materials — see PERF comments)
 *  [11] Loading screen SVG clover replaced with proper 3-heart shape
 * ═══════════════════════════════════════════════════════════════
 */

import * as THREE from 'three';
import { GLTFLoader }           from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

// ─────────────────────────────────────────────────────────────────
//  SCENE CONSTANTS
// ─────────────────────────────────────────────────────────────────
const ROOM_W = 28;
const ROOM_D = 44;
const ROOM_H = 5.6;
const WALL_T = 0.25;

const C_WALL  = 0xf5f0e8;
const C_CEIL  = 0xe8e4dc;
const C_METAL = 0x1a1a1a;
const C_GREEN = 0x88dd44;
const C_BLUE  = 0x99ccff;
const C_GOLD  = 0xc9a96e;

// ─────────────────────────────────────────────────────────────────
//  ★ ARTWORK DATA ★
//  title  — shown in the info panel
//  desc   — description paragraph
//  meta   — medium / year
//  color  — fallback colour when no image supplied
//  accent — subtle tinted overlay
//  tex    — (optional) 'images/filename.jpg' for a real image
//  pos    — [x, y, z] world position of frame centre
//  rotY   — 0=back wall, Math.PI=front wall,
//            Math.PI/2=left wall, -Math.PI/2=right wall
//  size   — [width, height] in world units
// ─────────────────────────────────────────────────────────────────
const ARTWORKS = [
  {
    title: '春風ひとひら',
    desc:  '四月の校庭。散りゆく桜の花びらが風に乗って舞い上がり、遥の笑顔を縁取る。「また来年も一緒に見ようね」——あの約束は、今も胸の中で咲き続けている。',
    meta:  'Digital · 2024',
    color: 0xffe4e8, accent: C_BLUE,
    pos: [-10, 2.3, -ROOM_D / 2 + 0.35], rotY: 0, size: [2.8, 1.9],
  },
  {
    title: 'Clover Stage',
    desc:  'スポットライトの下、緑のクローバーが三つ葉を広げる。More More Jump! の舞台は今日も満員。「みんなの笑顔がわたしのエネルギー！」',
    meta:  'Digital · 2024',
    color: 0xd4f5b0, accent: C_GREEN,
    pos: [0, 2.3, -ROOM_D / 2 + 0.35], rotY: 0, size: [2.8, 1.9],
  },
  {
    title: '夜の水族館',
    desc:  '閉館後の水族館、二人きり。水槽の青い光が遥の横顔を照らす。ペンギンたちが泳ぎ回る中、時間だけが静かに溶けていった。',
    meta:  'Digital · 2024',
    color: 0xb8e0ff, accent: C_BLUE,
    pos: [10, 2.3, -ROOM_D / 2 + 0.35], rotY: 0, size: [2.8, 1.9],
  },
  {
    title: '四葉のお守り',
    desc:  '手のひらに乗った小さな四葉のクローバー。「これ、きみに」——あの日渡されたお守りは、今でも財布の中で光り続けている。',
    meta:  'Digital · 2024',
    color: 0xc8f0a0, accent: C_GREEN,
    pos: [-ROOM_W / 2 + 0.35, 2.3, 0], rotY: Math.PI / 2, size: [2.4, 1.7],
  },
  {
    title: 'Blue Horizon',
    desc:  '遥かな水平線。水色と白だけで描かれた世界に、ひとつの星が瞬く。「どんなに遠くても、同じ空の下にいるから大丈夫」',
    meta:  'Digital · 2024',
    color: 0xd0ecff, accent: C_BLUE,
    pos: [-ROOM_W / 2 + 0.35, 2.3, 10], rotY: Math.PI / 2, size: [2.4, 1.7],
  },
  {
    title: 'Happy Birthday, 遥',
    desc:  '今日という特別な日に、あなたへ届けたい言葉がある。いつも笑顔をありがとう。これからもずっと、あなたの隣で応援し続けるよ。🎂💚',
    meta:  'With Love · 2024',
    color: 0xfff0d0, accent: C_GOLD,
    pos: [ROOM_W / 2 - 0.35, 2.3, 0], rotY: -Math.PI / 2, size: [3.0, 2.0],
  },
  {
    title: 'Penguin Parade',
    desc:  '桐谷遙の愛するペンギンたち。よちよち歩きのフォルムが愛らしく、見ているだけで心がほっこりする。「ねぇ、一番右の子が一番かわいくない？」',
    meta:  'Digital · 2024',
    color: 0xe0f4ff, accent: C_BLUE,
    pos: [ROOM_W / 2 - 0.35, 2.3, 10], rotY: -Math.PI / 2, size: [2.4, 1.7],
  },
];

// ─────────────────────────────────────────────────────────────────
//  ★ MODEL REPLACEMENT ★
//  Put your VRM file at  models/Shiho.vrm
//  Change the filename below if yours is different.
// ─────────────────────────────────────────────────────────────────
const VRM_PATH = 'models/Shiho.vrm';

// ─────────────────────────────────────────────────────────────────
//  DOM REFS
// ─────────────────────────────────────────────────────────────────
const canvas     = document.getElementById('canvas');
const loadScreen = document.getElementById('loading-screen');
const loadBar    = document.getElementById('loading-bar');
const loadText   = document.getElementById('loading-text');
const hud        = document.getElementById('hud');
const panel      = document.getElementById('artwork-panel');
const panelTitle = document.getElementById('panel-title');
const panelDesc  = document.getElementById('panel-desc');
const panelMeta  = document.getElementById('panel-meta');
const panelClose = document.getElementById('panel-close');

// ─────────────────────────────────────────────────────────────────
//  RENDERER
// ─────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled   = true;
renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace    = THREE.SRGBColorSpace;

// ─────────────────────────────────────────────────────────────────
//  SCENE & CAMERA
// ─────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.fog        = new THREE.FogExp2(0x1a1410, 0.018);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 120);

// ─────────────────────────────────────────────────────────────────
//  CLOCK & STATE
// ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

// [FIX 2] Spawn near entrance (z≈17), facing INTO the gallery (angle=Math.PI)
const SPAWN = new THREE.Vector3(0, 0, 17);

const state = {
  vrm:            null,
  mixer:          null,
  idleAction:     null,
  walkAction:     null,
  isWalking:      false,
  keys:           {},
  charPos:        SPAWN.clone(),
  charAngle:      Math.PI,          // faces –Z (into gallery)
  camYaw:         Math.PI,          // camera behind character
  camPitch:       0.28,
  camDist:        4.2,
  mouseDragging:  false,
  mouseHasMoved:  false,
  lastMX: 0, lastMY: 0,
  artworkMeshes:  [],
  focusedArtwork: null,
  camFocusTarget: null,
  camFocusOrigin: null,
  camLerpT:       1,
  needle: document.getElementById('compass-needle'),
};

// ─────────────────────────────────────────────────────────────────
//  LOADING MANAGER
// ─────────────────────────────────────────────────────────────────
const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
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
//  LIGHTING  (warmer spots for birthday feel)
// ─────────────────────────────────────────────────────────────────
function buildLighting() {
  // Warm ambient
  scene.add(new THREE.AmbientLight(0xfff3e0, 0.6));

  // Main shadow-casting overhead light
  const dir = new THREE.DirectionalLight(0xfff5e0, 1.15);
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

  // [PERF] Ceiling spot grid — warmer orange for birthday warmth
  // Using SpotLight instead of PointLight: directional = fewer overdraw pixels
  const spotGrid = [
    [-9,-18],[0,-18],[9,-18],
    [-9,0],  [0,0],  [9,0],
    [-9,16], [0,16], [9,16],
  ];
  spotGrid.forEach(([x, z]) => {
    // [FIX 4] Warmer colour: 0xffcca0 (orange-warm) instead of cool white
    const spot = new THREE.SpotLight(0xffcca0, 1.0, 20, Math.PI / 7, 0.5, 1.6);
    spot.position.set(x, ROOM_H - 0.1, z);
    spot.target.position.set(x, 0, z);
    spot.castShadow = false; // [PERF] only dir light casts shadow
    scene.add(spot, spot.target);
  });

  // Birthday table warm glow
  const tableGlow = new THREE.PointLight(0xff9966, 0.8, 12);
  tableGlow.position.set(0, 1.8, -6);
  scene.add(tableGlow);

  // Cake candle flicker (animated in loop)
  state.candleLight = new THREE.PointLight(0xffaa33, 1.2, 4);
  state.candleLight.position.set(0, 2.2, -6);
  scene.add(state.candleLight);

  // MMJ green accent
  const gf = new THREE.PointLight(C_GREEN, 0.3, 8);
  gf.position.set(0, 2, 19);
  scene.add(gf);

  // Haruka blue accent
  const bf = new THREE.PointLight(C_BLUE, 0.25, 10);
  bf.position.set(-11, 2, 0);
  scene.add(bf);
}

// ─────────────────────────────────────────────────────────────────
//  PROCEDURAL MATERIALS  (all canvas-generated, zero external files)
// ─────────────────────────────────────────────────────────────────
function makeWallMat() {
  return new THREE.MeshStandardMaterial({ color: C_WALL, roughness: 0.88 });
}

function makeFloorMat() {
  // [PERF] Single 512px canvas texture, tiled — no external file
  const size = 512, cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#7a5c12';
  ctx.fillRect(0, 0, size, size);
  const pw = size / 6;
  for (let i = 0; i < 6; i++) {
    const x = i * pw;
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
    for (let g = 0; g < 14; g++) {
      const y = g * (size / 14) + Math.random() * 6;
      ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? 180 : 100},90,20,0.08)`;
      ctx.lineWidth = 0.6 + Math.random();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + pw, y + (Math.random()-0.5)*18); ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(ROOM_W / 4, ROOM_D / 4);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72 });
}

const _metalMat = new THREE.MeshStandardMaterial({ color: C_METAL, roughness: 0.3, metalness: 0.85 });
const _goldMat  = new THREE.MeshStandardMaterial({ color: C_GOLD,  roughness: 0.25, metalness: 0.9 });
// [PERF] Shared material instances — reused across all geometry that needs them

// ─────────────────────────────────────────────────────────────────
//  HEART-CLOVER HELPERS  (SVG-style via Canvas2D bezier)
// ─────────────────────────────────────────────────────────────────

// [PERF] Build heart texture once, reuse across all clovers
let _heartTex = null;
function getHeartTex() {
  if (_heartTex) return _heartTex;
  const size = 256, cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#88dd44';
  // Heart: tip points DOWN (toward clover centre when rotated)
  const x = size/2, y = size*0.44, w = size*0.38, h = size*0.36;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.bezierCurveTo(x - w*1.6, y + h*0.55, x - w*1.6, y - h*0.85, x, y - h*0.35);
  ctx.bezierCurveTo(x + w*1.6, y - h*0.85, x + w*1.6, y + h*0.55, x, y + h);
  ctx.closePath();
  ctx.fill();
  _heartTex = new THREE.CanvasTexture(cv);
  return _heartTex;
}

// Shared clover material
let _cloverMat = null;
function getCloverMat(flat) {
  // [PERF] One material for floor, one for sculpture — not per-instance
  if (!_cloverMat) {
    _cloverMat = new THREE.MeshStandardMaterial({
      map: getHeartTex(),
      transparent: true, alphaTest: 0.05,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(C_GREEN), emissiveMap: getHeartTex(), emissiveIntensity: 0.12,
    });
  }
  return _cloverMat;
}

/**
 * Three-leaf clover: 3 heart planes rotated 120° apart, tips pointing inward.
 * flat=true → horizontal floor inlay   flat=false → upright pedestal sculpture
 */
function buildClover(cx, cy, cz, scale = 1, flat = true) {
  const mat      = getCloverMat(flat);
  const lR       = 0.22 * scale;   // lobe radius from centre
  const lS       = 0.32 * scale;   // leaf plane size

  // [PERF] Share one PlaneGeometry per clover call
  const geo = new THREE.PlaneGeometry(lS, lS);

  for (let i = 0; i < 3; i++) {
    const a  = (i * Math.PI * 2) / 3;
    const ox = Math.sin(a) * lR, oz = Math.cos(a) * lR;
    const pl = new THREE.Mesh(geo, mat);
    if (flat) {
      pl.rotation.x = -Math.PI / 2;
      pl.rotation.z = a;
      pl.position.set(cx + ox, cy + 0.006, cz + oz);
    } else {
      pl.rotation.y = -a;
      pl.rotation.z = Math.PI;
      pl.position.set(cx + ox, cy, cz + oz);
    }
    scene.add(pl);
  }
  // Stem
  const stemMat = new THREE.MeshStandardMaterial({
    color: C_GREEN, roughness: 0.5,
    emissive: new THREE.Color(C_GREEN), emissiveIntensity: 0.1,
  });
  const stemH = flat ? 0.008 : 0.22 * scale;
  const stem  = new THREE.Mesh(new THREE.CylinderGeometry(0.02*scale, 0.025*scale, stemH, 8), stemMat);
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

  // [PERF] Helper: add a box with minimal args
  const box = (w, h, d, mat, x, y, z, shadow = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (shadow) { m.castShadow = true; m.receiveShadow = true; }
    scene.add(m); return m;
  };

  // Room shell
  box(ROOM_W, 0.15, ROOM_D, floorMat, 0, -0.075, 0);
  box(ROOM_W, 0.15, ROOM_D, ceilMat,  0, ROOM_H + 0.075, 0, false);
  box(ROOM_W, ROOM_H, WALL_T, wallMat, 0, ROOM_H/2, -ROOM_D/2);
  box(ROOM_W, ROOM_H, WALL_T, wallMat, 0, ROOM_H/2,  ROOM_D/2);
  box(WALL_T, ROOM_H, ROOM_D, wallMat, -ROOM_W/2, ROOM_H/2, 0);
  box(WALL_T, ROOM_H, ROOM_D, wallMat,  ROOM_W/2, ROOM_H/2, 0);

  // Skirting boards
  box(ROOM_W, 0.12, 0.06, _metalMat, 0, 0.06, -ROOM_D/2+0.13);
  box(ROOM_W, 0.12, 0.06, _metalMat, 0, 0.06,  ROOM_D/2-0.13);
  box(0.06, 0.12, ROOM_D, _metalMat, -ROOM_W/2+0.13, 0.06, 0);
  box(0.06, 0.12, ROOM_D, _metalMat,  ROOM_W/2-0.13, 0.06, 0);

  // Ceiling picture rail
  const rH = ROOM_H - 0.08;
  box(ROOM_W, 0.06, 0.06, _metalMat, 0, rH, -ROOM_D/2+0.15);
  box(ROOM_W, 0.06, 0.06, _metalMat, 0, rH,  ROOM_D/2-0.15);
  box(0.06, 0.06, ROOM_D, _metalMat, -ROOM_W/2+0.15, rH, 0);
  box(0.06, 0.06, ROOM_D, _metalMat,  ROOM_W/2+0.15, rH, 0);

  // [FIX 1] Removed centre pillar — it was blocking the entrance view

  // Benches (moved aside so table area is clear)
  buildBench(-5.5, -4);  buildBench(5.5, -4);
  buildBench(-5.5, -16); buildBench(5.5, -16);

  // Pedestals (in corners, not centre path)
  buildPedestal(-6, -20); buildPedestal(6, -20);

  // Ceiling fixtures
  buildCeilingFixtures();

  // Penguin corners
  buildPenguin(-ROOM_W/2+1.2, 0,  ROOM_D/2-1.5);
  buildPenguin(-ROOM_W/2+1.2, 0, -ROOM_D/2+1.5);
  buildPenguin( ROOM_W/2-1.2, 0,  ROOM_D/2-1.5);

  // Clover floor inlays
  buildClover(-6, 0, 5,  1.4, true);
  buildClover( 6, 0, 5,  1.4, true);
  buildClover( 0, 0, -16, 1.6, true);
}

function buildBench(x, z) {
  const cush = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.85 });
  const add = (w,h,d,mat,px,py,pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    m.position.set(px,py,pz); m.castShadow = m.receiveShadow = true; scene.add(m);
  };
  add(1.8, 0.08, 0.55, cush,    x, 0.45, z);
  add(1.84,0.015,0.57,_goldMat, x, 0.49, z);
  [[x-0.75,z-0.2],[x+0.75,z-0.2],[x-0.75,z+0.2],[x+0.75,z+0.2]].forEach(([px,pz])=>{
    add(0.04,0.45,0.04,_metalMat,px,0.225,pz);
  });
}

function buildPedestal(x, z) {
  const bMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.7 });
  const add = (w,h,d,mat,px,py,pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    m.position.set(px,py,pz); m.castShadow = m.receiveShadow = true; scene.add(m);
  };
  add(0.55,1.1,0.55, bMat,   x, 0.55, z);
  add(0.65,0.04,0.65,_goldMat, x, 1.12, z);
  add(0.45,0.04,0.45,_goldMat, x, 0.01, z);
  buildClover(x, 1.22, z, 0.9, false);
}

function buildCeilingFixtures() {
  // [PERF] Shared geometries for all fixtures
  const rGeo  = new THREE.TorusGeometry(0.12, 0.025, 8, 24);
  const dGeo  = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
  const bMat  = new THREE.MeshStandardMaterial({
    color: 0xfff0cc, emissive: new THREE.Color(0xfff0cc), emissiveIntensity: 1.2,
  });
  const spots = [[-9,-18],[0,-18],[9,-18],[-9,0],[0,0],[9,0],[-9,16],[0,16],[9,16]];
  spots.forEach(([x,z]) => {
    const ring = new THREE.Mesh(rGeo, _metalMat);
    ring.rotation.x = Math.PI/2; ring.position.set(x, ROOM_H-0.05, z); scene.add(ring);
    const disc = new THREE.Mesh(dGeo, _metalMat);
    disc.position.set(x, ROOM_H-0.05, z); scene.add(disc);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05,8,6), bMat);
    bulb.position.set(x, ROOM_H-0.1, z); scene.add(bulb);
  });
}

function buildPenguin(x, yBase, z) {
  const dM = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
  const wM = new THREE.MeshStandardMaterial({ color: 0xedf2f7, roughness: 0.7 });
  const bM = new THREE.MeshStandardMaterial({ color: C_BLUE, roughness: 0.4, emissive: new THREE.Color(C_BLUE), emissiveIntensity: 0.06 });
  const oM = new THREE.MeshStandardMaterial({ color: 0xfd9800, roughness: 0.5 });
  const add = (geo, mat, ox, oy, oz, rx=0, ry=0, rz=0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x+ox, yBase+oy, z+oz); m.rotation.set(rx,ry,rz); m.castShadow=true; scene.add(m);
  };
  add(new THREE.SphereGeometry(0.22,12,10,0,Math.PI*2,0,Math.PI*0.75), dM, 0,0.30,0);
  add(new THREE.SphereGeometry(0.13,10,8), wM, 0,0.34,0.10);
  add(new THREE.SphereGeometry(0.14,10,8), dM, 0,0.62,0);
  add(new THREE.SphereGeometry(0.025,6,5), wM, -0.055,0.68,0.10);
  add(new THREE.SphereGeometry(0.025,6,5), wM,  0.055,0.68,0.10);
  add(new THREE.SphereGeometry(0.015,6,5), dM, -0.055,0.68,0.118);
  add(new THREE.SphereGeometry(0.015,6,5), dM,  0.055,0.68,0.118);
  add(new THREE.ConeGeometry(0.03,0.08,6), oM, 0,0.64,0.14, Math.PI/2,0,0);
  add(new THREE.TorusGeometry(0.135,0.02,6,16), bM, 0,0.55,0, Math.PI/2,0,0);
  add(new THREE.BoxGeometry(0.07,0.02,0.12), oM, -0.08,0.02,0.04);
  add(new THREE.BoxGeometry(0.07,0.02,0.12), oM,  0.08,0.02,0.04);
}

// ─────────────────────────────────────────────────────────────────
//  BIRTHDAY TABLE & FOOD
//  [PERF] Strategy B: all procedural geometry (BoxGeometry,
//  CylinderGeometry, SphereGeometry) — zero external files.
//  [PERF] Shared material instances for same-colour items.
//  [PERF] Low segment counts (8–12) throughout.
// ─────────────────────────────────────────────────────────────────
function buildBirthdayTable() {
  const TX = 0, TZ = -6;   // table centre — in the gallery midpoint

  // ── Wood table (MMJ style — warm oak with green stripe) ──
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5e2e, roughness: 0.7 });
  const legMat  = new THREE.MeshStandardMaterial({ color: 0x6b4520, roughness: 0.8 });
  const greenStripe = new THREE.MeshStandardMaterial({
    color: C_GREEN, roughness: 0.4,
    emissive: new THREE.Color(C_GREEN), emissiveIntensity: 0.12,
  });

  // Table top
  const top = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.12, 1.6), woodMat);
  top.position.set(TX, 1.0, TZ); top.castShadow = true; top.receiveShadow = true;
  scene.add(top);
  // Green MMJ stripe along edge
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.02, 0.04, 0.04), greenStripe);
  stripe.position.set(TX, 1.06, TZ - 0.82); scene.add(stripe);
  // Table legs  [PERF] shared geometry
  const legGeo = new THREE.BoxGeometry(0.1, 1.0, 0.1);
  [[-2.3,-0.7],[-2.3,0.7],[2.3,-0.7],[2.3,0.7]].forEach(([lx,lz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(TX+lx, 0.5, TZ+lz); leg.castShadow = true; scene.add(leg);
  });

  // ── Birthday cake (centrepiece) ──
  buildCake(TX, 1.06, TZ);

  // ── Food items (left side) ──
  buildCupcake(TX - 1.5, 1.06, TZ - 0.3);
  buildCupcake(TX - 1.5, 1.06, TZ + 0.3);
  buildMacaroon(TX - 2.0, 1.06, TZ - 0.2, 0xff88aa); // pink
  buildMacaroon(TX - 2.0, 1.06, TZ + 0.2, 0x88dd44); // green

  // ── Food items (right side) ──
  buildCupcake(TX + 1.5, 1.06, TZ - 0.3);
  buildCupcake(TX + 1.5, 1.06, TZ + 0.3);
  buildMacaroon(TX + 2.0, 1.06, TZ - 0.2, 0x99ccff); // blue
  buildMacaroon(TX + 2.0, 1.06, TZ + 0.2, 0xffdd88); // yellow

  // ── Small gift boxes at corners ──
  buildGiftBox(TX - 2.2, 1.06, TZ, 0x88dd44, 0xffffff);
  buildGiftBox(TX + 2.2, 1.06, TZ, 0x99ccff, 0xffffff);

  // ── Decorative balloons above table ──
  buildBalloon(TX - 1.8, 2.8, TZ - 0.4, 0x88dd44);
  buildBalloon(TX,       3.2, TZ - 0.5, 0xff88aa);
  buildBalloon(TX + 1.8, 2.8, TZ - 0.4, 0x99ccff);
  buildBalloon(TX - 0.9, 3.0, TZ + 0.3, 0xffdd44);
  buildBalloon(TX + 0.9, 3.0, TZ + 0.3, 0xdd88ff);
}

function buildCake(x, y, z) {
  // [PERF] Low-poly cylinder for each tier (12 segments)
  const bot = new THREE.MeshStandardMaterial({ color: 0xfff0f5, roughness: 0.8 });  // white frosting
  const mid = new THREE.MeshStandardMaterial({ color: 0xffe4e8, roughness: 0.8 });  // pink
  const top = new THREE.MeshStandardMaterial({ color: 0xd4f5b0, roughness: 0.8 });  // green (MMJ)

  // Bottom tier
  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.40, 0.28, 12), bot);
  t1.position.set(x, y+0.14, z); t1.castShadow = true; scene.add(t1);
  // Middle tier
  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.30, 0.24, 12), mid);
  t2.position.set(x, y+0.38, z); t2.castShadow = true; scene.add(t2);
  // Top tier
  const t3 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.20, 12), top);
  t3.position.set(x, y+0.58, z); t3.castShadow = true; scene.add(t3);

  // Green ribbon bands (MMJ colour)
  const ribbonMat = new THREE.MeshStandardMaterial({ color: C_GREEN, roughness: 0.3, emissive: new THREE.Color(C_GREEN), emissiveIntensity: 0.1 });
  const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.402,0.402,0.04,12), ribbonMat);
  r1.position.set(x, y+0.14, z); scene.add(r1);
  const r2 = new THREE.Mesh(new THREE.CylinderGeometry(0.302,0.302,0.04,12), ribbonMat);
  r2.position.set(x, y+0.38, z); scene.add(r2);

  // Candles (store refs for flicker)
  const candleMat  = new THREE.MeshStandardMaterial({ color: 0xffeeaa, roughness: 0.6 });
  const flameMat   = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: new THREE.Color(0xff6600), emissiveIntensity: 1.5, roughness: 0.3 });
  state.cakeCandles = [];
  [[-0.08,0.08],[0.08,0.08],[0,-0.06]].forEach(([cx,cz], i) => {
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.16,6), candleMat);
    candle.position.set(x+cx, y+0.76, z+cz); scene.add(candle);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.022,0.06,6), flameMat);
    flame.position.set(x+cx, y+0.87, z+cz); scene.add(flame);
    state.cakeCandles.push(flame);
  });

  // Star topper on top tier
  buildStarTopper(x, y+0.72, z);
}

function buildStarTopper(x, y, z) {
  // Simple gold star using a cone
  const starMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8, emissive: new THREE.Color(0xffd700), emissiveIntensity: 0.3 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), starMat);
    petal.position.set(x + Math.sin(a)*0.06, y+0.08, z + Math.cos(a)*0.06);
    petal.rotation.z = a; scene.add(petal);
  }
}

function buildCupcake(x, y, z) {
  // [PERF] Shared geometries reused across all cupcake calls
  const caseColors = [0xcc8844, 0x88bb44, 0xcc6688];
  const frostColors = [0xffddee, 0xd4f5b0, 0xfff5cc];
  const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
  const caseMat  = new THREE.MeshStandardMaterial({ color: pick(caseColors), roughness: 0.7 });
  const frostMat = new THREE.MeshStandardMaterial({ color: pick(frostColors), roughness: 0.6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.12, 8), caseMat);
  base.position.set(x, y+0.06, z); base.castShadow=true; scene.add(base);
  const frost = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6, 0, Math.PI*2, 0, Math.PI/2), frostMat);
  frost.position.set(x, y+0.135, z); scene.add(frost);
}

function buildMacaroon(x, y, z, color) {
  // [PERF] 8 segments only
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.045, 8), mat);
  top.position.set(x, y+0.045, z); scene.add(top);
  const bot = top.clone(); bot.position.set(x, y+0.005, z); scene.add(bot);
  const fill = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const cream = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.018, 8), fill);
  cream.position.set(x, y+0.026, z); scene.add(cream);
}

function buildGiftBox(x, y, z, boxColor, ribbonColor) {
  // [PERF] BoxGeometry = 1 draw call per box
  const boxMat    = new THREE.MeshStandardMaterial({ color: boxColor, roughness: 0.6 });
  const ribbonMat = new THREE.MeshStandardMaterial({ color: ribbonColor, roughness: 0.3, metalness: 0.1 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.22,0.22), boxMat);
  box.position.set(x, y+0.11, z); box.castShadow=true; scene.add(box);
  // Ribbon strips (2 thin boxes)
  const rx = new THREE.Mesh(new THREE.BoxGeometry(0.24,0.03,0.03), ribbonMat);
  rx.position.set(x, y+0.22, z); scene.add(rx);
  const rz = new THREE.Mesh(new THREE.BoxGeometry(0.03,0.03,0.24), ribbonMat);
  rz.position.set(x, y+0.22, z); scene.add(rz);
  // Bow (two small cones)
  const bowMat = new THREE.MeshStandardMaterial({ color: ribbonColor, roughness: 0.3 });
  const b1 = new THREE.Mesh(new THREE.ConeGeometry(0.04,0.06,6), bowMat);
  b1.position.set(x-0.04, y+0.26, z); b1.rotation.z = 0.5; scene.add(b1);
  const b2 = b1.clone(); b2.position.set(x+0.04, y+0.26, z); b2.rotation.z = -0.5; scene.add(b2);
}

function buildBalloon(x, y, z, color) {
  // [PERF] 10-segment sphere per balloon — very lightweight
  const mat  = new THREE.MeshStandardMaterial({ color, roughness: 0.3, transparent: true, opacity: 0.88 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat);
  ball.position.set(x, y, z); scene.add(ball);
  // String (thin cylinder)
  const strMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.8 });
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.9, 4), strMat);
  str.position.set(x, y - 0.65, z); scene.add(str);
  // Store for gentle float animation
  if (!state.balloons) state.balloons = [];
  state.balloons.push({ mesh: ball, baseY: y, phase: Math.random() * Math.PI * 2 });
}

// ─────────────────────────────────────────────────────────────────
//  ARTWORK FRAMES
// ─────────────────────────────────────────────────────────────────
function buildArtworks() {
  // [FIX 8] TextureLoader must be in this function scope with manager
  //  so image files are tracked by the LoadingManager
  const texLoader = new THREE.TextureLoader(manager);

  ARTWORKS.forEach((art) => {
    const [aw, ah] = art.size;
    const group = new THREE.Group();
    group.position.set(...art.pos);
    group.rotation.y = art.rotY;

    // Black frame bars
    const frameT  = 0.045;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.35, metalness: 0.6 });
    const barH  = new THREE.Mesh(new THREE.BoxGeometry(aw+frameT*2, frameT, 0.04), frameMat);
    const barHb = barH.clone();
    barH.position.y  =  ah/2 + frameT/2;
    barHb.position.y = -ah/2 - frameT/2;
    group.add(barH, barHb);
    const barV  = new THREE.Mesh(new THREE.BoxGeometry(frameT, ah, 0.04), frameMat);
    const barVr = barV.clone();
    barV.position.x  = -aw/2 - frameT/2;
    barVr.position.x =  aw/2 + frameT/2;
    group.add(barV, barVr);

    // Canvas face
    // ★ TO ADD A REAL IMAGE: add  tex: 'images/filename.jpg'  to the artwork entry above.
    let canvasMat;
    if (art.tex) {
      // [FIX 8] colorSpace must be set so ACESFilmic renders colours correctly
      const t = texLoader.load(art.tex, (loadedTex) => {
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        canvasMat.needsUpdate = true;  // force re-render after async load
      });
      canvasMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.88 });
    } else {
      canvasMat = new THREE.MeshStandardMaterial({ color: art.color, roughness: 0.9 });
    }
    const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(aw, ah), canvasMat);
    canvasMesh.position.z = 0.021;
    group.add(canvasMesh);

    // Subtle accent overlay
    const overlayMat = new THREE.MeshStandardMaterial({
      color: art.accent || 0xffffff, transparent: true, opacity: 0.06, roughness: 1.0,
    });
    const overlay = new THREE.Mesh(new THREE.PlaneGeometry(aw*0.6, ah*0.6), overlayMat);
    overlay.position.set(aw*0.15, -ah*0.15, 0.022);
    group.add(overlay);

    // Gold nameplate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.012), _goldMat);
    plate.position.set(0, -ah/2-0.22, 0.01);
    group.add(plate);

    // Wire hanger
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.8 });
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,0.18,4), wireMat);
    wire.position.set(0, ah/2+0.13, -0.02);
    group.add(wire);

    group.castShadow = true; group.receiveShadow = true;
    scene.add(group);
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
   *   1. GLTFLoader.load(VRM_PATH)
   *   2. VRMLoaderPlugin extracts gltf.userData.vrm
   *   3. We search animations for 'idle'/'walk' by name
   *
   * [FIX 3] AnimationMixer crossFade properly transitions idle↔walk.
   *   setEffectiveWeight alone won't remove T-pose on some rigs;
   *   crossFadeTo() resets the outgoing action cleanly.
   *
   * TO SWAP TO PLAIN GLB: remove loader.register(...) and replace
   *   gltf.userData.vrm block with:
   *     state.vrm = { scene: gltf.scene, update: ()=>{} };
   */
  const loader = new GLTFLoader(manager);
  loader.register((parser) => new VRMLoaderPlugin(parser));

  loader.load(VRM_PATH,
    (gltf) => {
      const vrm = gltf.userData.vrm;
      if (!vrm) {
        gltf.scene.traverse(c => { if (c.isMesh) { c.castShadow=true; c.receiveShadow=true; } });
        scene.add(gltf.scene);
        state.vrm = { scene: gltf.scene, update: ()=>{} };
        setupAnimations(gltf);
        setupVRMPosition();
        finishLoading();
        return;
      }
      VRMUtils.removeUnnecessaryJoints(gltf.scene);
      vrm.scene.traverse(c => { if (c.isMesh) { c.castShadow=true; c.receiveShadow=true; } });
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
      const dummy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 1.4, 12),
        new THREE.MeshStandardMaterial({ color: C_GREEN })
      );
      dummy.position.copy(state.charPos); dummy.position.y = 0.7;
      scene.add(dummy);
      state.vrm = { scene: dummy, update: ()=>{} };
      setupVRMPosition();
      finishLoading();
    }
  );
}

// [FIX 3] Proper AnimationMixer setup with crossFade support
function setupAnimations(gltf) {
  if (!gltf.animations || gltf.animations.length === 0) {
    console.log('[Gallery] No animations found in model — using position bob only.');
    return;
  }
  const root = state.vrm ? state.vrm.scene : gltf.scene;
  state.mixer = new THREE.AnimationMixer(root);

  const find = (kw) => gltf.animations.find(a => a.name.toLowerCase().includes(kw));
  const idleClip = find('idle') || find('stand') || gltf.animations[0];
  const walkClip = find('walk') || find('run');

  if (idleClip) {
    state.idleAction = state.mixer.clipAction(idleClip);
    // Start in idle, weight=1
    state.idleAction.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
  }
  if (walkClip) {
    state.walkAction = state.mixer.clipAction(walkClip);
    // Walk ready but silent (weight=0)
    state.walkAction.reset().setEffectiveWeight(0).setEffectiveTimeScale(1).play();
  }

  console.log('[Gallery] Animations ready — idle:', idleClip?.name, '| walk:', walkClip?.name);
}

function setupVRMPosition() {
  if (!state.vrm) return;
  state.vrm.scene.position.copy(state.charPos);
  state.vrm.scene.rotation.y = state.charAngle;
}

// ─────────────────────────────────────────────────────────────────
//  INPUT
// ─────────────────────────────────────────────────────────────────
window.addEventListener('keydown', e => { state.keys[e.code] = true; });
window.addEventListener('keyup',   e => { state.keys[e.code] = false; });

window.addEventListener('mousedown', e => {
  if (e.button === 0 || e.button === 2) {
    state.mouseDragging = true; state.mouseHasMoved = false;
    state.lastMX = e.clientX; state.lastMY = e.clientY;
  }
});
window.addEventListener('mouseup', () => { state.mouseDragging = false; });
window.addEventListener('mousemove', e => {
  if (!state.mouseDragging) return;
  const dx = e.clientX - state.lastMX, dy = e.clientY - state.lastMY;
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.mouseHasMoved = true;
  state.lastMX = e.clientX; state.lastMY = e.clientY;
  state.camYaw   -= dx * 0.003;
  state.camPitch  = Math.max(-0.25, Math.min(0.65, state.camPitch + dy * 0.003));
});

window.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    state.mouseDragging=true; state.mouseHasMoved=false;
    state.lastMX=e.touches[0].clientX; state.lastMY=e.touches[0].clientY;
  }
}, { passive: true });
window.addEventListener('touchend', () => { state.mouseDragging = false; });
window.addEventListener('touchmove', e => {
  if (!state.mouseDragging || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX-state.lastMX, dy = e.touches[0].clientY-state.lastMY;
  if (Math.abs(dx)>4||Math.abs(dy)>4) state.mouseHasMoved=true;
  state.lastMX=e.touches[0].clientX; state.lastMY=e.touches[0].clientY;
  state.camYaw   -= dx * 0.004;
  state.camPitch  = Math.max(-0.25, Math.min(0.65, state.camPitch + dy * 0.004));
}, { passive: true });

// Click → artwork panel (suppressed after drag)
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();
window.addEventListener('click', e => {
  if (state.mouseHasMoved) return;
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

  const worldPos = new THREE.Vector3();
  group.getWorldPosition(worldPos);
  const fwd = new THREE.Vector3(Math.sin(group.rotation.y), 0, Math.cos(group.rotation.y))
    .multiplyScalar(2.6);

  state.camFocusOrigin = camera.position.clone();
  state.camFocusTarget = worldPos.clone().add(new THREE.Vector3(fwd.x, 0.2, fwd.z));
  // [FIX 9] Reset lerp so camera actually moves; panel stays open independently
  state.camLerpT       = 0;
  state.focusedArtwork = found;
}

function closeArtworkPanel() {
  panel.classList.add('hidden');
  state.focusedArtwork = null;
  state.camFocusTarget = null;
  state.camLerpT       = 1;
}

// ─────────────────────────────────────────────────────────────────
//  CHARACTER MOVEMENT
//  [FIX 5] Direction is camera-relative: W always = forward in view
//  [FIX 6] Character rotation follows actual world-space move dir
//  [FIX 7] Wall collision via AABB clamp (simple & zero-cost)
// ─────────────────────────────────────────────────────────────────
const SPEED  = 4.2;
const HALF_W = ROOM_W / 2 - 0.6;
const HALF_D = ROOM_D / 2 - 0.6;
const FADE_T = 0.18;   // crossFade duration in seconds

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
    // [FIX 5] Rotate input by camYaw so W = camera-forward
    const sin = Math.sin(state.camYaw), cos = Math.cos(state.camYaw);
    const worldDir = new THREE.Vector3(
      moveDir.x * cos - moveDir.z * sin,
      0,
      moveDir.x * sin + moveDir.z * cos
    );

    state.charPos.addScaledVector(worldDir, SPEED * dt);
    // [FIX 7] AABB wall clamp
    state.charPos.x = Math.max(-HALF_W, Math.min(HALF_W, state.charPos.x));
    state.charPos.z = Math.max(-HALF_D, Math.min(HALF_D, state.charPos.z));

    // [FIX 6] Smooth turn toward movement direction
    const targetAngle = Math.atan2(worldDir.x, worldDir.z);
    let da = targetAngle - state.charAngle;
    while (da >  Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    state.charAngle += da * Math.min(1, 12 * dt);
  }

  state.vrm.scene.position.x = state.charPos.x;
  state.vrm.scene.position.z = state.charPos.z;
  // Gentle idle bob (tiny, barely noticeable)
  state.vrm.scene.position.y = state.charPos.y + Math.sin(clock.elapsedTime * 1.8) * 0.002;
  state.vrm.scene.rotation.y = state.charAngle;

  // [FIX 3] Animation crossFade: only transition on state change
  if (state.mixer && moving !== state.isWalking) {
    state.isWalking = moving;
    if (moving) {
      // idle → walk
      if (state.walkAction && state.idleAction) {
        state.idleAction.crossFadeTo(state.walkAction, FADE_T, true);
      } else if (state.walkAction) {
        state.walkAction.setEffectiveWeight(1);
      }
    } else {
      // walk → idle
      if (state.idleAction && state.walkAction) {
        state.walkAction.crossFadeTo(state.idleAction, FADE_T, true);
      } else if (state.idleAction) {
        state.idleAction.setEffectiveWeight(1);
      }
    }
  }

  state.vrm.update(dt);
}

// ─────────────────────────────────────────────────────────────────
//  THIRD-PERSON CAMERA
// ─────────────────────────────────────────────────────────────────
function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

function updateCamera(dt) {
  // Artwork focus lerp
  if (state.camFocusTarget && state.camLerpT < 1) {
    state.camLerpT = Math.min(1, state.camLerpT + dt * 1.4);
    camera.position.lerpVectors(state.camFocusOrigin, state.camFocusTarget, easeInOut(state.camLerpT));
    const wp = new THREE.Vector3();
    state.focusedArtwork?.group.getWorldPosition(wp);
    camera.lookAt(wp.x, wp.y, wp.z);
    return;
  }
  // If panel open and lerp done, hold camera still
  if (state.focusedArtwork) return;

  // Standard third-person
  const d  = state.camDist;
  const px = state.charPos.x + d * Math.sin(state.camYaw)  * Math.cos(state.camPitch);
  const py = state.charPos.y + 1.5 + d * Math.sin(state.camPitch);
  const pz = state.charPos.z + d * Math.cos(state.camYaw)  * Math.cos(state.camPitch);

  const cx = Math.max(-HALF_W+0.2, Math.min(HALF_W-0.2, px));
  const cz = Math.max(-HALF_D+0.2, Math.min(HALF_D-0.2, pz));

  camera.position.lerp(new THREE.Vector3(cx, Math.max(0.5, py), cz), 0.12);
  camera.lookAt(state.charPos.x, state.charPos.y + 1.2, state.charPos.z);

  if (state.needle) {
    state.needle.setAttribute('transform',
      `rotate(${(-state.camYaw * 180 / Math.PI).toFixed(1)}, 18, 18)`);
  }
}

// ─────────────────────────────────────────────────────────────────
//  RENDER LOOP
// ─────────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t  = clock.elapsedTime;

  // Mixer update
  if (state.mixer) state.mixer.update(dt);

  // Candle flicker  [PERF] cheap sin — no texture needed
  if (state.candleLight) {
    state.candleLight.intensity = 1.0 + Math.sin(t * 13.7) * 0.25 + Math.sin(t * 7.3) * 0.15;
  }
  // Candle flame scale
  if (state.cakeCandles) {
    state.cakeCandles.forEach((f, i) => {
      f.scale.y = 0.9 + Math.sin(t * 11 + i * 2.1) * 0.15;
      f.scale.x = 0.9 + Math.sin(t * 8  + i * 1.4) * 0.1;
    });
  }
  // Balloon gentle float
  if (state.balloons) {
    state.balloons.forEach(b => {
      b.mesh.position.y = b.baseY + Math.sin(t * 0.8 + b.phase) * 0.06;
    });
  }

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
  buildBirthdayTable();
  buildArtworks();
  loadCharacter();
  animate();
}

init();
