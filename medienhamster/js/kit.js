/* Medienhamster 3D – Baukasten für Level: feste Körper, Gänge, Licht, Schilder, Requisiten */
import { THREE, scene, boxGeo, planeGeo, mat4, rnd, Parts } from './core.js?v=10';
import { MAT, caseParts, signMesh, glowMat, beamMat } from './models.js?v=10';

export function makeKit(G, LV) {
  const B = G.batch, anims = [];
  LV.anims = anims;
  const K = {
    anims,
    // fester Körper (Kollision) + optional sichtbar
    solid(x1, x2, y1, y2, z1, z2, mat = null, o = {}) {
      const s = Object.assign({ x1, x2, y1, y2, z1, z2 }, o.extra || {}); LV.solids.push(s);
      if (mat) B.box(x2 - x1, y2 - y1, z2 - z1, mat, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, o.tile || 0, 0, o.shadow !== false, o.tileV || 0);
      return s;
    },
    box(w, h, d, mat, x, y, z, tile = 0, ry = 0, shadow = true, tileV = 0) { B.box(w, h, d, mat, x, y, z, tile, ry, shadow, tileV); },
    geo(geo, mat, m, shadow = true) { B.add(geo, mat, m, shadow); },
    parts(P, x, y, z, ry = 0, s = 1) { P.into(B, mat4(x, y, z, 0, ry, 0, s, s, s)); },
    caseAt(x, z, w, h, d, o = {}) {
      const y0 = o.y || 0; K.parts(caseParts(w, h, d, o), x, y0, z, o.ry || 0);
      const sw = o.ry ? d : w, sd = o.ry ? w : d;
      if (o.solid !== false) LV.solids.push({ x1: x - sw / 2, x2: x + sw / 2, z1: z - sd / 2, z2: z + sd / 2, y1: y0, y2: y0 + h });
    },
    sign(text, sub, bg, x, y, z, ry = 0, w = 2.4, icon = null, glow = false) { const m = signMesh(text, sub, bg, w, icon, glow); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; },
    light(x, y, z, color, int = 8, dist = 10, extra = {}) { const l = Object.assign({ x, y, z, color: new THREE.Color(color), int, dist }, extra); LV.lights.push(l); return l; },
    // Neonröhre unter der Decke (flackernd optional)
    neon(x, y, z, o = {}) {
      const len = o.len || 2.2;
      B.box(0.34, 0.1, len + 0.1, MAT.alu, x, y + 0.08, z, 0, 0, false);
      if (o.off) { B.box(0.12, 0.08, len, MAT.neonOff, x, y, z, 0, 0, false); return; }
      if (o.flicker) {
        const m = new THREE.Mesh(boxGeo(0.12, 0.08, len), MAT.neon); m.position.set(x, y, z); scene.add(m);
        const seed = rnd() * 100, on = F => !((Math.sin(F * 0.37 + seed) > 0.75) || ((F + seed * 10) % 173) < 9);
        anims.push(F => { m.material = on(F) ? MAT.neon : MAT.neonOff; });
        K.light(x, y - 0.4, z, o.color || '#e3ecff', o.int || 7, o.dist || 10, { flick: F => on(F) ? 1 : 0.05 });
      } else { B.box(0.12, 0.08, len, MAT.neon, x, y, z, 0, 0, false); K.light(x, y - 0.4, z, o.color || '#e3ecff', o.int || 7, o.dist || 10); }
    },
    // Rundumleuchte (Warnlicht) mit drehendem Lichtkegel
    beacon(x, y, z, col = 'amber', o = {}) {
      const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
      const glow = col === 'red' ? MAT.glowRed : col === 'blue' ? MAT.glowBlue : MAT.glowAmber;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.08, 14), MAT.black); g.add(base);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), glow); dome.position.y = 0.04; g.add(dome);
      const spin = new THREE.Group(); spin.position.y = 0.09; g.add(spin);
      const hex = col === 'red' ? '#ff2a1a' : col === 'blue' ? '#3a8aff' : '#ffaa1a';
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.6, 16, 1, true), beamMat(hex, 0.07)); cone.rotation.z = Math.PI / 2; cone.position.x = 1.3; spin.add(cone);
      const active = o.active || (() => true);
      anims.push((F, RF) => { const on = active(F); spin.visible = on; dome.material = on ? glow : MAT.lensOff; spin.rotation.y = RF * 0.12; });
      K.light(x, y + 0.3, z, hex, o.int || 6, o.dist || 7, { flick: F => active(F) ? 0.55 + 0.45 * Math.abs(Math.sin(F * 0.12)) : 0 });
      if (o.mount !== false) B.box(0.06, 0.25, 0.06, MAT.black, x, y - 0.14, z, 0, 0, false);
      return g;
    },
    // Rohrleitung entlang z an Wand/Decke
    pipeZ(x, y, z1, z2, r, mat) { B.add(new THREE.CylinderGeometry(r, r, z2 - z1, 12), mat, mat4(x, y, (z1 + z2) / 2, Math.PI / 2, 0, 0)); for (let z = z1 + 2; z < z2; z += 4) B.add(new THREE.CylinderGeometry(r * 1.3, r * 1.3, 0.08, 12), MAT.darkMetal, mat4(x, y, z, Math.PI / 2, 0, 0)); },
    // Gang-Abschnitte mit Wänden, Decke, Boden (Gruben ausgespart)
    corridor(SEG, PITS) {
      const W = z => { for (const s of SEG) if (z >= s[0] && z < s[1]) return s[2]; return SEG[SEG.length - 1][2]; };
      const Hc = z => { for (const s of SEG) if (z >= s[0] && z < s[1]) return s[3]; return SEG[SEG.length - 1][3]; };
      LV.bx = z => W(z); LV.ceil = z => Hc(z);
      SEG.forEach(([z1, z2, w, h], i) => {
        const len = z2 - z1, zc = (z1 + z2) / 2;
        for (const s of [-1, 1]) B.box(0.3, h, len, MAT.wall, s * (w + 0.15), h / 2, zc, 2 * h, 0, false, h);
        B.box(w * 2 + 0.6, 0.3, len, MAT.ceil, 0, h + 0.15, zc, 3, 0, false);
        // Boden (mit Grubenlücken)
        let z = z1; const cuts = PITS.filter(p => p[1] > z1 && p[0] < z2).map(p => [Math.max(p[0], z1), Math.min(p[1], z2)]).sort((a, b) => a[0] - b[0]);
        for (const [a, b] of [...cuts, [z2, z2]]) { if (a > z) K.solid(-w - 0.3, w + 0.3, -8, 0, z, a, MAT.floor, { tile: 4 }); z = Math.max(z, b); }
        // Deckenträger
        for (let zz = Math.ceil(z1 / 6) * 6; zz < z2; zz += 6) B.box(w * 2, 0.4, 0.35, MAT.concrete, 0, h - 0.2, zz, 2, 0, false);
        // Übergänge
        const nx = SEG[i + 1]; if (nx) {
          const w2 = nx[2], h2 = nx[3], mw = Math.min(w, w2), Mw = Math.max(w, w2), Mh = Math.max(h, h2);
          if (Mw > mw) for (const s of [-1, 1]) K.solid(s > 0 ? mw : -Mw, s > 0 ? Mw : -mw, 0, Mh, z2 - 0.15, z2 + 0.15, MAT.wall, { tile: 2 * Mh, tileV: Mh });
          if (h !== h2) B.box(Mw * 2, Math.abs(h - h2), 0.3, MAT.wall, 0, Math.min(h, h2) + Math.abs(h - h2) / 2, z2, 2, 0, false);
        }
      });
      // Gruben: Seitenwände, Boden, Warnkanten
      for (const [a, b] of PITS) {
        const w = W((a + b) / 2), zc = (a + b) / 2;
        for (const s of [-1, 1]) B.box(0.3, 8, b - a, MAT.concrete, s * (w + 0.15), -4, zc, 3, 0, false);
        B.box(w * 2, 0.3, b - a, MAT.black, 0, -8.15, zc, 0, 0, false);
        for (const zz of [a + 0.12, b - 0.12]) B.box(w * 2, 0.02, 0.24, MAT.hazard, 0, 0.011, zz, 1, 0, false);
        for (let k = 0; k < 3; k++) B.box(w * 1.8, 0.08, 0.08, MAT.glowAmber, 0, -7.9, a + (b - a) * (k + 1) / 4, 0, 0, false);
        K.light(0, -6, zc, '#ff7a2a', 9, 9);
      }
      return { W, H: Hc };
    }
  };
  return K;
}
