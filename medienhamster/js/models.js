/* Medienhamster 3D – Texturen, Materialien und alle 3D-Modelle (prozedural, ohne externe Dateien) */
import { THREE, RoundedBoxGeometry, canvasTex, rnd, boxGeo, mat4, tubeBetween, Parts } from './core.js?v=10';
const V3 = THREE.Vector3, PI = Math.PI;

/* =====================================================================
   TEXTUREN
   ===================================================================== */
function strokes(g, w, h, n, cols, len, ang, jit, lw, alpha) {
  g.lineWidth = lw; g.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const x = rnd() * w, y = rnd() * h, a = ang + (rnd() - 0.5) * jit, l = len[0] + rnd() * (len[1] - len[0]);
    g.strokeStyle = cols[i % cols.length]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.globalAlpha = 1;
}
function blob(g, cx, cy, rx, ry, col, col0) {
  g.save(); g.translate(cx, cy); g.scale(rx, ry);
  const r = g.createRadialGradient(0, 0, 0, 0, 0, 1); r.addColorStop(0, col); r.addColorStop(0.65, col); r.addColorStop(1, col0);
  g.fillStyle = r; g.beginPath(); g.arc(0, 0, 1, 0, PI * 2); g.fill(); g.restore();
}
function speck(g, w, h, n, base, amp, sz = 2) { for (let i = 0; i < n; i++) { const v = base + (rnd() - 0.5) * amp; g.fillStyle = `rgb(${v | 0},${v | 0},${(v + 3) | 0})`; g.fillRect(rnd() * w, rnd() * h, sz, sz); } }

