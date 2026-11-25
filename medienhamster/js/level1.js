/* LEVEL 1 – KATAKOMBEN DER MESSE (ca. 450 m)
   Start-Halle → Case-Lager → Kabelschacht → Lastenaufzug → Kabelsalat → Lagerhalle (Stapler) → rollende Cases →
   Wasserschaden → Rolltore → Förderbänder → Großer Schacht (Scherenbühnen) → Stromausfall (Dampf) → Endspurt → Aufzug */
import { THREE, scene, boxGeo, mat4, rnd, Parts, tubeBetween, lerp, clamp } from './core.js?v=10';
import { MAT, T, caseParts, palletParts, cableDrumParts, coneParts, extinguisherParts, powerBoxParts, rackParts, exitSign, buildForklift, buildHoist, chainMesh, buildHookBlock, buildSpeaker, buildScissorLift, glowMat, beamMat, labelTex, trussGeo } from './models.js?v=10';
import { sfx } from './audio.js?v=10';
import { makeKit } from './kit.js?v=10';

export function level1(G, LV) {
  const K = makeKit(G, LV), P = G.P, A = K.anims;
  Object.assign(LV, {
    name: 'KATAKOMBEN', music: 'kata', fog: ['#0c0a12', 9, 36], hemi: ['#9aa6d8', '#2a2230', 0.95], sun: ['#e8eeff', 1.15], envInt: 0.3,
    z1: -3.6, z2: 455.4, deathY: -5, winText: 'Raus aus den Katakomben – ab zur Mainstage!'
  });
  const SEG = [[-4, 24, 5, 6], [24, 64, 3.5, 5.4], [64, 74, 3.5, 5.4], [74, 124, 4.5, 7.2], [124, 138, 3.5, 5.4], [138, 196, 8, 8.5], [196, 232, 3.5, 5.4], [232, 268, 4, 5.4], [268, 300, 3.5, 5.4], [300, 340, 4, 5.6], [340, 362, 4.5, 8], [362, 420, 3.5, 5.4], [420, 456, 4, 6]];
  const PITS = [[66, 69.2], [336.4, 339.4], [342.5, 357.5]];
  const { W, H } = K.corridor(SEG, PITS);
  const DARK = [364, 418];
  LV.dark = p => clamp(Math.min(p.z - DARK[0], DARK[1] - p.z) / 3, 0, 1);
  LV.progress = p => p.z / 453;
  const SLOW = [126, 135.5];
  LV.slow = p => (p.z > SLOW[0] && p.z < SLOW[1] && p.y < 0.3) ? 0.5 : 1;
  LV.cps = [
    { x: 0, y: 0, z: 1 },
    ...[[71, 'Kabelschacht'], [141, 'Lagerhalle'], [199.5, ''], [270, ''], [302, ''], [360.5, ''], [421, '']].map(([z]) => ({ x: 0, y: 0, z, at: p => p.z > z && p.y > -0.5, px: W(z) - 0.7 }))
  ];
  LV.cps[0].at = () => true;

  /* ---------- Licht unter der Decke ---------- */
  for (const [z1, z2, w, h] of SEG) for (let z = z1 + 3.5; z < z2 - 1; z += 7) {
    if (z > DARK[0] - 1 && z < DARK[1] + 1) { K.neon(0, h - 0.12, z, { off: true }); continue; }
    if (z1 === 138) { // Hallenstrahler
      for (const x of [-4, 4]) { K.geo(new THREE.CylinderGeometry(0.45, 0.6, 0.35, 20, 1, true), MAT.darkMetal, mat4(x, h - 0.7, z), false); K.geo(new THREE.CircleGeometry(0.55, 20), MAT.neon, mat4(x, h - 0.86, z, Math.PI / 2, 0, 0), false); K.geo(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), MAT.black, mat4(x, h - 0.3, z), false); K.light(x, h - 1.5, z, '#fff2dc', 14, 14); }
      continue;
    }
    K.neon(0, h - 0.12, z, { flicker: rnd() < 0.12 });
  }
  /* ---------- Wand-Ausstattung: Rohre, Kabeltrassen, Feuerlöscher, Notausgang ---------- */
  for (const [z1, z2, w, h] of SEG) {
    K.pipeZ(-w + 0.35, h - 0.5, z1 + 0.2, z2 - 0.2, 0.16, MAT.pipeRed); K.pipeZ(w - 0.3, h - 0.45, z1 + 0.2, z2 - 0.2, 0.12, MAT.pipe);
    K.box(0.45, 0.05, z2 - z1 - 0.4, MAT.tray, w - 0.28, h - 1.3, (z1 + z2) / 2, 0, 0, false);
    for (let k = 0; k < 3; k++) K.geo(new THREE.CylinderGeometry(0.035, 0.035, z2 - z1 - 0.4, 6), MAT.black, mat4(w - 0.14 - k * 0.1, h - 1.25, (z1 + z2) / 2, Math.PI / 2, 0, 0), false);
    for (let z = z1 + 5; z < z2 - 3; z += 23) { K.parts(extinguisherParts(), -w + 0.15, 0.9, z, Math.PI / 2); K.box(0.04, 0.5, 0.5, MAT.red, -w + 0.02, 1.8, z, 0, 0, false); }
  }
  for (const z of [20, 60, 118, 190, 228, 296, 330, 410]) K.sign('NOTAUSGANG', '', '#139a48', W(z) - 0.03, 2.6, z, -Math.PI / 2, 1.3, 'exit', true);

  /* ---------- 1) START-HALLE ---------- */
  K.box(10, 6, 0.3, MAT.shutter, 0, 3, -4.0, 2);
  K.sign('LIEFERZONE', 'Ebene −2 · Halle 3', '#2b5a8c', 0, 4.3, -3.8, 0, 3.4);
  K.sign('KATAKOMBEN', 'Ausgang Bühne → immer geradeaus', '#4a1f99', 0, 4.2, 23.6, Math.PI, 3.8);
  for (let z = 0; z < 24; z += 1.2) for (const x of [-1.9, 1.9]) K.box(0.1, 0.012, 0.7, MAT.hazard, x, 0.006, z, 1, 0, false);
  K.parts(palletParts(), -3.8, 0, 3.5); for (let i = 0; i < 4; i++) K.box(0.45, 0.4, 0.38, MAT.cardboard, -4.05 + (i % 2) * 0.5, 0.35 + (i > 1 ? 0.4 : 0), 3.5, 1, 0.1 * i);
  LV.solids.push({ x1: -4.4, x2: -3.2, y1: 0, y2: 1.0, z1: 3.1, z2: 3.9 });
  K.parts(cableDrumParts(), 3.9, 0, 6.5, 0.3); LV.solids.push({ x1: 3.5, x2: 4.4, y1: 0, y2: 0.9, z1: 6.0, z2: 7.0 });
  for (let i = 0; i < 4; i++) K.parts(coneParts(), -2.6 + i * 0.35, 0, 10 + i * 0.7);
  K.parts(powerBoxParts(), 4.65, 0, 13, -Math.PI / 2);
  K.caseAt(3.8, 18.5, 1.4, 1.2, 1.0, { label: 0 }); K.caseAt(3.8, 18.5, 1.2, 0.9, 0.9, { y: 1.2, label: 1, blue: true });
  K.caseAt(-3.9, 16, 1.2, 1.0, 1.0, { label: 4 });
  G.tapeLine(0, 5, 0, 14, 6); G.tape(3.8, 2.1, 18.5); G.tape(-3.9, 1.0, 16);

  /* ---------- 2) CASE-LAGER ---------- */
  K.caseAt(-2.1, 28.5, 2.8, 1.0, 1.4, { label: 0 });
  K.caseAt(2.1, 33.5, 2.8, 1.0, 1.4, { label: 1, blue: true });
  K.caseAt(0, 38.5, 3.2, 0.95, 1.3, { label: 2 }); K.caseAt(-2.55, 38.5, 1.9, 2.1, 1.3, { label: 3 }); K.caseAt(2.55, 38.5, 1.9, 2.1, 1.3, { label: 5, blue: true });
  K.caseAt(-2.25, 44.7, 2.5, 0.9, 1.4, { label: 4 }); K.caseAt(-2.25, 46.1, 2.5, 1.8, 1.4, { label: 6 });
  K.caseAt(0, 50.8, 7.0, 1.25, 1.0, { label: 0 });
  K.caseAt(-1.5, 55.6, 4.0, 2.6, 1.4, { label: 5 }); K.caseAt(1.5, 59.6, 4.0, 2.6, 1.4, { label: 1, blue: true });
  G.tapeLine(1.5, 27, 1.5, 31, 3); G.tapeLine(-1.5, 32, -1.5, 36, 3); G.tape(0, 0.95, 38.5); G.tape(-2.25, 1.8, 46.1); G.tape(-2.25, 1.8, 46.9);
  G.tapeArc(0, 49.4, 52.2, 4, 0.2, 2.2); G.tapeLine(2.2, 55.2, 2.2, 57.5, 2); G.tapeLine(-2.2, 59, -2.2, 61.5, 2);

  /* ---------- 3) KABELSCHACHT 1 ---------- */
  K.sign('KABELSCHACHT', 'Achtung, offene Grube!', '#c0392b', 0, 3.6, 63.8, Math.PI, 2.8);
  for (const x of [-3.2, 3.2]) K.beacon(x, 0.3, 65.7, 'red');
  G.tapeArc(0, 65.4, 69.8, 5, 0.3, 2.3);

  /* ---------- 4) LASTENAUFZUG: schwingende Lautsprecher + Fall-Traverse ---------- */
  K.sign('LASTENAUFZUG', 'Kettenzüge in Betrieb!', '#c0392b', -W(76) + 0.03, 3.2, 77, Math.PI / 2, 2.6);
  const swings = [[82, 1.0, 0, 1.55], [90, 1.05, 2.0, 1.7], [98, 0.95, 4.1, 1.45], [106, 1.1, 1.0, 1.8], [113, 1.0, 3.0, 1.6]].map(([z, amp, ph, sp]) => {
    const h = H(z), py = h - 0.75, L = py - 0.85;
    K.box(W(z) * 2, 0.35, 0.25, MAT.darkMetal, 0, h - 0.3, z, 0, 0, false);
    const hoist = buildHoist(); hoist.position.set(0, py + 0.2, z); scene.add(hoist);
    const g = new THREE.Group(); g.position.set(0, py, z); scene.add(g);
    const ch = chainMesh(L - 0.9); g.add(ch);
    const hb = buildHookBlock(); hb.position.y = -(L - 0.9) - 0.12; g.add(hb);
    const sp1 = buildSpeaker(); sp1.position.y = -L; g.add(sp1);
    return { z, amp, ph, sp, L, py, g, lastA: 0 };
  });
  LV.hazards.push({
    update(F, p) {
      for (const s of swings) {
        const a = s.amp * Math.sin(F / 60 * s.sp + s.ph); s.g.rotation.z = a;
        const cx = Math.sin(a) * s.L, cy = s.py - Math.cos(a) * s.L;
        if (Math.sign(a) !== Math.sign(s.lastA) && Math.abs(p.z - s.z) < 9) sfx('whoosh', clamp(1 - Math.abs(p.z - s.z) / 9, 0, 1) * 0.7);
        s.lastA = a;
        if (Math.abs(p.z - s.z) < 0.31 + G.R && Math.abs(p.x - cx) < 0.62 + G.R && p.y < cy + 0.21 && p.y + G.H > cy - 0.21) G.hurt(Math.sign(p.x - cx || 1) * 0.3, -0.12);
      }
    }
  });
  // Fall-Traverse über die ganze Breite (bei z 119)
  {
    const z = 119.5, top = 4.0, grp = new THREE.Group(); scene.add(grp);
    grp.add(new THREE.Mesh(trussGeo(-4.3, 4.3, 0.75, 0, 0.5), MAT.alu));
    for (let i = 0; i < 4; i++) { const s = buildSpeaker(); s.position.set(-3.2 + i * 2.13, 0.2, 0); s.rotation.y = 0; s.scale.set(0.8, 0.9, 0.9); grp.add(s); }
    for (const x of [-3, 3]) { const c = chainMesh(3.5); c.position.set(x, 4.5, 0); grp.add(c); }
    let st = 'up';
    const m = { w: 8.6, h: 1.0, d: 0.7, hurts: true, mesh: grp, pos: F => { const u = (F + 40) % 210; let y; if (u < 90) y = top; else if (u < 104) y = top - (u - 90) / 14 * top; else if (u < 140) y = 0; else y = (u - 140) / 70 * top; return [0, Math.max(0, y), z]; },
      draw: (F) => { const u = (F + 40) % 210; if (u === 104 && Math.abs(P.z - z) < 14) { sfx('clank', 1 - Math.abs(P.z - z) / 14); G.shake(0.12 * (1 - Math.abs(P.z - z) / 14)); G.burst(0, 0.1, z, 'dust', 14); } } };
    LV.movers.push(m);
    K.beacon(-W(z) + 0.3, 3.4, z - 1.2, 'red', { active: F => { const u = (F + 40) % 210; return u > 70 && u < 140; } });
    K.box(8.6, 0.02, 0.9, MAT.hazard, 0, 0.012, z, 1, 0, false);
  }
  G.tapeLine(-3, 78, -3, 80, 2); G.tapeLine(3, 86, 3, 88, 2); G.tape(0, 2.2, 94); G.tape(0, 2.2, 102); G.tapeLine(-3, 109, -3, 111, 2); G.tape(0, 0, 119.5);

  /* ---------- 5) KABELSALAT (bremst) ---------- */
  K.box(7, 0.02, 0.3, MAT.hazard, 0, 0.012, SLOW[0] - 0.5, 1, 0, false);
  for (let i = 0; i < 34; i++) {
    const pts = [], x0 = (rnd() - 0.5) * 6, z0 = SLOW[0] + rnd() * (SLOW[1] - SLOW[0]);
    for (let k = 0; k < 6; k++) pts.push(new THREE.Vector3(clamp(x0 + (rnd() - 0.5) * 3, -3.3, 3.3), 0.05 + rnd() * 0.1, clamp(z0 + (rnd() - 0.5) * 3, SLOW[0], SLOW[1])));
    K.geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.045 + rnd() * 0.02, 6), [MAT.black, MAT.red, MAT.blue, MAT.black, MAT.pipeYellow][i % 5], null);
  }
  K.parts(cableDrumParts(), -2.8, 0, 131, 0.4); LV.solids.push({ x1: -3.3, x2: -2.3, y1: 0, y2: 0.9, z1: 130.5, z2: 131.5 });
  K.sign('VORSICHT', 'Kabelsalat – Bühnentechnik', '#d68910', W(129) - 0.03, 2.6, 129, -Math.PI / 2, 2.4);
  G.tapeLine(-1.5, 127, 1.5, 130, 3); G.tapeLine(1.5, 132, -1.5, 135, 3);

  /* ---------- 6) LAGERHALLE mit Gabelstaplern ---------- */
  for (const s of [-1, 1]) for (let z = 141; z < 193; z += 8.6) { K.parts(rackParts(8, 3.4, 1.1, 3), s * 7.3, 0, z + 4.1, Math.PI / 2); LV.solids.push({ x1: s > 0 ? 6.7 : -8, x2: s > 0 ? 8 : -6.7, y1: 0, y2: 3.6, z1: z, z2: z + 8.2 }); }
  K.sign('LAGERHALLE 3', 'Staplerverkehr!', '#f2a20c', 0, 6.2, 138.2, 0, 3.6);
  for (const z of [150, 172]) { for (let x = -6.5; x < 6.5; x += 1.1) K.box(0.55, 0.012, 1.6, MAT.white, x, 0.006, z, 0, 0, false); K.box(13.4, 0.012, 0.08, MAT.pipeYellow, 0, 0.007, z - 1.1, 0, 0, false); K.box(13.4, 0.012, 0.08, MAT.pipeYellow, 0, 0.007, z + 1.1, 0, 0, false); }
  for (const [x, z, h] of [[-2.2, 160.5, 1.2], [2.2, 160.5, 1.2], [0, 182.5, 1.6], [-4.5, 186, 0.9]]) {
    K.parts(palletParts(), x, 0, z); const n = Math.round(h / 0.4);
    for (let i = 0; i < n * 2; i++) K.box(0.55, 0.38, 0.38, MAT.cardboard, x - 0.28 + (i % 2) * 0.56, 0.34 + Math.floor(i / 2) * 0.4, z, 1, (rnd() - 0.5) * 0.1);
    LV.solids.push({ x1: x - 0.6, x2: x + 0.6, y1: 0, y2: 0.15 + n * 0.4, z1: z - 0.4, z2: z + 0.4 });
  }
  const forklift = (z, spd, ph, x1, x2) => {
    const g = buildForklift(), wrap = new THREE.Group(); g.position.x = -0.375; wrap.add(g); scene.add(wrap);
    const m = { w: 3.55, h: 2.3, d: 1.3, hurts: true, mesh: wrap, pos: F => [pingpongF(F + ph, x1, x2, spd, 45), 0, z],
      draw: (F, RF) => { g.userData.beacon.rotation.y = RF * 0.2; if (Math.abs(m.dx) > 0.01 && F % 36 === 0 && Math.abs(P.z - z) < 12) sfx('beep', clamp(1 - Math.abs(P.z - z) / 12, 0, 1) * 0.8); g.userData.spot.position.x = m.dx >= 0 ? 3.0 : -2.3; } };
    LV.movers.push(m);
    K.light(0, 2.6, z, '#ffaa2a', 4, 6, { follow: m });
    return m;
  };
  forklift(150, 0.065, 0, -4.4, 4.4); forklift(172, 0.08, 90, 4.4, -4.4);
  G.tapeLine(-5, 145, 5, 145, 5); G.tape(-2.2, 1.2, 160.5); G.tape(2.2, 1.2, 160.5); G.tape(0, 1.6, 182.5); G.tapeLine(-5, 165, -5, 168, 2); G.tapeLine(5, 177, 5, 180, 2); G.tapeLine(0, 188, 0, 193, 3);
  G.snack(0, 0, 197.5);

  /* ---------- 7) ROLLENDE CASES ---------- */
  K.sign('ACHTUNG', 'Case-Transport!', '#c0392b', 0, 3.9, 199, Math.PI, 2.4);
  [[-2.2, 0], [0, 75], [2.2, 150], [-2.2, 112], [2.2, 37]].forEach(([x, off], i) => {
    const grp = caseParts(1.4, 1.15, 1.3, { wheels: true, label: i % 7, blue: i % 2 === 1 }).toGroup();
    LV.movers.push({ w: 1.4, h: 1.15, d: 1.3, hurts: true, mesh: grp, pos: F => { const u = ((F * 0.085 + off * 0.4) % 28); return u < 26 ? [x, 0, 230 - u] : null; } });
    scene.add(grp);
  });
  G.tapeLine(0, 203, 0, 207, 3); G.tapeLine(-2.2, 212, -2.2, 216, 3); G.tapeLine(2.2, 220, 2.2, 224, 3);

  /* ---------- 8) WASSERSCHADEN mit Kurzschluss-Funken ---------- */
  K.sign('WASSERSCHADEN', 'Nicht in die Pfützen!', '#2a62d0', 0, 3.9, 231.8, Math.PI, 2.8);
  const zones = [[235.5, 246, 0], [251.5, 262, 110]].map(([z1, z2, ph]) => {
    const w = W(z1 + 1) - 0.05, shape = new THREE.Shape();
    shape.moveTo(-w, -z1); for (let i = 0; i <= 10; i++) shape.lineTo(-w + i * w * 0.2, -(z1 - 0.3 + Math.sin(i * 1.7) * 0.25)); for (let i = 0; i <= 10; i++) shape.lineTo(w - i * w * 0.2, -(z2 + 0.3 + Math.sin(i * 2.3) * 0.25));
    const geo = new THREE.ShapeGeometry(shape); geo.rotateX(-Math.PI / 2); geo.translate(0, 0.008, 0);
    const water = new THREE.Mesh(geo, MAT.water); water.receiveShadow = true; scene.add(water);
    const flash = new THREE.Mesh(geo.clone().translate(0, 0.004, 0), glowMat(0.12, 0.3, 0.85, 0.22)); flash.visible = false; scene.add(flash);
    const cx = w - 0.3, cz = (z1 + z2) / 2;
    K.geo(tubeBetween(new THREE.Vector3(w + 0.1, 2.2, cz), new THREE.Vector3(w - 0.1, 0.05, cz + 0.4), 0.05), MAT.black);
    K.geo(new THREE.CylinderGeometry(0.06, 0.04, 0.2, 8), MAT.pipeYellow, mat4(cx, 0.05, cz + 0.5, Math.PI / 2, 0, 0.4));
    const light = K.light(cx, 0.6, cz, '#5aa8ff', 0, 9);
    return { z1, z2, ph, flash, cx, cz, light };
  });
  for (const [x, z] of [[-2, 237.6], [1.0, 240.2], [-1.5, 242.8], [2.0, 245.0], [1.6, 253.5], [-1.2, 256.0], [1.4, 258.4], [-1.8, 260.8]]) { K.parts(palletParts(1.2, 1.0), x, 0, z, 0); LV.solids.push({ x1: x - 0.6, x2: x + 0.6, y1: 0, y2: 0.145, z1: z - 0.5, z2: z + 0.5 }); }
  K.caseAt(3, 249, 1.0, 0.8, 1.0, { label: 4 });
  LV.hazards.push({
    update(F, p) {
      for (const zn of zones) {
        const c = (F + zn.ph) % 220, warn = c >= 120 && c < 170, live = c >= 170;
        zn.state = live ? 2 : warn ? 1 : 0;
        const near = Math.abs(p.z - zn.cz) < 14;
        if (warn && F % 9 === 0 && near) { G.burst(zn.cx, 0.15, zn.cz + 0.5, 'blue', 3); if (F % 18 === 0) sfx('spark', 0.4 * (1 - Math.abs(p.z - zn.cz) / 14)); }
        if (live && F % 7 === 0 && near) { G.burst(zn.cx, 0.2, zn.cz + 0.5, 'blue', 3); if (F % 10 === 0) sfx('spark', 0.8 * (1 - Math.abs(p.z - zn.cz) / 14)); }
        const inZone = p.z > zn.z1 - 0.2 && p.z < zn.z2 + 0.2 && p.y < 0.05 && p.ground;
        if (inZone && Math.hypot(p.vx, p.vz) > 0.03 && F % 18 === 0) sfx('splash', 0.5);
        if (live && inZone) { G.hurt(0, -0.25); G.burst(p.x, 0.5, p.z, 'blue', 10); }
        zn.light.int = live ? 5 + Math.random() * 5 : warn ? (Math.random() < 0.2 ? 4 : 0) : 0;
      }
    },
    draw(F) { for (const zn of zones) { zn.flash.visible = zn.state === 2 && (F >> 1) % 3 !== 0; } }
  });
  for (let z = 236; z < 262; z += 3.3) { const x = (rnd() - 0.5) * 5; A.push((F, RF) => { if ((RF + z * 7 | 0) % 70 === 0 && Math.abs(P.z - z) < 10) G.burst(x, H(z) - 0.2, z, 'steam', 1); }); }
  G.tape(-2, 0.15, 237.6); G.tape(1.0, 0.15, 240.2); G.tape(-1.5, 0.15, 242.8); G.tape(2.0, 0.15, 245); G.tape(1.6, 0.15, 253.5); G.tape(-1.2, 0.15, 256); G.tape(1.4, 0.15, 258.4); G.tape(3, 0.8, 249);

  /* ---------- 9) ROLLTORE ---------- */
  const shutters = [276, 284, 292].map((z, i) => {
    const w = W(z), h = H(z), ph = i * 85;
    K.solid(-w, w, 3.25, h, z - 0.35, z + 0.35, MAT.wall, { tile: 2 * h, tileV: h });
    K.geo(new THREE.CylinderGeometry(0.32, 0.32, w * 2, 16), MAT.darkMetal, mat4(0, 3.6, z - 0.5, 0, 0, Math.PI / 2), false);
    for (const s of [-1, 1]) K.box(0.18, 3.25, 0.3, MAT.hazard, s * (w - 0.09), 1.62, z, 1, 0, true);
    const grp = new THREE.Group(); scene.add(grp);
    const panel = new THREE.Mesh(boxGeo(w * 2 - 0.3, 3.2, 0.1, 1.6), MAT.shutter); panel.position.y = 1.6; panel.castShadow = true; grp.add(panel);
    const edge = new THREE.Mesh(boxGeo(w * 2 - 0.3, 0.14, 0.14, 0.5), MAT.hazard); edge.position.y = 0.07; grp.add(edge);
    const cyc = F => { const u = (F + ph) % 250; return u < 110 ? 3.2 : u < 150 ? 3.2 * (1 - (u - 110) / 40) : u < 200 ? 0 : 3.2 * (u - 200) / 50; };
    const m = { w: w * 2, h: 3.25, d: 0.24, hurts: true, mesh: grp, pos: F => [0, cyc(F), z],
      draw: F => { const u = (F + ph) % 250, mv = (u >= 110 && u < 150) || u >= 200; if (mv && F % 30 === 0 && Math.abs(P.z - z) < 10) sfx('beep', 0.5 * (1 - Math.abs(P.z - z) / 10)); if (u === 110 && Math.abs(P.z - z) < 10) sfx('rumble', 0.6, { dur: 0.7 }); } };
    LV.movers.push(m);
    K.beacon(w - 0.5, 3.0, z - 0.45, 'amber', { active: F => { const u = (F + ph) % 250; return u >= 95 && u < 205; } });
    return m;
  });
  K.sign('ROLLTORE', 'Nicht drunter stehen bleiben!', '#d68910', 0, 4.4, 270.5, Math.PI, 2.6);
  G.tape(0, 0, 276); G.tape(0, 0, 284); G.tape(0, 0, 292); G.tapeLine(-2.5, 279, -2.5, 281, 2); G.tapeLine(2.5, 287, 2.5, 289, 2);
  G.snack(-2.5, 0, 298);

  /* ---------- 10) FÖRDERBÄNDER ---------- */
  K.sign('VERTEILZENTRUM', 'Förderbänder laufen', '#2b5a8c', 0, 4.1, 300.5, Math.PI, 2.8);
  const lanes = [[-2.4, 0.045], [0, -0.07], [2.4, -0.035]];
  const beltTex = [];
  for (const [x, v] of lanes) {
    const z1 = 303, z2 = 335.6, len = z2 - z1;
    LV.solids.push({ x1: x - 1.1, x2: x + 1.1, y1: 0, y2: 0.3, z1, z2, conv: [0, v] });
    K.box(2.3, 0.26, len, MAT.darkMetal, x, 0.13, (z1 + z2) / 2, 0, 0, true);
    const tex = T.belt.clone(); tex.needsUpdate = true; tex.repeat.set(1, len / 2); beltTex.push([tex, v]);
    const belt = new THREE.Mesh(new THREE.PlaneGeometry(2.0, len), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })); belt.rotation.x = -Math.PI / 2; belt.position.set(x, 0.302, (z1 + z2) / 2); belt.receiveShadow = true; scene.add(belt);
    for (const s of [-1, 1]) K.box(0.08, 0.12, len, MAT.darkMetal, x + s * 1.07, 0.33, (z1 + z2) / 2, 0, 0, false);
    for (const zz of [z1 + 0.15, z2 - 0.15]) K.geo(new THREE.CylinderGeometry(0.15, 0.15, 2.1, 14), MAT.chrome, mat4(x, 0.17, zz, 0, 0, Math.PI / 2));
  }
  A.push(() => { for (const [t, v] of beltTex) t.offset.y = (t.offset.y - v / 2) % 1; });
  [[0, 0], [0, 12], [2.4, 6], [2.4, 21], [0, 24]].forEach(([x, off], i) => {
    const v = lanes.find(l => l[0] === x)[1], grp = caseParts(1.3, 1.0, 1.2, { label: (i + 2) % 7, blue: i % 2 === 0 }).toGroup(); scene.add(grp);
    LV.movers.push({ w: 1.3, h: 1.0, d: 1.2, hurts: true, mesh: grp, pos: F => { const u = (F * -v + off * 1.3) % 31.5; return [x, 0.3, 334.8 - u]; } });
  });
  G.tapeLine(-2.4, 306, -2.4, 333, 8, 0.3); G.tapeArc(-2.4, 335.8, 340, 4, 0.4, 2.2);

  /* ---------- 11) GROSSER SCHACHT mit Scherenbühnen ---------- */
  K.sign('KABELSCHACHT 2', 'Hubpodeste benutzen!', '#c0392b', 0, 4.4, 340.2, Math.PI, 2.8);
  for (const x of [-3.9, 3.9]) { K.beacon(x, 0.3, 342.2, 'red'); K.beacon(x, 0.3, 357.8, 'red'); }
  [[345, 0], [348.6, 70], [352.2, 140], [355.8, 35]].forEach(([z, ph]) => {
    const lift = buildScissorLift(3.0, 2.6, -8); lift.position.set(0, 0, z); scene.add(lift);
    const m = { w: 3.0, h: 0.22, d: 2.6, hurts: false, pos: F => [0, pingpongF(F + ph, -1.8, 0.6, 0.02, 40) - 0.22, z], draw: () => lift.userData.update(m.y + 0.22) };
    LV.movers.push(m);
    G.tape(0, 1.2, z);
  });
  G.snack(0, 0, 359.5);

  /* ---------- 12) STROMAUSFALL mit Dampfleitungen ---------- */
  K.sign('STROMAUSFALL', 'Stirnlampe an!', '#3a3a44', 0, 4.0, 362.4, Math.PI, 2.6);
  for (let z = 366; z < 418; z += 8) for (const s of [-1, 1]) { K.box(0.12, 0.12, 0.25, MAT.glowRed, s * (W(z) - 0.08), 2.2, z + s * 2, 0, 0, false); K.light(s * (W(z) - 0.5), 2.2, z + s * 2, '#ff2a1a', 2.2, 5); }
  for (const z of [380, 404]) { const g = new THREE.Group(); g.position.set(-1.2, 0.08, z); g.rotation.set(0, 0.4, 0.12); scene.add(g); g.add(new THREE.Mesh(boxGeo(0.34, 0.1, 2.3), MAT.alu)); LV.solids.push({ x1: -2.2, x2: -0.2, y1: 0, y2: 0.25, z1: z - 1, z2: z + 1 }); A.push((F, RF) => { if (RF % 47 === 0 && Math.abs(P.z - z) < 12) { G.burst(-0.5, 0.3, z + 0.9, 'spark', 6); sfx('spark', 0.4); } }); }
  for (const [x, z] of [[1.8, 386], [-2.4, 393], [2.0, 410]]) { const slab = new THREE.Mesh(boxGeo(1.4, 0.18, 1.1, 1.5), MAT.concrete); slab.position.set(x, 0.25, z); slab.rotation.set(0.25, rnd(), 0.15); slab.castShadow = true; scene.add(slab); LV.solids.push({ x1: x - 0.7, x2: x + 0.7, y1: 0, y2: 0.45, z1: z - 0.55, z2: z + 0.55 }); }
  const VENTS = [];
  [[372, 0], [377, 50], [382, 100], [397, 25], [402, 75], [407, 125]].forEach(([z, phz]) => [-2.2, 0, 2.2].forEach((x, xi) => VENTS.push({ x, z, ph: (phz + xi * 50) % 150 })));
  const puffMat = new THREE.SpriteMaterial({ map: T.puff, color: '#c9d2dc', transparent: true, depthWrite: false });
  for (const v of VENTS) { K.box(1.25, 0.04, 1.25, MAT.grate, v.x, 0.02, v.z, 1.25, 0, false); v.puffs = Array.from({ length: 7 }, () => { const s = new THREE.Sprite(puffMat.clone()); s.visible = false; scene.add(s); return s; }); }
  LV.hazards.push({
    update(F, p) { for (const v of VENTS) { v.c = (F + v.ph) % 150; v.on = v.c > 92; if (v.c === 93 && Math.abs(p.z - v.z) < 7 && v.x === 0) sfx('steam', 0.5 * (1 - Math.abs(p.z - v.z) / 7)); if (v.on && Math.abs(p.x - v.x) < 0.72 && Math.abs(p.z - v.z) < 0.72 && p.y < 2.8) G.hurt(0, -0.2); } },
    draw(F, p) { for (const v of VENTS) v.puffs.forEach((s, k) => { const life = ((v.c - 92) / 58 + k / 7) % 1; const vis = Math.abs(v.z - p.z) < 26; if (v.on && vis) { s.visible = true; s.position.set(v.x + Math.sin(k * 3 + F * 0.05) * 0.15, 0.2 + life * 3.2, v.z); s.scale.setScalar(0.6 + life * 1.8); s.material.opacity = 0.8 * (1 - life); } else if (!v.on && v.c > 72 && k === 0 && vis) { s.visible = true; s.position.set(v.x, 0.25, v.z); s.scale.setScalar(0.45); s.material.opacity = 0.5; } else s.visible = false; }); }
  });
  G.tapeLine(0, 367, 0, 370, 3); G.tapeLine(-1.1, 374.5, -1.1, 379.5, 3); G.tapeLine(1.1, 386.5, 1.1, 392, 3); G.tapeLine(-1.1, 399.5, -1.1, 404.5, 3); G.tapeLine(0, 411, 0, 416, 4);

  /* ---------- 13) ENDSPURT + AUFZUG ---------- */
  K.sign('HALLE 5 ↑', 'Lastenaufzug zur Bühne', '#19a24a', 0, 4.6, 421, Math.PI, 3.2);
  forklift(433, 0.075, 0, -2.4, 2.4);
  for (let z = 438; z < 450; z += 2) G.tape(0, 0, z);
  const EZ = 452.2;
  for (const s of [-1, 1]) K.solid(s > 0 ? 1.25 : -4, s > 0 ? 4 : -1.25, 0, 6, EZ - 0.2, EZ + 0.2, MAT.steel, { tile: 2 });
  K.solid(-1.25, 1.25, 3.0, 6, EZ - 0.2, EZ + 0.2, MAT.steel, { tile: 2 });
  K.solid(-1.4, 1.4, 0, 3.4, 455.6, 455.9, MAT.steel, { tile: 2 }); K.solid(-1.6, -1.3, 0, 3.4, EZ, 455.6, MAT.steel, { tile: 2 }); K.solid(1.3, 1.6, 0, 3.4, EZ, 455.6, MAT.steel, { tile: 2 });
  K.box(2.8, 0.1, 3.5, MAT.glowWarm, 0, 3.35, 454, 0, 0, false); K.light(0, 2.8, 454, '#ffd9a0', 12, 7);
  K.box(2.6, 0.06, 0.06, MAT.chrome, 0, 1.0, 455.5, 0, 0, false);
  const ind = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.35), new THREE.MeshBasicMaterial({ map: labelTex('▲ 5', 'BÜHNE', '#111', '#6aff8a'), color: new THREE.Color(1.5, 1.5, 1.5) })); ind.position.set(0, 3.35, EZ - 0.21); ind.rotation.y = Math.PI; scene.add(ind);
  const doors = [-1, 1].map(s => { const d = new THREE.Mesh(boxGeo(1.25, 3.0, 0.08, 1.5), MAT.steel); d.position.set(s * 0.625, 1.5, EZ - 0.05); d.castShadow = true; scene.add(d); return d; });
  let doorOpen = 0, doorShut = false;
  LV.goal = p => p.z > 453.6 && Math.abs(p.x) < 1.1;
  A.push(() => doors.forEach((d, i) => d.position.x = (i ? 1 : -1) * (0.625 + doorOpen * 1.2)));
  LV.update = (F, p) => {
    const want = doorShut ? 0 : (p.z > 443 ? 1 : 0), prev = doorOpen; doorOpen = clamp(doorOpen + (want ? 0.03 : -0.04), 0, 1);
    if (prev === 0 && doorOpen > 0) sfx('ding', 0.8);
    if (p.won && !doorShut) { doorShut = true; sfx('door', 0.8); }
    const ds = LV.solids.find(s => s.door); if (ds) ds.y1 = doorOpen > 0.85 ? 99 : 0;
  };
  LV.solids.push({ x1: -1.25, x2: 1.25, y1: 0, y2: 3.0, z1: EZ - 0.12, z2: EZ + 0.02, door: true });
  LV.onRespawn = () => { };
  LV.transition = 'elevator';
  LV.camera = p => p.won ? { pos: new THREE.Vector3(0, 1.85, 448.4), look: new THREE.Vector3(0, 1.25, 455) } : null;
  LV.draw = (F, RF, p) => { for (const a of A) a(F, RF, p); for (const l of LV.lights) if (l.follow) { l.x = l.follow.x; l.z = l.follow.z; } };
}

// hin und her mit Pause (Frames)
function pingpongF(t, a, b, spd, pause) {
  const L = Math.abs(b - a) / spd, per = 2 * (L + pause), u = ((t % per) + per) % per;
  if (u < pause) return a; if (u < pause + L) return a + (b - a) * (u - pause) / L;
  if (u < 2 * pause + L) return b; return b + (a - b) * (u - 2 * pause - L) / L;
}
