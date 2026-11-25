/* Medienhamster 3D – Spiel-Engine: Spieler, Physik, Kamera, Licht-Pool, HUD, Menüs, Spielstand */
import { THREE, scene, camera, render, resize, QS, $, TOUCH, clamp, lerp, GFX, setGfx, ENV, reseed, Batch } from './core.js?v=10';
import { buildHamster, MAT, T, tapeGeos, buildBrezel } from './models.js?v=10';
import { AU, audioUnlock, setMusic, musicTick, sfx, jingle, setAudio, renderTrackOffline, renderOffline, JINGLES } from './audio.js?v=10';
import { level1 } from './level1.js?v=10';
import { level2 } from './level2.js?v=10';
import { pushState, pushEnable, IOS } from './push.js?v=10';

const LEVELS = [{ build: level1, name: 'Katakomben der Messe', short: 'KATAKOMBEN' }, { build: level2, name: 'Mainstage', short: 'MAINSTAGE' }];
const R = 0.42, H = 1.2, SPEED = 0.118, GRAV = 0.017, JUMP = 0.305, STEP = 0.45, COYOTE = 7, BUFFER = 9;
let save = { unlocked: 1, best: {}, tapes: {} };
try { save = Object.assign(save, JSON.parse(localStorage.getItem('mh3d-save') || '{}')); } catch (e) { }
const store = () => { try { localStorage.setItem('mh3d-save', JSON.stringify(save)); } catch (e) { } };

let LV = null, LEVEL = 1, F = 0, RF = 0, state = 'title', msgT = 0;
const P = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, gy: 0, ground: true, face: 0, hp: 3, hpMax: 3, inv: 0, cp: 0, jumps: 0, coy: 0, buf: 0, anim: 0, dead: 0, won: false, on: null, land: 0, tapes: 0, hits: 0, blink: 0, ext: [0, 0] };
export const G = { P, R, H, JUMP, get F() { return F; }, get state() { return state; } };

/* =====================================================================
   SZENE AUFBAUEN
   ===================================================================== */
let hamster, blob, sun, hemi, headlamp, pool = [], tapeIM = null, partSys = null;
function startLevel(n, toState = 'play', fromRide = false) {
  if (!fromRide) { rideId++; $('fade').classList.remove('on'); $('elev').classList.remove('on'); }
  LEVEL = n; F = 0; RF = 0;
  scene.clear(); reseed(7 + n * 101);
  G.batch = new Batch(24);
  LV = { tapes: [], snacks: [], lights: [], solids: [], movers: [], hazards: [], cps: [] };
  LEVELS[n - 1].build(G, LV);
  G.batch.build(scene);
  const fog = LV.fog || ['#0d0b12', 10, 40];
  scene.background = new THREE.Color(fog[0]); scene.fog = new THREE.Fog(fog[0], fog[1], fog[2]); camera.far = fog[2] + 6; camera.updateProjectionMatrix();
  scene.environment = ENV; scene.environmentIntensity = LV.envInt !== undefined ? LV.envInt : 0.35;
  hemi = new THREE.HemisphereLight(...(LV.hemi || ['#8f9bc9', '#2a2230', 1.1])); scene.add(hemi);
  sun = new THREE.DirectionalLight(...(LV.sun || ['#dfe9ff', 1.5])); sun.castShadow = true; sun.shadow.mapSize.set(GFX.high ? 2048 : 1024, GFX.high ? 2048 : 1024);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 12, bottom: -12, near: 0.5, far: 40 }); sun.shadow.bias = -0.0012; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  pool = []; for (let i = 0; i < 4; i++) { const l = new THREE.PointLight('#ffffff', 0, 10, 1.6); scene.add(l); pool.push(l); }
  hamster = buildHamster(); hamster.scale.setScalar(0.62); scene.add(hamster);
  headlamp = new THREE.SpotLight('#ffe8c0', 0, 26, 0.5, 0.5, 1.3); headlamp.castShadow = false; hamster.userData.lampAnchor.add(headlamp); const ht = new THREE.Object3D(); ht.position.set(0, -2, 8); hamster.userData.lampAnchor.add(ht); headlamp.target = ht;
  blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: T.blob, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); blob.rotation.x = -Math.PI / 2; scene.add(blob);
  buildTapes(); buildParticles(); buildCpPosts();
  const c = LV.cps[0]; Object.assign(P, { x: c.x, y: c.y, z: c.z, gy: c.y, vx: 0, vy: 0, vz: 0, ground: true, face: c.face || 0, hp: 3, hpMax: 3, inv: 0, cp: 0, jumps: 0, dead: 0, won: false, on: null, tapes: 0, hits: 0, ext: [0, 0] });
  hamster.rotation.y = P.face;
  snapCam(); updHud(); hideMsg(); bubbles.forEach(b => b.el.remove()); bubbles.length = 0;
  $('boss').style.display = 'none'; $('prog').style.display = '';
  setState(toState);
  if (toState === 'play') { setMusic(LV.music); if (!LV.intro) showMsg(`LEVEL ${n}<small>${LEVELS[n - 1].name}</small>`, 170); }
}
G.startLevel = startLevel;