export const T = {};
T.fur = canvasTex(512, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d6873a'); gr.addColorStop(0.45, '#e3984a'); gr.addColorStop(1, '#eaa65e');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const rg = g.createLinearGradient(0, 0, w, 0);   // Rücken (u = 0.75) etwas dunkler
  rg.addColorStop(0, 'rgba(110,55,15,0)'); rg.addColorStop(0.5, 'rgba(110,55,15,0)'); rg.addColorStop(0.75, 'rgba(110,55,15,0.3)'); rg.addColorStop(1, 'rgba(110,55,15,0)');
  g.fillStyle = rg; g.fillRect(0, 0, w, h);
  blob(g, w * 0.25, h * 0.72, w * 0.13, h * 0.27, '#fbe4c6', 'rgba(251,228,198,0)');   // Bauch
  blob(g, w * 0.25, h * 0.47, w * 0.07, h * 0.075, '#fdebd3', 'rgba(253,235,211,0)');  // Schnauze
  strokes(g, w, h, 9000, ['#8a4a18', '#f7c891', '#b8692a', '#ffe3bd'], [3, 7], PI / 2, 0.7, 1, 0.2);
});
T.furBump = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); strokes(g, w, h, 14000, ['#ffffff', '#000000'], [3, 8], PI / 2, 0.7, 1, 0.35); }, { data: true });
T.vest = canvasTex(512, 128, (g, w, h) => {
  g.fillStyle = '#7b35ec'; g.fillRect(0, 0, w, h);
  strokes(g, w, h, 3000, ['#6526d0', '#9050ff'], [2, 5], 0, 3, 1, 0.35);
  for (const y of [0.22, 0.66]) { g.fillStyle = '#d5dbe3'; g.fillRect(0, h * y, w, h * 0.13); g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(0, h * y + 2, w, 2); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, h * (y + 0.12), w, 2); }
  g.fillStyle = '#4e1aa6'; g.fillRect(0, 0, 9, h); g.fillRect(w - 9, 0, 9, h); g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
  g.fillStyle = '#f6f2ff'; g.font = '900 29px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MEDIEN', w * 0.5, h * 0.5);
});
T.rouge = canvasTex(64, 64, (g) => blob(g, 32, 32, 30, 30, 'rgba(255,120,150,0.55)', 'rgba(255,120,150,0)'));
T.sticker = canvasTex(128, 128, (g) => {
  g.fillStyle = '#8e44ff'; g.beginPath(); g.arc(64, 64, 62, 0, PI * 2); g.fill(); g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(72, 10); g.lineTo(36, 72); g.lineTo(60, 72); g.lineTo(50, 118); g.lineTo(92, 52); g.lineTo(66, 52); g.closePath(); g.fill();
});
T.laminate = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#1d1e22'; g.fillRect(0, 0, w, h); speck(g, w, h, 6000, 30, 18); });
T.laminateBlue = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#1c2a44'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { const v = (rnd() - 0.5) * 16; g.fillStyle = `rgb(${28 + v | 0},${42 + v | 0},${68 + v | 0})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); } });
export function labelTex(text, sub = '', bg = '#f2f2ee', fg = '#111') {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center';
    g.font = '900 54px Impact, "Arial Black", sans-serif'; g.fillText(text, w / 2, sub ? 68 : 84);
    if (sub) { g.font = '700 22px monospace'; g.fillText(sub, w / 2, 104); }
    g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
  });
}
T.floor = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#4a4650'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) blob(g, rnd() * w, rnd() * h, 30 + rnd() * 90, 20 + rnd() * 60, `rgba(${rnd() < 0.5 ? '30,28,34' : '90,86,96'},0.12)`, 'rgba(0,0,0,0)');
  speck(g, w, h, 9000, 74, 30);
  g.strokeStyle = 'rgba(20,18,24,0.5)'; g.lineWidth = 1.5;   // Risse
  for (let i = 0; i < 6; i++) { let x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 14; k++) { x += (rnd() - 0.5) * 22; y += (rnd() - 0.3) * 18; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = '#2c2930'; g.fillRect(0, 0, w, 4); g.fillRect(0, 0, 4, h);   // Dehnungsfugen
  for (let i = 0; i < 3; i++) blob(g, rnd() * w, rnd() * h, 25 + rnd() * 30, 12 + rnd() * 15, 'rgba(10,8,12,0.35)', 'rgba(0,0,0,0)');   // Ölflecken
});
T.wall = canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#8d8a8f'; g.fillRect(0, 0, w, h * 0.72);
  speck(g, w, h * 0.72, 5000, 140, 14);
  g.strokeStyle = 'rgba(60,58,64,0.55)'; g.lineWidth = 2;
  for (let y = 0; y < h * 0.72; y += 42) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = ((y / 42) % 2) * 64; x < w; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 42); g.stroke(); } }
  g.fillStyle = '#e2b51c'; g.fillRect(0, h * 0.72, w, 7);
  g.fillStyle = '#28507f'; g.fillRect(0, h * 0.72 + 7, w, h);
  for (let i = 0; i < 2500; i++) { const v = (rnd() - 0.5) * 22; g.fillStyle = `rgb(${40 + v | 0},${80 + v | 0},${127 + v | 0})`; g.fillRect(rnd() * w, h * 0.72 + 7 + rnd() * (h * 0.28 - 7), 2, 2); }
  const dirt = g.createLinearGradient(0, h * 0.85, 0, h); dirt.addColorStop(0, 'rgba(20,16,12,0)'); dirt.addColorStop(1, 'rgba(20,16,12,0.45)'); g.fillStyle = dirt; g.fillRect(0, h * 0.85, w, h * 0.15);
  for (let i = 0; i < 6; i++) { const x = rnd() * w; const gr = g.createLinearGradient(0, 0, 0, h * 0.7); gr.addColorStop(0, 'rgba(70,55,40,0.25)'); gr.addColorStop(1, 'rgba(70,55,40,0)'); g.fillStyle = gr; g.fillRect(x, 0, 6 + rnd() * 10, h * 0.7); }   // Wasserspuren
});
T.ceil = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3b3840'; g.fillRect(0, 0, w, h); speck(g, w, h, 5000, 58, 22); });
T.hazard = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#f2c018'; g.fillRect(0, 0, w, h); g.fillStyle = '#17151a';
  for (let i = -2; i < 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64 + 32, 0); g.lineTo(i * 64 + 32 + 128, h); g.lineTo(i * 64 + 128, h); g.fill(); }
  speck(g, w, h, 400, 120, 60, 1);
});
T.grate = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#6d7077'; g.fillRect(0, 0, w, h); g.fillStyle = '#121214'; for (let y = 6; y < h; y += 16) for (let x = 4; x < w; x += 32) g.fillRect(x, y, 24, 8); });
T.belt = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#1b1b1e'; g.fillRect(0, 0, w, h); speck(g, w, h, 1500, 34, 14);
  g.strokeStyle = '#3a3a40'; g.lineWidth = 7; for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(10, y + 24); g.lineTo(w / 2, y + 8); g.lineTo(w - 10, y + 24); g.stroke(); }
});
T.shutter = canvasTex(128, 256, (g, w, h) => {
  for (let y = 0; y < h; y += 16) { const gr = g.createLinearGradient(0, y, 0, y + 16); gr.addColorStop(0, '#b8bcc2'); gr.addColorStop(0.5, '#8e9298'); gr.addColorStop(1, '#5d6066'); g.fillStyle = gr; g.fillRect(0, y, w, 16); }
  speck(g, w, h, 800, 140, 40, 1);
});
T.rope = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#1f5fd0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f2c018'; g.lineWidth = 7; for (let i = -64; i < 128; i += 22) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, h); g.stroke(); } g.strokeStyle = '#ffffff'; g.lineWidth = 2; for (let i = -64; i < 128; i += 22) { g.beginPath(); g.moveTo(i + 10, 0); g.lineTo(i + 74, h); g.stroke(); } });
T.cardboard = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b48a58'; g.fillRect(0, 0, w, h); speck(g, w, h, 3000, 150, 30, 2);
  g.fillStyle = 'rgba(210,190,150,0.8)'; g.fillRect(w * 0.42, 0, w * 0.16, h);   // Klebeband
  g.strokeStyle = '#3a2a1a'; g.lineWidth = 6; g.beginPath(); g.moveTo(40, 200); g.lineTo(40, 150); g.moveTo(26, 166); g.lineTo(40, 150); g.lineTo(54, 166); g.moveTo(76, 200); g.lineTo(76, 150); g.moveTo(62, 166); g.lineTo(76, 150); g.lineTo(90, 166); g.stroke();
});
T.wood = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#c49a62'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,80,40,0.35)'; g.lineWidth = 1.5; for (let i = 0; i < 18; i++) { g.beginPath(); let y = rnd() * h; g.moveTo(0, y); for (let x = 0; x < w; x += 16) { y += (rnd() - 0.5) * 3; g.lineTo(x, y); } g.stroke(); } speck(g, w, h, 600, 160, 40, 1); });
T.steel = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#9ea3aa'; g.fillRect(0, 0, w, h); strokes(g, w, h, 4000, ['#c9ced4', '#7d828a'], [20, 60], 0, 0.02, 1, 0.25); });
T.stage = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#17161a'; g.fillRect(0, 0, w, h); speck(g, w, h, 2500, 30, 14);
  g.strokeStyle = '#0b0b0d'; g.lineWidth = 2; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, h); g.moveTo(0, 0); g.lineTo(w, 0); g.stroke();
  g.fillStyle = '#e8e8e8'; g.fillRect(40, 60, 22, 5); g.fillStyle = '#f2c018'; g.fillRect(180, 190, 5, 22); g.fillStyle = '#2bd1ff'; g.fillRect(150, 40, 18, 5);
});
T.curtain = canvasTex(256, 64, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 13 + 11 * Math.sin(x / w * PI * 8) ** 2; g.fillStyle = `rgb(${v | 0},${(v - 2) | 0},${(v + 5) | 0})`; g.fillRect(x, 0, 1, h); } });
T.grille = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#121214'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b2b30'; for (let y = 3; y < h; y += 6) for (let x = 3 + (y % 12 ? 3 : 0); x < w; x += 6) { g.beginPath(); g.arc(x, y, 1.6, 0, PI * 2); g.fill(); } });
T.puff = canvasTex(64, 64, (g) => blob(g, 32, 32, 31, 31, 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'));
T.spark = canvasTex(64, 64, (g) => { blob(g, 32, 32, 30, 30, 'rgba(160,210,255,0.6)', 'rgba(120,180,255,0)'); blob(g, 32, 32, 9, 9, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)'); });
T.ring = canvasTex(128, 128, (g) => { g.strokeStyle = 'rgba(255,60,40,1)'; g.lineWidth = 10; g.beginPath(); g.arc(64, 64, 54, 0, PI * 2); g.stroke(); g.fillStyle = 'rgba(255,60,40,0.25)'; g.beginPath(); g.arc(64, 64, 50, 0, PI * 2); g.fill(); g.lineWidth = 6; g.beginPath(); g.moveTo(64, 30); g.lineTo(64, 98); g.moveTo(30, 64); g.lineTo(98, 64); g.stroke(); });
T.blob = canvasTex(64, 64, (g) => blob(g, 32, 32, 31, 31, 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0)'));
export function signTex(text, sub, bg, fg = '#fff', icon = null, cw = 512) {
  return canvasTex(cw, 160, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, w, h / 2);
    g.fillStyle = fg; g.textAlign = 'center'; const cx = icon ? w / 2 + 50 : w / 2;
    const maxW = w - (icon ? 130 : 40);
    let fs = 62; g.font = `900 ${fs}px system-ui, "Arial Black", sans-serif`; const tw = g.measureText(text).width; if (tw > maxW) { fs = Math.floor(fs * maxW / tw); g.font = `900 ${fs}px system-ui, "Arial Black", sans-serif`; }
    g.fillText(text, cx, sub ? 80 : 100);
    if (sub) { let ss = 32; g.font = `700 ${ss}px system-ui, sans-serif`; const sw = g.measureText(sub).width; if (sw > maxW) { ss = Math.floor(ss * maxW / sw); g.font = `700 ${ss}px system-ui, sans-serif`; } g.fillText(sub, cx, 128); }
    if (icon === 'exit') {   // Notausgang-Männchen
      g.strokeStyle = fg; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.arc(70, 34, 12, 0, PI * 2); g.fillStyle = fg; g.fill();
      g.beginPath(); g.moveTo(66, 52); g.lineTo(56, 92); g.lineTo(80, 118); g.moveTo(56, 92); g.lineTo(34, 120); g.moveTo(62, 62); g.lineTo(86, 78); g.moveTo(62, 62); g.lineTo(40, 70); g.stroke();
    }
    if (icon === 'arrow') { g.fillStyle = fg; g.beginPath(); g.moveTo(40, 50); g.lineTo(90, 80); g.lineTo(40, 110); g.closePath(); g.fill(); }
  });
}

/* =====================================================================
   MATERIALIEN
   ===================================================================== */
const std = (o) => new THREE.MeshStandardMaterial(o);
const phys = (o) => new THREE.MeshPhysicalMaterial(o);
export const MAT = {
  floor: std({ map: T.floor, roughness: 0.88 }),
  wall: std({ map: T.wall, roughness: 0.95 }),
  ceil: std({ map: T.ceil, roughness: 1 }),
  concrete: std({ map: T.ceil, color: '#9a96a0', roughness: 0.95 }),
  hazard: std({ map: T.hazard, roughness: 0.7 }),
  laminate: std({ map: T.laminate, roughness: 0.55, metalness: 0.1 }),
  laminateBlue: std({ map: T.laminateBlue, roughness: 0.5, metalness: 0.1 }),
  alu: std({ color: '#c9ced6', roughness: 0.32, metalness: 0.9 }),
  chrome: std({ color: '#e8ebef', roughness: 0.12, metalness: 1 }),
  steel: std({ map: T.steel, roughness: 0.35, metalness: 0.85 }),
  darkMetal: std({ color: '#2a2c31', roughness: 0.45, metalness: 0.7 }),
  black: std({ color: '#151517', roughness: 0.75 }),
  rubber: std({ color: '#0e0e10', roughness: 0.9 }),
  pipe: std({ color: '#8a8e96', roughness: 0.4, metalness: 0.6 }),
  pipeRed: std({ color: '#b0332b', roughness: 0.45, metalness: 0.3 }),
  pipeYellow: std({ color: '#e0b020', roughness: 0.45, metalness: 0.3 }),
  tray: std({ color: '#9aa0a8', roughness: 0.4, metalness: 0.75 }),
  hookYellow: std({ color: '#f0b21e', roughness: 0.4, metalness: 0.35 }),
  orange: std({ color: '#ff7a1a', roughness: 0.5 }),
  white: std({ color: '#f2f2f0', roughness: 0.6 }),
  red: std({ color: '#d42a22', roughness: 0.4, metalness: 0.2 }),
  blue: std({ color: '#2a5fd0', roughness: 0.45, metalness: 0.2 }),
  green: std({ color: '#2a9d4a', roughness: 0.5 }),
  rackBlue: std({ color: '#2456a8', roughness: 0.5, metalness: 0.4 }),
  rackOrange: std({ color: '#f07a12', roughness: 0.5, metalness: 0.4 }),
  forklift: std({ color: '#f2a20c', roughness: 0.42, metalness: 0.25 }),
  cardboard: std({ map: T.cardboard, roughness: 0.9 }),
  wood: std({ map: T.wood, roughness: 0.85 }),
  grate: std({ map: T.grate, roughness: 0.5, metalness: 0.7 }),
  belt: std({ map: T.belt, roughness: 0.8 }),
  shutter: std({ map: T.shutter, roughness: 0.45, metalness: 0.6 }),
  rope: std({ map: T.rope, roughness: 0.8 }),
  grille: std({ map: T.grille, roughness: 0.7 }),
  curtain: std({ map: T.curtain, roughness: 1 }),
  stage: std({ map: T.stage, roughness: 0.72 }),
  water: phys({ color: '#0d1720', roughness: 0.05, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, polygonOffset: true, polygonOffsetFactor: -2 }),
  // leuchtende Materialien (HDR-Werte > 1 → Bloom)
  neon: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.4, 3.6) }),
  neonOff: std({ color: '#3a3d44', roughness: 0.3 }),
  glowAmber: new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 1.8, 0.2) }),
  glowRed: new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.35, 0.25) }),
  glowGreen: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 3.5, 0.9) }),
  glowBlue: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.4, 4) }),
  glowWarm: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 2.7, 1.8) }),
  glowPurple: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.8, 4) }),
  lensOff: std({ color: '#55565c', roughness: 0.2, metalness: 0.3 }),
};
export const glowMat = (r, g, b, opacity = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), transparent: opacity < 1, opacity, depthWrite: opacity >= 1, blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: true });
export const beamMat = (hex, op = 0.1) => new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
export function signMesh(text, sub, bg, w = 2.6, icon = null, glow = false) {
  const tex = signTex(text, sub, bg, '#fff', icon);
  const m = glow ? new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.6, 1.6, 1.6) }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35 });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, w * 160 / 512), m);
}
function mesh(geo, mat, p, s, r, par) { const m = new THREE.Mesh(geo, mat); if (p) m.position.set(p[0], p[1], p[2]); if (s) m.scale.set(s[0], s[1], s[2]); if (r) m.rotation.set(r[0], r[1], r[2]); m.castShadow = true; m.receiveShadow = true; if (par) par.add(m); return m; }

