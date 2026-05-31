/**
 * ═══════════════════════════════════════════════════════════════
 *  Haruka's Gallery — main.js  (v4)
 *  Theme: More More Jump! × 桐谷遙
 *
 *  ★ KEY CUSTOMIZATION POINTS ★
 *  1) MODEL REPLACEMENT  → search "★ MODEL REPLACEMENT ★"
 *  2) ARTWORK INFO       → search "★ ARTWORK DATA ★"
 * ═══════════════════════════════════════════════════════════════
 *
 *  v4 CHANGES vs v3:
 *  [A] Nameplate now renders actual text (Canvas2D → texture)
 *  [B] Frame size auto-fits image aspect ratio — no more stretching
 *  [C] Quaternion slerp for smooth character rotation
 *  [D] Box3 collision for birthday table + AABB walls
 *  [E] AnimationMixer crossFade idle↔walk (T-pose fix)
 *  [F] Camera-relative WASD movement
 *  [G] Birthday table, cake, food, balloons (procedural, low-poly)
 *  [H] Warmer lighting for birthday feel
 * ═══════════════════════════════════════════════════════════════
 */

import * as THREE from 'three';
import { GLTFLoader }            from 'three/addons/loaders/GLTFLoader.js';
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
//
//  HOW TO CUSTOMISE:
//  • title  — text shown in info panel AND on the gold nameplate
//  • desc   — description shown in panel
//  • meta   — "medium · year" line in panel
//  • color  — fallback canvas colour if no image supplied
//  • accent — subtle tinted overlay on canvas
//  • tex    — (optional) path like 'images/myart.jpg'
//             Frame will auto-resize to match image aspect ratio!
//  • pos    — [x, y, z] world centre of the frame
//  • rotY   — 0 = back wall, Math.PI = front wall,
//             Math.PI/2 = left wall, -Math.PI/2 = right wall
//  • size   — [maxWidth, maxHeight] MAXIMUM bounds; actual frame
//             scales to image ratio within these bounds.
//             For colour-only frames, used as-is.
// ─────────────────────────────────────────────────────────────────
const ARTWORKS = [
  // ══════════════════════════════════════════════════════════
  //  後牆（z = -21.7）— 正面最顯眼，共 5 幅，間距 4.5m
  //  rotY: 0  畫面朝向入口（+Z 方向）
  // ══════════════════════════════════════════════════════════
  {
    title: 'test',
    desc:  '四月の校庭。散りゆく桜の花びらが風に乗って舞い上がり、遥の笑顔を縁取る。「また来年も一緒に見ようね」——あの約束は、今も胸の中で咲き続けている。',
    meta:  'Digital · 2024',
    color: 0xffe4e8, accent: C_BLUE,
    tex:   'images/1031.png',
    pos:   [-9, 2.3, -ROOM_D / 2 + 0.35], rotY: 0, size: [3.2, 2.4],
  },
  {
    title: 'Clover Stage',
    desc:  'スポットライトの下、緑のクローバーが三つ葉を広げる。More More Jump! の舞台は今日も満員。「みんなの笑顔がわたしのエネルギー！」',
    meta:  'Digital · 2024',
    color: 0xd4f5b0, accent: C_GREEN,
    pos:   [0, 2.3, -ROOM_D / 2 + 0.35], rotY: 0, size: [2.8, 1.9],
  },
  {
    title: '夜の水族館',
    desc:  '閉館後の水族館、二人きり。水槽の青い光が遥の横顔を照らす。ペンギンたちが泳ぎ回る中、時間だけが静かに溶けていった。',
    meta:  'Digital · 2024',
    color: 0xb8e0ff, accent: C_BLUE,
    pos:   [9, 2.3, -ROOM_D / 2 + 0.35], rotY: 0, size: [2.8, 1.9],
  },

  // ══════════════════════════════════════════════════════════
  //  左牆（x = -13.7）— 共 6 幅，z 從 -18 到 +16，間距 ~6.5m
  //  rotY: Math.PI / 2  畫面朝向右側（+X 方向）
  // ══════════════════════════════════════════════════════════
  {
    title: '四葉のお守り',
    desc:  '手のひらに乗った小さな四葉のクローバー。「これ、きみに」——あの日渡されたお守りは、今でも財布の中で光り続けている。',
    meta:  'Digital · 2024',
    color: 0xc8f0a0, accent: C_GREEN,
    pos:   [-ROOM_W / 2 + 0.35, 2.3, -16], rotY: Math.PI / 2, size: [2.4, 1.7],
  },
  {
    title: 'Blue Horizon',
    desc:  '遥かな水平線。水色と白だけで描かれた世界に、ひとつの星が瞬く。「どんなに遠くても、同じ空の下にいるから大丈夫」',
    meta:  'Digital · 2024',
    color: 0xd0ecff, accent: C_BLUE,
    pos:   [-ROOM_W / 2 + 0.35, 2.3, -8], rotY: Math.PI / 2, size: [2.4, 1.7],
  },
  {
    title: '春の記憶',
    desc:  '桜並木の下を二人で歩いた、あの春の午後。風が運んでくる花びらの香りと、遥の笑い声が今でも耳に残っている。',
    meta:  'Digital · 2024',
    color: 0xffd6e7, accent: C_BLUE,
    pos:   [-ROOM_W / 2 + 0.35, 2.3, 0], rotY: Math.PI / 2, size: [2.4, 1.7],
  },
  {
    title: 'Midnight Sky',
    desc:  '深夜の屋上。星がこんなに綺麗に見えるなんて知らなかった。「ねえ、あの星に名前をつけよう」——遥が空を指さした瞬間、時間が止まった。',
    meta:  'Digital · 2024',
    color: 0x1a1a3e, accent: C_BLUE,
    pos:   [-ROOM_W / 2 + 0.35, 2.3, 8], rotY: Math.PI / 2, size: [2.4, 1.7],
  },
  {
    title: '緑の午後',
    desc:  'More More Jump! の練習後、みんなで寝転んだ芝生の上。空の青さと草の緑が、あの日の幸せをそのまま閉じ込めている。',
    meta:  'Digital · 2024',
    color: 0xc5e8b0, accent: C_GREEN,
    pos:   [-ROOM_W / 2 + 0.35, 2.3, 16], rotY: Math.PI / 2, size: [2.4, 1.7],
  },

  // ══════════════════════════════════════════════════════════
  //  右牆（x = +13.7）— 共 6 幅，z 從 -18 到 +16，間距 ~6.5m
  //  rotY: -Math.PI / 2  畫面朝向左側（-X 方向）
  // ══════════════════════════════════════════════════════════
  {
    title: 'Happy Birthday, 遥',
    desc:  '今日という特別な日に、あなたへ届けたい言葉がある。いつも笑顔をありがとう。これからもずっと、あなたの隣で応援し続けるよ。🎂💚',
    meta:  'With Love · 2024',
    color: 0xfff0d0, accent: C_GOLD,
    pos:   [ROOM_W / 2 - 0.35, 2.3, -16], rotY: -Math.PI / 2, size: [3.0, 2.0],
  },
  {
    title: 'Penguin Parade',
    desc:  '桐谷遙の愛するペンギンたち。よちよち歩きのフォルムが愛らしく、見ているだけで心がほっこりする。「ねぇ、一番右の子が一番かわいくない？」',
    meta:  'Digital · 2024',
    color: 0xe0f4ff, accent: C_BLUE,
    pos:   [ROOM_W / 2 - 0.35, 2.3, -8], rotY: -Math.PI / 2, size: [2.4, 1.7],
  },
  {
    title: '冬のかけら',
    desc:  '初雪の朝、窓の外を見ていたら遥からメッセージが届いた。「雪、見てる？」——たった一言なのに、どうしてこんなに温かいんだろう。',
    meta:  'Digital · 2024',
    color: 0xe8f4ff, accent: C_BLUE,
    pos:   [ROOM_W / 2 - 0.35, 2.3, 0], rotY: -Math.PI / 2, size: [2.4, 1.7],
  },
  {
    title: 'Summer Soda',
    desc:  '夏祭りの縁日で飲んだラムネの味。氷の溶けた音と、遥の弾ける笑顔。あの夏は一生忘れられない。',
    meta:  'Digital · 2024',
    color: 0xb8f0ff, accent: C_BLUE,
    pos:   [ROOM_W / 2 - 0.35, 2.3, 8], rotY: -Math.PI / 2, size: [2.4, 1.7],
  },
  {
    title: '光の粒',
    desc:  'ステージの上、スポットライトを浴びた遥は別次元の輝きを放っていた。あの光の粒のひとつひとつが、わたしの宝物になった。',
    meta:  'Digital · 2024',
    color: 0xfffde0, accent: C_GOLD,
    pos:   [ROOM_W / 2 - 0.35, 2.3, 16], rotY: -Math.PI / 2, size: [2.4, 1.7],
  },

  // ══════════════════════════════════════════════════════════
  //  前牆（z = +21.7）— 入口後方牆面，共 3 幅
  //  rotY: Math.PI  畫面朝向畫廊內部（-Z 方向）
  // ══════════════════════════════════════════════════════════
  {
    title: '始まりの扉',
    desc:  'この美術館に足を踏み入れたあなたへ。ここにあるすべての作品は、遥への愛と感謝を込めて作られました。ゆっくりと、楽しんでいってください。',
    meta:  'Prologue · 2024',
    color: 0xf0ece0, accent: C_GOLD,
    pos:   [-8, 2.3, ROOM_D / 2 - 0.35], rotY: Math.PI, size: [2.6, 1.8],
  },
  {
    title: 'More More Jump!',
    desc:  '遥、寧々、絵名、瑞希。四人が集まればどんな夢も叶う気がした。More More Jump! の音楽は、いつだってわたしの背中を押してくれる。',
    meta:  'Digital · 2024',
    color: 0xd8f5c0, accent: C_GREEN,
    pos:   [0, 2.3, ROOM_D / 2 - 0.35], rotY: Math.PI, size: [2.8, 1.9],
  },
  {
    title: 'ありがとう',
    desc:  'この一年、たくさんの思い出をありがとう。これからも一緒に笑って、泣いて、また笑おう。あなたの笑顔がわたしの原動力です。誕生日おめでとう。',
    meta:  'With Love · 2024',
    color: 0xffe8f0, accent: C_GOLD,
    pos:   [8, 2.3, ROOM_D / 2 - 0.35], rotY: Math.PI, size: [2.6, 1.8],
  },
];

