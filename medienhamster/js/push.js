/* Medienhamster 3D – Push-Benachrichtigungen (Web-Push; iPhone ab iOS 16.4 nur als Home-Bildschirm-App).
   Anmeldungen landen in Firestore „gamespushsNN“ (Teil-Dokumente, max. 50.000 Zeichen je Dokument).
   Verschickt wird per GitHub Action im Games-Repo (.github/workflows/games-push.yml). */
import { QS } from './core.js?v=10';

const PUSH_KEY = 'BEY7sz7g93OVSSjAe1e47oE6U7hS5WfJasH1UI1A_4zu-kxMblnKALCW76WWfz-IYXHrlzpKEmBgi3MhNMUSkaU';
const FS_BASE = 'https://firestore.googleapis.com/v1/projects/posmaster-1fb94/databases/(default)/documents/sync/';
const FS_KEY = 'key=AIzaSyDmYVHhpwJ13MAD28G8BEcIX_M0HEXFme0';
const PREFIX = 'gamespushs', PART_MAX = 45000, GAME = 'medienhamster';

export const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const STANDALONE = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const SUPPORTED = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.isSecureContext && (location.hostname.endsWith('github.io') || QS.has('push'));

// Zustand für die Glocke im Menü
export function pushState() {
  if (IOS && !STANDALONE) return 'install';                 // erst zum Home-Bildschirm hinzufügen
  if (!SUPPORTED) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted') { let s = null; try { s = localStorage.getItem('mh3d-pushsub'); } catch (e) { } return s ? 'on' : 'granted'; }
  return 'off';
}

async function fsLoad(id) {
  const r = await fetch(FS_BASE + id + '?' + FS_KEY, { cache: 'no-store' });
  if (r.status === 404) return { data: {}, ut: null };
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const d = await r.json(); let data = {};
  try { data = JSON.parse(d.fields.data.stringValue); } catch (e) { }
  return { data, ut: d.updateTime };
}
async function fsWrite(id, data, ut) {
  const pre = ut ? '&currentDocument.updateTime=' + encodeURIComponent(ut) : '&currentDocument.exists=false';
  const r = await fetch(FS_BASE + id + '?' + FS_KEY + pre, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(data) } } }) });
  return r.ok;
}
async function appendParts(items) {
  for (let p = 0; p < 100; p++) {
    const id = PREFIX + String(p).padStart(2, '0'); let full = false;
    for (let tries = 0; tries < 4; tries++) {
      const { data, ut } = await fsLoad(id);
      if (data.full) { full = true; break; }
      const next = { s: (Array.isArray(data.s) ? data.s : []).concat(items) };
      if (JSON.stringify(next).length > PART_MAX) { await fsWrite(id, Object.assign({}, data, { full: true }), ut); full = true; break; }
      if (await fsWrite(id, next, ut)) return true;
    }
    if (!full) return false;
  }
  return false;
}
const b64key = k => { const p = '='.repeat((4 - k.length % 4) % 4), raw = atob((k + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...raw].map(ch => ch.charCodeAt(0))); };

// Muss direkt aus einem Klick heraus aufgerufen werden (sonst blockt Safari die Abfrage)
export async function pushEnable() {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'denied';
  const reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64key(PUSH_KEY) });
  const j = sub.toJSON(); let known = null; try { known = localStorage.getItem('mh3d-pushsub'); } catch (e) { }
  if (known === j.endpoint) return 'on';
  const ok = await appendParts([{ e: j.endpoint, k: j.keys, g: GAME, dev: (IOS ? 'iOS' : matchMedia('(pointer: coarse)').matches ? 'Touch' : 'Desktop') + (STANDALONE ? ' App' : ''), d: Date.now() }]);
  if (ok) try { localStorage.setItem('mh3d-pushsub', j.endpoint); } catch (e) { }
  return ok ? 'on' : 'later';
}
