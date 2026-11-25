/* Medienhamster 3D – Audio: Synth-Instrumente, Mix-Bus (Kompressor, Hall, Delay, Sidechain), Musik-Sequencer, Soundeffekte */
let saved = {}; try { saved = JSON.parse(localStorage.getItem('mh3d-audio') || '{}'); } catch (e) { }
export const AU = { ctx: null, bus: null, musicOn: saved.music !== false, sfxOn: saved.sfx !== false, cur: null, step: 0, next: 0, pending: null };
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);

/* ---------- Mix-Bus ---------- */
function makeIR(c, dur, decay) {
  const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch); let lp = 0;
    for (let i = 0; i < len; i++) { const t = i / len, k = 0.15 + t * 0.8; lp = lp * k + (Math.random() * 2 - 1) * (1 - k); d[i] = lp * Math.pow(1 - t, decay) * (i < c.sampleRate * 0.012 ? i / (c.sampleRate * 0.012) : 1) * 2.2; }
  }
  return buf;
}
const curves = new Map();
function distCurve(k) { if (curves.has(k)) return curves.get(k); const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } curves.set(k, c); return c; }
export function makeBus(c, dest) {
  const g = (v = 1) => { const n = c.createGain(); n.gain.value = v; return n; };
  const master = g(0.9), comp = c.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 40; hp.Q.value = 0.7;   // Tiefstbass raus (unhörbar, frisst Lautstärke)
  master.connect(hp); hp.connect(comp); comp.connect(dest);
  const music = g(AU.musicOn ? 0.62 : 0), sfx = g(AU.sfxOn ? 0.85 : 0); music.connect(master); sfx.connect(master);
  const drums = g(0.9); drums.connect(music);
  const duck = g(1); duck.connect(music);                       // Sidechain: Bass + Flächen werden von der Kick weggedrückt
  const rev = c.createConvolver(); rev.buffer = makeIR(c, 2.6, 2.6); const revOut = g(0.55); rev.connect(revOut); revOut.connect(music);
  const sfxRev = g(0.4); sfxRev.connect(rev);
  // Ping-Pong-Delay (punktierte Achtel werden pro Track gesetzt)
  const dIn = g(1), dL = c.createDelay(2), dR = c.createDelay(2), fb = g(0.38), lp = c.createBiquadFilter(), mg = c.createChannelMerger(2), dOut = g(0.5);
  lp.type = 'lowpass'; lp.frequency.value = 3200; dL.delayTime.value = dR.delayTime.value = 0.38;
  dIn.connect(lp); lp.connect(dL); dL.connect(dR); dR.connect(fb); fb.connect(lp); dL.connect(mg, 0, 0); dR.connect(mg, 0, 1); mg.connect(dOut); dOut.connect(music);
  const drive = c.createWaveShaper(); drive.curve = distCurve(8); const driveOut = g(0.5); drive.connect(driveOut); driveOut.connect(drums);
  const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return { c, master, music, sfx, drums, duck, rev, sfxRev, delay: dIn, dL, dR, drive, noise: nb };
}

/* ---------- Bausteine ---------- */
function O(b, type, f, t, end, out) { const o = b.c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (out) o.connect(out); o.start(t); o.stop(end); return o; }
function N(b, t, end, out) { const s = b.c.createBufferSource(); s.buffer = b.noise; s.loop = true; if (out) s.connect(out); s.start(t, Math.random() * 1.5); s.stop(end); return s; }
function G(b, v, out) { const n = b.c.createGain(); n.gain.value = v; if (out) n.connect(out); return n; }
function F(b, type, f, q, out) { const n = b.c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q || 0.7; if (out) n.connect(out); return n; }
function perc(g, t, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); }
function adsr(g, t, dur, peak, a, d, s, r) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(peak * s, t + a, d / 3); g.gain.setTargetAtTime(0, t + Math.max(dur, a), r / 3); }
function send(b, src, rev = 0, dl = 0) { if (rev) src.connect(G(b, rev, b.rev)); if (dl) src.connect(G(b, dl, b.delay)); }
function duck(b, t, depth = 0.5, rel = 0.2) { const p = b.duck.gain; p.cancelScheduledValues(t); p.setValueAtTime(1 - depth, t); p.linearRampToValueAtTime(1, t + rel); }