/* =====================================================================
   MEDIEN HAMSTER
   ===================================================================== */
const HM = {
  fur: phys({ map: T.fur, bumpMap: T.furBump, bumpScale: 2, roughness: 0.85, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color('#ffd2a0') }),
  furD: phys({ color: '#c97d38', bumpMap: T.furBump, bumpScale: 2, roughness: 0.85, sheen: 0.8, sheenRoughness: 0.45, sheenColor: new THREE.Color('#ffcf9a') }),
  face: phys({ color: '#e39a50', bumpMap: T.furBump, bumpScale: 1.5, roughness: 0.85, sheen: 0.8, sheenColor: new THREE.Color('#ffd2a0') }),
  cheek: phys({ color: '#f3bd84', bumpMap: T.furBump, bumpScale: 1.5, roughness: 0.85, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color('#fff0dc') }),
  pink: phys({ color: '#f29db2', roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color('#ffd0dc') }),
  nose: phys({ color: '#e5839c', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
  vest: std({ map: T.vest, roughness: 0.75, side: THREE.DoubleSide }),
  helmet: phys({ color: '#121215', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.05 }),
  eye: phys({ color: '#060608', roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 }),
  shine: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.6, 1.6) }),
  dark: std({ color: '#3a2212', roughness: 0.8 }),
  tooth: std({ color: '#fffaf0', roughness: 0.3 }),
  cig: std({ color: '#f4f4f2', roughness: 0.6 }),
  filter: std({ color: '#d9963f', roughness: 0.7 }),
  rouge: new THREE.MeshBasicMaterial({ map: T.rouge, transparent: true, depthWrite: false }),
  sticker: std({ map: T.sticker, roughness: 0.4, transparent: true }),
  lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 1.1, 0.9) }),
};
// Birnenform: unten breiter, vorne leichter Bauch
function hamDeform(x, y, z) {
  const w = 1 + Math.max(0, -y) * 0.15 - Math.max(0, y) * 0.05;
  let b = 1; if (z > 0 && y < 0.35) b = 1 + 0.07 * Math.max(0, 1 - Math.abs(y + 0.25) * 1.6);
  return [x * w * 0.84, y * 0.95, z * w * b * 0.8];
}
function deformGeo(g, r = 1) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = hamDeform(p.getX(i) / r, p.getY(i) / r, p.getZ(i) / r); p.setXYZ(i, v[0] * r, v[1] * r, v[2] * r); } g.computeVertexNormals(); return g; }
function surfZ(x, y) { const Y = y / 0.95, w = 1 + Math.max(0, -Y) * 0.15 - Math.max(0, Y) * 0.05, X = x / (0.84 * w), Z = Math.sqrt(Math.max(0, 1 - Y * Y - X * X)); const b = Y < 0.35 ? 1 + 0.07 * Math.max(0, 1 - Math.abs(Y + 0.25) * 1.6) : 1; return Z * w * b * 0.8; }