/* ---------- Gaffa-Tapes (Sammelobjekte) ---------- */
function buildTapes() {
  const n = LV.tapes.length; if (!n) { tapeIM = null; return; }
  const { ring, core } = tapeGeos();
  const tapeMat = new THREE.MeshStandardMaterial({ color: '#c3c7cf', roughness: 0.38, metalness: 0.55, emissive: '#5a5470', emissiveIntensity: 0.35 });
  const coreMat = new THREE.MeshStandardMaterial({ color: '#c8a878', roughness: 0.8 });
  tapeIM = [new THREE.InstancedMesh(ring, tapeMat, n), new THREE.InstancedMesh(core, coreMat, n)];
  for (const im of tapeIM) { im.castShadow = true; im.frustumCulled = false; scene.add(im); }
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
function drawTapes() {
  if (!tapeIM) return;
  LV.tapes.forEach((t, i) => {
    let sc = t.got ? Math.max(0, 1 - (RF - t.gotF) / 12) : 1;
    const y = t.y + 0.35 + Math.sin(RF * 0.06 + i) * 0.08 + (t.got ? (RF - t.gotF) * 0.06 : 0);
    _m.compose(_v.set(t.x, y, t.z), _q.setFromEuler(_e.set(Math.PI / 2 - 0.25, RF * 0.05 + i, 0, 'YXZ')), _s.set(sc * 1.25, sc * 1.25, sc * 1.25));
    tapeIM[0].setMatrixAt(i, _m); tapeIM[1].setMatrixAt(i, _m);
  });
  tapeIM[0].instanceMatrix.needsUpdate = tapeIM[1].instanceMatrix.needsUpdate = true;
}
G.tape = (x, y, z) => LV.tapes.push({ x, y, z, got: false });
G.tapeLine = (x1, z1, x2, z2, n, y = 0) => { for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : 0; G.tape(lerp(x1, x2, t), y, lerp(z1, z2, t)); } };
G.tapeArc = (x, z1, z2, n, y0, h) => { for (let i = 0; i < n; i++) { const t = i / (n - 1); G.tape(x, y0 + Math.sin(t * Math.PI) * h, lerp(z1, z2, t)); } };
G.snack = (x, y, z) => { const m = buildBrezel(); m.position.set(x, y + 0.5, z); m.scale.setScalar(1.3); scene.add(m); LV.snacks.push({ x, y, z, m, got: false }); return LV.snacks[LV.snacks.length - 1]; };

/* ---------- Partikel (Funken, Staub, Konfetti) ---------- */
function buildParticles() {
  const N = 160, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: T.puff }, scale: { value: innerHeight } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    vertexShader: 'attribute float size; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = min(size * 220.0 / -mv.z, 42.0); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D map; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * 1.1, t.a); }'
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
  partSys = { N, pos, col, size, geo, p: Array.from({ length: N }, () => ({ life: 0 })) , i: 0 };
}
G.burst = (x, y, z, kind = 'spark', n = 12) => {
  const S = partSys, C = { spark: [1, 0.9, 0.5], tape: [0.7, 0.6, 1], dust: [0.11, 0.1, 0.1], blue: [0.25, 0.45, 0.9], confetti: null, steam: [0.6, 0.6, 0.65], heal: [1, 0.5, 0.6] }[kind];
  for (let k = 0; k < n; k++) {
    const p = S.p[S.i = (S.i + 1) % S.N], a = Math.random() * Math.PI * 2, sp = kind === 'dust' ? 0.04 : kind === 'confetti' ? 0.12 : 0.09;
    Object.assign(p, { x, y, z, vx: Math.cos(a) * sp * Math.random(), vy: (kind === 'dust' ? 0.02 : 0.05) + Math.random() * (kind === 'confetti' ? 0.18 : 0.1), vz: Math.sin(a) * sp * Math.random(), life: 1, dec: kind === 'dust' ? 0.025 : 0.02 + Math.random() * 0.02, g: kind === 'dust' ? 0.0 : 0.006, sz: kind === 'dust' ? 0.6 : kind === 'confetti' ? 0.25 : 0.3, c: C || [[1, 0.3, 0.3], [0.4, 0.8, 1], [1, 0.9, 0.3], [0.7, 0.4, 1], [0.4, 1, 0.5]][k % 5] });
  }
};
function drawParticles() {
  const S = partSys; if (!S) return;
  S.p.forEach((p, i) => {
    if (p.life > 0) { p.life -= p.dec; p.vy -= p.g; p.x += p.vx; p.y += p.vy; p.z += p.vz; }
    const l = Math.max(0, p.life); S.pos[i * 3] = p.x || 0; S.pos[i * 3 + 1] = p.y || -99; S.pos[i * 3 + 2] = p.z || 0;
    if (p.c) { S.col[i * 3] = p.c[0] * l; S.col[i * 3 + 1] = p.c[1] * l; S.col[i * 3 + 2] = p.c[2] * l; }
    S.size[i] = l > 0 ? p.sz * (0.5 + l * 0.5) : 0;
  });
  S.geo.attributes.position.needsUpdate = S.geo.attributes.color.needsUpdate = S.geo.attributes.size.needsUpdate = true;
}

/* ---------- Checkpoint-Pfosten ---------- */
function buildCpPosts() {
  LV.cps.forEach((c, i) => {
    if (!i || c.noPost) return;
    const g = new THREE.Group(); g.position.set(c.px !== undefined ? c.px : (c.x + 1.6), c.y, c.z); scene.add(g);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 10), MAT.hazard); pole.position.y = 0.75; pole.castShadow = true; g.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.08, 16), MAT.black); base.position.y = 0.04; g.add(base);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), MAT.glowRed); head.position.y = 1.6; g.add(head);
    c.post = head; LV.lights.push({ x: g.position.x, y: c.y + 1.7, z: c.z, color: new THREE.Color('#ff3a2a'), int: 3, dist: 5, cp: c });
  });
}

/* =====================================================================
   SPIELER-PHYSIK
   ===================================================================== */
const mBox = m => ({ x1: m.x - m.w / 2, x2: m.x + m.w / 2, z1: m.z - m.d / 2, z2: m.z + m.d / 2, y1: m.y, y2: m.y + m.h, m });
function overlap(o, px = P.x, py = P.y, pz = P.z) { return px + R > o.x1 && px - R < o.x2 && pz + R > o.z1 && pz - R < o.z2 && py + H > o.y1 && py < o.y2; }
G.overlap = overlap;
function bxAt(z) { if (!LV.bx) return 99; return Math.min(LV.bx(z - R), LV.bx(z), LV.bx(z + R)); }
function nearBoxes() {
  const out = []; for (const o of LV.solids) if (o.z2 > P.z - 8 && o.z1 < P.z + 8) out.push(o);
  for (const m of LV.movers) if (m.active !== false && Math.abs(m.z - P.z) < 10) out.push(mBox(m));
  return out;
}

