# Games

| Ordner | Spiel | Stand |
|---|---|---|
| `medienhamster/` | **Medienhamster 3D** – 3D-Backstage-Abenteuer mit dem Medienhamster aus Backstage Brawl. Level 1 „Katakomben der Messe“ (ca. 450 m), Level 2 „Mainstage“ mit Endgegner „Der Rigger“. | v1.0 |
| `backstage-rallye/` | **Backstage Rallye** – 2D-Rennen durch die Halle: Start auf dem Hubwagen, mit XP aufsteigen zum Stapler und Teleskopsteiger. Fahrer: ITler, Hallenmeister, Medien Hamster, Headrigger. 1 Spieler gegen CPU, 2 Spieler im Split-Screen, Touch fürs iPhone/iPad. Läuft auch per `file://`. | v1.0 |

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

## Backstage Rallye – Aufbau

Eigenes, neues Rennspiel im Browser (unabhängig von Backstage Brawl): Zwei Fahrer rasen durch die Halle – zwischen Hochregalen, unter Traversen, über Kabelbrücken. Alle starten auf dem **Hubwagen**, sammeln XP und steigen im Rennen auf zum **Stapler** und zum **Teleskopsteiger**. 3 Runden, wer zuerst im Ziel ist, gewinnt. Einfach `backstage-rallye/index.html` öffnen – eine einzige Datei, kein Server nötig.

**Fahrer:** die vier beliebtesten Figuren aus Backstage Brawl (laut Spielstatistik), als Kopie übernommen – jede mit kleinem Vorteil:

| Fahrer | Vorteil |
|---|---|
| **ITler** | Spezial lädt 30 % schneller |
| **Hallenmeister** | nach Crashs doppelt so schnell wieder flott |
| **Medien Hamster** | beschleunigt 25 % schneller |
| **Headrigger** | springt 12 % höher |

**Fahrzeuge & Spezial:** Hubwagen → *Turbo* · Stapler (ab 8 XP) → *Gabel-Ramme* (fährt durch Flightcases und Paletten) · Teleskopsteiger (ab 22 XP) → *Ausleger-Sprung* (riesiger Satz über alles).
**XP:** Gaffa-Rolle +1 · Sprung über Kabelbrücke +2 · Überholen +3 · Ramme durch Kiste +1. Wer weit zurückliegt, bekommt die *Aufholjagd* (XP ×2, etwas mehr Tempo).
**Hindernisse:** Flightcases und Palettenstapel (drüberspringen oder draufspringen, sonst RUMMS), Pylonen (bremsen), Kabelbrücken (Schanze).

| | P1 | P2 |
|---|---|---|
| Gas / Bremse | `D` / `A` | `→` / `←` |
| Springen | `W` (oder Leertaste) | `↑` |
| Spezial | `S` (oder `F`) | `↓` (oder `K`) |

`Esc` Pause, `M` Ton. **1 Spieler** gegen die CPU (Leicht/Mittel/Schwer, Bestzeit wird lokal gespeichert) oder **2 Spieler** an einer Tastatur im geteilten Bildschirm. **iPhone/iPad:** Gas automatisch, links Bremse, rechts Sprung und Spezial; im Querformat, über *Teilen → Zum Home-Bildschirm* als Vollbild-App. Keine Online-Anbindung, keine Schlüssel – läuft komplett offline.
