# Games

| Ordner | Spiel | Stand |
|---|---|---|
| `medienhamster/` | **Medienhamster 3D** – 3D-Backstage-Abenteuer mit dem Medienhamster aus Backstage Brawl. Level 1 „Katakomben der Messe“ (ca. 450 m), Level 2 „Mainstage“ mit Endgegner „Der Rigger“. | v1.0 |

Jedes Spiel liegt in einem eigenen Unterordner und ist unter `https://elitepole92.github.io/Games/<ordner>/` erreichbar.
Lokal testen: Ordner mit einem kleinen Webserver öffnen, z. B. `npx serve .`, dann `/medienhamster/` aufrufen (ES-Module brauchen einen Server, `file://` geht nicht).

## Medienhamster 3D – Aufbau

- `index.html` – HUD, Menüs, Startbildschirm (lädt `js/game.js`)
- `js/core.js` – Renderer, Bloom, Kamera, Geometrie-Helfer
- `js/models.js` – Texturen, Materialien und alle 3D-Modelle (Hamster, Rigger, Crew, Cases, Stapler …)
- `js/audio.js` – Synth-Instrumente, Mix-Bus, Musik-Tracks, Soundeffekte
- `js/kit.js` – Baukasten für Level (Gänge, Licht, Schilder)
- `js/level1.js`, `js/level2.js` – die Level
- `js/push.js`, `sw.js`, `manifest.webmanifest`, `icon-*.png` – App + Push-Benachrichtigungen

Neue Version veröffentlichen: in allen Dateien `?v=10` auf die nächste Zahl hochsetzen (sonst laden Handys alte Module aus dem Cache).

## Push-Benachrichtigungen

- Anmeldungen landen in Firestore (`gamespushs00`, `01`, …).
- Senden: **Actions → „Games – Push senden“ → Run workflow** (Überschrift, Text, Spiel bzw. „alle“).
- Einmalig nötig: Repo-Secret `GAMES_VAPID_PRIVATE_KEY` (Settings → Secrets and variables → Actions).
- iPhone: Push geht nur, wenn das Spiel als App auf dem Home-Bildschirm liegt (Teilen → „Zum Home-Bildschirm“).