function hurt(kx = 0, kz = -0.2, src = '') {
  if (state !== 'play' || P.inv > 0 || P.dead || P.won) return false;
  P.hp--; P.hits++; P.inv = 100; P.vx = kx; P.vz = kz; P.vy = 0.2; P.ground = false; P.on = null; sfx('hurt'); G.shake(0.25);
  G.burst(P.x, P.y + 0.8, P.z, 'spark', 10);
  if (P.hp <= 0) die('AUTSCH!'); updHud(); return true;
}
G.hurt = hurt;
function die(text) {
  P.dead = 110; P.hp = 0; updHud(); showMsg(`${text}<small>Zurück zum Checkpoint …</small>`, 105); jingle('lose');
}
function respawn(full) {
  const c = LV.cps[P.cp];
  Object.assign(P, { x: c.x, y: c.y, z: c.z, gy: c.y, vx: 0, vy: 0, vz: 0, ground: true, inv: 90, dead: 0, on: null, face: c.face || 0, ext: [0, 0] });
  if (full) { P.hp = Math.max(3, P.hpMax === 3 ? 3 : P.hp); P.hp = P.hpMax; }
  hamster.rotation.y = P.face; snapCam(); updHud();
  LV.onRespawn && LV.onRespawn(full);
  if (full) setMusic(LV.music);
}
function fallOut() {
  P.hp--; P.hits++; updHud();
  if (P.hp <= 0) die('ABGESTÜRZT!'); else { respawn(false); showMsg('ABGESTÜRZT!<small>−1 Leben</small>', 80); sfx('hurt'); }
}

function stepMovers() {
  for (const m of LV.movers) {
    const np = m.pos(F);
    if (!np) { if (m.active !== false && P.on === m) P.on = null; m.active = false; continue; }
    const [nx, ny, nz] = np;
    if (m.active === false || m.x === undefined) { m.x = nx; m.y = ny; m.z = nz; m.dx = m.dy = m.dz = 0; m.active = true; m.fresh = true; continue; }
    m.dx = nx - m.x; m.dy = ny - m.y; m.dz = nz - m.z; m.fresh = false;
    if (Math.abs(m.dx) + Math.abs(m.dy) + Math.abs(m.dz) > 2) { m.dx = m.dy = m.dz = 0; if (P.on === m) P.on = null; m.fresh = true; }
    m.x = nx; m.y = ny; m.z = nz;
    if (state !== 'play' || P.dead || P.won) continue;
    if (P.on === m) { P.x += m.dx; P.z += m.dz; if (P.vy <= 0) P.y = m.y + m.h; continue; }
    const o = mBox(m); if (!overlap(o)) continue;
    if (P.y >= o.y2 - 0.4 && P.vy <= 0.05) { P.y = o.y2; P.vy = 0; P.on = m; P.ground = true; continue; }
    if (m.fresh) continue;
    // aus dem Weg schieben: kleinste Durchdringung
    const pen = [[o.x2 - (P.x - R), 'x', 1], [(P.x + R) - o.x1, 'x', -1], [o.z2 - (P.z - R), 'z', 1], [(P.z + R) - o.z1, 'z', -1]];
    let best = null; for (const p of pen) { if (m.dx && p[1] === 'x' && Math.sign(m.dx) !== p[2] && Math.abs(m.dx) > 0.01) continue; if (m.dz && p[1] === 'z' && Math.sign(m.dz) !== p[2] && Math.abs(m.dz) > 0.01) continue; if (!best || p[0] < best[0]) best = p; }
    if (!best) best = pen.reduce((a, b) => a[0] < b[0] ? a : b);
    P[best[1]] += best[0] * best[2];
    if (m.hurts && Math.hypot(m.dx, m.dz, m.dy) > 0.008) hurt(best[1] === 'x' ? best[2] * 0.26 : 0, best[1] === 'z' ? best[2] * 0.26 : 0, 'mover');
  }
}

function playerStep() {
  if (LV.intro && F < LV.intro.walk) { IN.jump = false; IN.x = 0; IN.z = F < LV.intro.lock ? 0 : 1; }
  const boxes = nearBoxes();
  const slow = LV.slow ? LV.slow(P) : 1, sp = SPEED * slow, acc = P.ground ? 0.24 : 0.1;
  P.vx += (IN.x * sp - P.vx) * acc; P.vz += (IN.z * sp - P.vz) * acc;
  if (P.ground) P.coy = COYOTE; else if (P.coy > 0) P.coy--;
  if (IN.jump) { if (P.coy > 0) { doJump(1); } else if (P.jumps < 1) { P.jumps++; doJump(0.9, true); } else P.buf = BUFFER; }
  else if (P.buf > 0) { P.buf--; if (P.ground) doJump(1); }
  P.vy -= GRAV; if (P.vy < -0.55) P.vy = -0.55;
  const ext = LV.force ? LV.force(P) : [0, 0];
  const conv = P.onSolid && P.onSolid.conv && P.ground ? P.onSolid.conv : [0, 0];
  const horiz = (axis, v) => {
    if (!v) return; P[axis] += v;
    for (const o of boxes) if (overlap(o)) {
      if (o.y2 - P.y <= STEP && o.y2 - P.y > 0 && (P.ground || P.coy > 0)) { const y0 = P.y; P.y = o.y2; if (!boxes.some(q => q !== o && overlap(q))) continue; P.y = y0; }
      P[axis] = v > 0 ? (axis === 'x' ? o.x1 : o.z1) - R - 0.0001 : (axis === 'x' ? o.x2 : o.z2) + R + 0.0001;
      if (axis === 'x') P.vx = 0; else P.vz = 0;
    }
  };
  horiz('x', P.vx + ext[0] + conv[0]); const bx = bxAt(P.z); P.x = clamp(P.x, -bx + R, bx - R);
  horiz('z', P.vz + ext[1] + conv[1]); P.z = clamp(P.z, LV.z1, LV.z2);
  const wasGround = P.ground, vyBefore = P.vy; P.ground = false; P.y += P.vy; let landed = null;
  for (const o of boxes) if (overlap(o)) {
    if (P.vy <= 0 && P.y - P.vy >= o.y2 - 0.45) { P.y = o.y2; P.vy = 0; P.ground = true; landed = o; }
    else if (P.vy > 0 && P.y + H - P.vy <= o.y1 + 0.05) { P.y = o.y1 - H; P.vy = 0; sfx('bonk', 0.6); }
    else { // seitlich festgesteckt (z. B. nach Schubsen): nach oben raus
      if (o.y2 - P.y < 0.6) { P.y = o.y2; P.vy = 0; P.ground = true; landed = o; }
    }
  }
  if (!P.ground && P.on && P.vy <= 0) { const o = mBox(P.on); if (P.x + R > o.x1 && P.x - R < o.x2 && P.z + R > o.z1 && P.z - R < o.z2 && Math.abs(P.y - o.y2) < 0.35) { P.y = o.y2; P.vy = 0; P.ground = true; landed = o; } }
  P.on = landed && landed.m ? landed.m : null; P.onSolid = landed && !landed.m ? landed : null;
  if (P.ground) { if (!wasGround && vyBefore < -0.2) { P.land = 1; sfx('land', Math.min(1, -vyBefore * 2)); if (vyBefore < -0.35) G.burst(P.x, P.y + 0.05, P.z, 'dust', 6); } P.jumps = 0; P.gy = P.y; }
  if (Math.hypot(P.vx, P.vz) > 0.012) P.face = Math.atan2(P.vx, P.vz);
}
function doJump(k, dbl) { P.vy = JUMP * k; P.ground = false; P.on = null; P.coy = 0; P.buf = 0; sfx(dbl ? 'jump2' : 'jump'); if (dbl) G.burst(P.x, P.y + 0.1, P.z, 'dust', 5); }
G.bounce = (k = 1) => { P.vy = JUMP * k; P.ground = false; P.on = null; P.jumps = 0; };

