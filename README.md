# Nährwert als App aufs Handy

Diese App ist eine **PWA** – eine Webseite, die man wie eine echte App installieren
kann und die danach **auch ohne Internet** funktioniert.

Was offline geht: Tagebuch, Lebensmittel-Vorschläge, Profil-/Zielberechnung,
Makros, Tagebuch-Seite mit Bewertungen, feste Rezeptsammlung, regelbasierte
Auswertung, Hell/Dunkel, Fotos anhängen.

Was Internet **und** Claude braucht (nur in der Claude-Version, nicht hier):
KI-Foto-Analyse, personalisierte Gerichte, KI-Auswertung, „schätzen".

---

## Diese Dateien

```
index.html            – die App
manifest.webmanifest  – App-Infos (Name, Icon, Farben)
sw.js                 – Service Worker (macht sie offline-fähig)
icon-192.png / icon-512.png / icon-180.png / favicon-32.png – App-Symbole
```

Alle Dateien müssen **im selben Ordner** liegen.

---

## Schritt für Schritt: kostenlos über GitHub Pages online stellen

Du brauchst ein kostenloses GitHub-Konto (github.com).

### 1. Neues Repository anlegen
1. Auf github.com oben rechts auf **+** → **New repository**.
2. **Repository name:** `naehrwert` (klein).
3. **Public** auswählen.
4. Haken bei **Add a README file** – *nicht* setzen.
5. **Create repository**.

### 2. Dateien hochladen
1. Im leeren Repository auf **uploading an existing file** klicken
   (oder **Add file → Upload files**).
2. **Alle** Dateien aus diesem Ordner reinziehen: `index.html`,
   `manifest.webmanifest`, `sw.js` und die vier `.png`-Dateien.
3. Unten auf **Commit changes**.

### 3. GitHub Pages einschalten
1. Im Repository oben auf **Settings**.
2. Links auf **Pages**.
3. Unter **Branch**: `main` auswählen, Ordner `/ (root)`, dann **Save**.
4. Kurz warten (1–2 Minuten). Oben erscheint dann die Adresse, z. B.
   `https://deinname.github.io/naehrwert/`.

### 4. Auf dem Handy öffnen und installieren
Öffne die Adresse **im Browser** (Chrome / Safari), nicht in der GitHub-App.

**Android (Chrome):** Menü **⋮** → **App installieren** bzw. **Zum
Startbildschirm hinzufügen** → **Installieren**.

**iPhone (Safari):** **Teilen-Symbol** (Viereck mit Pfeil) → **Zum
Home-Bildschirm** → **Hinzufügen**.

Danach hast du ein App-Symbol. Beim ersten Start braucht es einmal Internet,
danach läuft es auch offline.

---

## Etwas ändern und neu hochladen

Neue `index.html` (oder eine andere Datei) im Repository öffnen → Stift-Symbol
**Edit** → Inhalt ersetzen → **Commit changes**. **Wichtig:** in `sw.js` die
Zeile `var CACHE = "naehrwert-v1";` auf `"naehrwert-v2"` (usw.) ändern, sonst
zeigt die installierte App noch die alte Version.

---

## Ohne Hosting nur schnell testen

`index.html` direkt am PC im Browser öffnen. Dann fehlt das App-Symbol und der
Offline-Cache, aber die App läuft. (Am Handy ohne Hosting geht das meist nicht.)