export function buildHamster() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.position.y = 0.95;
  const add = (geo, mat, p, s, r, par = body) => mesh(geo, mat, p, s, r, par);
  add(deformGeo(new THREE.SphereGeometry(1, 64, 44)), HM.fur);
  add(deformGeo(new THREE.SphereGeometry(1.035, 64, 18, PI * 0.74, PI * 1.52, PI * 0.42, PI * 0.34), 1.035), HM.vest);
  // Bauhelm
  const helm = new THREE.Group(); helm.position.set(0, 0.5, 0.02); helm.rotation.x = -0.1; body.add(helm);
  const prof = [[0.001, 0.6], [0.2, 0.585], [0.36, 0.54], [0.48, 0.45], [0.57, 0.33], [0.625, 0.2], [0.648, 0.08], [0.655, 0.02], [0.7, 0.0], [0.72, -0.025], [0.69, -0.045], [0.6, -0.035]].map(([r, y]) => new THREE.Vector2(r, y));
  add(new THREE.LatheGeometry(prof, 56), HM.helmet, null, [1, 1, 1.06], null, helm);
  add(new THREE.CylinderGeometry(0.8, 0.82, 0.03, 40, 1, false, -0.8, 1.6), HM.helmet, [0, -0.012, 0.02], [1, 1, 1.12], [0.16, 0, 0], helm);
  const rp = prof.slice(0, 8), rpts = [...rp.slice().reverse().map(v => new V3(0, v.y + 0.012, -v.x * 1.06)), ...rp.slice(1).map(v => new V3(0, v.y + 0.012, v.x * 1.06))];
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rpts), 48, 0.045, 8), HM.helmet, null, null, null, helm);
  for (const s of [-1, 1]) { const st = add(new THREE.CircleGeometry(0.1, 24), HM.sticker, [s * 0.555, 0.3, 0.06], null, null, helm); st.quaternion.setFromUnitVectors(new V3(0, 0, 1), new V3(s * 0.85, 0.52, 0.1).normalize()); st.castShadow = false; }
  const lampG = new THREE.Group(); lampG.position.set(0, 0.3, 0.6); lampG.rotation.x = -0.35; helm.add(lampG);
  add(new RoundedBoxGeometry(0.2, 0.13, 0.1, 2, 0.03), HM.helmet, null, null, null, lampG);
  const lens = add(new THREE.CircleGeometry(0.048, 20), HM.lamp, [0, 0, 0.052], null, null, lampG); lens.castShadow = false;
  const lampAnchor = new THREE.Object3D(); lampAnchor.position.set(0, 0, 0.1); lampG.add(lampAnchor);
  // Ohren unter der Krempe
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(s * 0.6, 0.47, -0.1); ear.rotation.set(-0.15, s * 0.35, s * 1.0); body.add(ear);
    add(new THREE.SphereGeometry(0.19, 24, 16), HM.furD, null, [1, 1.05, 0.45], null, ear);
    add(new THREE.SphereGeometry(0.125, 20, 14), HM.pink, [0, 0.01, 0.055], [1, 1.05, 0.3], null, ear);
    ears.push(ear);
  }
  // Augen mit halb geschlossenen Lidern (lässiger Blick) + Brauen
  const eyes = [];
  for (const s of [-1, 1]) {
    const ex = s * 0.27, ey = 0.31, eg = new THREE.Group(); eg.position.set(ex, ey, surfZ(ex, ey) - 0.05); eg.rotation.y = s * 0.32; body.add(eg);
    add(new THREE.SphereGeometry(0.105, 28, 20), HM.eye, null, [1, 1.12, 0.75], null, eg);
    add(new THREE.SphereGeometry(0.028, 10, 8), HM.shine, [0.025, 0.045, 0.07], null, null, eg).castShadow = false;
    add(new THREE.SphereGeometry(0.013, 8, 6), HM.shine, [-0.03, -0.035, 0.075], null, null, eg).castShadow = false;
    const lid = add(new THREE.SphereGeometry(0.116, 28, 12, 0, PI * 2, 0, PI / 2), HM.face, null, [1, 1.12, 0.82], [0.42, 0, 0], eg);
    add(new THREE.CapsuleGeometry(0.022, 0.12, 4, 8), HM.dark, [0, 0.145, 0.05], null, [0, 0, PI / 2 + s * 0.32], eg);
    eyes.push({ g: eg, lid });
  }
  add(new THREE.SphereGeometry(0.07, 22, 16), HM.nose, [0, 0.15, surfZ(0, 0.15) + 0.025], [1.15, 0.8, 0.85]);
  add(new THREE.SphereGeometry(0.016, 8, 6), HM.shine, [0.02, 0.175, surfZ(0, 0.15) + 0.08]).castShadow = false;
  const mp = [[-0.1, 0.07], [-0.05, 0.025], [0, 0.065], [0.05, 0.025], [0.1, 0.07]].map(([x, y]) => new V3(x, y, surfZ(x, y) + 0.01));
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mp), 24, 0.012, 6), HM.dark);
  for (const s of [-1, 1]) add(new RoundedBoxGeometry(0.045, 0.075, 0.03, 2, 0.01), HM.tooth, [s * 0.025, 0.025, surfZ(0, 0.025) - 0.004], null, [-0.2, 0, 0]);
  const cheeks = [];
  for (const s of [-1, 1]) {
    const c = add(new THREE.SphereGeometry(0.26, 30, 22), HM.cheek, [s * 0.38, 0.03, surfZ(0.38, 0.03) - 0.14], [1, 0.82, 0.8]); cheeks.push(c);
    const r = add(new THREE.PlaneGeometry(0.2, 0.14), HM.rouge, [s * 0.42, 0.06, surfZ(0.38, 0.03) + 0.075], null, [0, s * 0.45, 0]); r.castShadow = false; r.renderOrder = 2;
    for (let k = -1; k <= 1; k++) {   // Schnurrhaare
      const a = new V3(s * 0.15, 0.1 + k * 0.03, surfZ(0.15, 0.1) + 0.01), b = new V3(s * 0.4, 0.13 + k * 0.07, surfZ(0.15, 0.1) - 0.02), c2 = new V3(s * 0.66, 0.12 + k * 0.13, surfZ(0.15, 0.1) - 0.14);
      add(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, b, c2), 10, 0.006, 4), HM.dark).castShadow = false;
    }
  }
  // Ärmchen
  const arms = [];
  for (const s of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(s * 0.66, -0.02, 0.26); pv.rotation.z = s * 0.15; body.add(pv);
    add(new THREE.CapsuleGeometry(0.11, 0.16, 6, 12), HM.furD, [0, -0.14, 0.02], null, null, pv);
    add(new THREE.SphereGeometry(0.09, 16, 12), HM.pink, [0, -0.3, 0.05], [1, 0.85, 1], null, pv);
    for (let k = -1; k <= 1; k++) add(new THREE.SphereGeometry(0.03, 8, 6), HM.pink, [k * 0.04, -0.37, 0.085], null, null, pv);
    arms.push(pv);
  }
  // Füße (am root, bleiben am Boden)
  const feet = [];
  for (const s of [-1, 1]) {
    const ft = new THREE.Group(); ft.position.set(s * 0.34, 0, 0.1); root.add(ft);
    add(new THREE.SphereGeometry(0.21, 20, 14), HM.furD, [0, 0.15, -0.05], [0.95, 0.75, 1], null, ft);
    add(new THREE.SphereGeometry(0.19, 20, 14), HM.pink, [0, 0.055, 0.1], [0.85, 0.35, 1.15], null, ft);
    for (let k = -1; k <= 1; k++) add(new THREE.SphereGeometry(0.05, 10, 8), HM.pink, [k * 0.08, 0.05, 0.31], [1, 0.8, 1], null, ft);
    feet.push(ft);
  }
  add(new THREE.SphereGeometry(0.11, 14, 10), HM.furD, [0, -0.6, -0.66], [1, 0.8, 1]);   // Stummelschwanz
  // Kippe hinterm Ohr
  const cig = new THREE.Group(); cig.position.set(0.66, 0.5, -0.02); cig.rotation.set(0.3, 0.2, 1.1); body.add(cig);
  add(new THREE.CylinderGeometry(0.024, 0.024, 0.26, 10), HM.cig, [0, 0.03, 0], null, null, cig);
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 10), HM.filter, [0, -0.13, 0], null, null, cig);
  root.userData = { body, arms, feet, eyes, cheeks, helm, ears, lampAnchor, lens };
  return root;
}

/* =====================================================================
   MENSCHEN (Gelenk-Rig): Rigger, Stagehands, Fahrer
   ===================================================================== */
const skinMat = (hex) => phys({ color: hex, roughness: 0.6, sheen: 0.3, sheenColor: new THREE.Color('#ffd8c0') });
export function buildHuman(o = {}) {
  const C = Object.assign({ skin: '#d9a27f', shirt: '#151518', pants: '#2c2f36', boots: '#3b2a1e', gloves: null, hair: '#2a1d14', scale: 1 }, o);
  const M = { skin: skinMat(C.skin), shirt: std({ color: C.shirt, roughness: 0.92 }), pants: std({ color: C.pants, roughness: 0.9 }), boots: std({ color: C.boots, roughness: 0.7 }), sole: std({ color: '#141210', roughness: 0.9 }), gloves: C.gloves ? std({ color: C.gloves, roughness: 0.85 }) : null, hair: std({ color: C.hair, roughness: 0.9 }) };
  const root = new THREE.Group(), J = {};
  const joint = (name, par, x, y, z) => { const n = new THREE.Group(); n.position.set(x, y, z); par.add(n); J[name] = n; return n; };
  const hip = joint('hip', root, 0, 1.0, 0);
  mesh(new THREE.CapsuleGeometry(0.15, 0.1, 6, 14), M.pants, [0, -0.02, 0], [1.3, 1, 0.85], [0, 0, PI / 2], hip);
  const spine = joint('spine', hip, 0, 0.08, 0);
  const tp = [[0.001, -0.04], [0.15, -0.04], [0.165, 0.08], [0.18, 0.22], [0.205, 0.36], [0.215, 0.44], [0.2, 0.5], [0.15, 0.55], [0.07, 0.58], [0.001, 0.585]].map(([r, y]) => new THREE.Vector2(r, y));
  mesh(new THREE.LatheGeometry(tp, 24), M.shirt, null, [1.15, 1, 0.72], null, spine);
  const neck = joint('neck', spine, 0, 0.56, 0.0);
  mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.1, 12), M.skin, [0, 0.04, 0], null, null, neck);
  const head = joint('head', neck, 0, 0.13, 0.015);
  mesh(new THREE.SphereGeometry(0.135, 28, 20), M.skin, [0, 0.02, 0], [0.95, 1.08, 1], null, head);
  mesh(new THREE.SphereGeometry(0.03, 10, 8), M.skin, [0, 0.0, 0.135], [1, 1.1, 1], null, head);   // Nase
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.035, 10, 8), M.skin, [s * 0.128, 0.01, -0.01], [0.5, 1, 0.8], null, head);
  for (const s of [-1, 1]) {
    const L = s < 0 ? 'L' : 'R';
    const sh = joint('sh' + L, spine, s * 0.255, 0.47, 0);
    mesh(new THREE.SphereGeometry(0.075, 14, 10), M.shirt, null, null, null, sh);
    mesh(new THREE.CapsuleGeometry(0.062, 0.2, 6, 12), M.shirt, [0, -0.15, 0], null, null, sh);
    const el = joint('el' + L, sh, 0, -0.31, 0);
    mesh(new THREE.CapsuleGeometry(0.052, 0.19, 6, 12), C.sleeves === false ? M.skin : M.shirt, [0, -0.13, 0], null, null, el);
    const wr = joint('wr' + L, el, 0, -0.28, 0);
    mesh(new THREE.CapsuleGeometry(0.048, 0.06, 6, 10), M.gloves || M.skin, [0, -0.05, 0.01], [1.05, 1, 0.75], null, wr);
    mesh(new THREE.CapsuleGeometry(0.02, 0.04, 4, 6), M.gloves || M.skin, [s * -0.045, -0.035, 0.035], null, [0.4, 0, s * 0.5], wr);
    const hp = joint('hp' + L, hip, s * 0.105, -0.04, 0);
    mesh(new THREE.CapsuleGeometry(0.088, 0.3, 6, 12), M.pants, [0, -0.22, 0], null, null, hp);
    const kn = joint('kn' + L, hp, 0, -0.46, 0);
    mesh(new THREE.CapsuleGeometry(0.072, 0.3, 6, 12), M.pants, [0, -0.21, 0], null, null, kn);
    const an = joint('an' + L, kn, 0, -0.44, 0);
    mesh(new RoundedBoxGeometry(0.13, 0.11, 0.28, 2, 0.04), M.boots, [0, -0.035, 0.05], null, null, an);
    mesh(new RoundedBoxGeometry(0.14, 0.035, 0.3, 2, 0.012), M.sole, [0, -0.085, 0.05], null, null, an);
  }
  root.scale.setScalar(C.scale);
  root.userData = { J, M };
  return root;
}
// Posen: Gelenkwinkel setzen (alles relativ zur Ruhepose)
export function resetPose(J) { for (const k in J) J[k].rotation.set(0, 0, 0); J.hip.position.y = 1.0; J.hip.position.x = 0; J.hip.position.z = 0; }
export function walkPose(J, ph, amp = 1) {
  const s = Math.sin(ph), c = Math.cos(ph);
  J.hpL.rotation.x = s * 0.6 * amp; J.hpR.rotation.x = -s * 0.6 * amp;
  J.knL.rotation.x = Math.max(0, -c) * 0.9 * amp; J.knR.rotation.x = Math.max(0, c) * 0.9 * amp;
  J.shL.rotation.x = -s * 0.5 * amp; J.shR.rotation.x = s * 0.5 * amp; J.elL.rotation.x = -0.3 * amp; J.elR.rotation.x = -0.3 * amp;
  J.hip.position.y = 1.0 - Math.abs(c) * 0.03 * amp; J.spine.rotation.y = s * 0.08 * amp;
}