// ─────────────────────────────────────────────────────────────────
//  ★ MODEL REPLACEMENT ★
//  File must be at:  models/Shiho.vrm
//  Change the path below if yours differs.
// ─────────────────────────────────────────────────────────────────
const VRM_PATH = 'models/Shiho.vrm';

// ─────────────────────────────────────────────────────────────────
//  DOM
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
const clock  = new THREE.Clock();

// ─────────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────────
const SPAWN = new THREE.Vector3(0, 0, 17);

const state = {
  vrm: null, mixer: null,
  idleAction: null, walkAction: null,
  isWalking: false,
  keys: {},
  charPos:    SPAWN.clone(),
  charQuat:   new THREE.Quaternion(),   // [C] Quaternion for smooth rotation
  targetQuat: new THREE.Quaternion(),
  camYaw:     Math.PI,   // camera behind spawn, facing inward
  camPitch:   0.28,
  camDist:    4.2,
  mouseDragging: false, mouseHasMoved: false,
  lastMX: 0, lastMY: 0,
  artworkMeshes:  [],
  focusedArtwork: null,
  camFocusTarget: null, camFocusOrigin: null,
  camLerpT: 1,
  needle: document.getElementById('compass-needle'),
  // [D] Collision boxes
  colliders: [],
  // Animated objects
  candleLight: null, cakeCandles: [], balloons: [],
};

// ─────────────────────────────────────────────────────────────────
//  LOADING
// ─────────────────────────────────────────────────────────────────
const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
  const pct = Math.round((loaded / total) * 100);
  loadBar.style.width  = pct + '%';
  loadText.textContent = `正在前往畫展... ${pct}%`;
};
let _loadingDone = false;
function finishLoading() {
  if (_loadingDone) return;   // guard: only run once
  _loadingDone = true;
  loadText.textContent = '歡迎蒞臨！';
  loadBar.style.width  = '100%';
  setTimeout(() => { loadScreen.classList.add('fade-out'); hud.classList.add('visible'); }, 700);
}
// Safety net: if something goes wrong (network, CORS, etc.)
// force-dismiss the loading screen after 12 seconds
setTimeout(() => {
  if (!_loadingDone) {
    console.warn('[Gallery] Loading timeout — forcing dismiss');
    finishLoading();
  }
}, 12000);

// ─────────────────────────────────────────────────────────────────
//  LIGHTING  [H] Warmer birthday atmosphere
// ─────────────────────────────────────────────────────────────────
function buildLighting() {
  scene.add(new THREE.AmbientLight(0xfff3e0, 0.62));

  const dir = new THREE.DirectionalLight(0xfff5e0, 1.1);
  dir.position.set(0, ROOM_H - 0.5, 0);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -16; dir.shadow.camera.right  = 16;
  dir.shadow.camera.top  =  24; dir.shadow.camera.bottom = -24;
  dir.shadow.camera.near = 0.5; dir.shadow.camera.far    = 60;
  dir.shadow.bias = -0.0005;
  scene.add(dir);

  // Warm ceiling spots (orange-warm, birthday feel)
  [[-9,-18],[0,-18],[9,-18],[-9,0],[0,0],[9,0],[-9,16],[0,16],[9,16]].forEach(([x,z]) => {
    const s = new THREE.SpotLight(0xffcca0, 1.0, 20, Math.PI/7, 0.5, 1.6);
    s.position.set(x, ROOM_H-0.1, z); s.target.position.set(x,0,z);
    s.castShadow = false;
    scene.add(s, s.target);
  });

  // Table warm glow
  const tg = new THREE.PointLight(0xff9966, 0.8, 12);
  tg.position.set(0, 1.8, -6); scene.add(tg);

  // Candle flicker light (animated in loop)
  state.candleLight = new THREE.PointLight(0xffaa33, 1.2, 5);
  state.candleLight.position.set(0, 2.2, -6);
  scene.add(state.candleLight);

  const gf = new THREE.PointLight(C_GREEN, 0.28, 8);
  gf.position.set(0, 2, 19); scene.add(gf);

  const bf = new THREE.PointLight(C_BLUE, 0.22, 10);
  bf.position.set(-11, 2, 0); scene.add(bf);
}

// ─────────────────────────────────────────────────────────────────
//  SHARED MATERIALS  [PERF] reused across many meshes
// ─────────────────────────────────────────────────────────────────
const MAT = {
  metal: new THREE.MeshStandardMaterial({ color: C_METAL, roughness: 0.3, metalness: 0.85 }),
  gold:  new THREE.MeshStandardMaterial({ color: C_GOLD,  roughness: 0.25, metalness: 0.9 }),
  frame: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.35, metalness: 0.6 }),
  wire:  new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.8 }),
};