/* ---------- Instrumente ---------- */
export const I = {
  kick(b, t, v = 1) {
    const g = G(b, 0, b.drums); perc(g, t, 0.72 * v, 0.38); const o = O(b, 'sine', 155, t, t + 0.45, g); o.frequency.exponentialRampToValueAtTime(50, t + 0.11);
    const g2 = G(b, 0, b.drive); perc(g2, t, 0.62 * v, 0.13); const o2 = O(b, 'sine', 330, t, t + 0.15, g2); o2.frequency.exponentialRampToValueAtTime(85, t + 0.09);
    const g3 = G(b, 0, b.drums); perc(g3, t, 0.25 * v, 0.012); N(b, t, t + 0.02, F(b, 'highpass', 2500, 0.7, g3));
    duck(b, t);
  },
  snare(b, t, v = 1, rv = 0.25) {
    const g = G(b, 0, b.drums); perc(g, t, 0.55 * v, 0.2); N(b, t, t + 0.22, F(b, 'bandpass', 1900, 0.8, g)); send(b, g, rv);
    const g2 = G(b, 0, b.drums); perc(g2, t, 0.35 * v, 0.1); const o = O(b, 'triangle', 215, t, t + 0.12, g2); o.frequency.exponentialRampToValueAtTime(165, t + 0.08);
    const g3 = G(b, 0, b.drums); perc(g3, t, 0.18 * v, 0.13); N(b, t, t + 0.14, F(b, 'highpass', 5500, 0.7, g3));
  },
  clap(b, t, v = 1) {
    const f = F(b, 'bandpass', 1250, 1.1, null), g = G(b, 0, b.drums); f.connect(g); send(b, g, 0.35);
    g.gain.setValueAtTime(0.0001, t); for (let i = 0; i < 3; i++) { g.gain.linearRampToValueAtTime(0.6 * v, t + i * 0.011 + 0.001); g.gain.exponentialRampToValueAtTime(0.08 * v, t + i * 0.011 + 0.009); }
    g.gain.linearRampToValueAtTime(0.45 * v, t + 0.035); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); N(b, t, t + 0.22, f);
  },
  hat(b, t, v = 0.3, open = false) {
    const g = G(b, 0, b.drums); perc(g, t, v * 0.42, open ? 0.3 : 0.05); const f = F(b, 'highpass', 6800, 0.7, g); N(b, t, t + (open ? 0.32 : 0.06), f);
  },
  shaker(b, t, v = 0.2) { const g = G(b, 0, b.drums); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); N(b, t, t + 0.09, F(b, 'bandpass', 6500, 1.5, g)); },
  crash(b, t, v = 0.6) { const g = G(b, 0, b.drums); perc(g, t, v * 0.32, 2.0); N(b, t, t + 2.1, F(b, 'highpass', 4200, 0.7, g)); send(b, g, 0.3); },
  tom(b, t, f, v = 0.8) {
    const g = G(b, 0, b.drums); perc(g, t, v * 0.7, 0.38); send(b, g, 0.25); const o = O(b, 'sine', f * 1.7, t, t + 0.4, g); o.frequency.exponentialRampToValueAtTime(f, t + 0.1);
    const g2 = G(b, 0, b.drums); perc(g2, t, v * 0.12, 0.05); N(b, t, t + 0.06, F(b, 'bandpass', f * 4, 1, g2));
  },
  taiko(b, t, v = 1) {
    const g = G(b, 0, b.drums); perc(g, t, v * 0.9, 0.8); send(b, g, 0.45); const o = O(b, 'sine', 120, t, t + 0.85, g); o.frequency.exponentialRampToValueAtTime(52, t + 0.25);
    const g2 = G(b, 0, b.drive); perc(g2, t, v * 0.6, 0.25); N(b, t, t + 0.26, F(b, 'lowpass', 500, 1, g2));
    duck(b, t, 0.35, 0.3);
  },
  clank(b, t, v = 0.6, k = 1) {
    const f = F(b, 'bandpass', 2300 * k, 2.5, null), g = G(b, 0, b.drums); f.connect(g); perc(g, t, v * 0.25, 0.18); send(b, g, 0.2, 0.5);
    for (const m of [523, 811, 1307, 1907]) O(b, 'square', m * k, t, t + 0.2, f);
  },
  bass(b, t, n, dur, o = {}) {
    const f = mtof(n), cut = (o.cut || 800) * 1.3, out = G(b, 0, b.duck); adsr(out, t, dur, 0.32 * (o.vol || 1), 0.005, 0.25, 0.75, 0.06);
    const ws = b.c.createWaveShaper(); ws.curve = distCurve(o.drive || 5); ws.connect(out);
    const lp = F(b, 'lowpass', cut * 2.6, 3.5, ws); lp.frequency.setValueAtTime(cut * 2.6, t); lp.frequency.setTargetAtTime(cut, t, 0.05);
    const end = t + dur + 0.25; O(b, 'sawtooth', f, t, end, lp); O(b, 'square', f * 0.998, t, end, G(b, 0.5, lp)); O(b, 'sine', f < 110 ? f : f / 2, t, end, G(b, 0.35, out));
  },
  pad(b, t, notes, dur, o = {}) {
    const out = G(b, 0, b.duck); adsr(out, t, dur, 0.095 * (o.vol || 1), o.att || 0.35, 0.6, 0.85, o.rel || 0.8); send(b, out, 0.5);
    const lp = F(b, 'lowpass', o.cut || 1600, 0.8, out), end = t + dur + 1.2;
    for (const n of notes) for (const d of [-10, 0, 10]) { const os = O(b, 'sawtooth', mtof(n), t, end, lp); os.detune.value = d + (Math.random() - 0.5) * 4; }
  },
  pluck(b, t, n, o = {}) {
    const out = G(b, 0, b.music); perc(out, t, 0.19 * (o.vol || 1), o.dec || 0.32); send(b, out, 0.15, o.dl !== undefined ? o.dl : 0.45);
    const lp = F(b, 'lowpass', o.cut || 3000, 5, out); lp.frequency.setValueAtTime(o.cut || 3000, t); lp.frequency.setTargetAtTime(280, t, 0.06);
    O(b, 'sawtooth', mtof(n), t, t + 0.4, lp); O(b, 'square', mtof(n + 12), t, t + 0.4, G(b, 0.25, lp));
  },
  lead(b, t, n, dur, o = {}) {
    const f = mtof(n), out = G(b, 0, b.music); adsr(out, t, dur, 0.17 * (o.vol || 1), 0.012, 0.3, 0.8, 0.12); send(b, out, 0.28, o.dl !== undefined ? o.dl : 0.32);
    let dst = F(b, 'lowpass', o.cut || 3200, 1.2, out);
    if (o.gtr) { const ws = b.c.createWaveShaper(); ws.curve = distCurve(40); const pre = G(b, 0.5, ws); ws.connect(F(b, 'lowpass', 3800, 0.8, F(b, 'highpass', 200, 0.7, dst))); dst = pre; }
    const end = t + dur + 0.5, o1 = O(b, o.type || 'square', f, t, end, dst), o2 = O(b, 'sawtooth', f, t, end, G(b, 0.6, dst)); o2.detune.value = 7;
    if (o.from) { for (const x of [o1, o2]) { x.frequency.setValueAtTime(mtof(o.from), t); x.frequency.exponentialRampToValueAtTime(f, t + 0.07); } }
    const lfo = O(b, 'sine', 5.6, t, end, null), lg = G(b, 0, null); lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.013, t + Math.min(0.35, dur * 0.6) + 0.05);
  },
  brass(b, t, notes, dur, v = 1) {
    const out = G(b, 0, b.music); adsr(out, t, dur, 0.09 * v, 0.03, 0.25, 0.6, 0.15); send(b, out, 0.35);
    const lp = F(b, 'lowpass', 500, 1.5, out); lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(2800, t + 0.06); lp.frequency.setTargetAtTime(1300, t + 0.08, 0.1);
    for (const n of notes) for (const d of [-8, 8]) { const x = O(b, 'sawtooth', mtof(n), t, t + dur + 0.4, lp); x.detune.value = d; }
  },
  guitar(b, t, notes, dur, o = {}) {
    const out = G(b, 0, b.music); adsr(out, t, dur, 0.19 * (o.vol || 1), 0.004, o.mute ? 0.08 : 0.6, o.mute ? 0.3 : 0.75, 0.07);
    const cab = F(b, 'lowpass', o.mute ? 1500 : 3600, 0.9, out), pk = F(b, 'peaking', 1400, 1, cab); pk.gain.value = 5;
    const ws = b.c.createWaveShaper(); ws.curve = distCurve(70); ws.connect(F(b, 'highpass', 100, 0.7, pk));
    const pre = G(b, 0.45, ws), end = t + dur + 0.2;
    for (const n of notes) for (const d of [-6, 5]) { const x = O(b, 'sawtooth', mtof(n), t, end, pre); x.detune.value = d; }
  },
  choir(b, t, notes, dur, v = 1) {
    const out = G(b, 0, b.music); adsr(out, t, dur, 0.06 * v, 0.6, 1, 0.9, 1.2); send(b, out, 0.9);
    const fs = [[780, 7, 1], [1150, 8, 0.55], [2850, 10, 0.25]].map(([f, q, a]) => F(b, 'bandpass', f, q, G(b, a * 3, out)));
    const mix = G(b, 1, null); for (const f of fs) mix.connect(f);
    for (const n of notes) for (const d of [-9, 0, 9]) { const x = O(b, 'sawtooth', mtof(n), t, t + dur + 1.5, mix); x.detune.value = d; }
  },
  ep(b, t, n, dur, v = 1) {
    const f = mtof(n), out = G(b, 0, b.music); out.gain.setValueAtTime(0.0001, t); out.gain.linearRampToValueAtTime(0.1 * v, t + 0.005); out.gain.exponentialRampToValueAtTime(0.03 * v, t + 0.6); out.gain.setTargetAtTime(0.0001, t + dur, 0.15); send(b, out, 0.3, 0.12);
    const end = t + dur + 0.8, car = O(b, 'sine', f, t, end, out), mod = O(b, 'sine', f, t, end, null), mg = G(b, 0, null); mod.connect(mg); mg.connect(car.frequency);
    mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.2, t + 0.9);
    O(b, 'sine', f * 2, t, end, G(b, 0.08, out));
  },
  riser(b, t, dur, v = 1) {
    const g = G(b, 0, b.music); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * v, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.05); send(b, g, 0.4);
    const f = F(b, 'bandpass', 300, 2.5, g); f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur); N(b, t, t + dur + 0.06, f);
  },
  impact(b, t, v = 1) {
    const g = G(b, 0, b.drive); perc(g, t, 0.9 * v, 1.3); const o = O(b, 'sine', 95, t, t + 1.4, g); o.frequency.exponentialRampToValueAtTime(32, t + 1.0);
    const g2 = G(b, 0, b.music); perc(g2, t, 0.3 * v, 1.0); N(b, t, t + 1.1, F(b, 'lowpass', 900, 0.7, g2)); send(b, g2, 0.6);
    duck(b, t, 0.6, 0.6);
  },
  hey(b, t, v = 1) {
    for (let k = 0; k < 6; k++) {
      const f0 = 140 + Math.random() * 90, out = G(b, 0, b.music), dt = Math.random() * 0.02; adsr(out, t + dt, 0.16, 0.05 * v, 0.02, 0.1, 0.8, 0.08); send(b, out, 0.5);
      const mix = G(b, 1, null); for (const [ff, q, a] of [[560, 5, 1], [1850, 9, 0.6], [2600, 10, 0.3]]) mix.connect(F(b, 'bandpass', ff, q, G(b, a * 4, out)));
      const x = O(b, 'sawtooth', f0 * 1.15, t + dt, t + 0.4, mix); x.frequency.exponentialRampToValueAtTime(f0 * 0.85, t + dt + 0.22);
    }
  },
};

