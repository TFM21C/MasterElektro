
# ✅ Codex Tasks – Stromlaufplan in zusammenhängender Darstellung (Juli 2025)

Diese Datei enthält alle aktuellen Anweisungen und Spezifikationen für die Weiterentwicklung des Moduls **Stromlaufplan in zusammenhängender Darstellung**. Entwickler (auch Codex) müssen sich an diese Liste halten. Änderungen werden zentral hier gepflegt.

---

## 🔧 Aktuelle Bugs

- [ ] **PR #61 – Schalter toggelt mehrfach:**  
  → **Fix:** Schalter darf nur **einmal toggeln**, nicht mehrfach bei einem Klick.

---

## 🧩 Feature Requests

### 1. **Schalter-Skins korrekt darstellen**
Die Schalter im Stromlaufplan-Modul müssen wie folgt aussehen:

![Schalterbeispiele](/docs/codex/MusterStromlaufplanInZusammenhängenderDarstellung.png)

- ✅ **Kabel horizontal mittig** führen (damit oben & unten Platz ist)
- ✅ Schalter benötigen die typische „V-Nase“ = Drücker-Symbol
- ✅ Steckdose muss wie im Bild (Position 3) dargestellt sein
- ✅ Relais darf räumlich vom zugehörigen Schalter getrennt sein (Position 4)

---

### 2. **L / N / PE – Standardmäßig mittig platzieren**

Beim Anlegen eines neuen Projekts sollen die drei Hauptleiter:
- **horizontal**
- **mittig im Canvas**
- **mit anpassbarer Länge** (z. B. über Ziehpunkte)

angelegt werden.

---

### 3. **Steuerstromkreis-Bauteile ausblenden**

→ In diesem Modul **nicht nötig**, daher:
- [ ] Alle Bauteile aus dem Steuerstromkreis **verstecken oder filtern**

---

### 4. **Tastenkürzel & Mehrfachbearbeitung**

- [x] **ESC** → laufenden Pin-Vorgang abbrechen
- [x] **DEL** → löscht **alle markierten Bauteile gleichzeitig**

---

## ✅ Hinweis

Diese Datei ist die **Verbindliche Referenz für Codex**.  
Bitte **nicht entfernen oder umbenennen**, sondern Änderungen direkt hier ergänzen.

**Dateipfad:**  
`/docs/codex/codex-tasks-juli.md`

**Bildpfad:**  
`/docs/codex/MusterStromlaufplanInZusammenhängenderDarstellung.png`