function step() {
  F++;
  if (msgT > 0 && --msgT === 0) hideMsg();
  stepMovers();
  if (state === 'play') {
    if (LV.intro && F === LV.intro.walk) showMsg(`LEVEL ${LEVEL}<small>${LEVELS[LEVEL - 1].name}</small>`, 150);
    if (P.dead > 0) { if (--P.dead === 0) respawn(true); }
    else if (!P.won) {
      playerStep();
      if (P.y < (LV.deathY !== undefined ? LV.deathY : -6)) fallOut();
      else if (LV.fall && LV.fall(P)) fallOut();
      // Sammeln
      for (const t of LV.tapes) if (!t.got && Math.abs(t.z - P.z) < 0.8 && Math.abs(t.x - P.x) < 0.75 && Math.abs(t.y + 0.35 - (P.y + 0.6)) < 0.95) {
        t.got = true; t.gotF = RF; P.tapes++; sfx('tape'); G.burst(t.x, t.y + 0.4, t.z, 'tape', 8);
        if (P.tapes % 25 === 0 && P.hpMax < 5) { P.hpMax++; P.hp++; showMsg('+1 LEBEN<small>25 Gaffa-Rollen gesammelt!</small>', 90); sfx('cp'); }
        updHud();
      }
      for (const s of LV.snacks) if (!s.got && Math.hypot(s.x - P.x, s.z - P.z) < 0.8 && Math.abs(s.y - P.y) < 1.2) { s.got = true; s.m.visible = false; if (P.hp < P.hpMax) P.hp++; sfx('eat'); G.burst(s.x, s.y + 0.6, s.z, 'heal', 12); showMsg('MAMPF!<small>+1 Herz</small>', 60); updHud(); }
      for (let i = P.cp + 1; i < LV.cps.length; i++) if (LV.cps[i].at(P)) {
        P.cp = i; sfx('cp'); showMsg('CHECKPOINT', 70); const c = LV.cps[i]; if (c.post) { c.post.material = MAT.glowGreen; const l = LV.lights.find(q => q.cp === c); if (l) l.color = new THREE.Color('#2aff6a'); G.burst(c.post.parent.position.x, c.y + 1.6, c.z, 'tape', 14); }
        if (P.hp < 3 && !LV.noCpHeal) { P.hp = Math.max(P.hp, Math.min(P.hpMax, P.hp + 1)); updHud(); }
      }
      if (LV.goal && LV.goal(P)) win();
    }
    for (const h of LV.hazards) h.update && h.update(F, P);
    LV.update && LV.update(F, P);
    if (P.inv > 0) P.inv--;
  } else {
    for (const h of LV.hazards) h.update && h.update(F, P);
    LV.update && LV.update(F, P);
  }
}
function win(text) {
  if (P.won) return; P.won = true; P.winF = F;
  const prev = save.best[LEVEL]; if (!prev || F < prev) save.best[LEVEL] = F;
  save.tapes[LEVEL] = Math.max(save.tapes[LEVEL] || 0, P.tapes); save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, LEVEL + 1)); store();
  if (LV.transition === 'elevator' && LEVEL < LEVELS.length) { elevatorRide(prev); return; }
  jingle('win'); sfx('cheer', 0.6); G.burst(P.x, P.y + 1.5, P.z, 'confetti', 60);
  setTimeout(() => showWin(text || LV.winText, prev), 1600);
}
// Aufzugfahrt: Türen zu → Abblenden → Etagenanzeige mit Zwischenstand → nächstes Level startet im Aufzug
let rideId = 0;
function elevatorRide(prev) {
  const id = ++rideId, lvl = LEVEL, fade = $('fade'), card = $('elev'), floorEl = card.querySelector('.floor');
  const later = (ms, fn) => setTimeout(() => { if (id === rideId) fn(); }, ms);
  jingle('win', false); sfx('cheer', 0.4);
  card.querySelector('b').textContent = `LEVEL ${lvl} GESCHAFFT!`;
  card.querySelector('.stats2').innerHTML = `<span>⏱ ${fmtTime(P.winF)}${!prev || P.winF < prev ? ' · <em>Bestzeit!</em>' : ''}</span><span>🎞 ${P.tapes} / ${LV.tapes.length}</span><span>💥 ${P.hits}</span>`;
  floorEl.textContent = '−2';
  later(1700, () => { fade.classList.add('on'); sfx('rumble', 0.5, { dur: 2.6 }); });
  later(2200, () => card.classList.add('on'));
  ['−1', '0', 'B'].forEach((f, i) => later(2900 + i * 650, () => { floorEl.textContent = f; sfx('blip', 0.9, { f: 990 }); }));
  later(4900, () => { sfx('ding', 0.9); startLevel(lvl + 1, 'play', true); });
  later(5300, () => { card.classList.remove('on'); fade.classList.remove('on'); });
}
G.win = win;