/* =====================================================================
   MUSIK-TRACKS
   ===================================================================== */
const R = (arr) => { const m = new Map(); for (const [s, l, n] of arr) { if (!m.has(s)) m.set(s, []); m.get(s).push([l, n]); } return m; };

// Level 1 – „Katakomben": D-Moll, treibend, industriell, 118 BPM
const K1 = [{ r: 38, pad: [62, 65, 69], arp: [50, 57, 62, 65, 69, 65, 62, 57] }, { r: 34, pad: [62, 65, 70], arp: [46, 53, 58, 62, 65, 62, 58, 53] }, { r: 41, pad: [60, 65, 69], arp: [53, 57, 60, 65, 69, 65, 60, 57] }, { r: 36, pad: [60, 64, 67], arp: [48, 55, 60, 64, 67, 64, 60, 55] }];
const K2 = [{ r: 43, pad: [62, 67, 70], arp: [55, 58, 62, 67, 70, 67, 62, 58] }, K1[0], K1[1], { r: 33, pad: [61, 64, 69], arp: [45, 52, 57, 61, 64, 61, 57, 52] }];
const KMEL = R([[0, 3, 69], [3, 3, 74], [6, 2, 77], [8, 2, 76], [10, 2, 74], [12, 2, 72], [14, 2, 74], [16, 6, 77], [22, 2, 74], [24, 4, 70], [28, 2, 72], [30, 2, 74], [32, 3, 72], [35, 3, 77], [38, 2, 79], [40, 4, 81], [44, 2, 79], [46, 2, 77], [48, 6, 76], [54, 2, 79], [56, 4, 76], [60, 2, 74], [62, 2, 76],
  [64, 2, 74], [66, 2, 77], [68, 4, 81], [72, 2, 77], [74, 2, 76], [76, 2, 74], [78, 2, 76], [80, 6, 77], [86, 2, 74], [88, 2, 77], [90, 2, 79], [92, 4, 81], [96, 6, 81], [102, 2, 79], [104, 4, 77], [108, 2, 72], [110, 2, 77], [112, 6, 79], [118, 2, 77], [120, 4, 76], [124, 2, 74], [126, 2, 72]]);