// ─────────────────────────────────────────────────────────────────
//  PROCEDURAL FLOOR TEXTURE  [PERF] canvas-generated, no file
// ─────────────────────────────────────────────────────────────────
function makeFloorMat() {
  const size = 512, cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#7a5c12'; ctx.fillRect(0,0,size,size);
  const pw = size/6;
  for (let i=0;i<6;i++) {
    const x = i*pw;
    ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,size); ctx.stroke();
    for (let g=0;g<14;g++) {
      const y = g*(size/14)+Math.random()*6;
      ctx.strokeStyle=`rgba(${Math.random()>.5?180:100},90,20,0.08)`;
      ctx.lineWidth=0.6+Math.random();
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+pw,y+(Math.random()-.5)*18); ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(ROOM_W/4, ROOM_D/4);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72 });
}

// ─────────────────────────────────────────────────────────────────
//  [A] NAMEPLATE TEXTURE — renders actual text via Canvas2D
//  Returns a THREE.Texture with the title drawn in gold serif font
// ─────────────────────────────────────────────────────────────────
function makeNameplateTex(title) {
  const W = 512, H = 96;
  const cv  = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  // Gold gradient background
  const grad = ctx.createLinearGradient(0,0,W,0);
  grad.addColorStop(0,   '#2a1e08');
  grad.addColorStop(0.5, '#4a3410');
  grad.addColorStop(1,   '#2a1e08');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  // Top/bottom gold lines
  ctx.strokeStyle = '#c9a96e'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(12,10); ctx.lineTo(W-12,10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12,H-10); ctx.lineTo(W-12,H-10); ctx.stroke();

  // Title text
  ctx.fillStyle    = '#e8d5a3';
  ctx.font         = `300 ${H * 0.38}px "Cormorant Garamond", Georgia, serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, W/2, H/2);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─────────────────────────────────────────────────────────────────
//  HEART-CLOVER  [PERF] shared texture & material
// ─────────────────────────────────────────────────────────────────
let _cloverTex = null;
function getCloverTex() {
  if (_cloverTex) return _cloverTex;
  const s = 256, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0,0,s,s);
  ctx.fillStyle = '#88dd44';
  const x=s/2, y=s*0.44, w=s*0.38, h=s*0.36;
  ctx.beginPath();
  ctx.moveTo(x, y+h);
  ctx.bezierCurveTo(x-w*1.6, y+h*0.55, x-w*1.6, y-h*0.85, x, y-h*0.35);
  ctx.bezierCurveTo(x+w*1.6, y-h*0.85, x+w*1.6, y+h*0.55, x, y+h);
  ctx.closePath(); ctx.fill();
  _cloverTex = new THREE.CanvasTexture(cv);
  return _cloverTex;
}

let _cloverMat = null;
function cloverMat() {
  if (_cloverMat) return _cloverMat;
  const t = getCloverTex();
  _cloverMat = new THREE.MeshStandardMaterial({
    map: t, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide,
    emissive: new THREE.Color(C_GREEN), emissiveMap: t, emissiveIntensity: 0.12,
  });
  return _cloverMat;
}

function buildClover(cx, cy, cz, scale=1, flat=true) {
  const lR = 0.22*scale, lS = 0.32*scale;
  const geo = new THREE.PlaneGeometry(lS, lS); // [PERF] shared geo per call
// ⚡ 請把 buildClover 裡面的 for 迴圈精準替換成這段：
  for (let i=0;i<3;i++) {
    const a = (i*Math.PI*2)/3;
    const pl = new THREE.Mesh(geo, cloverMat());
    
    // 【調整半徑】原本是 0.22*scale，我們把它縮小（例如改成 0.1*scale）
    // 數值越小，三個愛心的尖端就會靠得越近！
    const closeRadius = 0.11 * scale; 
    
    if (flat) {
      // 1. 地板上的平鋪三葉草
      pl.rotation.x = -Math.PI/2; 
      
      // 關鍵修正：加上 Math.PI (等於轉 180 度)，讓愛心尖端原轉朝內指向圓心！
      pl.rotation.z = a + Math.PI; 
      
      // 使用縮小後的半徑 closeRadius 重新定位
      pl.position.set(cx+Math.sin(a)*closeRadius, cy+0.006, cz+Math.cos(a)*closeRadius);
    } else {
      // 2. 立體的三葉草（如果有的話）
      // 關鍵修正：原本是 -a，我們把它加上 Math.PI 讓它反轉朝內
      pl.rotation.y = -a + Math.PI; 
      pl.rotation.z = Math.PI;
      
      pl.position.set(cx+Math.sin(a)*closeRadius, cy, cz+Math.cos(a)*closeRadius);
    }
    scene.add(pl);
  }
}

// ─────────────────────────────────────────────────────────────────
//  GALLERY ARCHITECTURE
// ─────────────────────────────────────────────────────────────────
function buildGallery() {
  const wallMat  = new THREE.MeshStandardMaterial({ color: C_WALL, roughness: 0.88 });
  const floorMat = makeFloorMat();
  const ceilMat  = new THREE.MeshStandardMaterial({ color: C_CEIL, roughness: 0.9 });

  const box = (w,h,d,mat,x,y,z,sh=true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    m.position.set(x,y,z); if(sh){m.castShadow=true;m.receiveShadow=true;} scene.add(m); return m;
  };

  // Room shell
  box(ROOM_W,0.15,ROOM_D, floorMat, 0,-0.075,0);
  box(ROOM_W,0.15,ROOM_D, ceilMat,  0,ROOM_H+0.075,0,false);
  box(ROOM_W,ROOM_H,WALL_T, wallMat, 0,ROOM_H/2,-ROOM_D/2);
  box(ROOM_W,ROOM_H,WALL_T, wallMat, 0,ROOM_H/2, ROOM_D/2);
  box(WALL_T,ROOM_H,ROOM_D, wallMat,-ROOM_W/2,ROOM_H/2,0);
  box(WALL_T,ROOM_H,ROOM_D, wallMat, ROOM_W/2,ROOM_H/2,0);

  // Skirting
  box(ROOM_W,0.12,0.06,MAT.metal,0,0.06,-ROOM_D/2+0.13);
  box(ROOM_W,0.12,0.06,MAT.metal,0,0.06, ROOM_D/2-0.13);
  box(0.06,0.12,ROOM_D,MAT.metal,-ROOM_W/2+0.13,0.06,0);
  box(0.06,0.12,ROOM_D,MAT.metal, ROOM_W/2-0.13,0.06,0);

  // Ceiling rail
  const rH = ROOM_H-0.08;
  box(ROOM_W,0.06,0.06,MAT.metal,0,rH,-ROOM_D/2+0.15);
  box(ROOM_W,0.06,0.06,MAT.metal,0,rH, ROOM_D/2-0.15);
  box(0.06,0.06,ROOM_D,MAT.metal,-ROOM_W/2+0.15,rH,0);
  box(0.06,0.06,ROOM_D,MAT.metal, ROOM_W/2-0.15,rH,0);

  // Benches (offset from table area)
  buildBench(-5.5,-4); buildBench(5.5,-4);
  buildBench(-5.5,-16);buildBench(5.5,-16);

  // Pedestals with clover
  buildPedestal(-6,-20); buildPedestal(6,-20);

  // Ceiling fixtures
  buildCeilingFixtures();

  // Penguins
  buildPenguin(-ROOM_W/2+1.2,0, ROOM_D/2-1.5);
  buildPenguin(-ROOM_W/2+1.2,0,-ROOM_D/2+1.5);
  buildPenguin( ROOM_W/2-1.2,0, ROOM_D/2-1.5);

  // Floor clover inlays
  buildClover(-6,0,5,  1.4,true);
  buildClover( 6,0,5,  1.4,true);
  buildClover( 0,0,-16,1.6,true);
}

function buildBench(x,z) {
  const cush = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.85 });
  const add = (w,h,d,mat,px,py,pz) => {
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.position.set(px,py,pz); m.castShadow=m.receiveShadow=true; scene.add(m);
  };
  add(1.8,0.08,0.55,cush,x,0.45,z);
  add(1.84,0.015,0.57,MAT.gold,x,0.49,z);
  [[x-0.75,z-0.2],[x+0.75,z-0.2],[x-0.75,z+0.2],[x+0.75,z+0.2]].forEach(([px,pz])=>{
    add(0.04,0.45,0.04,MAT.metal,px,0.225,pz);
  });
}

function buildPedestal(x,z) {
  const bM = new THREE.MeshStandardMaterial({color:0x111111,roughness:0.3,metalness:0.7});
  const add = (w,h,d,mat,px,py,pz)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.position.set(px,py,pz); m.castShadow=m.receiveShadow=true; scene.add(m);
  };
  add(0.55,1.1,0.55,bM,x,0.55,z);
  add(0.65,0.04,0.65,MAT.gold,x,1.12,z);
  add(0.45,0.04,0.45,MAT.gold,x,0.01,z);
  buildClover(x,1.22,z,0.9,false);
}

function buildCeilingFixtures() {
  const rG = new THREE.TorusGeometry(0.12,0.025,8,24);
  const dG = new THREE.CylinderGeometry(0.08,0.08,0.04,16);
  const bM = new THREE.MeshStandardMaterial({color:0xfff0cc,emissive:new THREE.Color(0xfff0cc),emissiveIntensity:1.2});
  [[-9,-18],[0,-18],[9,-18],[-9,0],[0,0],[9,0],[-9,16],[0,16],[9,16]].forEach(([x,z])=>{
    const rg=new THREE.Mesh(rG,MAT.metal); rg.rotation.x=Math.PI/2; rg.position.set(x,ROOM_H-.05,z); scene.add(rg);
    const dc=new THREE.Mesh(dG,MAT.metal); dc.position.set(x,ROOM_H-.05,z); scene.add(dc);
    const bl=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),bM); bl.position.set(x,ROOM_H-.1,z); scene.add(bl);
  });
}

function buildPenguin(x,yBase,z) {
  const dM=new THREE.MeshStandardMaterial({color:0x111827,roughness:0.6});
  const wM=new THREE.MeshStandardMaterial({color:0xedf2f7,roughness:0.7});
  const bM=new THREE.MeshStandardMaterial({color:C_BLUE,roughness:0.4,emissive:new THREE.Color(C_BLUE),emissiveIntensity:0.06});
  const oM=new THREE.MeshStandardMaterial({color:0xfd9800,roughness:0.5});
  const add=(geo,mat,ox,oy,oz,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,mat); m.position.set(x+ox,yBase+oy,z+oz); m.rotation.set(rx,ry,rz); m.castShadow=true; scene.add(m);
  };
  add(new THREE.SphereGeometry(0.22,12,10,0,Math.PI*2,0,Math.PI*.75),dM,0,.30,0);
  add(new THREE.SphereGeometry(0.13,10,8),wM,0,.34,.10);
  add(new THREE.SphereGeometry(0.14,10,8),dM,0,.62,0);
  add(new THREE.SphereGeometry(.025,6,5),wM,-.055,.68,.10);
  add(new THREE.SphereGeometry(.025,6,5),wM, .055,.68,.10);
  add(new THREE.SphereGeometry(.015,6,5),dM,-.055,.68,.118);
  add(new THREE.SphereGeometry(.015,6,5),dM, .055,.68,.118);
  add(new THREE.ConeGeometry(.03,.08,6),oM,0,.64,.14,Math.PI/2,0,0);
  add(new THREE.TorusGeometry(.135,.02,6,16),bM,0,.55,0,Math.PI/2,0,0);
  add(new THREE.BoxGeometry(.07,.02,.12),oM,-.08,.02,.04);
  add(new THREE.BoxGeometry(.07,.02,.12),oM, .08,.02,.04);
}

// ─────────────────────────────────────────────────────────────────
//  [G] BIRTHDAY TABLE  [PERF] procedural geometry only
// ─────────────────────────────────────────────────────────────────
function buildBirthdayTable() {
  const TX=0, TZ=-6;
  const woodMat = new THREE.MeshStandardMaterial({color:0x8b5e2e,roughness:0.7});
  const legMat  = new THREE.MeshStandardMaterial({color:0x6b4520,roughness:0.8});
  const strMat  = new THREE.MeshStandardMaterial({color:C_GREEN,roughness:0.4,emissive:new THREE.Color(C_GREEN),emissiveIntensity:0.12});

  // Table top
  const top = new THREE.Mesh(new THREE.BoxGeometry(5.0,0.12,1.6), woodMat);
  top.position.set(TX,1.0,TZ); top.castShadow=true; top.receiveShadow=true;
  scene.add(top);

  // MMJ green stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.02,0.04,0.04),strMat);
  stripe.position.set(TX,1.06,TZ-0.82); scene.add(stripe);

  // Legs  [PERF] shared geometry
  const legGeo = new THREE.BoxGeometry(0.1,1.0,0.1);
  [[-2.3,-0.7],[-2.3,0.7],[2.3,-0.7],[2.3,0.7]].forEach(([lx,lz])=>{
    const l=new THREE.Mesh(legGeo,legMat); l.position.set(TX+lx,0.5,TZ+lz); l.castShadow=true; scene.add(l);
  });

  // [D] Register table as collider
  const tableBox = new THREE.Box3().setFromObject(top);
  tableBox.expandByScalar(0.2);   // small margin
  state.colliders.push(tableBox);

  // Food
  buildCake(TX,1.06,TZ);
  buildCupcake(TX-1.5,1.06,TZ-0.3); buildCupcake(TX-1.5,1.06,TZ+0.3);
  buildMacaroon(TX-2.0,1.06,TZ-0.2,0xff88aa); buildMacaroon(TX-2.0,1.06,TZ+0.2,C_GREEN);
  buildCupcake(TX+1.5,1.06,TZ-0.3); buildCupcake(TX+1.5,1.06,TZ+0.3);
  buildMacaroon(TX+2.0,1.06,TZ-0.2,C_BLUE);   buildMacaroon(TX+2.0,1.06,TZ+0.2,0xffdd88);
  buildGiftBox(TX-2.2,1.06,TZ,C_GREEN,0xffffff);
  buildGiftBox(TX+2.2,1.06,TZ,C_BLUE, 0xffffff);

  // Balloons above table
  buildBalloon(TX-1.8,2.8,TZ-0.4,C_GREEN);
  buildBalloon(TX,    3.2,TZ-0.5,0xff88aa);
  buildBalloon(TX+1.8,2.8,TZ-0.4,C_BLUE);
  buildBalloon(TX-0.9,3.0,TZ+0.3,0xffdd44);
  buildBalloon(TX+0.9,3.0,TZ+0.3,0xdd88ff);
}

function buildCake(x,y,z) {
  const tiers = [
    {r:0.38,h:0.28,c:0xfff0f5,y:0.14},
    {r:0.28,h:0.24,c:0xffe4e8,y:0.38},
    {r:0.18,h:0.20,c:0xd4f5b0,y:0.58},
  ];
  const rib = new THREE.MeshStandardMaterial({color:C_GREEN,roughness:0.3,emissive:new THREE.Color(C_GREEN),emissiveIntensity:0.1});
  tiers.forEach(({r,h,c,y:ty})=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r-0.02,r,h,12),
      new THREE.MeshStandardMaterial({color:c,roughness:0.8}));
    m.position.set(x,y+ty,z); m.castShadow=true; scene.add(m);
    const rb=new THREE.Mesh(new THREE.CylinderGeometry(r+0.002,r+0.002,0.04,12),rib);
    rb.position.set(x,y+ty,z); scene.add(rb);
  });
  // Candles
  const cMat=new THREE.MeshStandardMaterial({color:0xffeeaa,roughness:0.6});
  const fMat=new THREE.MeshStandardMaterial({color:0xff6600,emissive:new THREE.Color(0xff6600),emissiveIntensity:1.5});
  state.cakeCandles=[];
  [[-0.08,0.08],[0.08,0.08],[0,-0.06]].forEach(([cx,cz],i)=>{
    const c=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.16,6),cMat);
    c.position.set(x+cx,y+0.76,z+cz); scene.add(c);
    const f=new THREE.Mesh(new THREE.ConeGeometry(.022,.06,6),fMat);
    f.position.set(x+cx,y+0.87,z+cz); scene.add(f);
    state.cakeCandles.push(f);
  });
}

function buildCupcake(x,y,z) {
  const cases =[0xcc8844,0x88bb44,0xcc6688];
  const frosts=[0xffddee,0xd4f5b0,0xfff5cc];
  const ri=Math.floor(Math.random()*cases.length);
  const cM=new THREE.MeshStandardMaterial({color:cases[ri],roughness:0.7});
  const fM=new THREE.MeshStandardMaterial({color:frosts[ri],roughness:0.6});
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.09,.07,.12,8),cM);
  b.position.set(x,y+.06,z); b.castShadow=true; scene.add(b);
  const f=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6,0,Math.PI*2,0,Math.PI/2),fM);
  f.position.set(x,y+.135,z); scene.add(f);
}

function buildMacaroon(x,y,z,color) {
  const mat=new THREE.MeshStandardMaterial({color,roughness:0.5});
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.045,8),mat); t.position.set(x,y+.045,z); scene.add(t);
  const b=t.clone(); b.position.set(x,y+.005,z); scene.add(b);
  const cr=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.018,8),new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.6}));
  cr.position.set(x,y+.026,z); scene.add(cr);
}

function buildGiftBox(x,y,z,boxColor,ribColor) {
  const bM=new THREE.MeshStandardMaterial({color:boxColor,roughness:0.6});
  const rM=new THREE.MeshStandardMaterial({color:ribColor,roughness:0.3});
  const bx=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.22),bM);
  bx.position.set(x,y+.11,z); bx.castShadow=true; scene.add(bx);
  const rx=new THREE.Mesh(new THREE.BoxGeometry(.24,.03,.03),rM); rx.position.set(x,y+.22,z); scene.add(rx);
  const rz=new THREE.Mesh(new THREE.BoxGeometry(.03,.03,.24),rM); rz.position.set(x,y+.22,z); scene.add(rz);
}

function buildBalloon(x,y,z,color) {
  const mat=new THREE.MeshStandardMaterial({color,roughness:0.3,transparent:true,opacity:0.88});
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),mat);
  ball.position.set(x,y,z); scene.add(ball);
  const sM=new THREE.MeshStandardMaterial({color:0xaaaaaa,roughness:0.8});
  const str=new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.9,4),sM);
  str.position.set(x,y-.65,z); scene.add(str);
  state.balloons.push({mesh:ball,baseY:y,phase:Math.random()*Math.PI*2});
}

// ─────────────────────────────────────────────────────────────────
//  [B] ARTWORK FRAMES — auto aspect ratio
// ─────────────────────────────────────────────────────────────────
function buildArtworks() {
  // ── IMPORTANT: use a standalone TextureLoader (NOT manager) ──
  // Images load asynchronously AFTER the scene is ready.
  // Tying them to manager would block finishLoading() until every
  // image has downloaded, causing the loading screen to hang if
  // any image 404s or takes too long.
  const texLoader = new THREE.TextureLoader();

  ARTWORKS.forEach((art) => {
    // We defer frame creation until we know actual image size.
    // For colour-only entries, we build immediately.
    if (art.tex) {
      texLoader.load(
        art.tex,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          // [B] Compute frame size that fits image ratio within art.size bounds
          const imgW = tex.image.width, imgH = tex.image.height;
          const imgRatio = imgW / imgH;
          const [maxW, maxH] = art.size;
          let fw, fh;
          if (imgRatio >= maxW / maxH) {
            fw = maxW; fh = maxW / imgRatio;
          } else {
            fh = maxH; fw = maxH * imgRatio;
          }
          buildFrame(art, fw, fh, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88 }));
        },
        undefined,
        () => {
          // Image failed to load — fall back to colour
          buildFrame(art, art.size[0], art.size[1],
            new THREE.MeshStandardMaterial({ color: art.color, roughness: 0.9 }));
        }
      );
    } else {
      buildFrame(art, art.size[0], art.size[1],
        new THREE.MeshStandardMaterial({ color: art.color, roughness: 0.9 }));
    }
  });
}

function buildFrame(art, aw, ah, canvasMat) {
  const group = new THREE.Group();
  group.position.set(...art.pos);
  group.rotation.y = art.rotY;

  // Black thin frame bars
  const frameT = 0.045;
  const bH  = new THREE.Mesh(new THREE.BoxGeometry(aw+frameT*2, frameT, 0.04), MAT.frame);
  const bHb = bH.clone();
  bH.position.y  =  ah/2+frameT/2;
  bHb.position.y = -ah/2-frameT/2;
  group.add(bH, bHb);
  const bV  = new THREE.Mesh(new THREE.BoxGeometry(frameT, ah, 0.04), MAT.frame);
  const bVr = bV.clone();
  bV.position.x  = -aw/2-frameT/2;
  bVr.position.x =  aw/2+frameT/2;
  group.add(bV, bVr);

  // Canvas
  const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(aw, ah), canvasMat);
  canvasMesh.position.z = 0.021;
  group.add(canvasMesh);

  // Accent overlay
  if (art.accent) {
    const ov = new THREE.Mesh(
      new THREE.PlaneGeometry(aw*0.6, ah*0.6),
      new THREE.MeshStandardMaterial({ color: art.accent, transparent: true, opacity: 0.05, roughness: 1.0 })
    );
    ov.position.set(aw*0.15, -ah*0.15, 0.022);
    group.add(ov);
  }

  // [A] Nameplate with real text
  const plateW = Math.max(aw * 0.75, 1.0);
  const plateMesh = new THREE.Mesh(
    new THREE.BoxGeometry(plateW, 0.18, 0.015),
    new THREE.MeshStandardMaterial({ map: makeNameplateTex(art.title), roughness: 0.3, metalness: 0.5 })
  );
  plateMesh.position.set(0, -ah/2-0.26, 0.01);
  group.add(plateMesh);

  // Wire hanger
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.18,4), MAT.wire);
  wire.position.set(0, ah/2+0.13, -0.02);
  group.add(wire);

  group.castShadow = true; group.receiveShadow = true;
  scene.add(group);
  state.artworkMeshes.push({ group, face: canvasMesh, art });
}

// ─────────────────────────────────────────────────────────────────
//  VRM LOADER
// ─────────────────────────────────────────────────────────────────
function loadCharacter() {
  const loader = new GLTFLoader(manager);
  loader.register((parser) => new VRMLoaderPlugin(parser));

  loader.load(VRM_PATH,
    (gltf) => {
      const vrm = gltf.userData.vrm;
      if (!vrm) {
        gltf.scene.traverse(c=>{ if(c.isMesh){c.castShadow=c.receiveShadow=true;} });
        scene.add(gltf.scene);
        state.vrm = { scene: gltf.scene, update: ()=>{} };
      } else {
        VRMUtils.removeUnnecessaryJoints(gltf.scene);
        vrm.scene.traverse(c=>{ if(c.isMesh){c.castShadow=c.receiveShadow=true;} });
        state.vrm = vrm;
        scene.add(vrm.scene);
      }
      setupAnimations(gltf);
      setupVRMPosition();
      finishLoading();
    },
    (progress) => {
      if (progress.total > 0) {
        const pct = Math.round(progress.loaded/progress.total*100);
        loadBar.style.width  = Math.min(pct,99)+'%';
        loadText.textContent = `正在前往畫展... ${pct}%`;
      }
    },
    (err) => {
      console.error('[Gallery] VRM load failed:', err);
      const dummy = new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,1.4,12),
        new THREE.MeshStandardMaterial({color:C_GREEN}));
      dummy.position.copy(state.charPos); dummy.position.y=0.7; scene.add(dummy);
      state.vrm = { scene: dummy, update: ()=>{} };
      setupVRMPosition(); finishLoading();
    }
  );
}

// [E] Proper AnimationMixer with crossFade
function setupAnimations(gltf) {
  if (!gltf.animations?.length) { console.log('[Gallery] No animations in VRM.'); return; }
  const root = state.vrm?.scene ?? gltf.scene;
  state.mixer = new THREE.AnimationMixer(root);

  const find = kw => gltf.animations.find(a => a.name.toLowerCase().includes(kw));
  const idleClip = find('idle') || find('stand') || gltf.animations[0];
  const walkClip = find('walk') || find('run');

  if (idleClip) {
    state.idleAction = state.mixer.clipAction(idleClip);
    state.idleAction.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
  }
  if (walkClip) {
    state.walkAction = state.mixer.clipAction(walkClip);
    state.walkAction.reset().setEffectiveWeight(0).setEffectiveTimeScale(1).play();
  }
  console.log('[Gallery] idle:', idleClip?.name, '| walk:', walkClip?.name);
}

function setupVRMPosition() {
  if (!state.vrm) return;
  state.vrm.scene.position.copy(state.charPos);
  state.vrm.scene.quaternion.copy(state.charQuat);
}

// ─────────────────────────────────────────────────────────────────
//  INPUT
// ─────────────────────────────────────────────────────────────────
window.addEventListener('keydown', e=>{ state.keys[e.code]=true; });
window.addEventListener('keyup',   e=>{ state.keys[e.code]=false; });

window.addEventListener('mousedown', e=>{
  if(e.button===0||e.button===2){ state.mouseDragging=true; state.mouseHasMoved=false; state.lastMX=e.clientX; state.lastMY=e.clientY; }
});
window.addEventListener('mouseup', ()=>{ state.mouseDragging=false; });
window.addEventListener('mousemove', e=>{
  if(!state.mouseDragging) return;
  const dx=e.clientX-state.lastMX, dy=e.clientY-state.lastMY;
  if(Math.abs(dx)>4||Math.abs(dy)>4) state.mouseHasMoved=true;
  state.lastMX=e.clientX; state.lastMY=e.clientY;
  state.camYaw  -= dx*0.003;
  state.camPitch = Math.max(-0.25,Math.min(0.65,state.camPitch+dy*0.003));
});
window.addEventListener('touchstart',e=>{ if(e.touches.length===1){state.mouseDragging=true;state.mouseHasMoved=false;state.lastMX=e.touches[0].clientX;state.lastMY=e.touches[0].clientY;} },{passive:true});
window.addEventListener('touchend',  ()=>{ state.mouseDragging=false; });
window.addEventListener('touchmove', e=>{
  if(!state.mouseDragging||e.touches.length!==1) return;
  const dx=e.touches[0].clientX-state.lastMX, dy=e.touches[0].clientY-state.lastMY;
  if(Math.abs(dx)>4||Math.abs(dy)>4) state.mouseHasMoved=true;
  state.lastMX=e.touches[0].clientX; state.lastMY=e.touches[0].clientY;
  state.camYaw  -= dx*0.004;
  state.camPitch = Math.max(-0.25,Math.min(0.65,state.camPitch+dy*0.004));
},{passive:true});

const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();
window.addEventListener('click', e=>{
  if(state.mouseHasMoved) return;
  pointer.x= (e.clientX/window.innerWidth )*2-1;
  pointer.y=-(e.clientY/window.innerHeight)*2+1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(state.artworkMeshes.map(a=>a.face),false);
  if(hits.length>0){ const found=state.artworkMeshes.find(a=>a.face===hits[0].object); if(found) openArtworkPanel(found); }
});
panelClose.addEventListener('click', closeArtworkPanel);
window.addEventListener('resize', ()=>{
  camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

// ─────────────────────────────────────────────────────────────────
//  ARTWORK PANEL
// ─────────────────────────────────────────────────────────────────
function openArtworkPanel(found) {
  panelTitle.textContent = found.art.title;
  panelDesc.textContent  = found.art.desc;
  panelMeta.textContent  = found.art.meta;
  panel.classList.remove('hidden');
  const wp = new THREE.Vector3();
  found.group.getWorldPosition(wp);
  const fwd = new THREE.Vector3(Math.sin(found.group.rotation.y),0,Math.cos(found.group.rotation.y)).multiplyScalar(2.6);
  state.camFocusOrigin = camera.position.clone();
  state.camFocusTarget = wp.clone().add(new THREE.Vector3(fwd.x,0.2,fwd.z));
  state.camLerpT       = 0;
  state.focusedArtwork = found;
}
function closeArtworkPanel() {
  panel.classList.add('hidden');
  state.focusedArtwork=null; state.camFocusTarget=null; state.camLerpT=1;
}

// ─────────────────────────────────────────────────────────────────
//  CHARACTER UPDATE  [C][D][E][F]
// ─────────────────────────────────────────────────────────────────
const SPEED  = 4.0;
const HALF_W = ROOM_W/2 - 0.6;
const HALF_D = ROOM_D/2 - 0.6;
const CHAR_R = 0.3;   // character bounding radius for Box3 colliders
const FADE_T = 0.18;
const _tmpQuat = new THREE.Quaternion();

function updateCharacter(dt) {
  if (!state.vrm) return;

  const mv = new THREE.Vector3();
  if (state.keys['KeyW']||state.keys['ArrowUp'])    mv.z -= 1;
  if (state.keys['KeyS']||state.keys['ArrowDown'])  mv.z += 1;
  if (state.keys['KeyA']||state.keys['ArrowLeft'])  mv.x -= 1;
  if (state.keys['KeyD']||state.keys['ArrowRight']) mv.x += 1;

  const moving = mv.lengthSq() > 0;

  if (moving) {
    mv.normalize();
    // Camera-relative movement:
    // Camera sits behind character at angle camYaw.
    // Camera forward (where camera looks) = (-sin(yaw), 0, -cos(yaw))
    // Camera right = (cos(yaw), 0, -sin(yaw))
    // W(mv.z=-1) → move forward (into scene), S(mv.z=+1) → move backward
    // A(mv.x=-1) → move left,                 D(mv.x=+1) → move right
    const fwdX = -Math.sin(state.camYaw);
    const fwdZ = -Math.cos(state.camYaw);
    const rgtX =  Math.cos(state.camYaw);
    const rgtZ = -Math.sin(state.camYaw);
    const worldDir = new THREE.Vector3(
      -mv.z * fwdX + mv.x * rgtX,
       0,
      -mv.z * fwdZ + mv.x * rgtZ
    );
    if (worldDir.lengthSq() > 0) worldDir.normalize();

    const next = state.charPos.clone().addScaledVector(worldDir, SPEED*dt);

    // [D] Wall AABB clamp
    next.x = Math.max(-HALF_W, Math.min(HALF_W, next.x));
    next.z = Math.max(-HALF_D, Math.min(HALF_D, next.z));

    // [D] Box3 collider check — try sliding if blocked
    const charAABB = new THREE.Box3(
      new THREE.Vector3(next.x-CHAR_R, 0, next.z-CHAR_R),
      new THREE.Vector3(next.x+CHAR_R, 2, next.z+CHAR_R)
    );
    let blocked = false;
    for (const col of state.colliders) {
      if (charAABB.intersectsBox(col)) { blocked = true; break; }
    }
    if (!blocked) {
      state.charPos.copy(next);
    } else {
      // Try sliding on X only
      const slideX = state.charPos.clone();
      slideX.x = Math.max(-HALF_W, Math.min(HALF_W, state.charPos.x + worldDir.x * SPEED * dt));
      const aabbX = new THREE.Box3(
        new THREE.Vector3(slideX.x-CHAR_R,0,slideX.z-CHAR_R),
        new THREE.Vector3(slideX.x+CHAR_R,2,slideX.z+CHAR_R)
      );
      let bX=false; for(const c of state.colliders) if(aabbX.intersectsBox(c)){bX=true;break;}
      if (!bX) { state.charPos.x = slideX.x; }

      // Try sliding on Z only
      const slideZ = state.charPos.clone();
      slideZ.z = Math.max(-HALF_D, Math.min(HALF_D, state.charPos.z + worldDir.z * SPEED * dt));
      const aabbZ = new THREE.Box3(
        new THREE.Vector3(slideZ.x-CHAR_R,0,slideZ.z-CHAR_R),
        new THREE.Vector3(slideZ.x+CHAR_R,2,slideZ.z+CHAR_R)
      );
      let bZ=false; for(const c of state.colliders) if(aabbZ.intersectsBox(c)){bZ=true;break;}
      if (!bZ) { state.charPos.z = slideZ.z; }
    }

    // [C] Quaternion slerp — character faces movement direction
    // atan2(x,z) gives the angle of worldDir on XZ plane.
    // Add Math.PI because VRM default face direction is +Z,
    // but we want the character to face TOWARD movement (away from camera).
    const targetAngle = Math.atan2(worldDir.x, worldDir.z) + Math.PI;
    _tmpQuat.setFromAxisAngle(new THREE.Vector3(0,1,0), targetAngle);
    state.charQuat.slerp(_tmpQuat, Math.min(1, 12 * dt));
  }

  // Apply transform
  state.vrm.scene.position.x = state.charPos.x;
  state.vrm.scene.position.z = state.charPos.z;
  state.vrm.scene.position.y = state.charPos.y + Math.sin(clock.elapsedTime*1.8)*0.002;
  // VRM: extract Y rotation from quaternion and apply via rotation.y
  // (direct quaternion.copy is unreliable on VRM scene roots)
  const ey = Math.atan2(
    2*(state.charQuat.w*state.charQuat.y + state.charQuat.x*state.charQuat.z),
    1 - 2*(state.charQuat.y*state.charQuat.y + state.charQuat.z*state.charQuat.z)
  );
  state.vrm.scene.rotation.y = ey;

  // Animation: crossFade if clips exist; otherwise procedural bob
  if (state.mixer) {
    // Clip-based animation (only runs if VRM has embedded clips)
    if (moving !== state.isWalking) {
      state.isWalking = moving;
      if (moving && state.idleAction && state.walkAction) {
        state.idleAction.crossFadeTo(state.walkAction, FADE_T, true);
      } else if (!moving && state.walkAction && state.idleAction) {
        state.walkAction.crossFadeTo(state.idleAction, FADE_T, true);
      }
    }
  } else {
    // Procedural animation fallback for VRMs with no embedded clips
    // Uses VRM humanoid bone API if available, otherwise moves the root
    state.isWalking = moving;
    const t = clock.elapsedTime;
    if (state.vrm && state.vrm.humanoid) {
      const h = state.vrm.humanoid;

      // Helper: get bone node safely
      const bone = (name) => h.getNormalizedBoneNode(name);

      // ── Arms: T-pose fix ──
      // VRM T-pose has arms at 90° sideways (rotation.z = ±π/2).
      // We need to bring arms DOWN first (rotation.z → 0 or small value),
      // then swing them forward/back via rotation.x.
      // Natural arm-down position for VRM: leftUpperArm.z ≈ -1.2, rightUpperArm.z ≈ +1.2
      // (slightly angled away from body, not flat at sides)

      // ─────────────────────────────────────────────────────────
      //  【手指骨骼微彎】
      //  VRM 標準手指骨骼命名規律：
      //    {side}{Finger}{Joint}
      //    side  : left / right
      //    finger: Thumb / Index / Middle / Ring / Little
      //    joint : Proximal / Intermediate / Distal
      //  使用陣列 + 迴圈統一設定，避免重複代碼。
      //  rotation.x 正值 = 往掌心方向彎曲（VRM 座標系）
      // ─────────────────────────────────────────────────────────
      const FINGER_NAMES = ['Index', 'Middle', 'Ring', 'Little'];
      const FINGER_JOINTS = ['Proximal', 'Intermediate', 'Distal'];
      // 各關節彎曲角度：近端稍彎、中端多彎、末端最彎，呈自然蜷縮
      const FINGER_CURL = { Proximal: -0.3, Intermediate: -0.7, Distal: -0.3 };
      // 拇指單獨設定（拇指彎曲方向不同）
      const THUMB_CURL  = { Proximal: 0.2, Intermediate: 0.3, Distal: 0.4 };

const applyFingerCurl = () => {
  ['left', 'right'].forEach(side => {
    
// ⚡ 請把 1. 四指這段代碼，完完整整替換成下面這樣：
FINGER_NAMES.forEach(finger => {
  FINGER_JOINTS.forEach(joint => {
    const boneName = `${side}${finger}${joint}`; 
    const b = bone(boneName);
    
    if (b) {
      b.rotation.x = 0; 
      b.rotation.y = 0; 
      
      const directionMultiplier = (side === 'left') ? -1 : 1;
      
      b.rotation.z = FINGER_CURL[joint] * directionMultiplier; 
    }
  });
});
    
    // 2. 拇指單獨處理
    FINGER_JOINTS.forEach(joint => {
      const b = bone(`${side}Thumb${joint}`);
      if (b) {
        // 拇指微彎
        b.rotation.x = 0.2;
        
        // 修正：只有最底部的關節（Proximal）需要往內收，其他關節不要亂轉
        if (joint === 'Proximal') {
          // 左手大拇指和右手大拇指內收方向相反
          b.rotation.z = (side === 'left') ? 0.2 : -0.2;
          b.rotation.y = (side === 'left') ? 0.1 : -0.1;
        } else {
          b.rotation.y = 0;
          b.rotation.z = 0;
        }
      }
    });

  });
};
      if (moving) {
        // ─────────────────────────────────────────────────────
        //  【走路狀態】
        //  正弦波頻率 7 rad/s ≈ 步頻，與移動速度 4.0 匹配。
        //  手臂與腿部反向擺動（左手 = 右腿同步）。
        // ─────────────────────────────────────────────────────
        const swing = Math.sin(t * 7) * 0.45;
        const bob   = Math.abs(Math.sin(t * 7)) * 0.025;

        // 【左上臂】放下（z=+1.2）並前後擺動（x）
        if (bone('leftUpperArm')) {
          bone('leftUpperArm').rotation.z =  1.1;
          bone('leftUpperArm').rotation.x =  swing * 0.85;
        }
        // 【右上臂】放下（z=-1.2）並反向擺動
        if (bone('rightUpperArm')) {
          bone('rightUpperArm').rotation.z = -1.1;
          bone('rightUpperArm').rotation.x = -swing * 0.85;
        }
        // 【下臂】走路時輕微彎曲，更自然
        if (bone('leftLowerArm'))  bone('leftLowerArm').rotation.x  = -0.4;
        if (bone('rightLowerArm')) bone('rightLowerArm').rotation.x = -0.4;

        // 【大腿】前後交替擺動
        // swing > 0：左腿前踢、右腿後收
        // swing < 0：左腿後收、右腿前踢
        if (bone('leftUpperLeg'))  bone('leftUpperLeg').rotation.x  = -swing * 0.80;
        if (bone('rightUpperLeg')) bone('rightUpperLeg').rotation.x =  swing * 0.80;

        // 【小腿 / 膝蓋】正確走路生物力學：
        // 前踢時：大腿往前抬，小腿因慣性保持垂直 → 膝蓋彎曲最多
        // 後收時：大腿往後，大腿小腿慢慢伸直成一直線 → 膝蓋接近 0
        //
        // 左大腿 rotation.x = -swing * 0.60
        //   swing > 0 → 左大腿往前（rotation.x 為負）→ 前踢 → 膝蓋應彎曲
        //   swing < 0 → 左大腿往後（rotation.x 為正）→ 後收 → 膝蓋應伸直
        // ∴ 左小腿彎曲量 ∝ Math.max(0, swing)（swing 越大 = 前踢越多 = 膝蓋越彎）
        //
        // 右大腿 rotation.x = +swing * 0.60，邏輯相反
        // ∴ 右小腿彎曲量 ∝ Math.max(0, -swing)
        const kneeBase = -0.12;   // 走路時膝蓋的最小彎曲（防止完全鎖直）
        const kneeAmp  = -0.9;   // 前踢頂點時的最大額外彎曲幅度

        if (bone('leftLowerLeg')) {
          bone('leftLowerLeg').rotation.x = kneeBase + Math.max(0, swing) * kneeAmp;
        }
        if (bone('rightLowerLeg')) {
          bone('rightLowerLeg').rotation.x = kneeBase + Math.max(0, -swing) * kneeAmp;
        }

        // 【腳踝】前踢頂點時腳掌自然下垂（重力），落地時腳尖翹起準備踩地
        if (bone('leftFoot'))  bone('leftFoot').rotation.x  =  Math.max(0, swing) * 0.25;
        if (bone('rightFoot')) bone('rightFoot').rotation.x =  Math.max(0, -swing) * 0.25;

        // 【身體輕微上下晃動】
        state.vrm.scene.position.y = state.charPos.y + bob;

        // 【走路時手指保持微蜷】
        applyFingerCurl();

      } else {
        // ─────────────────────────────────────────────────────
        //  【靜止（Idle）狀態】
        //  呼吸頻率 1.4 rad/s ≈ 每 4.5 秒一次呼吸，非常輕柔。
        // ─────────────────────────────────────────────────────
        const breathe = Math.sin(t * 1.4) * 0.006;

        // 【上臂】自然垂下，隨呼吸輕微開合
        if (bone('leftUpperArm')) {
          // z 值越大 = 手臂越靠近身體；+1.35 比走路時的 +1.2 更靠近
          bone('leftUpperArm').rotation.z =  1.1 + breathe * 0.4;
          bone('leftUpperArm').rotation.x =  0;
        }
        if (bone('rightUpperArm')) {
          bone('rightUpperArm').rotation.z = -1.1 - breathe * 0.4;
          bone('rightUpperArm').rotation.x =  0;
        }
        // 【肩膀】輕微向前收，讓手臂更自然地貼近身體
        if (bone('leftShoulder'))  bone('leftShoulder').rotation.z  =  0.08;
        if (bone('rightShoulder')) bone('rightShoulder').rotation.z = -0.08;

        // 【下臂】自然微彎
        if (bone('leftLowerArm'))  bone('leftLowerArm').rotation.y  =  0.15;
        if (bone('rightLowerArm')) bone('rightLowerArm').rotation.y = -0.15;

        // 【腿部歸零】
        if (bone('leftUpperLeg'))  bone('leftUpperLeg').rotation.x  = 0;
        if (bone('rightUpperLeg')) bone('rightUpperLeg').rotation.x = 0;
        if (bone('leftLowerLeg'))  bone('leftLowerLeg').rotation.x  = 0;
        if (bone('rightLowerLeg')) bone('rightLowerLeg').rotation.x = 0;

        // 【脊椎/胸腔】隨呼吸輕微起伏
        if (bone('spine')) bone('spine').rotation.z = breathe;
        if (bone('chest')) bone('chest').rotation.z = breathe * 0.4;
        // 呼吸時身體高度輕微變化
        state.vrm.scene.position.y = state.charPos.y + Math.abs(breathe) * 0.3;

        // 【靜止時手指保持微蜷】
        applyFingerCurl();
      }
    }
  }

  state.vrm.update(dt);
}

// ─────────────────────────────────────────────────────────────────
//  CAMERA
// ─────────────────────────────────────────────────────────────────
function easeInOut(t) { return t<.5?2*t*t:-1+(4-2*t)*t; }

function updateCamera(dt) {
  if (state.camFocusTarget && state.camLerpT < 1) {
    state.camLerpT = Math.min(1, state.camLerpT + dt*1.4);
    camera.position.lerpVectors(state.camFocusOrigin, state.camFocusTarget, easeInOut(state.camLerpT));
    const wp=new THREE.Vector3();
    state.focusedArtwork?.group.getWorldPosition(wp);
    camera.lookAt(wp.x, wp.y, wp.z);
    return;
  }
  if (state.focusedArtwork) return;

  const d=state.camDist;
  const px=state.charPos.x + d*Math.sin(state.camYaw)*Math.cos(state.camPitch);
  const py=state.charPos.y + 1.5 + d*Math.sin(state.camPitch);
  const pz=state.charPos.z + d*Math.cos(state.camYaw)*Math.cos(state.camPitch);

  camera.position.lerp(new THREE.Vector3(
    Math.max(-HALF_W+.2,Math.min(HALF_W-.2,px)),
    Math.max(.5,py),
    Math.max(-HALF_D+.2,Math.min(HALF_D-.2,pz))
  ), 0.12);
  camera.lookAt(state.charPos.x, state.charPos.y+1.2, state.charPos.z);

  if(state.needle) state.needle.setAttribute('transform',
    `rotate(${(-state.camYaw*180/Math.PI).toFixed(1)},18,18)`);
}

// ─────────────────────────────────────────────────────────────────
//  RENDER LOOP
// ─────────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t  = clock.elapsedTime;

  if (state.mixer) state.mixer.update(dt);

  // Candle flicker
  if (state.candleLight)
    state.candleLight.intensity = 1.0+Math.sin(t*13.7)*.25+Math.sin(t*7.3)*.15;
  state.cakeCandles.forEach((f,i)=>{
    f.scale.y = 0.9+Math.sin(t*11+i*2.1)*.15;
    f.scale.x = 0.9+Math.sin(t*8+i*1.4)*.10;
  });
  state.balloons.forEach(b=>{ b.mesh.position.y = b.baseY+Math.sin(t*.8+b.phase)*.06; });

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