/* =====================================================================
   DARSTELLUNG
   ===================================================================== */
function pose(t) {
  const { body, arms, feet, eyes, ears } = hamster.userData;
  body.position.y = 0.95; body.rotation.set(0, 0, 0); body.scale.set(1, 1, 1);
  arms.forEach((a, i) => a.rotation.set(0, 0, (i ? 1 : -1) * 0.15));
  feet.forEach((f, i) => { f.position.set(i ? 0.34 : -0.34, 0, 0.1); f.rotation.set(0, 0, 0); });
  const spd = Math.hypot(P.vx - (P.on ? P.on.dx : 0), P.vz - (P.on ? P.on.dz : 0));
  if (P.dead > 0) { body.rotation.z = Math.min(1.4, (110 - P.dead) * 0.05); body.position.y = 0.75; eyes.forEach(e => e.lid.rotation.x = 1.5); return; }
  if (P.won && LV.transition === 'elevator') { let d = Math.PI - hamster.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); hamster.rotation.y += d * 0.12; arms[1].rotation.x = -2.7; arms[1].rotation.z = 0.5 + Math.sin(F * 0.3) * 0.45; body.position.y += Math.sin(t * 2.6) * 0.02; return; }
  if (P.won) { const k = (F - P.winF) * 0.18; body.position.y += Math.abs(Math.sin(k)) * 0.5; arms.forEach((a, i) => { a.rotation.x = -2.6; a.rotation.z = (i ? 1 : -1) * (0.5 + Math.sin(k * 2) * 0.3); }); hamster.rotation.y += 0.04; return; }
  if (!P.ground) {
    const up = P.vy > 0; body.rotation.x = up ? -0.18 : 0.12;
    arms.forEach((a, i) => { a.rotation.x = up ? -2.4 : -1.4; a.rotation.z = (i ? 1 : -1) * 0.6; });
    feet[0].position.set(-0.32, 0.28, 0.26); feet[1].position.set(0.32, 0.12, -0.08);
    body.scale.set(up ? 0.93 : 1.0, up ? 1.08 : 1.0, up ? 0.93 : 1.0);
  } else if (spd > 0.02) {
    P.anim += spd * 1.55; const s = Math.sin(P.anim), c = Math.cos(P.anim);
    feet[0].position.z = 0.1 + s * 0.34; feet[0].position.y = Math.max(0, c) * 0.2; feet[0].rotation.x = -s * 0.4;
    feet[1].position.z = 0.1 - s * 0.34; feet[1].position.y = Math.max(0, -c) * 0.2; feet[1].rotation.x = s * 0.4;
    body.position.y += Math.abs(s) * 0.09; body.rotation.x = 0.22; body.rotation.z = s * 0.06;
    arms[0].rotation.x = -s * 1.0; arms[1].rotation.x = s * 1.0;
    body.scale.set(1 + Math.abs(c) * 0.03, 1 - Math.abs(c) * 0.03, 1);
  } else {
    body.position.y += Math.sin(t * 2.6) * 0.022; body.scale.set(1 + Math.sin(t * 2.6) * 0.012, 1 - Math.sin(t * 2.6) * 0.012, 1);
    ears.forEach((e, i) => e.rotation.x = -0.15 + Math.sin(t * 1.7 + i) * 0.06);
  }
  if (P.land > 0) { const k = P.land; body.scale.set(1 + k * 0.16, 1 - k * 0.2, 1 + k * 0.16); body.position.y -= k * 0.12; P.land = Math.max(0, P.land - 0.12); }
  // Blinzeln
  if (--P.blink < 0) P.blink = 140 + Math.random() * 200;
  const bl = P.blink < 7 ? 1.5 : 0.42; eyes.forEach(e => e.lid.rotation.x = bl);
}

const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(); let shakeA = 0;
G.shake = a => { shakeA = Math.max(shakeA, a); };
function camTarget() {
  if (LV.camera) { const c = LV.camera(P, F); if (c) return c; }
  const bx = LV.bx ? LV.bx(P.z - 3.9) : 99, ceil = LV.ceil ? LV.ceil(P.z - 3.9) : 99;
  const hy = P.gy + Math.max(0, P.y - P.gy) * 0.5;
  const pos = new THREE.Vector3(clamp(P.x * 0.55, -bx + 0.4, bx - 0.4), Math.min(hy + 2.15, ceil - 0.35), P.z - 3.9);
  const look = new THREE.Vector3(P.x * 0.7, P.gy + Math.max(-1, P.y - P.gy) * 0.6 + 0.85, P.z + 3.4);
  // Hindernis zwischen Kamera und Hamster? Dann Kamera anheben
  const head = new THREE.Vector3(P.x, P.y + 1.0, P.z);
  for (let k = 0; k < 3 && rayBlocked(head, pos); k++) { pos.y = Math.min(pos.y + 0.9, ceil - 0.35); pos.z += 0.7; }
  return { pos, look };
}
function rayBlocked(a, b) {
  const d = new THREE.Vector3().subVectors(b, a);
  for (const o of LV.solids) {
    if (o.z2 < Math.min(a.z, b.z) - 0.2 || o.z1 > Math.max(a.z, b.z) + 0.2 || o.noCam) continue;
    let t0 = 0, t1 = 1, ok = true;
    for (const [s, dd, lo, hi] of [[a.x, d.x, o.x1, o.x2], [a.y, d.y, o.y1, o.y2], [a.z, d.z, o.z1, o.z2]]) {
      if (Math.abs(dd) < 1e-6) { if (s < lo || s > hi) { ok = false; break; } continue; }
      let u0 = (lo - s) / dd, u1 = (hi - s) / dd; if (u0 > u1) [u0, u1] = [u1, u0]; t0 = Math.max(t0, u0); t1 = Math.min(t1, u1); if (t0 > t1) { ok = false; break; }
    }
    if (ok && t1 > 0.05 && t0 < 0.95) return true;
  }
  return false;
}
function snapCam() { const c = camTarget(); camPos.copy(c.pos); camLook.copy(c.look); }
G.snapCam = snapCam;