// Level 2 – „Mainstage": E-Moll Stadion-Rock, 128 BPM
const MS = { Em: { r: 40, pw: [40, 47, 52], st: [64, 67, 71] }, C: { r: 36, pw: [36, 43, 48], st: [64, 67, 72] }, G: { r: 43, pw: [43, 50, 55], st: [62, 67, 71] }, D: { r: 38, pw: [38, 45, 50], st: [62, 66, 69] }, Am: { r: 45, pw: [45, 52, 57], st: [64, 69, 72] } };
const MVERSE = ['Em', 'Em', 'C', 'C', 'G', 'G', 'D', 'D'], MCHOR = ['Em', 'C', 'G', 'D'], MPRE = ['Am', 'C', 'D', 'D'];
const MMEL = R([[0, 4, 71], [4, 2, 71], [6, 2, 69], [8, 4, 67], [12, 4, 64], [16, 4, 67], [20, 2, 67], [22, 2, 69], [24, 8, 72], [32, 4, 71], [36, 2, 71], [38, 2, 69], [40, 4, 67], [44, 4, 74], [48, 6, 74], [54, 2, 72], [56, 4, 71], [60, 4, 69],
  [64, 4, 71], [68, 2, 71], [70, 2, 69], [72, 4, 67], [76, 4, 64], [80, 4, 67], [84, 2, 67], [86, 2, 69], [88, 8, 72], [96, 4, 74], [100, 2, 74], [102, 2, 72], [104, 4, 71], [108, 4, 67], [112, 4, 69], [116, 4, 71], [120, 8, 74]]);
// Boss – „Der Rigger": A-Moll/phrygisch, 150 BPM
const BC = { Am: { r: 33, pad: [57, 60, 64] }, F: { r: 29, pad: [57, 60, 65] }, E: { r: 28, pad: [56, 59, 64] }, Dm: { r: 38, pad: [57, 62, 65] }, Bb: { r: 34, pad: [58, 62, 65] } };
const BA = ['Am', 'Am', 'F', 'E'], BB = ['Dm', 'Am', 'Bb', 'E'];
const BMEL = R([[0, 4, 74], [4, 2, 76], [6, 2, 77], [8, 6, 76], [14, 2, 74], [16, 4, 72], [20, 4, 76], [24, 8, 69], [32, 4, 70], [36, 2, 72], [38, 2, 74], [40, 6, 77], [46, 2, 76], [48, 6, 76], [54, 2, 77], [56, 4, 76], [60, 4, 68]]);
// Menü – entspannter Groove, 88 BPM
const MN = [{ r: 41, ch: [53, 57, 60, 64] }, { r: 40, ch: [52, 55, 59, 62] }, { r: 38, ch: [50, 53, 57, 60] }, { r: 36, ch: [48, 52, 55, 59] }];
const MNMEL = R([[0, 6, 72], [6, 2, 74], [8, 4, 76], [12, 4, 79], [16, 8, 76], [24, 4, 74], [28, 4, 72], [32, 6, 74], [38, 2, 72], [40, 4, 71], [44, 4, 67], [48, 12, 72]]);