export function buildCrew(variant = 0) {
  const skins = ['#e6b48f', '#c98e6a', '#8d5a3c', '#f0c9a8'];
  const h = buildHuman({ skin: skins[variant % 4], shirt: '#141416', pants: '#1c1c20', gloves: '#18181a', boots: '#1a1a1a', scale: 0.95 });
  const { J } = h.userData, cap = std({ color: '#121214', roughness: 0.8 });
  mesh(new THREE.SphereGeometry(0.145, 20, 12, 0, PI * 2, 0, PI * 0.5), cap, [0, 0.05, 0], [1, 0.8, 1.05], null, J.head);
  mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.015, 20, 1, false, -0.9, 1.8), cap, [0, 0.055, 0.07], [1, 1, 1.3], [0.08, 0, 0], J.head);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.09), new THREE.MeshStandardMaterial({ map: labelTex('CREW', '', '#141416', '#e8e8e8'), roughness: 0.9 }));
  back.position.set(0, 0.42, -0.16); back.rotation.y = PI; J.spine.add(back);
  if (variant % 2) mesh(new THREE.SphereGeometry(0.13, 16, 10, 0, PI * 2, PI * 0.55, PI * 0.45), h.userData.M.hair, [0, 0.0, 0.01], [1.02, 1, 1.05], null, J.head);   // Bart
  return h;
}

/* ---------- Der Rigger (Endgegner Level 2) ---------- */
export function buildRigger() {
  const h = buildHuman({ skin: '#d49a74', shirt: '#17171a', pants: '#3c4048', boots: '#4a3322', gloves: '#b38a58', hair: '#3a2718', scale: 1.08 });
  const { J, M } = h.userData;
  const harness = std({ color: '#e2552b', roughness: 0.7 }), alu = MAT.alu, gold = std({ color: '#d4a640', roughness: 0.3, metalness: 0.9 });
  const helmetM = phys({ color: '#f4f4f0', roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1 });
  // Kletterhelm mit Lüftungsschlitzen und Stirnlampe
  mesh(new THREE.SphereGeometry(0.168, 28, 16, 0, PI * 2, 0, PI * 0.56), helmetM, [0, 0.04, 0], [1, 0.95, 1.08], null, J.head);
  for (let i = -1; i <= 1; i++) mesh(new RoundedBoxGeometry(0.03, 0.02, 0.1, 1, 0.008), MAT.black, [i * 0.06, 0.2, -0.02], null, [0, 0, i * -0.35], J.head);
  mesh(new RoundedBoxGeometry(0.09, 0.055, 0.04, 2, 0.012), MAT.black, [0, 0.105, 0.165], null, [-0.25, 0, 0], J.head);
  const lamp = mesh(new THREE.CircleGeometry(0.018, 12), MAT.glowWarm, [0, 0.105, 0.187], null, [-0.25, 0, 0], J.head); lamp.castShadow = false;
  mesh(new THREE.TorusGeometry(0.135, 0.008, 6, 24, PI), MAT.black, [0, 0.04, 0.0], [1, 1.25, 1], [0, PI / 2, PI], J.head);   // Kinnriemen
  // Sonnenbrille, Bart, Schnauzer
  const glass = phys({ color: '#0a0c10', roughness: 0.05, metalness: 0.6, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6 });
  for (const s of [-1, 1]) mesh(new RoundedBoxGeometry(0.085, 0.045, 0.02, 2, 0.012), glass, [s * 0.048, 0.035, 0.125], null, [0, s * 0.18, 0], J.head);
  mesh(new THREE.BoxGeometry(0.03, 0.012, 0.012), MAT.black, [0, 0.045, 0.135], null, null, J.head);
  mesh(new THREE.SphereGeometry(0.138, 22, 14, 0, PI * 2, PI * 0.5, PI * 0.5), M.hair, [0, -0.005, 0.012], [1.02, 1.05, 1.06], null, J.head);
  mesh(new THREE.CapsuleGeometry(0.018, 0.07, 4, 8), M.hair, [0, -0.025, 0.13], null, [0, 0, PI / 2], J.head);
  // Klettergurt: Hüftgurt, Beinschlaufen, Schultergurte, Karabiner
  mesh(new THREE.TorusGeometry(0.19, 0.03, 8, 28), harness, [0, 0.04, 0], [1.18, 1, 0.82], [PI / 2, 0, 0], J.hip);
  for (const s of [-1, 1]) {
    mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 20), harness, [0, -0.1, 0], [1, 1, 1], [PI / 2, 0, 0], J[s < 0 ? 'hpL' : 'hpR']);
    mesh(new THREE.BoxGeometry(0.045, 0.56, 0.02), harness, [s * 0.1, 0.27, 0.142], null, [-0.05, 0, s * -0.12], J.spine);
    mesh(new THREE.BoxGeometry(0.045, 0.5, 0.02), harness, [s * 0.1, 0.27, -0.145], null, [0.05, 0, s * 0.1], J.spine);
  }
  mesh(new RoundedBoxGeometry(0.08, 0.06, 0.03, 2, 0.01), alu, [0, 0.38, 0.15], null, null, J.spine);
  const biner = new THREE.TorusGeometry(0.035, 0.007, 6, 14);
  [[-0.2, alu], [-0.13, gold], [0.13, harness], [0.19, alu], [0.22, gold]].forEach(([x, m], i) => mesh(biner, m, [x, -0.04, 0.11 - Math.abs(x) * 0.2], [0.65, 1, 1], [0, 0.3 * i, 0], J.hip));
  mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 16), alu, [0, -0.03, 0.16], [0.7, 1, 1], [0, PI / 2, 0], J.hip);
  // Seilbund auf dem Rücken + Schraubenschlüssel am Gurt
  mesh(new THREE.TorusGeometry(0.17, 0.045, 10, 28), MAT.rope, [0, 0.3, -0.2], [1, 1.25, 1], null, J.spine);
  mesh(new THREE.TorusGeometry(0.15, 0.04, 10, 28), MAT.rope, [0, 0.27, -0.24], [1, 1.2, 1], [0, 0, 0.3], J.spine);
  mesh(new THREE.BoxGeometry(0.025, 0.2, 0.012), MAT.chrome, [0.2, -0.12, 0.05], null, [0, 0, 0.2], J.hip);
  mesh(new THREE.TorusGeometry(0.028, 0.01, 6, 12), MAT.chrome, [0.22, -0.02, 0.05], null, null, J.hip);
  // Knieschoner
  for (const s of ['L', 'R']) mesh(new RoundedBoxGeometry(0.13, 0.13, 0.06, 2, 0.025), MAT.black, [0, -0.02, 0.07], null, null, J['kn' + s]);
  // Name auf dem Rücken
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshStandardMaterial({ map: labelTex('RIGGER', '', '#17171a', '#ff8a3a'), roughness: 0.9 }));
  back.position.set(0, 0.45, -0.165); back.rotation.y = PI; J.spine.add(back);
  h.userData.lamp = lamp;
  return h;
}

