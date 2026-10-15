/* Verbindung zur Zentrale (Cardinal, D:\Claude\cardinal)
 *
 * Gleicht die Nährwert-Daten (alle naehrwert.*-Einträge) zwischen Geräten ab und meldet
 * der Zentrale die Tages-kcal. Fotos bleiben auf dem Gerät, auf dem sie gemacht wurden.
 *
 * Automatisch an, wenn die App über die Zentrale läuft (…/apps/naehrwert/).
 * Sonst einmal mit ?zentrale=http://localhost:8090 (und vom Handy &schluessel=…) öffnen.
 */
(function () {
  "use strict";

  var KEY = "naehrwert.cardinal";
  var PRAEFIX = "naehrwert.";
  var NUR_HIER = { "naehrwert.cardinal": 1, "naehrwert.theme": 1, "naehrwert.heuteCollapsed": 1 };
  var LS;
  try { LS = window.localStorage; } catch (e) { return; }

  function cfg() { try { return JSON.parse(LS.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function setze(f) {
    var c = cfg();
    Object.keys(f).forEach(function (k) { if (f[k] === undefined) delete c[k]; else c[k] = f[k]; });
    LS.setItem(KEY, JSON.stringify(c));
  }

  // ?zentrale=…&schluessel=… übernehmen und aus der Adresse entfernen
  (function () {
    var u = new URL(location.href), z = u.searchParams.get("zentrale"), s = u.searchParams.get("schluessel");
    if (!z && !s) return;
    if (z) setze({ url: z.replace(/\/+$/, ""), version: undefined, hash: undefined });
    if (s) setze({ schluessel: s });
    u.searchParams.delete("zentrale"); u.searchParams.delete("schluessel");
    history.replaceState(null, "", u.pathname + u.search + u.hash);
  })();

  var unterZentrale = /\/apps\/naehrwert\//.test(location.pathname);
  function adresse() { var c = cfg(); return c.url || (unterZentrale ? location.origin : ""); }
  if (!adresse() || cfg().aus) return;

  function api(pfad, daten) {
    var c = cfg(), opt = { method: daten ? "POST" : "GET", headers: {} };
    if (c.schluessel) opt.headers["x-schluessel"] = c.schluessel;
    if (daten) { opt.headers["content-type"] = "application/json"; opt.body = JSON.stringify(daten); }
    return fetch(adresse() + pfad, opt).then(function (r) {
      return r.json().then(function (x) { if (!r.ok) throw new Error(x && x.fehler || r.status); return x; });
    });
  }

  /* ---------- Stand ---------- */
  function stand() {
    var s = {};
    for (var i = 0; i < LS.length; i++) {
      var k = LS.key(i);
      if (!k || k.indexOf(PRAEFIX) !== 0 || NUR_HIER[k]) continue;
      var v;
      try { v = JSON.parse(LS.getItem(k)); } catch (e) { continue; }
      if (k.indexOf("naehrwert.log.") === 0 && Array.isArray(v)) {
        v = v.map(function (x) { var y = {}; for (var p in x) if (p !== "img") y[p] = x[p]; return y; });
      }
      s[k] = v;
    }
    return s;
  }
  function sortiert(s) {
    var o = {};
    Object.keys(s).sort().forEach(function (k) { o[k] = s[k]; });
    return JSON.stringify(o);
  }
  function pruefwert(t) {
    var h = 5381;
    for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
    return (h >>> 0).toString(16) + "-" + t.length;
  }
  function leer(s) {
    return !Object.keys(s).some(function (k) { return k.indexOf("naehrwert.log.") === 0 && s[k].length; });
  }

  function uebernehmen(s) {
    // Fotos der eigenen Einträge behalten
    var fotos = {};
    Object.keys(stand()).forEach(function (k) {
      if (k.indexOf("naehrwert.log.") !== 0) return;
      try { (JSON.parse(LS.getItem(k)) || []).forEach(function (x) { if (x.img) fotos[x.id] = x.img; }); } catch (e) { /* egal */ }
    });
    var weg = [];
    for (var i = 0; i < LS.length; i++) {
      var k = LS.key(i);
      if (k && k.indexOf(PRAEFIX) === 0 && !NUR_HIER[k] && !(k in s)) weg.push(k);
    }
    weg.forEach(function (k) { LS.removeItem(k); });
    Object.keys(s).forEach(function (k) {
      var v = s[k];
      if (k.indexOf("naehrwert.log.") === 0 && Array.isArray(v)) v = v.map(function (x) { if (fotos[x.id]) x.img = fotos[x.id]; return x; });
      try { LS.setItem(k, JSON.stringify(v)); } catch (e) { /* voll */ }
    });
  }

  function zusammenfassung(s) {
    var heute = new Date().toISOString().slice(0, 10);
    var log = s["naehrwert.log." + heute] || [];
    var woche = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
      woche.push((s["naehrwert.log." + d] || []).reduce(function (a, x) { return a + (x.kcal || 0); }, 0));
    }
    return {
      leer: leer(s),
      tag: new Date().toLocaleDateString("sv-SE"),
      kcal: log.reduce(function (a, x) { return a + (x.kcal || 0); }, 0),
      ziel: s["naehrwert.goal"] || 2000,
      eintraege: log.length,
      essen: log.map(function (x) { return x.name + " (" + x.kcal + " kcal)"; }),
      woche: woche,
      tageMitEintrag: Object.keys(s).filter(function (k) { return k.indexOf("naehrwert.log.") === 0 && s[k].length; }).length
    };
  }

  /* ---------- Abgleich (gleiche Regeln wie in LevelUp) ---------- */
  var laeuft = false;
  function abgleichen() {
    if (laeuft || cfg().aus) return Promise.resolve();
    laeuft = true;
    var s = stand(), h = pruefwert(sortiert(s)), c = cfg();
    if (h !== c.lokalHash) setze({ lokalHash: h, geaendertAm: h !== c.hash ? Date.now() : c.geaendertAm });
    c = cfg();
    function hoch(erzwingen) {
      return api("/api/abgleich/naehrwert", { stand: s, hash: h, geraet: (/Android|iPhone/.test(navigator.userAgent) ? "Handy" : "PC") + " · " + location.host,
        basis: c.version || 0, zusammenfassung: zusammenfassung(s), erzwingen: !!erzwingen })
        .then(function (r) { if (r.ok) setze({ version: r.version, hash: h, lokalHash: h, geaendertAm: undefined }); });
    }
    function runter() {
      return api("/api/abgleich/naehrwert").then(function (r) {
        if (!r || !r.stand) return;
        uebernehmen(r.stand);
        var neu = pruefwert(sortiert(stand()));
        setze({ version: r.version, hash: neu, lokalHash: neu, geaendertAm: undefined });
        location.reload();   // die App liest ihre Daten nur beim Start
      });
    }
    return api("/api/abgleich/naehrwert/info").then(function (info) {
      if (info.hash === h) {
        setze({ version: info.version, hash: h });
        var z = info.zusammenfassung;
        if (!z || z.tag !== new Date().toLocaleDateString("sv-SE") || Date.now() - (c.zusammenAm || 0) > 10 * 60000) {
          setze({ zusammenAm: Date.now() });
          return api("/api/abgleich/naehrwert/zusammenfassung", { zusammenfassung: zusammenfassung(s) });
        }
        return;
      }
      var lokal = h !== c.hash, fern = info.version !== (c.version || 0);
      var fernLeer = !info.version || !!(info.zusammenfassung && info.zusammenfassung.leer);
      if (!info.version) return leer(s) ? null : hoch();
      if (!c.version) {
        if (leer(s)) return fernLeer ? null : runter();
        if (fernLeer) return hoch(true);
        return window.confirm("In der Zentrale liegt schon ein Nährwert-Stand. Den übernehmen? (Abbrechen = deinen Stand hier hochladen)") ? runter() : hoch(true);
      }
      if (lokal && !fern) return hoch();
      if (fern && !lokal) return runter();
      return (cfg().geaendertAm || 0) > Date.parse(info.zeit) ? hoch(true) : runter();
    }).catch(function () { /* Zentrale gerade nicht erreichbar – später nochmal */ })
      .then(function () { laeuft = false; });
  }

  setTimeout(abgleichen, 1500);
  setInterval(function () { if (!document.hidden) abgleichen(); }, 20000);
  document.addEventListener("visibilitychange", abgleichen);
})();