export const TRACKS = {
  kata: {
    bpm: 118, arr: [['intro', 4], ['build', 4], ['A', 8], ['B', 8], ['brk', 4], ['drop', 8]], loop: 2,
    play(b, sec, bar, st, t, D) {
      const ch = (sec === 'build' || sec === 'brk' ? K2 : K1)[bar % 4], full = sec === 'A' || sec === 'B' || sec === 'drop';
      if ((full || sec === 'build') && st % 4 === 0) I.kick(b, t, sec === 'build' ? 0.8 : 0.95);
      if (full && (st === 4 || st === 12)) I.clap(b, t, 0.75);
      if (sec === 'build' && bar >= 1 && (st === 4 || st === 12)) I.clap(b, t, 0.5);
      if (full) I.hat(b, t, st % 4 === 2 ? 0.55 : 0.16 + (st % 2) * 0.1, st % 4 === 2 && sec === 'drop');
      else if ((sec === 'intro' && bar >= 1) || sec === 'brk') { if (st % 4 === 2) I.hat(b, t, 0.22); }
      else if (sec === 'build') I.hat(b, t, st % 4 === 2 ? 0.4 : 0.12);
      if ((full || sec === 'intro') && st === 14 && bar % 2 === 1) I.clank(b, t, 0.7);
      if (full && st === 7 && bar % 4 === 2) I.clank(b, t, 0.45, 1.5);
      if (st === 0 && bar === 0 && full) I.crash(b, t, 0.7);
      if (sec === 'drop' && st === 0 && bar === 4) I.crash(b, t, 0.5);
      if ((sec === 'build' || sec === 'brk') && bar === 3) I.snare(b, t, 0.2 + st / 16 * 0.6, 0.15);
      if (sec === 'build' && bar === 2 && st >= 8 && st % 2 === 0) I.snare(b, t, 0.3, 0.15);
      if (sec === 'drop' && bar === 7 && st >= 12) I.tom(b, t, [196, 165, 131, 110][st - 12], 0.8);
      if (sec === 'build' && bar === 0 && st === 0) I.riser(b, t, D * 64);
      if (sec === 'brk' && bar === 2 && st === 0) I.riser(b, t, D * 32);
      if (sec === 'brk' && bar === 0 && st === 0) I.impact(b, t);
      if (sec === 'intro') { if (st === 0) I.bass(b, t, ch.r, D * 15, { cut: 300, vol: 0.45 }); }
      else if (sec === 'brk') { if (st === 0) I.bass(b, t, ch.r, D * 15, { cut: 380, vol: 0.55 }); }
      else { if (st % 4 === 2) I.bass(b, t, ch.r, D * 1.6, { cut: 700 }); if (st === 7 || st === 15) I.bass(b, t, ch.r + 12, D * 0.9, { cut: 950, vol: 0.7 }); if (st === 11 && bar % 2) I.bass(b, t, ch.r + 7, D * 0.9, { cut: 900, vol: 0.6 }); }
      if (st === 0) I.pad(b, t, ch.pad, D * 16, { cut: sec === 'intro' ? 900 : sec === 'brk' ? 2300 : 1500, vol: sec === 'brk' ? 1.35 : sec === 'intro' ? 0.7 : 0.9 });
      if (sec !== 'brk') I.pluck(b, t, ch.arp[st % 8] + 12, { cut: sec === 'intro' ? 1100 : sec === 'build' ? 900 + (bar * 16 + st) / 64 * 2300 : sec === 'B' ? 1700 : 2700, vol: sec === 'B' ? 0.5 : 0.75 });
      if (sec === 'B' || sec === 'drop') { const ns = KMEL.get((bar * 16 + st) % 128); if (ns) for (const [l, n] of ns) { I.lead(b, t, n, D * l * 0.92); if (sec === 'drop') I.lead(b, t, n - 12, D * l * 0.92, { vol: 0.45, type: 'sawtooth', dl: 0.1 }); } }
      if (sec === 'brk' && st === 0) I.lead(b, t, [74, 77, 77, 76][bar], D * 15, { vol: 0.65, cut: 1900 });
    }
  },
  stage: {
    bpm: 128, arr: [['intro', 4], ['verse', 8], ['pre', 4], ['chorus', 8], ['post', 4]], loop: 1,
    play(b, sec, bar, st, t, D) {
      const name = sec === 'verse' ? MVERSE[bar] : sec === 'pre' ? MPRE[bar] : sec === 'intro' || sec === 'post' ? 'Em' : MCHOR[bar % 4], ch = MS[name];
      const big = sec === 'chorus';
      // Schlagzeug
      if (sec !== 'intro' || bar >= 2) {
        if (st === 0 || st === 8 || (st === 6 && sec !== 'post') || (big && st === 10)) I.kick(b, t, 0.95);
        if (st === 4 || st === 12) { I.snare(b, t, 0.9, 0.3); if (big || sec === 'pre') I.clap(b, t, 0.5); }
        if (st % 2 === 0) I.hat(b, t, big ? 0.45 : 0.3, big && st % 4 === 2);
      } else if (st % 4 === 0) I.hat(b, t, 0.25);
      if (st === 0 && (big ? bar % 2 === 0 : bar === 0) && sec !== 'intro') I.crash(b, t, 0.6);
      if (sec === 'pre' && bar === 3) I.snare(b, t, 0.2 + st / 16 * 0.7, 0.2);
      if (sec === 'pre' && st === 12 && bar % 2 === 1) I.hey(b, t);
      if (big && st === 12 && bar % 4 === 3) I.hey(b, t, 0.8);
      if (sec === 'pre' && bar === 2 && st === 0) I.riser(b, t, D * 32, 0.8);
      // Gitarre
      if (sec === 'intro' || sec === 'verse' || sec === 'post') { if (st % 2 === 0) I.guitar(b, t, ch.pw.slice(0, 2), D * 1.4, { mute: true, vol: sec === 'intro' && bar < 2 ? 0.6 : 0.9 }); }
      else if (sec === 'pre') { if (st % 4 === 0) I.guitar(b, t, ch.pw, D * 3.5, { vol: 0.8 }); }
      else { if (st === 0) I.guitar(b, t, ch.pw, D * 7.5); if (st === 8) I.guitar(b, t, ch.pw, D * 3.6, { vol: 0.85 }); if (st === 14 || st === 12) I.guitar(b, t, ch.pw.slice(0, 2), D * 1.4, { mute: true, vol: 0.7 }); }
      // Bass
      if (sec !== 'intro' || bar >= 2) { if (st % 2 === 0) I.bass(b, t, ch.r, D * 1.7, { cut: big ? 900 : 650, vol: 0.9 }); }
      // Synth-Stabs + Melodie im Refrain
      if (big && (st === 2 || st === 6 || st === 10 || st === 14)) I.pluck(b, t, ch.st[(st >> 2) % 3] + 12, { cut: 2600, vol: 0.55, dl: 0.25 });
      if (big) { const ns = MMEL.get((bar * 16 + st) % 128); if (ns) for (const [l, n] of ns) { I.lead(b, t, n, D * l * 0.95, { gtr: true, vol: 1.1, type: 'sawtooth' }); } }
      if (sec === 'post' && st === 0) I.pad(b, t, ch.st, D * 16, { cut: 1400, vol: 0.9 });
    }
  },
  boss: {
    bpm: 150, arr: [['intro', 2], ['A', 8], ['B', 8], ['brk', 4]], loop: 1,
    play(b, sec, bar, st, t, D) {
      const ch = BC[sec === 'B' ? BB[bar % 4] : sec === 'brk' ? ['Am', 'F', 'Am', 'E'][bar] : BA[bar % 4]];
      if (sec === 'intro' || sec === 'brk') { if (st === 0 || st === 10 || (st === 6 && bar % 2)) I.taiko(b, t, 1); if (st === 0) I.choir(b, t, ch.pad, D * 16, 1.2); if (sec === 'brk' && bar === 3) I.snare(b, t, 0.2 + st / 16 * 0.7, 0.2); return; }
      if (st === 0 || st === 3 || st === 8 || st === 11) I.kick(b, t, 1);
      if (st === 4 || st === 12) I.snare(b, t, 0.95, 0.35);
      if (st % 2 === 0) I.hat(b, t, st % 4 === 2 ? 0.45 : 0.25);
      if (st === 0 && bar % 4 === 0) I.crash(b, t, 0.6);
      if (st === 0 || st === 10) I.taiko(b, t, 0.7);
      if (bar % 8 === 7 && st >= 8) I.tom(b, t, [220, 196, 165, 147, 131, 110, 98, 82][st - 8], 0.75);
      if (st % 4 !== 1) I.bass(b, t, ch.r + 12, D * 0.85, { cut: 900, drive: 9, vol: 0.95 });
      const arp = [ch.pad[0] + 12, ch.pad[1] + 12, ch.pad[2] + 12, ch.pad[1] + 12];
      I.pluck(b, t, arp[st % 4] + (st % 8 === 7 ? 1 : 0), { cut: 2200, vol: 0.45, dec: 0.15, dl: 0.12 });
      if (st === 0) { I.brass(b, t, ch.pad, D * 3); I.choir(b, t, ch.pad.map(n => n - 12), D * 16, 0.7); }
      if (st === 10 && sec === 'B') I.brass(b, t, ch.pad, D * 2, 0.8);
      if (sec === 'B') { const ns = BMEL.get((bar * 16 + st) % 64); if (ns) for (const [l, n] of ns) I.lead(b, t, n + (bar >= 4 ? 12 : 0), D * l * 0.92, { vol: 0.9, cut: 3600 }); }
    }
  },
  menu: {
    bpm: 88, arr: [['A', 4], ['B', 4]], loop: 0,
    play(b, sec, bar, st, t, D) {
      const ch = MN[bar % 4], sw = st % 2 === 1 ? D * 0.28 : 0;
      if (st === 0 || st === 7 || st === 10) I.kick(b, t, st ? 0.55 : 0.7);
      if (st === 4 || st === 12) I.snare(b, t + 0.01, 0.45, 0.45);
      if (st % 2 === 0) I.hat(b, t + sw, st % 4 === 2 ? 0.28 : 0.15); I.shaker(b, t + sw, 0.25);
      if (st === 0) for (const n of ch.ch) I.ep(b, t + Math.random() * 0.02, n, D * 7, 0.8);
      if (st === 10 || st === 14) for (const n of ch.ch.slice(1)) I.ep(b, t + sw, n, D * 1.5, 0.45);
      if (st === 0 || st === 10) I.bass(b, t, ch.r, D * (st ? 5 : 9), { cut: 420, vol: 0.75, drive: 1.5 });
      if (st === 7) I.bass(b, t + sw, ch.r + 12, D * 1.5, { cut: 500, vol: 0.5, drive: 1.5 });
      if (sec === 'B') { const ns = MNMEL.get(bar * 16 + st); if (ns) for (const [l, n] of ns) I.lead(b, t, n, D * l * 0.9, { type: 'triangle', vol: 0.75, cut: 2400, dl: 0.4 }); }
    }
  }
};