/* =====================================================================
   FLIGHTCASES, REQUISITEN
   ===================================================================== */
const caseLabels = [['TON', 'Halle 3'], ['LICHT', 'Rack 2'], ['VIDEO', 'LED'], ['BÜHNE', 'Podest'], ['MEDIEN', 'Fragile'], ['RIGGING', 'Motoren'], ['BACKLINE', 'Drums']].map(([a, b]) => new THREE.MeshStandardMaterial({ map: labelTex(a, b), roughness: 0.6 }));
const tapeCols = ['#e8312a', '#2a7be8', '#f2c018', '#2ab84a', '#e8e8e8'].map(c => std({ color: c, roughness: 0.75 }));
// Liefert die Teile eines Flightcase (Boden bei y = 0, mittig in x/z)
export function caseParts(w, h, d, o = {}) {
  const P = new Parts(), body = o.blue ? MAT.laminateBlue : MAT.laminate, e = 0.035, wh = o.wheels ? 0.14 : 0;
  const H = h - wh, y0 = wh;
  P.add(new RoundedBoxGeometry(w - 0.02, H - 0.02, d - 0.02, 2, 0.02), body, mat4(0, y0 + H / 2, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    P.add(new THREE.BoxGeometry(e, H, e), MAT.alu, mat4(sx * (w / 2 - e / 2 + 0.004), y0 + H / 2, sz * (d / 2 - e / 2 + 0.004)));
    for (const sy of [0, 1]) {
      P.add(new THREE.BoxGeometry(w, e, e), MAT.alu, mat4(0, y0 + sy * H + (sy ? -e / 2 : e / 2), sz * (d / 2 - e / 2 + 0.004)));
      P.add(new THREE.BoxGeometry(e, e, d), MAT.alu, mat4(sx * (w / 2 - e / 2 + 0.004), y0 + sy * H + (sy ? -e / 2 : e / 2), 0));
      P.add(new RoundedBoxGeometry(0.075, 0.075, 0.075, 2, 0.025), MAT.chrome, mat4(sx * (w / 2 - 0.03), y0 + sy * (H - 0.06) + 0.03, sz * (d / 2 - 0.03)));
    }
  }
  if (H > 0.5) {
    P.add(new THREE.BoxGeometry(e, e, d), MAT.alu, mat4(w / 2 - 0.012, y0 + H * 0.72, 0)); P.add(new THREE.BoxGeometry(e, e, d), MAT.alu, mat4(-w / 2 + 0.012, y0 + H * 0.72, 0));   // Deckelfuge
    for (const sx of [-1, 1]) { P.add(new RoundedBoxGeometry(0.14, 0.05, 0.03, 2, 0.01), MAT.chrome, mat4(sx * w * 0.25, y0 + H * 0.72, d / 2 + 0.01)); }   // Butterfly-Verschlüsse
    for (const sx of [-1, 1]) { P.add(new RoundedBoxGeometry(0.03, 0.1, 0.22, 2, 0.01), MAT.black, mat4(sx * (w / 2 + 0.005), y0 + H * 0.45, 0)); P.add(new THREE.BoxGeometry(0.02, 0.03, 0.16), MAT.chrome, mat4(sx * (w / 2 + 0.02), y0 + H * 0.45, 0)); }   // Griffe
  }
  const lab = caseLabels[o.label !== undefined ? o.label : Math.floor(rnd() * caseLabels.length)];
  if (H > 0.4 && w > 0.6) P.add(new THREE.PlaneGeometry(Math.min(0.5, w * 0.45), Math.min(0.25, w * 0.225)), lab, mat4(-w * 0.15, y0 + H * 0.42, d / 2 + 0.002));
  if (H > 0.4 && w > 0.6) P.add(new THREE.PlaneGeometry(Math.min(0.5, w * 0.45), Math.min(0.25, w * 0.225)), lab, mat4(w * 0.15, y0 + H * 0.42, -d / 2 - 0.002, 0, PI, 0));
  P.add(new THREE.BoxGeometry(w * 0.9, 0.006, 0.07), tapeCols[Math.floor(rnd() * tapeCols.length)], mat4(0, y0 + H + 0.001, d * 0.2 * (rnd() - 0.5)));   // Gaffa-Streifen auf dem Deckel
  if (o.wheels) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    P.add(new THREE.CylinderGeometry(0.06, 0.06, 0.045, 14), MAT.rubber, mat4(sx * (w / 2 - 0.12), 0.06, sz * (d / 2 - 0.12), 0, 0, PI / 2));
    P.add(new THREE.BoxGeometry(0.07, 0.08, 0.06), MAT.darkMetal, mat4(sx * (w / 2 - 0.12), 0.11, sz * (d / 2 - 0.12)));
  }
  return P;
}
export function palletParts(w = 1.2, d = 0.8) {
  const P = new Parts();
  for (let i = 0; i < 5; i++) P.add(new THREE.BoxGeometry(w, 0.022, d / 7), MAT.wood, mat4(0, 0.133, -d / 2 + d / 14 + i * (d - d / 7) / 4));
  for (const x of [-1, 0, 1]) for (const z of [-1, 0, 1]) P.add(new THREE.BoxGeometry(0.1, 0.078, 0.1), MAT.wood, mat4(x * (w / 2 - 0.05), 0.083, z * (d / 2 - 0.05)));
  for (const z of [-1, 0, 1]) P.add(new THREE.BoxGeometry(w, 0.022, 0.1), MAT.wood, mat4(0, 0.033, z * (d / 2 - 0.05)));
  for (const x of [-1, 0, 1]) P.add(new THREE.BoxGeometry(0.1, 0.022, d), MAT.wood, mat4(x * (w / 2 - 0.05), 0.011, 0));
  return P;
}
export function cableDrumParts() {
  const P = new Parts();
  for (const s of [-1, 1]) P.add(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 28), MAT.wood, mat4(s * 0.26, 0.45, 0, 0, 0, PI / 2));
  P.add(new THREE.CylinderGeometry(0.3, 0.3, 0.48, 24), MAT.rubber, mat4(0, 0.45, 0, 0, 0, PI / 2));
  for (let i = 0; i < 6; i++) P.add(new THREE.TorusGeometry(0.3, 0.035, 8, 24), MAT.rubber, mat4(-0.2 + i * 0.08, 0.45, 0, 0, PI / 2, 0));
  return P;
}
export function coneParts() {
  const P = new Parts(), prof = [[0.001, 0.72], [0.045, 0.72], [0.17, 0.06], [0.2, 0.06], [0.2, 0], [0.001, 0]].map(([r, y]) => new THREE.Vector2(r, y));
  P.add(new THREE.LatheGeometry(prof, 20), MAT.orange, null);
  P.add(new THREE.CylinderGeometry(0.105, 0.135, 0.12, 20, 1, true), MAT.white, mat4(0, 0.38, 0));
  P.add(new THREE.BoxGeometry(0.46, 0.04, 0.46), MAT.orange, mat4(0, 0.02, 0));
  return P;
}
export function extinguisherParts() {
  const P = new Parts();
  P.add(new THREE.CapsuleGeometry(0.1, 0.42, 6, 14), MAT.red, mat4(0, 0.31, 0));
  P.add(new THREE.CylinderGeometry(0.035, 0.04, 0.08, 10), MAT.black, mat4(0, 0.6, 0));
  P.add(new THREE.BoxGeometry(0.16, 0.025, 0.04), MAT.black, mat4(0.03, 0.65, 0));
  P.add(tubeBetween(new V3(0.02, 0.62, 0.03), new V3(0.09, 0.3, 0.08), 0.014), MAT.black, null);
  return P;
}
export function powerBoxParts() {
  const P = new Parts();
  P.add(new RoundedBoxGeometry(0.6, 0.7, 0.32, 2, 0.04), MAT.pipeYellow, mat4(0, 0.5, 0));
  P.add(new THREE.BoxGeometry(0.5, 0.15, 0.3), MAT.black, mat4(0, 0.075, 0));
  for (let i = 0; i < 3; i++) P.add(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 12), i ? MAT.blue : MAT.red, mat4(-0.17 + i * 0.17, 0.42, 0.18, PI / 2, 0, 0));
  P.add(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshStandardMaterial({ map: labelTex('400V', '⚡ Gefahr', '#f2c018'), roughness: 0.5 }), mat4(0, 0.68, 0.162));
  return P;
}
export function rackParts(len, h = 3.2, d = 1.1, levels = 3) {
  const P = new Parts(), bays = Math.max(1, Math.round(len / 2.7)), bw = len / bays;
  for (let b = 0; b <= bays; b++) for (const z of [-d / 2, d / 2]) P.add(new THREE.BoxGeometry(0.08, h, 0.08), MAT.rackBlue, mat4(-len / 2 + b * bw, h / 2, z));
  for (let l = 1; l <= levels; l++) { const y = l * h / (levels + 0.2); for (const z of [-d / 2, d / 2]) P.add(new THREE.BoxGeometry(len, 0.12, 0.06), MAT.rackOrange, mat4(0, y, z)); }
  for (let l = 0; l <= levels; l++) for (let b = 0; b < bays; b++) {
    const y = l ? l * h / (levels + 0.2) + 0.06 : 0, x = -len / 2 + (b + 0.5) * bw;
    if (rnd() < 0.15) continue;
    if (rnd() < 0.5) { palletParts(1.1, 0.8).into(P2(P), mat4(x, y, 0)); for (let k = 0; k < 2 + (rnd() * 3 | 0); k++) { const s = 0.35 + rnd() * 0.25; P.add(boxGeo(s, s * 0.8, s), MAT.cardboard, mat4(x - 0.3 + (k % 2) * 0.55, y + 0.145 + s * 0.4 + (k > 1 ? s * 0.8 : 0), (rnd() - 0.5) * 0.2, 0, rnd() * 0.3, 0)); } }
    else caseParts(1.0 + rnd() * 0.6, 0.6 + rnd() * 0.4, 0.8, { blue: rnd() < 0.3 }).into(P2(P), mat4(x, y, 0));
  }
  return P;
}
function P2(P) { return { addRaw: (g, m) => P.list.push([g, m]) }; }   // Parts als Batch-Ziel
export function exitSign(text = 'NOTAUSGANG') { return signMesh(text, '', '#139a48', 1.2, 'exit', true); }

