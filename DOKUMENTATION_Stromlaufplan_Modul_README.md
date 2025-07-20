
# Modul: Stromlaufplan in zusammenhängender Darstellung

Dieses Repository dokumentiert die visuelle, technische und funktionale Spezifikation für das Modul **„Stromlaufplan in zusammenhängender Darstellung“**. Ziel ist es, angehenden Elektrikern eine digitale Simulationsumgebung zur Verfügung zu stellen, die sich an der Ausbildungspraxis orientiert und den Zugriff auf wichtige Werkzeuge wie FluidSIM ergänzt oder ersetzt.

---

## 📄 Inhalte

| Abschnitt | Beschreibung |
|----------|--------------|
| `Stromlaufplan_Modul_Komplett.pdf` | Die zusammengeführte Hauptdokumentation mit Erklärung, Musterplänen, Bauteilbeschreibung und Deep Research zu FluidSIM |
| `Inhaltsverzeichnis_Stromlaufplan_Modul.pdf` | Navigierbares Inhaltsverzeichnis der o. g. PDF |
| `/skizzen` (optional) | Eigene Zeichnungen & Annotierungen zur Visualisierung des Layouts |

---

## ✅ Spezifikation: Stromlaufplan (Modulbeschreibung)

**Leiter-Vorgabe beim Start:**
- L (rot), N (blau), PE (grün-gelb) – vertikal, am linken Rand
- Optional: zuschaltbares Karopapier als Planungsraster (5x5mm)

**Bauteile mit Symbolpflicht (grafische Darstellung in PDF):**
- Sicherung
- Ausschalter, Serienschalter, Wechselschalter, Kreuzschalter
- Taster
- Lampe
- Steckdose
- Relais / Stromstoßschalter (inkl. A1/A2 & Kontakte)
- Abzweigdose (hilfsmittelsymbol)

**Simulation**
- Kurzschluss-Erkennung (L direkt auf N/PE ohne Last → Fehler)
- Fehler-Panel mit Fehlermeldungen im Klartext

### Bauteil-Bibliothek
- Linkes Flyout-Menü mit Drag-&-Drop-Unterstützung
- Zeigt ausschließlich Bauteile des ZD-Moduls

---

## 💡 Ziel

> Die Digitalisierung der Ausbildung zum Elektroniker für Energie- und Gebäudetechnik.  
> Kostenlos, praxisnah und erweiterbar.

Dieses Projekt soll es Azubis ermöglichen, ohne teure Lizenzen zu üben, zu lernen und eigene Stromlaufpläne digital zu entwickeln und zu simulieren.

---

## 🤖 CodeX & Gemini

Diese Dokumentation dient als **Referenz für KI-unterstützte Entwicklung**.  
Jede visuelle und funktionale Anforderung an den Editor und die Simulation ist in der Dokumentation definiert und kann zur automatischen Generierung von Code-Komponenten verwendet werden.

---

## 🛠️ Nächstes Ziel

- Interaktive Platzierung von Bauteilen im Canvas
- Leitungsverbindung per Drag & Drop
- Funktionstests und Simulation

---

## 🔖 Lizenz

Dieses Projekt folgt dem Grundsatz „Bildung ist kostenlos“ – die Inhalte dürfen frei verwendet, verbessert und verteilt werden (MIT License).