function updateLights() {
  const ref = state === 'title' ? camPos : _v.set(P.x, P.y, P.z + 2);
  const L = LV.lights.filter(l => l.on === undefined || l.on(F)).map(l => [l, (l.x - ref.x) ** 2 + (l.y - ref.y) ** 2 * 0.3 + (l.z - ref.z) ** 2]).sort((a, b) => a[1] - b[1]);
  pool.forEach((pl, i) => {
    const e = L[i]; if (!e) { pl.intensity = 0; return; }
    const l = e[0]; pl.position.set(l.x, l.y, l.z); pl.color.copy(l.color); pl.distance = l.dist || 10;
    pl.intensity = (l.int || 10) * (l.flick ? l.flick(F) : 1);
  });
}
function draw(dt) {
  RF++;
  const t = RF / 60;
  hamster.position.set(P.x, P.y, P.z);
  if (state !== 'title') { let d = P.face - hamster.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); if (!P.won) hamster.rotation.y += d * 0.22; }
  hamster.visible = !(P.inv > 0 && (P.inv >> 2) % 2 && !P.dead);
  pose(t);
  // Schatten-Fleck unter dem Hamster
  let gy = -99; for (const o of LV.solids) if (P.x > o.x1 && P.x < o.x2 && P.z > o.z1 && P.z < o.z2 && o.y2 <= P.y + 0.1 && o.y2 > gy) gy = o.y2;
  for (const m of LV.movers) if (m.active !== false && Math.abs(P.x - m.x) < m.w / 2 && Math.abs(P.z - m.z) < m.d / 2 && m.y + m.h <= P.y + 0.1 && m.y + m.h > gy) gy = m.y + m.h;
  blob.visible = gy > -50; if (blob.visible) { const hgt = P.y - gy, s = clamp(1.1 - hgt * 0.12, 0.4, 1.1); blob.position.set(P.x, gy + 0.015, P.z); blob.scale.setScalar(s); blob.material.opacity = clamp(1 - hgt * 0.12, 0.25, 1); }
  // Kamera
  if (state === 'title' || state === 'pushbox' || state === 'options') { const a = Math.sin(t * 0.13) * 0.9, wide = innerWidth / innerHeight > 1.33 && innerWidth >= 700; camPos.set(P.x + Math.sin(a) * 3.6, P.y + 1.5, P.z + Math.cos(a) * 3.6); camLook.set(P.x, P.y + 0.75, P.z); if (wide) { const f = camLook.clone().sub(camPos).normalize(), r = f.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(); camLook.addScaledVector(r, -1.55); } hamster.rotation.y = a * 0.9; }
  else { const c = camTarget(); camPos.lerp(c.pos, c.snap ? 1 : 0.1); camLook.lerp(c.look, c.snap ? 1 : 0.14); }
  camera.position.copy(camPos);
  if (shakeA > 0.001) { camera.position.x += (Math.random() - 0.5) * shakeA; camera.position.y += (Math.random() - 0.5) * shakeA; shakeA *= 0.86; }
  camera.lookAt(camLook);
  sun.position.set(P.x + 2.5, P.y + 10, P.z - 3); sun.target.position.set(P.x, P.y, P.z + 2);
  // Dunkelheit (Stromausfall) + Stirnlampe
  const dark = LV.dark ? LV.dark(P) : 0; P.darkS = lerp(P.darkS || 0, dark, 0.05);
  hemi.intensity = (LV.hemi ? LV.hemi[2] : 1.1) * (1 - P.darkS * 0.85); sun.intensity = (LV.sun ? LV.sun[1] : 1.5) * (1 - P.darkS * 0.9);
  headlamp.intensity = P.darkS * 60; hamster.userData.lens.material.color.setScalar(0.8 + P.darkS * 3);
  updateLights();
  for (const m of LV.movers) { if (m.x === undefined) continue; if (m.mesh) { m.mesh.visible = m.active !== false; if (m.active !== false) m.mesh.position.set(m.x, m.y, m.z); } m.draw && m.draw(F, RF); }
  for (const h of LV.hazards) h.draw && h.draw(F, P, RF);
  for (const s of LV.snacks) if (!s.got) { s.m.rotation.y = RF * 0.04; s.m.position.y = s.y + 0.5 + Math.sin(RF * 0.07) * 0.08; }
  LV.draw && LV.draw(F, RF, P);
  drawTapes(); drawParticles(); drawBubbles();
  $('time').textContent = fmtTime(P.won ? P.winF : F);
  $('prog').firstElementChild.style.width = clamp(LV.progress(P), 0, 1) * 100 + '%';
  render();
}
const fmtTime = f => { const s = f / 60; return (s / 60 | 0) + ':' + (s % 60).toFixed(1).padStart(4, '0'); };

/* =====================================================================
   HUD, SPRECHBLASEN, MENÜS
   ===================================================================== */
function updHud() {
  let h = ''; for (let i = 0; i < P.hpMax; i++) h += `<i class="${i < P.hp ? 'on' : ''}"></i>`;
  $('hearts').innerHTML = h; $('tapes').textContent = P.tapes + ' / ' + LV.tapes.length;
}
G.updHud = updHud;
function showMsg(html, frames = 120) { const m = $('msg'); m.innerHTML = html; m.classList.add('show'); msgT = frames; }
function hideMsg() { $('msg').classList.remove('show'); msgT = 0; }
G.msg = showMsg;
const bubbles = [];
G.say = (text, obj, frames = 140, voice = 220, offY = 2.4) => {
  bubbles.filter(b => b.obj === obj).forEach(b => { b.el.remove(); b.dead = true; });
  const el = document.createElement('div'); el.className = 'bubble'; $('bubbles').appendChild(el);
  bubbles.push({ el, obj, text, n: 0, t: frames, voice, offY });
};
function drawBubbles() {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    if (b.dead || --b.t <= 0) { b.el.remove(); bubbles.splice(i, 1); continue; }
    if (b.n < b.text.length) { b.n = Math.min(b.text.length, b.n + 0.7); if ((b.n | 0) % 3 === 0 && b.text[b.n | 0] !== ' ') sfx('blip', 0.7, { f: b.voice * (0.9 + Math.random() * 0.3) }); b.el.textContent = b.text.slice(0, Math.ceil(b.n)); }
    b.obj.getWorldPosition(_v); _v.y += b.offY; _v.project(camera);
    b.el.style.left = clamp((_v.x * 0.5 + 0.5) * innerWidth, 90, innerWidth - 90) + 'px'; b.el.style.top = Math.max(70, (-_v.y * 0.5 + 0.5) * innerHeight) + 'px';
    b.el.style.opacity = b.t < 12 ? b.t / 12 : 1;
  }
}
G.boss = (show, name, hp, max) => { const el = $('boss'); el.style.display = show ? 'block' : 'none'; if (show) { el.querySelector('b').textContent = name; el.querySelector('i').style.width = (hp / max * 100) + '%'; } $('prog').style.display = show ? 'none' : ''; };