/* ---------- Gaffa-Tape (Sammelobjekt) und Brezel (Heilung) ---------- */
export function tapeGeos() {
  const ring = new THREE.LatheGeometry([[0.11, -0.045], [0.2, -0.045], [0.205, 0], [0.2, 0.045], [0.11, 0.045], [0.11, -0.045]].map(([r, y]) => new THREE.Vector2(r, y)), 28);
  const core = new THREE.CylinderGeometry(0.11, 0.11, 0.085, 24, 1, true);
  return { ring, core };
}
export function buildBrezel() {
  const pts = []; for (let i = 0; i <= 64; i++) { const t = i / 64 * PI * 2; pts.push(new V3(Math.sin(t) * (0.22 + 0.1 * Math.cos(t)), 0.2 * Math.sin(2 * t) * 0.5 + Math.cos(t) * 0.14 - 0.02, 0.03 * Math.sin(3 * t))); }
  const g = new THREE.Group();
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 80, 0.055, 10, true), phys({ color: '#8a4a1c', roughness: 0.35, clearcoat: 0.6 }), null, null, null, g);
  const salt = MAT.white; for (let i = 0; i < 14; i++) { const p = pts[(i * 5) % 64]; mesh(new THREE.BoxGeometry(0.025, 0.02, 0.025), salt, [p.x, p.y + 0.05, p.z + 0.02], null, [rnd(), rnd(), rnd()], g); }
  return g;
}
export function buildShackle() {
  const g = new THREE.Group(), red = std({ color: '#ff3b1f', roughness: 0.35, metalness: 0.5 });
  const pts = []; for (let i = 0; i <= 20; i++) { const a = PI + i / 20 * PI; pts.push(new V3(Math.cos(a) * 0.12, Math.sin(a) * 0.12 - 0.05, 0)); }
  pts.unshift(new V3(-0.12, 0.12, 0)); pts.push(new V3(0.12, 0.12, 0));
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.035, 8), red, null, null, null, g);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 10), MAT.chrome, [0, 0.14, 0], null, [0, 0, PI / 2], g);
  return g;
}

/* =====================================================================
   MASCHINEN: Gabelstapler, Kettenzug, Lautsprecher, Scherenbühne
   ===================================================================== */
