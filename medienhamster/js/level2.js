/* LEVEL 2 – MAINSTAGE
   Backstage (Case-Verkehr) → Treppe → Bühne (Cases rollen entgegen) → Podeste mit Backline → Kettenzug-Lift → Traverse: BOSS „Der Rigger“ */
import { THREE, scene, boxGeo, mat4, rnd, lerp, clamp, tubeBetween } from './core.js?v=10';
import { MAT, T, caseParts, palletParts, buildCrew, buildRigger, resetPose, walkPose, buildShackle, buildHookBlock, chainMesh, buildHoist, glowMat, beamMat, labelTex, trussGeo, towerGeo, signTex } from './models.js?v=10';
import { sfx, setMusic, jingle } from './audio.js?v=10';
import { makeKit } from './kit.js?v=10';

export function level2(G, LV) {
  const K = makeKit(G, LV), P = G.P, A = K.anims;
  const W = 7, DECK = 1.6, TZ = 64, TY = 8.6, WZ1 = TZ - 1.2, WZ2 = TZ + 1.2;
  Object.assign(LV, {
    name: 'MAINSTAGE', music: 'stage', fog: ['#07060b', 18, 72], hemi: ['#8790c4', '#1c1622', 0.7], sun: ['#dfe6ff', 1.0], envInt: 0.45,
    z1: -5.9, z2: 69.4, deathY: -5, winText: 'Der Rigger gibt auf – die Traverse gehört dir!', noCpHeal: false
  });
  LV.bx = () => W; LV.ceil = z => z < 22 ? 6.8 : 40;
  const solid = (x1, x2, y1, y2, z1, z2, mat, o) => K.solid(x1, x2, y1, y2, z1, z2, mat, o);

  /* ---------- Backstage ---------- */
  solid(-W - 0.3, W + 0.3, -6, 0, -6.6, 22, MAT.floor, { tile: 4 });
  for (const s of [-1, 1]) K.box(0.3, 7, 26, MAT.wall, s * (W + 0.15), 3.5, 9.5, 14, 0, false, 7);
  for (const s of [-1, 1]) K.box(W - 1.4, 7, 0.3, MAT.wall, s * (W + 1.4) / 2, 3.5, -3.6, 14, 0, false, 7);
  K.box(2.8, 3.8, 0.3, MAT.wall, 0, 5.1, -3.6, 2.8, 0, false, 3.8); K.box(W * 2 + 0.6, 0.3, 26, MAT.ceil, 0, 7.15, 9.5, 3, 0, false);
  // Aufzug (Ankunft aus Level 1)
  for (const s of [-1, 1]) { K.solid(s > 0 ? 1.3 : -1.6, s > 0 ? 1.6 : -1.3, 0, 3.3, -6.4, -3.5, MAT.steel, { tile: 2 }); K.box(0.16, 3.3, 0.14, MAT.chrome, s * 1.33, 1.65, -3.38, 0, 0, false); }
  K.solid(-1.6, 1.6, 0, 3.3, -6.7, -6.4, MAT.steel, { tile: 2 }); K.box(2.9, 0.1, 2.9, MAT.glowWarm, 0, 3.25, -5.0, 0, 0, false); K.box(3.0, 0.14, 0.14, MAT.chrome, 0, 3.28, -3.38, 0, 0, false);
  K.box(2.6, 0.06, 0.06, MAT.chrome, 0, 1.0, -6.35, 0, 0, false); K.light(0, 2.7, -5.0, '#ffd9a0', 10, 6);
  K.sign('BÜHNE', 'Aufzug · Ebene 0', '#139a48', 0, 3.75, -3.43, 0, 1.6, null, true);
  const eDoors = [-1, 1].map(s => { const d = new THREE.Mesh(boxGeo(1.3, 3.2, 0.08, 1.5), MAT.steel); d.position.set(s * 0.65, 1.6, -3.4); d.castShadow = true; scene.add(d); return [d, s]; });
  const eDoorSolid = { x1: -1.3, x2: 1.3, y1: 0, y2: 3.2, z1: -3.48, z2: -3.32 }; LV.solids.push(eDoorSolid);
  let eOpen = 0;
  A.push(() => eDoors.forEach(([d, s]) => d.position.x = s * (0.65 + eOpen * 1.3)));
  LV.intro = { lock: 48, walk: 128 };
  for (let z = 2; z < 22; z += 6) K.neon(0, 6.85, z, { flicker: z === 14 });
  K.sign('MAINSTAGE ›', 'Nur Crew & Künstler', '#8e44ff', -W + 0.03, 2.8, 5, Math.PI / 2, 3);
  K.sign('BACKSTAGE', 'Achtung Case-Verkehr!', '#c0392b', W - 0.03, 2.8, 4, -Math.PI / 2, 3);
  for (const [x, z] of [[-6.1, 1], [6.1, 9.5], [-6.1, 15.5], [6.1, 20]]) { K.parts(palletParts(), x, 0, z, Math.PI / 2); K.caseAt(x, z, 1.1, 1.0, 1.1, { y: 0.145, solid: false }); K.caseAt(x, z, 0.9, 0.8, 0.9, { y: 1.145, solid: false, blue: true }); LV.solids.push({ x1: x - 0.6, x2: x + 0.6, y1: 0, y2: 1.95, z1: z - 0.6, z2: z + 0.6 }); }
  G.tapeLine(0, 2.5, 0, 5, 3);
  // Treppe + Bühnendeck
  for (let i = 0; i < 4; i++) solid(-3, 3, 0, 0.4 * (i + 1), 22 + i, 26, MAT.black);
  for (const s of [-1, 1]) { K.box(0.08, 1.0, 4.2, MAT.alu, s * 3.05, 1.3, 24, 0, 0, false); solid(s > 0 ? 3 : -W, s > 0 ? W : -3, 0, DECK, 21.9, 26, MAT.black); }
  solid(-W, W, 0, DECK, 26, 70, null);
  { const m = MAT.stage.clone(); m.map = T.stage.clone(); m.map.repeat.set(5, 16); m.map.needsUpdate = true; const d = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, 44), m); d.rotation.x = -Math.PI / 2; d.position.set(0, DECK, 48); d.receiveShadow = true; scene.add(d); }
  K.box(W * 2, DECK, 0.1, MAT.black, 0, DECK / 2, 70, 0, 0, false); K.box(W * 2, 0.04, 0.12, MAT.glowPurple, 0, DECK + 0.02, 69.9, 0, 0, false);
  { const m = MAT.curtain.clone(); m.map = T.curtain.clone(); m.map.repeat.set(10, 1); m.map.needsUpdate = true; for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(46, 13), m); c.position.set(s * W, DECK + 6.5, 48); c.rotation.y = -s * Math.PI / 2; scene.add(c); } }
  G.tapeLine(0, 22.5, 0, 25.5, 3, 0.4);
  // Backline-Requisiten (Deko)
  const drumMat = new THREE.MeshPhysicalMaterial({ color: '#7a1020', roughness: 0.3, clearcoat: 1 }), skin = MAT.white, gold = new THREE.MeshStandardMaterial({ color: '#d4a640', metalness: 0.9, roughness: 0.3 });
  // Podeste
  solid(-6, -2, DECK, 2.4, 50, 53, MAT.laminate); solid(-1.2, 2.8, DECK, 3.2, 53.5, 56.5, MAT.laminate); solid(3.4, W, DECK, 4.0, 57, 60.6, MAT.laminate);
  for (const [x1, x2, z1, z2, y] of [[-6, -2, 50, 53, 2.4], [-1.2, 2.8, 53.5, 56.5, 3.2], [3.4, W, 57, 60.6, 4.0]]) K.box(x2 - x1, 0.03, 0.12, MAT.glowPurple, (x1 + x2) / 2, y - 0.1, z1 - 0.01, 0, 0, false);
  // Schlagzeug auf Podest B
  { const x = 0.8, z = 55.4, y = 3.2;
    K.geo(new THREE.CylinderGeometry(0.42, 0.42, 0.5, 24), drumMat, mat4(x, y + 0.42, z - 0.4, Math.PI / 2, 0, 0)); K.geo(new THREE.CircleGeometry(0.4, 24), skin, mat4(x, y + 0.42, z - 0.66, 0, Math.PI, 0));
    for (const [dx, dy, r] of [[-0.45, 0.85, 0.2], [0.45, 0.85, 0.2], [0.9, 0.55, 0.26], [-0.8, 0.6, 0.18]]) { K.geo(new THREE.CylinderGeometry(r, r, 0.25, 18), drumMat, mat4(x + dx, y + dy, z - 0.2, 0.4, 0, 0)); }
    for (const [dx, h] of [[-1.1, 1.3], [1.2, 1.45], [0.2, 1.55]]) { K.geo(new THREE.CylinderGeometry(0.015, 0.015, h, 6), MAT.chrome, mat4(x + dx, y + h / 2, z)); K.geo(new THREE.CylinderGeometry(0.34, 0.34, 0.012, 24), gold, mat4(x + dx, y + h, z, 0.15, 0, 0)); }
    LV.solids.push({ x1: x - 1.2, x2: x + 1.3, y1: y, y2: y + 0.9, z1: z - 0.7, z2: z + 0.5 });
    G.tape(-0.6, 3.2, 54.2); G.tape(2.2, 3.2, 54.2);
  }
  // Gitarren-Amps auf Podest A
  for (const x of [-5.3, -4.3, -3.3]) { K.box(0.85, 0.7, 0.4, MAT.black, x, 2.4 + 0.35, 52.6, 0, 0, true); K.geo(new THREE.PlaneGeometry(0.75, 0.55), MAT.grille, mat4(x, 2.75, 52.39, 0, Math.PI, 0)); K.box(0.85, 0.7, 0.4, MAT.black, x, 2.4 + 1.05, 52.6, 0, 0, true); }
  LV.solids.push({ x1: -5.8, x2: -2.8, y1: 2.4, y2: 3.8, z1: 52.4, z2: 52.8, noCam: true });
  G.tapeLine(-5, 51.4, -2.8, 51.4, 3, 2.4);
  // Monitorboxen + Mikros an der Bühnenkante
  for (const x of [-4.5, -1.5, 1.5, 4.5]) { K.box(0.9, 0.4, 0.55, MAT.black, x, DECK + 0.2, 68.4, 0, -0.5, true); K.geo(new THREE.PlaneGeometry(0.8, 0.3), MAT.grille, mat4(x, DECK + 0.22, 68.1, -0.5, Math.PI, 0)); K.geo(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 6), MAT.black, mat4(x + 0.6, DECK + 0.75, 67.6)); K.geo(new THREE.SphereGeometry(0.04, 10, 8), MAT.chrome, mat4(x + 0.6, DECK + 1.52, 67.6)); }
  for (const x of [-4.5, -1.5, 1.5, 4.5]) LV.solids.push({ x1: x - 0.45, x2: x + 0.45, y1: DECK, y2: DECK + 0.45, z1: 68.1, z2: 68.7 });
  // Kabel auf der Bühne
  for (let i = 0; i < 8; i++) { const pts = []; let x = (rnd() - 0.5) * 12; for (let z = 28; z < 68; z += 4) { x = clamp(x + (rnd() - 0.5) * 2, -6.5, 6.5); pts.push(new THREE.Vector3(x, DECK + 0.03, z)); } K.geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.025, 5), MAT.black, null, false); }

  /* ---------- Publikum ---------- */
  {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(70, 40), new THREE.MeshStandardMaterial({ color: '#0b0a0e', roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, -0.6, 92); scene.add(fl);
    K.box(W * 2 + 6, 1.1, 0.15, MAT.alu, 0, -0.05, 72.5, 0, 0, false);
    const N = 340, crowd = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.24, 0.62, 3, 8), new THREE.MeshStandardMaterial({ color: '#1d1b26', roughness: 1 }), N);
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshStandardMaterial({ color: '#2a2530', roughness: 1 }), N);
    const phones = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.1, 0.17), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 2.3, 2.6) }), 60);
    const C = []; for (let i = 0; i < N; i++) C.push({ x: (rnd() - 0.5) * 38, z: 74 + rnd() * 24, ph: rnd() * 7, s: 0.9 + rnd() * 0.3 });
    for (const im of [crowd, heads, phones]) { im.frustumCulled = false; scene.add(im); }
    const mx = new THREE.Matrix4();
    A.push((F) => {
      const hype = boss.st === 'defeat' ? 0.6 : 0.3;
      C.forEach((c, i) => { const j = Math.max(0, Math.sin(F * 0.16 + c.ph)) * hype; mx.makeScale(c.s, c.s, c.s).setPosition(c.x, 0.1 + j, c.z); crowd.setMatrixAt(i, mx); mx.setPosition(c.x, 0.1 + j + 0.62 * c.s, c.z); heads.setMatrixAt(i, mx); if (i < 60) { mx.makeRotationY(Math.PI).setPosition(c.x + 0.25, 1.4 + j + 0.4 * Math.sin(F * 0.05 + c.ph), c.z - 0.3); phones.setMatrixAt(i, mx); } });
      crowd.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = phones.instanceMatrix.needsUpdate = true;
    });
  }

  /* ---------- Traversen + Laufsteg (Boss-Arena) ---------- */
  const trussM = new THREE.Mesh(trussGeo(-W + 0.4, W - 0.4, TY - 0.3, TZ - 0.9, 0.6), MAT.alu); trussM.castShadow = true; scene.add(trussM);
  const trussM2 = new THREE.Mesh(trussGeo(-W + 0.4, W - 0.4, TY - 0.3, TZ + 0.9, 0.6), MAT.alu); trussM2.castShadow = true; scene.add(trussM2);
  for (const s of [-1, 1]) for (const dz of [-0.9, 0.9]) { const t = new THREE.Mesh(towerGeo(s * (W - 0.1), TZ + dz, TY + 0.3), MAT.alu); t.castShadow = true; scene.add(t); }
  const lightTruss = new THREE.Mesh(trussGeo(-W + 0.4, W - 0.4, 9.6, 38, 0.6), MAT.alu); scene.add(lightTruss);
  for (const s of [-1, 1]) scene.add(new THREE.Mesh(towerGeo(s * (W - 0.1), 38, 9.9), MAT.alu));
  solid(-6.5, 6.5, TY - 0.6, TY, WZ1, WZ2, null);
  const walkMat = MAT.grate.clone(); walkMat.metalness = 0.2; walkMat.roughness = 0.8;
  K.box(13, 0.06, 2.4, walkMat, 0, TY + 0.03, TZ, 1.2, 0, true); for (const z of [WZ1 + 0.05, WZ2 - 0.05]) K.box(13, 0.07, 0.1, MAT.hazard, 0, TY + 0.06, z, 0.5, 0, false);
  for (const s of [-1, 1]) solid(s > 0 ? 6.5 : -W, s > 0 ? W : -6.5, TY - 0.6, TY + 3, WZ1, WZ2, null);
  const roof = new THREE.Mesh(trussGeo(-W, W, TY + 9.5, TZ, 0.9), MAT.darkMetal); scene.add(roof);
  for (const x of [-5, -2, 2, 5]) { const h = buildHoist(); h.position.set(x, TY + 8.7, TZ - 0.9); scene.add(h); const c = chainMesh(8.4); c.position.set(x, TY + 8.5, TZ - 0.9); scene.add(c); }
  { const bt = signTex('BACKSTAGE BRAWL', 'LIVE · MAINSTAGE', '#2a0f55', '#fff', null, 1200); const ban = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.2), new THREE.MeshStandardMaterial({ map: bt, roughness: 0.6, emissive: '#ffffff', emissiveMap: bt, emissiveIntensity: 0.3 })); ban.position.set(0, TY - 1.35, WZ1 - 0.25); ban.rotation.y = Math.PI; scene.add(ban); }

  /* ---------- Kettenzug-Lift ---------- */
  const liftG = new THREE.Group(); scene.add(liftG);
  const lp = caseParts(2.6, 0.3, 2.2, { label: 5 }); liftG.add(lp.toGroup()); { const st = new THREE.Mesh(boxGeo(2.6, 0.02, 0.12), MAT.hazard); st.position.set(0, 0.31, 1.04); liftG.add(st); }
  const liftChains = [-1, 1].map(s => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), MAT.chrome); scene.add(c); return [c, s]; });
  { const h = buildHoist(); h.position.set(5.2, 12.2, 61.6); scene.add(h); K.box(0.15, 0.15, 6, MAT.pipe, 5.2, 12.5, 62, 0, 0, false); }
  let liftLock = false;
  const lift = { w: 2.6, h: 0.3, d: 2.2, x: 5.2, z: 61.6, hurts: false, mesh: liftG,
    pos: F => [5.2, liftLock ? 3.7 : pingpong(F, 3.7, TY - 0.3, 0.032, 85), 61.6],
    draw: () => { if (lift.y === undefined) return; for (const [c, s] of liftChains) { const top = 12.0, bot = lift.y + 0.3; c.position.set(5.2 + s * 1.1, (top + bot) / 2, 61.6); c.scale.y = top - bot; } } };
  LV.movers.push(lift);
  K.beacon(6.6, 4.3, 60.2, 'amber', { active: () => !liftLock });

  /* ---------- Case-Verkehr mit Stagehands ---------- */
  const caseMover = (w, h, d, pos, i) => {
    const grp = caseParts(w, h, d, { wheels: true, label: i % 7, blue: i % 3 === 0 }).toGroup(), crew = buildCrew(i);
    scene.add(grp, crew);
    const J = crew.userData.J; let ph = 0;
    const m = { w, h, d, hurts: true, mesh: grp, pos, draw: (F) => {
      if (m.x === undefined) return;
      const sp = Math.hypot(m.dx || 0, m.dz || 0); if (sp > 0.003) m.dir = Math.atan2(m.dx, m.dz);
      const dir = m.dir || 0, back = (Math.abs(Math.sin(dir)) * w + Math.abs(Math.cos(dir)) * d) / 2 + 0.28;
      crew.visible = m.active !== false; crew.position.set(m.x - Math.sin(dir) * back, m.y, m.z - Math.cos(dir) * back); crew.rotation.y = dir;
      resetPose(J); if (sp > 0.003) { ph += sp * 9; walkPose(J, ph, 0.9); } J.spine.rotation.x = 0.35; J.shL.rotation.x = J.shR.rotation.x = -1.25; J.elL.rotation.x = J.elR.rotation.x = -0.3;
    } };
    LV.movers.push(m); return m;
  };
  [[7, 0.05, 0], [12.5, 0.068, 140], [18, 0.058, 60]].forEach(([z, v, ph], i) => caseMover(1.6, 1.3, 1.4, F => [pingpong(F + ph, -5.0, 5.0, v, 30), 0, z], i));
  [[-4.6, 0], [-1.6, 120], [1.6, 60], [4.6, 180]].forEach(([x, ph], i) => caseMover(1.5, 1.3, 1.5, F => { const u = (F * 0.072 + ph * 0.5 + x * 3 + 40) % 22.5; return [x, DECK, 49 - u]; }, i + 3));
  caseMover(1.6, 1.3, 1.4, F => [pingpong(F + 30, 5.2, -5.2, 0.075, 25), DECK, 42], 9);
  G.tapeLine(-2.8, 30, -2.8, 46, 5, DECK); G.tapeLine(3, 32, 3, 44, 4, DECK);
  G.snack(-4, DECK, 48.5);

  /* ---------- Checkpoints ---------- */
  LV.cps = [
    { x: 0, y: 0, z: -5.0, at: () => true },
    { x: 0, y: DECK, z: 27.6, at: p => p.z > 27 && p.y > 1, px: 3.6 },
    { x: 5.2, y: 4.0, z: 59.2, at: p => p.z > 57.2 && p.y > 3.8, px: 6.4 },
    { x: 4.6, y: TY, z: TZ, at: p => p.y > TY - 0.15 && p.z > WZ1 - 0.1, noPost: true, face: -Math.PI / 2 }
  ];
  LV.fall = p => P.cp >= 3 && p.y < TY - 2.6;

  /* ---------- Bühnenlicht ---------- */
  const beams = [], bm = ['#a45cff', '#2bd1ff', '#ff3ea5'].map(c => beamMat(c, 0.1));
  [-5, -3, -1, 1, 3, 5].forEach((x, i) => {
    const g = new THREE.Group(); g.position.set(x, 9.1, 38); scene.add(g);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.35), MAT.black));
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14), [MAT.glowPurple, MAT.glowBlue, MAT.glowRed][i % 3]); lens.rotation.x = Math.PI / 2; lens.position.y = -0.21; g.add(lens);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 1.7, 9, 22, 1, true), bm[i % 3]); cone.position.y = -4.6; g.add(cone);
    beams.push({ g, i });
  });
  const spots = [['#a45cff', -3], ['#2bd1ff', 3]].map(([c, x]) => { const s = new THREE.SpotLight(c, 160, 28, 0.5, 0.6, 1.2); s.position.set(x, 9, 38); scene.add(s, s.target); return s; });
  const front = new THREE.SpotLight('#ffe7c4', 140, 45, 0.7, 0.5, 1); front.position.set(0, 14, 92); front.target.position.set(0, 4, 58); scene.add(front, front.target);
  const follow = new THREE.SpotLight('#fff4e0', 0, 40, 0.16, 0.4, 1); follow.position.set(0, 18, 95); scene.add(follow, follow.target);
  A.push((F) => {
    beams.forEach(({ g, i }) => { g.rotation.z = Math.sin(F * 0.02 + i) * 0.5; g.rotation.x = Math.cos(F * 0.017 + i * 1.7) * 0.4; });
    spots.forEach((s, i) => s.target.position.set(Math.sin(F * 0.015 + i * 3) * 5, DECK, 44 + Math.cos(F * 0.012 + i) * 8));
    follow.intensity = boss.st !== 'wait' ? 38 : 0; follow.target.position.set(P.x, P.y + 0.5, P.z);
  });

  /* =====================================================================
     BOSS: DER RIGGER
     ===================================================================== */
  const rig = buildRigger(); rig.scale.setScalar(1.18); scene.add(rig);
  const RJ = rig.userData.J;
  const boss = { x: -5.4, z: TZ, y: TY, hp: 3, st: 'wait', t: 0, side: -1, k: 0, seq: 0, n: 0, flash: 0, ry: Math.PI / 2 };
  LV.boss = boss;
  LV._test = () => ({ shackles, hooks: hookPool });
  const shackles = [], hooks = [];
  const starG = new THREE.Group(); scene.add(starG); starG.visible = false;
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), MAT.glowAmber); s.position.set(Math.cos(i * Math.PI / 2) * 0.38, 0, Math.sin(i * Math.PI / 2) * 0.38); starG.add(s); }
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 24), MAT.rope); coil.rotation.x = Math.PI / 2; scene.add(coil); coil.visible = false;
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), MAT.rope); scene.add(rope); rope.visible = false;
  const anchor = new THREE.Vector3(0, TY + 9.3, TZ);
  const headObj = new THREE.Object3D(); RJ.head.add(headObj);
  const lines = { hit: ['AUA! Mein Helm!', 'Hey! Das gibt ’ne Abmahnung!', 'Na warte, du Fellknäuel …'], start: 'Ey! Wer hat DICH auf meine Traverse gelassen?!', start2: 'Runter da, Nager! Hier wird gearbeitet!', retry: 'Na? Noch einer? Komm her!', hooks: 'Achtung, LAST!!', swing: 'Jiiiihaaaa!', tangled: 'Moment … mein Seil …', recover: ['Jetzt reicht’s!', 'Ich hab 40 Kettenzüge, Freundchen!'], defeat: 'Okay, okay!! Du darfst bleiben …' };
  const say = (txt, f = 130) => G.say(txt, headObj, f, 150, 0.55);
  const hookPool = Array.from({ length: 6 }, () => {
    const g = new THREE.Group(), hb = buildHookBlock(); hb.scale.setScalar(2.2); g.add(hb);
    const wgt = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.55, 18), MAT.hookYellow); wgt.position.y = -1.0; wgt.castShadow = true; g.add(wgt);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.12, 18), MAT.black); band.position.y = -1.0; g.add(band);
    const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 12, 6), MAT.chrome); ch.position.y = 6; g.add(ch);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: T.ring, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(2, 1, 1) }));
    ring.rotation.x = -Math.PI / 2; scene.add(ring); ring.visible = false; scene.add(g); g.visible = false;
    return { g, ring, on: false };
  });
  const shackleGeo = buildShackle();

  function startCycle() { boss.st = 'throw'; boss.t = 0; boss.n = 0; boss.k = 3 - boss.hp; }
  function resetBoss() {
    Object.assign(boss, { x: -5.4, z: TZ, y: TY, hp: 3, st: 'retry', t: 0, side: -1, k: 0, flash: 0 });
    for (const s of shackles) scene.remove(s.m); shackles.length = 0; hookPool.forEach(h => { h.on = false; h.g.visible = h.ring.visible = false; });
    rope.visible = coil.visible = starG.visible = false; G.boss(true, 'DER RIGGER', 3, 3);
  }
  LV.onRespawn = (full) => { if (boss.st !== 'wait' && boss.st !== 'defeat' && full) resetBoss(); };

  LV.update = (F, p) => {
    { const prev = eOpen; eOpen = clamp(eOpen + (F > 22 ? 0.025 : 0), 0, 1); if (prev === 0 && eOpen > 0) sfx('ding', 0.9); eDoorSolid.y1 = eOpen > 0.8 ? 99 : 0; }
    boss.t++;
    const playing = G.state === 'play' && !p.dead && !p.won, dir = Math.sign(p.x - boss.x) || 1, k = boss.k;
    const onWalk = p.y > TY - 0.15 && p.z > WZ1 - 0.1;
    switch (boss.st) {
      case 'wait': if (playing && onWalk) { boss.st = 'intro'; boss.t = 0; liftLock = true; jingle('boss'); setTimeout(() => setMusic('boss'), 1600); G.boss(true, 'DER RIGGER', 3, 3); } break;
      case 'intro': if (boss.t === 10) say(lines.start, 110); if (boss.t === 120) say(lines.start2, 90); if (boss.t >= 205) startCycle(); break;
      case 'retry': if (boss.t === 5) say(lines.retry, 80); if (boss.t >= 90) startCycle(); break;
      case 'throw': {
        const n = 3 + k, iv = 50 - 7 * k, rel = 24 - 3 * k;
        if (boss.n < n && boss.t % iv === rel) {
          const s = { m: shackleGeo.clone(), x: boss.x + dir * 0.5, y: TY + 1.4, z: clamp(p.z, WZ1 + 0.3, WZ2 - 0.3), vx: dir * (0.12 + 0.022 * k), vy: 0.05 };
          scene.add(s.m); shackles.push(s); boss.n++; sfx('whoosh', 0.6);
        }
        if (boss.n >= n && boss.t > n * iv + 40) { boss.st = 'hooks'; boss.t = 0; boss.n = 0; }
        break;
      }
      case 'hooks': {
        const n = 3 + k, iv = 44 - 6 * k;
        if (boss.t === 1) say(lines.hooks, 70);
        if (boss.t > 30 && boss.n < n && (boss.t - 30) % iv === 0) { const h = hookPool.find(q => !q.on); if (h) { Object.assign(h, { on: true, t: 0, x: clamp(p.x, -6, 6), z: clamp(p.z, WZ1 + 0.4, WZ2 - 0.4), warn: 46 - 5 * k }); h.g.visible = h.ring.visible = true; } boss.n++; }
        if (boss.n >= n && hookPool.every(h => !h.on)) { boss.st = 'swing'; boss.t = 0; }
        break;
      }
      case 'swing': {
        const prep = 42, dur = 76 - 8 * k, xs = boss.side * 5.4, xe = -xs;
        if (boss.t === 1) say(lines.swing, 70);
        if (boss.t < prep) { boss.y = TY; boss.x = xs; }
        else if (boss.t < prep + dur) { const u = (boss.t - prep) / dur, e = u * u * (3 - 2 * u); boss.x = lerp(xs, xe, e); boss.y = TY + 0.15 + 2.3 * Math.pow(2 * u - 1, 2); if (boss.t === prep + 2) sfx('whoosh', 1); }
        else if (boss.t < prep + dur + 14) { boss.y = lerp(boss.y, TY, 0.3); }
        else { boss.y = TY; boss.side = -boss.side; boss.st = 'tangled'; boss.t = 0; say(lines.tangled, 90); sfx('land', 1); G.burst(boss.x, TY + 0.1, boss.z, 'dust', 10); }
        // Beine treffen beim Durchschwingen
        if (playing && boss.t >= prep && boss.t < prep + dur && Math.abs(p.x - boss.x) < 0.38 + G.R && Math.abs(p.z - boss.z) < 0.45 + G.R && p.y < boss.y + 1.15 && p.y + G.H > boss.y) G.hurt(Math.sign(p.x - boss.x || 1) * 0.3, 0);
        break;
      }
      case 'tangled': {
        if (playing && p.vy < 0 && Math.abs(p.x - boss.x) < 0.62 && Math.abs(p.z - boss.z) < 0.7 && p.y > TY + 0.9 && p.y < TY + 1.85) {
          boss.hp--; boss.st = 'hit'; boss.t = 0; boss.flash = 20; G.bounce(1.15); sfx('stomp'); sfx('bosshit'); G.shake(0.35); G.burst(boss.x, TY + 1.4, boss.z, 'spark', 18);
          G.boss(true, 'DER RIGGER', boss.hp, 3); say(lines.hit[2 - boss.hp] || lines.hit[0], 90);
          if (boss.hp > 0) G.snack(0, TY, TZ);
        } else if (boss.t > 230 - 40 * k) { boss.st = 'recover'; boss.t = 0; say(lines.recover[rnd() * 2 | 0], 80); }
        break;
      }
      case 'hit': if (boss.t >= 85) { if (boss.hp <= 0) { boss.st = 'defeat'; boss.t = 0; say(lines.defeat, 150); } else { boss.st = 'recover'; boss.t = 0; say(lines.recover[(3 - boss.hp) % 2], 80); } } break;
      case 'recover': if (boss.t >= 55) startCycle(); break;
      case 'defeat': {
        if (boss.t > 60) { boss.z = lerp(boss.z, TZ + 1.9, 0.08); boss.y = Math.max(TY - 2.6, boss.y - 0.12); }
        if (boss.t === 75) { sfx('cheer', 1); G.burst(boss.x, TY, TZ + 1, 'confetti', 50); }
        if (boss.t === 200) { G.win('Der Rigger hängt in den Seilen – die Traverse gehört dir!'); G.boss(false); }
        break;
      }
    }
    // Kontaktschaden
    if (playing && ['throw', 'hooks', 'recover', 'intro', 'retry'].includes(boss.st) && Math.abs(p.x - boss.x) < 0.35 + G.R && Math.abs(p.z - boss.z) < 0.35 + G.R && p.y < boss.y + 2.25 && p.y + G.H > boss.y) {
      if (p.vy < 0 && p.y > boss.y + 1.95) { G.bounce(0.9); sfx('bonk'); say('Finger weg vom Helm!', 60); } else G.hurt(Math.sign(p.x - boss.x || 1) * 0.35, 0);
    }
    // Schäkel
    for (let i = shackles.length - 1; i >= 0; i--) {
      const s = shackles[i]; s.vy -= 0.011; s.y += s.vy; s.x += s.vx; if (s.y < TY + 0.14) { s.y = TY + 0.14; s.vy = 0.1; if (Math.abs(p.x - s.x) < 10) sfx('bonk', 0.25); }
      if (Math.abs(s.x) > 7.5 || boss.st === 'defeat') { scene.remove(s.m); shackles.splice(i, 1); continue; }
      if (playing && Math.abs(p.x - s.x) < G.R + 0.17 && Math.abs(p.z - s.z) < G.R + 0.2 && p.y < s.y + 0.15 && p.y + G.H > s.y - 0.12) { G.hurt(Math.sign(s.vx) * 0.3, 0); }
    }
    // fallende Lasten
    for (const h of hookPool) if (h.on) {
      h.t++; const fallT = h.warn;
      if (h.t === fallT) sfx('whoosh', 0.8);
      if (h.t === fallT + 10) { sfx('clank', 1); G.shake(0.3); G.burst(h.x, TY + 0.1, h.z, 'dust', 14); if (playing && Math.abs(p.x - h.x) < 0.8 && Math.abs(p.z - h.z) < 0.8 && p.y < TY + 1.6) G.hurt(Math.sign(p.x - h.x || 1) * 0.3, 0); }
      if (h.t > fallT && h.t < fallT + 10 && playing && Math.abs(p.x - h.x) < 0.7 && Math.abs(p.z - h.z) < 0.7 && p.y < h.y && p.y + G.H > h.y - 1.3) G.hurt(Math.sign(p.x - h.x || 1) * 0.3, 0);
      if (h.t > fallT + 76) { h.on = false; h.g.visible = h.ring.visible = false; }
    }
  };

  LV.camera = (p, F) => {
    if (F < 165 && boss.st === 'wait' && P.cp === 0) {   // Ankunft: Blick auf den Aufzug, dann Schwenk hinter den Hamster
      const u = clamp((F - 92) / 70, 0, 1), e = u * u * (3 - 2 * u), th = e * Math.PI, r = 4.3 - e * 0.4, h = 1.45 + e * 0.7;
      return { pos: new THREE.Vector3(p.x + Math.sin(th) * r * 0.9, p.y + h, p.z + Math.cos(th) * r), look: new THREE.Vector3(p.x * (1 - e * 0.3), p.y + 1.0 - e * 0.15, p.z + e * 3.4), snap: true };
    }
    if (boss.st === 'wait' && !(p.y > TY - 1 && p.z > WZ1 - 1.4)) return null;
    const portrait = innerWidth < innerHeight, mid = clamp((p.x + (boss.st === 'defeat' ? 0 : boss.x)) / 2, -3.2, 3.2);
    return { pos: new THREE.Vector3(mid, TY + (portrait ? 3.4 : 2.5), TZ - (portrait ? 11.5 : 7.4)), look: new THREE.Vector3(mid, TY + 1.0, TZ + 0.6) };
  };
  LV.progress = p => boss.st === 'wait' ? Math.min(1, p.z / 62 * 0.85 + Math.max(0, p.y - 4) / 4.6 * 0.15) : (3 - boss.hp) / 3;

  LV.draw = (F, RF, p) => {
    for (const a of A) a(F, RF, p);
    // Rigger-Pose
    resetPose(RJ); rig.rotation.set(0, 0, 0);
    const k = boss.t, faceP = Math.atan2(p.x - boss.x, (p.z - boss.z) * 0.6 - 1.2);
    let ry = boss.st === 'wait' ? Math.PI : faceP;
    rig.position.set(boss.x, boss.y, boss.z);
    starG.visible = coil.visible = rope.visible = false;
    switch (boss.st) {
      case 'wait': RJ.shL.rotation.x = RJ.shR.rotation.x = -1.4; RJ.elL.rotation.x = RJ.elR.rotation.x = -0.6; RJ.head.rotation.x = 0.25 + Math.sin(RF * 0.05) * 0.1; RJ.spine.rotation.x = 0.15; break;
      case 'intro': case 'retry': RJ.shR.rotation.x = -2.3 + Math.sin(RF * 0.3) * 0.4; RJ.shR.rotation.z = 0.3; RJ.shL.rotation.z = -0.5; RJ.elL.rotation.x = -1.6; RJ.head.rotation.z = Math.sin(RF * 0.15) * 0.1; break;
      case 'throw': { const iv = 50 - 7 * boss.k, rel = 24 - 3 * boss.k, u = (k % iv) / rel; if (u < 1) { RJ.shR.rotation.x = -0.4 - u * 2.4; RJ.spine.rotation.y = -u * 0.5; } else { RJ.shR.rotation.x = 0.9; RJ.spine.rotation.y = 0.3; RJ.spine.rotation.x = 0.2; } RJ.hpL.rotation.x = -0.3; RJ.hpR.rotation.x = 0.3; break; }
      case 'hooks': RJ.shR.rotation.x = -3.0; RJ.shL.rotation.x = -0.4; RJ.head.rotation.x = -0.4; ry = faceP; break;
      case 'swing': {
        const prep = 42; rope.visible = true;
        if (k < prep) { RJ.hip.position.y = 1.0 - Math.min(1, k / prep) * 0.25; RJ.hpL.rotation.x = RJ.hpR.rotation.x = -0.7; RJ.knL.rotation.x = RJ.knR.rotation.x = 1.2; RJ.shL.rotation.x = RJ.shR.rotation.x = -2.9; }
        else { RJ.shL.rotation.x = RJ.shR.rotation.x = -3.0; RJ.hpL.rotation.x = RJ.hpR.rotation.x = -1.2; RJ.knL.rotation.x = RJ.knR.rotation.x = 0.3; RJ.spine.rotation.x = -0.25; }
        ry = boss.side < 0 ? Math.PI / 2 : -Math.PI / 2;
        const hand = new THREE.Vector3(boss.x, boss.y + 2.25, boss.z), d = new THREE.Vector3().subVectors(anchor, hand);
        rope.position.copy(hand).addScaledVector(d, 0.5); rope.scale.y = d.length(); rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
        break;
      }
      case 'tangled': RJ.hip.position.y = 0.42; RJ.hpL.rotation.x = RJ.hpR.rotation.x = -1.45; RJ.knL.rotation.x = RJ.knR.rotation.x = 0.25; RJ.shL.rotation.z = -0.9; RJ.shR.rotation.z = 0.9; RJ.head.rotation.z = Math.sin(RF * 0.12) * 0.25; RJ.spine.rotation.x = 0.2;
        starG.visible = true; RJ.head.getWorldPosition(starG.position); starG.position.y += 0.35; starG.rotation.y = RF * 0.12;
        coil.visible = true; coil.position.set(boss.x, TY + 0.5, boss.z); coil.scale.set(1, 1, 1 + Math.sin(RF * 0.1) * 0.05); break;
      case 'hit': RJ.hip.position.y = 0.42; RJ.hpL.rotation.x = RJ.hpR.rotation.x = -1.45; RJ.shL.rotation.x = RJ.shR.rotation.x = -2.6; RJ.spine.rotation.x = -0.3; RJ.head.rotation.x = -0.3 + Math.sin(RF * 0.6) * 0.2; break;
      case 'recover': RJ.hip.position.y = 0.42 + Math.min(1, k / 40) * 0.58; RJ.shR.rotation.x = -1.2; RJ.shR.rotation.z = 0.5; break;
      case 'defeat': rig.rotation.z = Math.min(Math.PI, k * 0.05); RJ.shL.rotation.x = RJ.shR.rotation.x = -2.8 + Math.sin(RF * 0.2) * 0.3; RJ.hpL.rotation.x = Math.sin(RF * 0.15) * 0.4; ry = 0;
        rope.visible = k > 60; if (rope.visible) { const a = new THREE.Vector3(boss.x, TY, TZ + 1.2), b = new THREE.Vector3(boss.x, boss.y + 0.2, boss.z), d = new THREE.Vector3().subVectors(a, b); rope.position.copy(b).addScaledVector(d, 0.5); rope.scale.y = Math.max(0.01, d.length()); rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }
        if (k > 60) rig.position.y = boss.y + 2.0; break;
    }
    boss.ry = lerpAngle(boss.ry, ry, 0.15); rig.rotation.y = boss.ry;
    if (boss.st === 'throw' || boss.st === 'hooks' || boss.st === 'recover' || boss.st === 'intro') { const sp = Math.sin(RF * 0.1) * 0.03; RJ.spine.rotation.z += sp; }
    if (boss.flash > 0) { boss.flash--; rig.visible = (boss.flash >> 1) % 2 === 0; } else rig.visible = true;
    rig.userData.lamp.material = boss.st === 'tangled' || boss.st === 'hit' ? MAT.lensOff : MAT.glowWarm;
    // Schäkel + Lasten zeichnen
    for (const s of shackles) { s.m.position.set(s.x, s.y, s.z); s.m.rotation.set(RF * 0.3 * Math.sign(s.vx), 0, RF * 0.25); }
    for (const h of hookPool) if (h.on) {
      const fallT = h.warn; let y;
      if (h.t < fallT) y = TY + 9; else if (h.t < fallT + 10) y = lerp(TY + 9, TY + 1.3, (h.t - fallT) / 10); else if (h.t < fallT + 36) y = TY + 1.3; else y = lerp(TY + 1.3, TY + 9, (h.t - fallT - 36) / 40);
      h.y = y - 0.25; h.g.position.set(h.x, y, h.z);
      h.ring.position.set(h.x, TY + 0.08, h.z); h.ring.visible = h.t < fallT + 10; const pulse = 0.8 + 0.2 * Math.sin(RF * 0.4); h.ring.scale.setScalar(pulse * (h.t < fallT ? 1 : 0.7));
    }
  };
}

function pingpong(t, a, b, spd, pause) {
  const L = Math.abs(b - a) / spd, per = 2 * (L + pause), u = ((t % per) + per) % per;
  if (u < pause) return a; if (u < pause + L) return a + (b - a) * (u - pause) / L;
  if (u < 2 * pause + L) return b; return b + (a - b) * (u - 2 * pause - L) / L;
}
function lerpAngle(a, b, t) { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * t; }