function setState(s) {
  state = s;
  document.body.dataset.state = s;
  for (const id of ['title', 'options', 'pause', 'win', 'pushbox']) $(id).classList.toggle('show', id === s);
  $('hud').style.display = (s === 'play' || s === 'pause') ? '' : 'none';
  if (s === 'title') { setMusic('menu'); renderLevelCards(); syncBell(); }
}
function renderLevelCards() {
  $('cards').innerHTML = LEVELS.map((L, i) => {
    const n = i + 1, lock = n > save.unlocked, best = save.best[n];
    return `<button class="card${lock ? ' lock' : ''}" data-lv="${n}" ${lock ? 'disabled' : ''}><span class="num">${n}</span><b>${L.name}</b><small>${lock ? '🔒 Erst Level ' + (n - 1) + ' schaffen' : best ? 'Bestzeit ' + fmtTime(best) + ' · 🎞 ' + (save.tapes[n] || 0) : 'Noch nicht gespielt'}</small></button>`;
  }).join('');
  $('cards').querySelectorAll('.card').forEach(b => b.onclick = () => { audioUnlock(); startLevel(+b.dataset.lv); });
}
function showWin(text, prevBest) {
  if (state !== 'play') return;
  const total = LV.tapes.length, best = save.best[LEVEL];
  $('winText').innerHTML = `<b>${text}</b><div class="stats"><span>⏱ ${fmtTime(P.winF)}${!prevBest || P.winF < prevBest ? ' <em>NEUE BESTZEIT!</em>' : ''}</span><span>🎞 ${P.tapes} / ${total} Gaffa</span><span>💥 ${P.hits} Treffer</span></div>`;
  $('btnNext').style.display = LEVEL < LEVELS.length ? '' : 'none';
  $('btnNext').textContent = LEVEL < LEVELS.length ? `Weiter zu Level ${LEVEL + 1} ›` : '';
  setState('win'); setMusic('menu');
}
function bindMenus() {
  const on = (id, fn) => $(id).addEventListener('click', e => { e.stopPropagation(); audioUnlock(); fn(); });
  on('btnPlay', () => startLevel(Math.min(save.unlocked, LEVELS.length)));
  on('btnOpt', () => { optFrom = state; setState('options'); syncOpts(); });
  on('btnOptBack', () => setState(optFrom === 'pause' ? 'pause' : 'title'));
  on('btnPause', () => { if (state === 'play') setState('pause'); });
  on('btnResume', () => setState('play'));
  on('btnRestart', () => startLevel(LEVEL));
  on('btnPauseOpt', () => { optFrom = 'pause'; setState('options'); syncOpts(); });
  on('btnMenu', () => { startLevel(LEVEL, 'title'); });
  on('btnNext', () => startLevel(LEVEL + 1));
  on('btnAgain', () => startLevel(LEVEL));
  on('btnWinMenu', () => startLevel(LEVEL, 'title'));
  on('optMusic', () => { setAudio(!AU.musicOn, AU.sfxOn); syncOpts(); });
  on('optSfx', () => { setAudio(AU.musicOn, !AU.sfxOn); syncOpts(); });
  on('optGfx', () => { setGfx(!GFX.high); syncOpts(); });
  on('btnBell', () => openPush());
  on('pushNo', () => setState('title'));
  $('pushYes').addEventListener('click', async e => {
    e.stopPropagation(); const st = pushState(), msg = $('pushMsg');
    if (st === 'install' || st === 'unsupported' || st === 'denied') { setState('title'); return; }
    msg.textContent = 'Einen Moment …';
    try { const r = await pushEnable(); msg.textContent = r === 'on' ? 'Push ist an – wir melden uns! 🔔' : r === 'later' ? 'Push ist an, Anmeldung wird später nachgeholt.' : 'Okay, dann nicht.'; if (r !== 'denied') sfx('cp'); }
    catch (err) { msg.textContent = 'Hat nicht geklappt – später nochmal probieren.'; }
    syncBell(); setTimeout(() => { if (state === 'pushbox') setState('title'); }, 1800);
  });
}
let optFrom = 'title';
function syncBell() { const st = pushState(), b = $('btnBell'); b.style.display = st === 'unsupported' && !IOS ? 'none' : ''; b.classList.toggle('on', st === 'on'); b.textContent = st === 'on' ? '🔔 Benachrichtigungen an' : '🔔 Benachrichtigungen'; }
function openPush() {
  const st = pushState(), txt = $('pushText'), yes = $('pushYes'), no = $('pushNo'); $('pushMsg').textContent = '';
  yes.style.display = ''; no.textContent = 'Lieber nicht';
  if (st === 'install') { txt.innerHTML = 'Auf dem iPhone klappt das nur als App:<br>Teilen-Symbol <b>⬆︎</b> → <b>„Zum Home-Bildschirm“</b>, dann den Medienhamster von dort starten und hier nochmal auf die Glocke tippen.'; yes.style.display = 'none'; no.textContent = 'Alles klar'; }
  else if (st === 'denied') { txt.textContent = 'Benachrichtigungen sind in den Einstellungen deines Geräts für diese Seite blockiert. Dort kannst du sie wieder erlauben.'; yes.style.display = 'none'; no.textContent = 'Okay'; }
  else if (st === 'on') { txt.textContent = 'Benachrichtigungen sind schon an – wir sagen Bescheid, wenn es Neues gibt. 🔔'; yes.style.display = 'none'; no.textContent = 'Super'; }
  else if (st === 'unsupported') { txt.textContent = 'Dein Browser unterstützt leider keine Push-Benachrichtigungen.'; yes.style.display = 'none'; no.textContent = 'Okay'; }
  else txt.textContent = 'Sollen wir dir kurz Bescheid sagen, wenn es neue Level oder Spiele gibt? Selten und ohne Werbung.';
  setState('pushbox');
}
function syncOpts() { $('optMusic').textContent = 'Musik: ' + (AU.musicOn ? 'AN' : 'AUS'); $('optSfx').textContent = 'Sounds: ' + (AU.sfxOn ? 'AN' : 'AUS'); $('optGfx').textContent = 'Grafik: ' + (GFX.high ? 'HOCH' : 'SPARSAM'); }