export function buildForklift() {
  const g = new THREE.Group(), P = new Parts();
  P.add(new RoundedBoxGeometry(2.0, 0.62, 1.2, 3, 0.12), MAT.forklift, mat4(-0.1, 0.55, 0));
  P.add(new RoundedBoxGeometry(0.55, 0.85, 1.15, 3, 0.15), MAT.darkMetal, mat4(-1.0, 0.7, 0));   // Gegengewicht
  P.add(new RoundedBoxGeometry(0.6, 0.2, 0.5, 2, 0.05), MAT.black, mat4(-0.35, 0.95, 0));   // Sitz
  P.add(new RoundedBoxGeometry(0.12, 0.55, 0.5, 2, 0.04), MAT.black, mat4(-0.62, 1.2, 0));
  for (const sx of [-0.85, 0.45]) for (const sz of [-0.55, 0.55]) P.add(new THREE.CylinderGeometry(0.035, 0.035, 1.35, 8), MAT.black, mat4(sx, 1.5, sz));
  P.add(new RoundedBoxGeometry(1.45, 0.06, 1.2, 2, 0.02), MAT.black, mat4(-0.2, 2.18, 0));
  for (let i = -2; i <= 2; i++) P.add(new THREE.BoxGeometry(1.4, 0.03, 0.05), MAT.darkMetal, mat4(-0.2, 2.22, i * 0.22));
  P.add(new THREE.TorusGeometry(0.15, 0.025, 6, 18), MAT.black, mat4(0.25, 1.25, 0, 0, 0, 1.0));
  P.add(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6), MAT.black, mat4(0.35, 1.05, 0, 0, 0, 0.6));
  for (const sz of [-0.32, 0.32]) P.add(new THREE.BoxGeometry(0.1, 2.5, 0.1), MAT.darkMetal, mat4(0.95, 1.3, sz));   // Hubmast
  for (const y of [0.5, 1.5, 2.45]) P.add(new THREE.BoxGeometry(0.08, 0.08, 0.74), MAT.darkMetal, mat4(0.95, y, 0));
  P.add(new THREE.BoxGeometry(0.06, 0.5, 0.9), MAT.darkMetal, mat4(1.03, 0.4, 0));
  for (const sz of [-0.3, 0.3]) P.add(new THREE.BoxGeometry(1.1, 0.05, 0.12), MAT.darkMetal, mat4(1.6, 0.17, sz));   // Gabeln
  for (const [x, r] of [[0.65, 0.3], [-0.75, 0.26]]) for (const sz of [-0.58, 0.58]) { P.add(new THREE.CylinderGeometry(r, r, 0.22, 20), MAT.rubber, mat4(x, r, sz, PI / 2, 0, 0)); P.add(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.23, 16), MAT.forklift, mat4(x, r, sz, PI / 2, 0, 0)); }
  P.add(new THREE.PlaneGeometry(0.7, 0.18), new THREE.MeshStandardMaterial({ map: labelTex('STAPLER 3', 'Max 2,5 t', '#f2a20c', '#111'), roughness: 0.5 }), mat4(-0.1, 0.62, 0.605));
  g.add(P.toGroup());
  const beacon = mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.14, 14), MAT.glowAmber, [-0.6, 2.3, 0], null, null, g);
  const driver = buildCrew(2); driver.position.set(-0.4, -0.05, 0); driver.rotation.y = PI / 2; g.add(driver);
  const J = driver.userData.J; J.hpL.rotation.x = J.hpR.rotation.x = -1.5; J.knL.rotation.x = J.knR.rotation.x = 1.4; J.hip.position.y = 1.0; J.shL.rotation.x = J.shR.rotation.x = -0.9; J.elL.rotation.x = J.elR.rotation.x = -0.6;
  driver.position.y = -0.0; J.hip.position.y = 0.96;
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.55, 28), glowMat(0.3, 0.7, 3.2, 0.55)); spot.rotation.x = -PI / 2; spot.position.set(3.0, 0.02, 0); g.add(spot);
  g.userData = { beacon, spot };
  return g;
}
export function buildHoist() {   // Kettenzug-Motor (schwarz, Kühlrippen)
  const P = new Parts();
  P.add(new THREE.CylinderGeometry(0.17, 0.17, 0.38, 20), MAT.black, mat4(0, 0, 0, 0, 0, PI / 2));
  for (let i = -2; i <= 2; i++) P.add(new THREE.CylinderGeometry(0.19, 0.19, 0.025, 20), MAT.darkMetal, mat4(i * 0.07, 0, 0, 0, 0, PI / 2));
  P.add(new RoundedBoxGeometry(0.22, 0.22, 0.3, 2, 0.04), MAT.black, mat4(0.28, -0.02, 0));
  P.add(new THREE.PlaneGeometry(0.16, 0.08), MAT.pipeYellow, mat4(0.28, 0.0, 0.152));
  P.add(new THREE.TorusGeometry(0.06, 0.018, 6, 14), MAT.alu, mat4(0, 0.22, 0));
  return P.toGroup();
}
export function chainMesh(len, links = null) {   // instanzierte Kettenglieder
  const n = links || Math.max(2, Math.round(len / 0.06)), geo = new THREE.TorusGeometry(0.028, 0.009, 5, 10), im = new THREE.InstancedMesh(geo, MAT.chrome, n), m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m.compose(new V3(0, -i * len / n, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i % 2 ? PI / 2 : 0, PI / 2)), new V3(1, 1.4, 1)); im.setMatrixAt(i, m); }
  im.castShadow = true; return im;
}
export function buildHookBlock() {
  const g = new THREE.Group(), P = new Parts();
  P.add(new RoundedBoxGeometry(0.2, 0.26, 0.13, 2, 0.04), MAT.hookYellow, mat4(0, 0, 0));
  const hp = [new V3(0, -0.12, 0), new V3(0, -0.28, 0), new V3(-0.05, -0.38, 0), new V3(-0.14, -0.36, 0), new V3(-0.16, -0.27, 0)];
  P.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp), 20, 0.03, 8), MAT.darkMetal, null);
  P.add(new THREE.BoxGeometry(0.012, 0.12, 0.02), MAT.chrome, mat4(-0.08, -0.22, 0, 0, 0, -0.6));
  g.add(P.toGroup()); return g;
}
export function buildSpeaker() {   // Line-Array-Element als schwingende Last
  const P = new Parts();
  P.add(new RoundedBoxGeometry(1.15, 0.42, 0.62, 2, 0.04), MAT.black, mat4(0, 0, 0));
  P.add(new THREE.PlaneGeometry(1.05, 0.34), MAT.grille, mat4(0, 0, 0.315));
  P.add(new THREE.PlaneGeometry(1.05, 0.34), MAT.grille, mat4(0, 0, -0.315, 0, PI, 0));
  for (const s of [-1, 1]) { P.add(new THREE.BoxGeometry(0.06, 0.5, 0.66), MAT.darkMetal, mat4(s * 0.6, 0, 0)); P.add(new THREE.BoxGeometry(0.05, 0.05, 0.05), MAT.chrome, mat4(s * 0.6, 0.28, 0.25)); }
  P.add(new THREE.BoxGeometry(1.3, 0.06, 0.1), MAT.darkMetal, mat4(0, 0.32, 0));   // Rigging-Bügel
  for (const s of [-1, 1]) P.add(tubeBetween(new V3(s * 0.62, 0.32, 0), new V3(0, 0.9, 0), 0.02), MAT.rubber, null);
  return P.toGroup();
}
// Scherenbühne: Plattform + Scherenarme, Höhe per update(y) einstellbar
export function buildScissorLift(w = 2.8, d = 2.6, baseY = -6) {
  const g = new THREE.Group(), plat = new THREE.Group(); g.add(plat);
  const P = new Parts();
  P.add(new RoundedBoxGeometry(w, 0.22, d, 2, 0.04), MAT.grate, mat4(0, -0.11, 0));
  P.add(new THREE.BoxGeometry(w, 0.05, 0.12), MAT.hazard, mat4(0, 0.005, d / 2 - 0.06)); P.add(new THREE.BoxGeometry(w, 0.05, 0.12), MAT.hazard, mat4(0, 0.005, -d / 2 + 0.06));
  for (const s of [-1, 1]) { P.add(new THREE.BoxGeometry(0.05, 0.9, 0.05), MAT.pipeYellow, mat4(s * (w / 2 - 0.05), 0.45, -d / 2 + 0.1)); P.add(new THREE.BoxGeometry(0.05, 0.9, 0.05), MAT.pipeYellow, mat4(s * (w / 2 - 0.05), 0.45, d / 2 - 0.1)); P.add(new THREE.BoxGeometry(0.05, 0.05, d - 0.2), MAT.pipeYellow, mat4(s * (w / 2 - 0.05), 0.9, 0)); }
  plat.add(P.toGroup());
  const arms = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.08, 1), MAT.hookYellow, 12); arms.castShadow = true; g.add(arms);
  const base = mesh(new THREE.BoxGeometry(w, 0.3, d), MAT.darkMetal, [0, baseY + 0.15, 0], null, null, g);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  g.userData.update = (y) => {
    plat.position.y = y; const stages = 3, sh = (y - 0.22 - (baseY + 0.3)) / stages, L = d * 0.92, ang = Math.asin(Math.min(0.999, Math.max(0.05, sh / L)));
    const span = Math.cos(ang) * L; let k = 0;
    for (let s = 0; s < stages; s++) for (const sx of [-1, 1]) for (const dir of [-1, 1]) {
      const cy = baseY + 0.3 + sh * (s + 0.5);
      m.compose(new V3(sx * (w / 2 - 0.25), cy, 0), q.setFromEuler(e.set(dir * ang, 0, 0)), new V3(1, 1, span / Math.cos(ang) * 1.0)); arms.setMatrixAt(k++, m);
    }
    arms.instanceMatrix.needsUpdate = true;
  };
  return g;
}

/* =====================================================================
   TRAVERSEN
   ===================================================================== */
import { mergeGeometries } from './core.js?v=10';
export function trussGeo(x1, x2, y, z, size = 0.6, axis = 'x') {
  const geos = [], hs = size / 2, len = x2 - x1, n = Math.max(1, Math.round(len / size)), C = [[-hs, -hs], [hs, -hs], [-hs, hs], [hs, hs]];
  const P = (a, b, c) => axis === 'x' ? new V3(a, y + b, z + c) : new V3(z + c, y + b, a);
  for (const [cy, cz] of C) geos.push(tubeBetween(P(x1, cy, cz), P(x2, cy, cz), 0.048, 8));
  for (let i = 0; i < n; i++) {
    const a = x1 + len * i / n, b = x1 + len * (i + 1) / n;
    for (const cz of [-hs, hs]) geos.push(tubeBetween(P(a, -hs, cz), P(b, hs, cz), 0.022));
    for (const cy of [-hs, hs]) geos.push(tubeBetween(P(a, cy, -hs), P(b, cy, hs), 0.022));
    geos.push(tubeBetween(P(a, -hs, -hs), P(a, hs, -hs), 0.02)); geos.push(tubeBetween(P(a, -hs, hs), P(a, hs, hs), 0.02));
  }
  return mergeGeometries(geos);
}
export function towerGeo(x, z, h, size = 0.6) {
  const geos = [], hs = size / 2;
  for (const [cx, cz] of [[-hs, -hs], [hs, -hs], [-hs, hs], [hs, hs]]) geos.push(tubeBetween(new V3(x + cx, 0, z + cz), new V3(x + cx, h, z + cz), 0.048, 8));
  for (let y = 0; y < h - 0.1; y += size) {
    geos.push(tubeBetween(new V3(x - hs, y, z - hs), new V3(x + hs, y + size, z - hs), 0.022)); geos.push(tubeBetween(new V3(x - hs, y, z + hs), new V3(x + hs, y + size, z + hs), 0.022));
    geos.push(tubeBetween(new V3(x - hs, y, z - hs), new V3(x - hs, y + size, z + hs), 0.022)); geos.push(tubeBetween(new V3(x + hs, y, z - hs), new V3(x + hs, y + size, z + hs), 0.022));
  }
  geos.push(new THREE.BoxGeometry(1.2, 0.08, 1.2).translate(x, 0.04, z));
  return mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g));
}