/* ---------- Jingles ---------- */
export const JINGLES = {
  win(b, t) { const D = 0.11; [72, 76, 79].forEach((n, i) => I.lead(b, t + i * D, n, D * 0.9, { vol: 0.9 })); I.lead(b, t + 3 * D, 84, 1.3, { vol: 1 }); I.brass(b, t + 3 * D, [60, 64, 67, 72], 1.4, 1.2); I.crash(b, t + 3 * D, 0.7); I.snare(b, t, 0.5); I.snare(b, t + D, 0.6); I.snare(b, t + 2 * D, 0.7); I.kick(b, t + 3 * D, 1); },
  lose(b, t) { [76, 74, 72, 71].forEach((n, i) => I.lead(b, t + i * 0.28, n, 0.26, { vol: 0.7, type: 'triangle' })); I.impact(b, t + 1.1, 0.7); },
  boss(b, t) { I.impact(b, t, 1); I.brass(b, t, [45, 52, 57, 60], 1.6, 1.4); I.choir(b, t, [57, 60, 64], 2.2, 1.3); I.taiko(b, t, 1); I.taiko(b, t + 0.4, 0.8); I.taiko(b, t + 0.6, 0.9); },
};

/* ---------- Sequencer ---------- */
function stepDur(T) { return 60 / T.bpm / 4; }
function sectionAt(T, barAbs) {
  let total = 0, pre = 0; T.arr.forEach(([, n], i) => { total += n; if (i < T.loop) pre += n; });
  const bi = barAbs < total ? barAbs : pre + (barAbs - pre) % (total - pre);
  let acc = 0; for (const [s, n] of T.arr) { if (bi < acc + n) return [s, bi - acc]; acc += n; }
  return [T.arr[0][0], 0];
}
export function playStep(b, T, step, t) { const [sec, bar] = sectionAt(T, Math.floor(step / 16)); T.play(b, sec, bar, step % 16, t, stepDur(T)); }
export function setMusic(name) {
  if (!AU.ctx) { AU.pending = name; return; }
  if (AU.cur === TRACKS[name]) return;
  AU.cur = TRACKS[name] || null; AU.step = 0; AU.next = AU.ctx.currentTime + 0.12;
  if (AU.cur) { AU.bus.dL.delayTime.value = AU.bus.dR.delayTime.value = stepDur(AU.cur) * 3; }
}
export function stopMusic() { AU.cur = null; }
export function musicTick() {
  if (!AU.ctx || !AU.cur || AU.ctx.state !== 'running') return;
  const T = AU.cur, ahead = AU.ctx.currentTime + 0.3;
  if (AU.next < AU.ctx.currentTime - 0.5) AU.next = AU.ctx.currentTime + 0.05;   // nach Pause nicht nachholen
  while (AU.next < ahead) { playStep(AU.bus, T, AU.step, AU.next); AU.step++; AU.next += stepDur(T); }
}
export function jingle(name, stopTrack = true) { if (!AU.ctx) return; if (stopTrack) AU.cur = null; JINGLES[name](AU.bus, AU.ctx.currentTime + 0.05); }