/* =====================================================================
   EINGABE
   ===================================================================== */
const keys = {}, IN = { x: 0, z: 0, jump: false, held: false };
addEventListener('keydown', e => {
  keys[e.code] = true; if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); audioUnlock();
  if ((e.code === 'Escape' || e.code === 'KeyP') && (state === 'play' || state === 'pause')) setState(state === 'play' ? 'pause' : 'play');
});
addEventListener('keyup', e => keys[e.code] = false);
let stick = null; const stickEl = $('stick'), knob = stickEl.firstElementChild, tJump = { down: false, id: null };
addEventListener('pointerdown', e => {
  audioUnlock();
  if (state !== 'play' || e.target.closest('button')) return;
  if (e.pointerType !== 'mouse') document.body.classList.add('touch');
  if (e.target.id === 'jump' || e.clientX > innerWidth * 0.55) { tJump.down = true; tJump.id = e.pointerId; return; }
  stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 }; stickEl.style.display = 'block'; stickEl.style.left = e.clientX + 'px'; stickEl.style.top = e.clientY + 'px';
});
addEventListener('pointermove', e => {
  if (!stick || e.pointerId !== stick.id) return;
  let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy; const l = Math.hypot(dx, dy), mx = 55;
  if (l > mx) { stick.ox += dx * (1 - mx / l); stick.oy += dy * (1 - mx / l); dx *= mx / l; dy *= mx / l; stickEl.style.left = stick.ox + 'px'; stickEl.style.top = stick.oy + 'px'; }   // Stick wandert mit
  stick.dx = dx / mx; stick.dy = dy / mx; knob.style.transform = `translate(${dx}px,${dy}px)`;
});
const endPtr = e => { if (stick && e.pointerId === stick.id) { stick = null; stickEl.style.display = 'none'; knob.style.transform = ''; } if (e.pointerId === tJump.id) { tJump.down = false; tJump.id = null; } };
addEventListener('pointerup', endPtr); addEventListener('pointercancel', endPtr);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; tJump.down = false; stick = null; stickEl.style.display = 'none'; });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') setState('pause'); });
function readInput() {
  let x = 0, z = 0;
  if (keys.ArrowLeft || keys.KeyA) x += 1; if (keys.ArrowRight || keys.KeyD) x -= 1;
  if (keys.ArrowUp || keys.KeyW) z += 1; if (keys.ArrowDown || keys.KeyS) z -= 1;
  if (stick) { const dz = Math.hypot(stick.dx, stick.dy) < 0.18 ? 0 : 1; x -= stick.dx * dz; z -= stick.dy * dz; }
  const l = Math.hypot(x, z); if (l > 1) { x /= l; z /= l; }
  const j = !!(keys.Space || keys.KeyK || keys.KeyJ || tJump.down);
  IN.jump = j && !IN.held; IN.held = j; IN.x = x; IN.z = z;
}

/* =====================================================================
   HAUPTSCHLEIFE
   ===================================================================== */
bindMenus(); resize(); addEventListener('resize', resize);
startLevel(QS.has('level') ? clamp(+QS.get('level') || 1, 1, LEVELS.length) : Math.min(save.unlocked, LEVELS.length), QS.has('level') || QS.has('play') ? 'play' : 'title');
let acc = 0, last = performance.now(), perfN = 0, perfSum = 0, perfDone = false;
function loop(now) {
  const dt = Math.min(100, now - last); last = now;
  if (state === 'play' || state === 'title' || state === 'win') { acc += dt; while (acc >= 1000 / 60) { readInput(); step(); acc -= 1000 / 60; } }
  musicTick(); draw(dt);
  if (!perfDone && state === 'play') { perfN++; perfSum += dt; if (perfN === 240) { perfDone = true; if (perfSum / perfN > 26 && GFX.high) { setGfx(false); showMsg('Grafik angepasst<small>für flüssigeres Spielen</small>', 100); } } }
}
if (!QS.has('shot')) renderer_loop();
function renderer_loop() { const f = (n) => { loop(n); requestAnimationFrame(f); }; requestAnimationFrame(f); }

// Test-Schnittstelle
window.__G = {
  G, P, get LV() { return LV; }, get F() { return F; }, set F(v) { F = v; }, startLevel, setState, IN,
  sim(n, inp = {}) { for (let i = 0; i < n; i++) { IN.x = inp.x || 0; IN.z = inp.z || 0; const j = !!(inp.jumpAt && inp.jumpAt.includes(i)) || (inp.jumpEvery && i % inp.jumpEvery === 0); IN.jump = j; IN.held = j; step(); if (inp.until && inp.until(P)) break; } draw(16); return { x: +P.x.toFixed(2), y: +P.y.toFixed(2), z: +P.z.toFixed(2), hp: P.hp, cp: P.cp, won: P.won, tapes: P.tapes, dead: P.dead }; },
  frame() { draw(16); },
  cam: camera, render, scene, hamster: () => hamster,
  stepN(n, fn) { for (let i = 0; i < n; i++) { if (fn && fn(P, LV, IN) === false) return i; step(); } return n; },
  track: (name, secs) => renderTrackOffline(name, secs),
  jingleWav: (name) => renderOffline((b, c) => JINGLES[name](b, 0.05), 3),
  hideUi() { document.getElementById('hud').style.display = 'none'; for (const id of ['title', 'options', 'pause', 'win']) $(id).classList.remove('show'); hideMsg(); },
};
