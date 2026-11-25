/* Medienhamster 3D – Kern: Renderer, Szene, Kamera, Nachbearbeitung, Hilfsfunktionen */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export { THREE, mergeGeometries, RoundedBoxGeometry };
export const QS = new URLSearchParams(location.search);
export const TOUCH = matchMedia('(pointer: coarse)').matches;
export const $ = id => document.getElementById(id);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Renderer ---------- */
export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: QS.has('shot') });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.prepend(renderer.domElement);

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 60);
const pmrem = new THREE.PMREMGenerator(renderer);
export const ENV = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* ---------- Nachbearbeitung: Bloom lässt Neon, Beacons und Bühnenlicht leuchten ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
export const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.42, 0.86);
composer.addPass(bloom);
composer.addPass(new OutputPass());

let saved = {}; try { saved = JSON.parse(localStorage.getItem('mh3d-gfx') || '{}'); } catch (e) { }
export const GFX = { high: saved.high !== undefined ? saved.high : true };
export function setGfx(high) { GFX.high = high; try { localStorage.setItem('mh3d-gfx', JSON.stringify(GFX)); } catch (e) { } resize(); }
export function resize() {
  const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio, GFX.high ? 2 : 1.25);
  renderer.setPixelRatio(dpr); composer.setPixelRatio(dpr);
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w / h < 0.9 ? 72 : 58; camera.updateProjectionMatrix();
}
export function render() { if (GFX.high) composer.render(); else renderer.render(scene, camera); }

/* ---------- Zufall (reproduzierbar, damit Level immer gleich aussehen) ---------- */
let seed = 7;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const reseed = s => { seed = s; };

/* ---------- Texturen aus Canvas ---------- */
export function canvasTex(w, h, draw, opts = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = opts.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

/* ---------- Geometrie-Helfer ---------- */
// Box mit Welt-gekachelten UVs (damit Texturen auf großen Flächen nicht verzerren)
export function boxGeo(w, h, d, tile = 0, tileV = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (tile) {
    const tv = tileV || tile, uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tv); }
  }
  return g;
}
export function planeGeo(w, h, tile = 0) {
  const g = new THREE.PlaneGeometry(w, h);
  if (tile) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * h / tile); }
  return g;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function mat4(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
// Rohr zwischen zwei Punkten
export function tubeBetween(a, b, r, seg = 6) {
  const d = new THREE.Vector3().subVectors(b, a), g = new THREE.CylinderGeometry(r, r, d.length(), seg, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); return g;
}

/* ---------- Teile-Sammler: viele kleine Teile → wenige Draw Calls ---------- */
export class Parts {
  constructor() { this.list = []; }
  add(geo, mat, m) { const g = (geo.index ? geo.toNonIndexed() : geo.clone()); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (m) g.applyMatrix4(m); this.list.push([g, mat]); return this; }
  // alles in eine Gruppe mit einem Mesh pro Material
  toGroup(shadow = true) {
    const by = new Map(); for (const [g, m] of this.list) { if (!by.has(m)) by.set(m, []); by.get(m).push(g); }
    const grp = new THREE.Group();
    for (const [m, gs] of by) { const mesh = new THREE.Mesh(mergeGeometries(gs), m); mesh.castShadow = shadow; mesh.receiveShadow = true; grp.add(mesh); }
    return grp;
  }
  // in einen Batch übernehmen (mit Welt-Matrix)
  into(batch, m) { for (const [g, mat] of this.list) batch.addRaw(m ? g.clone().applyMatrix4(m) : g, mat); }
}
// Statischer Batch: sortiert nach Material und z-Abschnitt (für Frustum-Culling)
export class Batch {
  constructor(chunk = 24) { this.chunk = chunk; this.map = new Map(); }
  addRaw(g, mat, shadow = true) {
    g.computeBoundingBox(); const zc = (g.boundingBox.min.z + g.boundingBox.max.z) / 2;
    const key = mat.uuid + '|' + Math.floor(zc / this.chunk) + '|' + shadow;
    if (!this.map.has(key)) this.map.set(key, { mat, shadow, gs: [] });
    this.map.get(key).gs.push(g);
  }
  add(geo, mat, m, shadow = true) { const g = (geo.index ? geo.toNonIndexed() : geo.clone()); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (m) g.applyMatrix4(m); this.addRaw(g, mat, shadow); }
  box(w, h, d, mat, x, y, z, tile = 0, ry = 0, shadow = true, tileV = 0) { this.add(boxGeo(w, h, d, tile, tileV), mat, mat4(x, y, z, 0, ry, 0), shadow); }
  build(parent = scene) {
    for (const { mat, shadow, gs } of this.map.values()) {
      const mesh = new THREE.Mesh(mergeGeometries(gs), mat); mesh.castShadow = shadow; mesh.receiveShadow = true; parent.add(mesh);
    }
    this.map.clear();
  }
}