/* ---------- Ein/Aus, Freischalten (iOS braucht eine Berührung) ---------- */
export function audioUnlock() {
  if (!AU.ctx) {
    try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    AU.bus = makeBus(AU.ctx, AU.ctx.destination);
    if (AU.pending) { const p = AU.pending; AU.pending = null; setMusic(p); }
  }
  if (AU.ctx.state === 'suspended') AU.ctx.resume();
}
export function setAudio(music, sfx) {
  AU.musicOn = music; AU.sfxOn = sfx; try { localStorage.setItem('mh3d-audio', JSON.stringify({ music, sfx })); } catch (e) { }
  if (AU.bus) { AU.bus.music.gain.setTargetAtTime(music ? 0.62 : 0, AU.ctx.currentTime, 0.05); AU.bus.sfx.gain.setTargetAtTime(sfx ? 0.85 : 0, AU.ctx.currentTime, 0.05); }
}

/* =====================================================================
   SOUNDEFFEKTE
   ===================================================================== */
export function sfx(kind, vol = 1, opt = {}) {
  if (!AU.ctx || !AU.sfxOn || vol < 0.02) return;
  const b = AU.bus, t = AU.ctx.currentTime + 0.005, out = G(b, vol, b.sfx);
  const tone = (type, f1, f2, dur, v, at = 0, dest = out) => { const g = G(b, 0, dest); perc(g, t + at, v, dur); const o = O(b, type, f1, t + at, t + at + dur + 0.05, g); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + at + dur * 0.8); return o; };
  const noise = (type, f, q, dur, v, at = 0, dest = out) => { const g = G(b, 0, dest); perc(g, t + at, v, dur); N(b, t + at, t + at + dur + 0.05, F(b, type, f, q, g)); return g; };
  switch (kind) {
    case 'jump': tone('sine', 300, 640, 0.14, 0.35); tone('triangle', 600, 1280, 0.1, 0.08); break;
    case 'jump2': tone('sine', 480, 980, 0.13, 0.3); tone('triangle', 960, 1900, 0.09, 0.07); break;
    case 'land': noise('lowpass', 380, 1, 0.09, 0.5); tone('sine', 120, 60, 0.08, 0.3); break;
    case 'tape': tone('sine', 1320, 0, 0.09, 0.22); tone('sine', 1760, 0, 0.22, 0.22, 0.06); tone('sine', 3520, 0, 0.12, 0.05, 0.06); break;
    case 'hurt': { const o = tone('sine', 1100, 0, 0.32, 0.35); o.frequency.setValueAtTime(1100, t); o.frequency.linearRampToValueAtTime(1750, t + 0.07); o.frequency.exponentialRampToValueAtTime(820, t + 0.3); noise('bandpass', 900, 1, 0.12, 0.3); break; }
    case 'stomp': tone('sine', 190, 620, 0.16, 0.45); noise('lowpass', 600, 1, 0.12, 0.45); break;
    case 'bonk': tone('square', 170, 230, 0.07, 0.15); break;
    case 'cp': tone('sine', 1318, 0, 0.5, 0.2); tone('sine', 1976, 0, 0.7, 0.18, 0.1); tone('sine', 3952, 0, 0.3, 0.04, 0.1); break;
    case 'beep': tone('square', 1040, 0, 0.13, 0.12); break;
    case 'steam': { const g = noise('highpass', 2600, 0.7, 0.7, 0.28); break; }
    case 'spark': for (let i = 0; i < 7; i++) noise('bandpass', 2500 + Math.random() * 3000, 2, 0.025, 0.35 + Math.random() * 0.3, i * 0.035 + Math.random() * 0.02); break;
    case 'clank': I.clank({ ...b, drums: out, rev: b.sfxRev, delay: G(b, 0, null) }, t, 1.3, 0.8); tone('sine', 140, 70, 0.25, 0.4); break;
    case 'whoosh': { const g = G(b, 0, out); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); const f = F(b, 'bandpass', 500, 1.5, g); f.frequency.exponentialRampToValueAtTime(2200, t + 0.2); N(b, t, t + 0.4, f); break; }
    case 'rumble': { noise('lowpass', 220, 1, opt.dur || 0.8, 0.4); tone('sawtooth', 48, 0, opt.dur || 0.8, 0.12); break; }
    case 'blip': tone('square', opt.f || 600, (opt.f || 600) * 1.05, 0.05, 0.08); break;
    case 'eat': for (let i = 0; i < 4; i++) noise('bandpass', 1800, 1.5, 0.05, 0.4, i * 0.08); tone('sine', 660, 990, 0.15, 0.25, 0.34); tone('sine', 990, 1320, 0.2, 0.22, 0.46); break;
    case 'bosshit': noise('bandpass', 1200, 1, 0.25, 0.6); tone('square', 420, 140, 0.35, 0.18); tone('sine', 90, 45, 0.4, 0.5); break;
    case 'ding': tone('sine', 1568, 0, 1.2, 0.2); tone('sine', 1245, 0, 1.5, 0.2, 0.35); break;
    case 'cheer': { const g = G(b, 0, out); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.4, t + 0.4); g.gain.setTargetAtTime(0.0001, t + 1.8, 0.5); N(b, t, t + 3.5, F(b, 'bandpass', 1400, 0.6, g)); I.hey({ ...b, music: out, rev: b.sfxRev }, t + 0.3, 1.2); break; }
    case 'splash': noise('bandpass', 1500, 0.8, 0.25, 0.35); noise('highpass', 4000, 0.7, 0.15, 0.2, 0.05); break;
    case 'door': noise('lowpass', 300, 1, 0.9, 0.3); tone('sine', 80, 70, 0.9, 0.12); break;
  }
}

/* ---------- Offline-Rendern (für Vorschau-WAVs im Test) ---------- */
export async function renderOffline(fn, secs) {
  const oc = new OfflineAudioContext(2, Math.floor(44100 * secs), 44100), b = makeBus(oc, oc.destination);
  b.music.gain.value = 0.62; b.sfx.gain.value = 0.85;
  fn(b, oc);
  const buf = await oc.startRendering(), L = buf.getChannelData(0), Rr = buf.getChannelData(1), n = L.length;
  const ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab); let p = 0;
  const w = s => { for (const ch of s) v.setUint8(p++, ch.charCodeAt(0)); }, u32 = x => { v.setUint32(p, x, true); p += 4; }, u16 = x => { v.setUint16(p, x, true); p += 2; };
  w('RIFF'); u32(36 + n * 4); w('WAVE'); w('fmt '); u32(16); u16(1); u16(2); u32(44100); u32(44100 * 4); u16(4); u16(16); w('data'); u32(n * 4);
  let peak = 0; for (let i = 0; i < n; i++) { for (const ch of [L, Rr]) { const s = Math.max(-1, Math.min(1, ch[i])); peak = Math.max(peak, Math.abs(s)); v.setInt16(p, s * 32767, true); p += 2; } }
  let bin = ''; const bytes = new Uint8Array(ab); for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { b64: btoa(bin), peak };
}
export function renderTrackOffline(name, secs) {
  return renderOffline((b) => { const T = TRACKS[name], D = stepDur(T); b.dL.delayTime.value = b.dR.delayTime.value = D * 3; let t = 0.05, s = 0; while (t < secs - 0.5) { playStep(b, T, s++, t); t += D; } }, secs);
}
