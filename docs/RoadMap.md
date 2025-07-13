CircuitCraft - Roadmap (Angepasste Version)
===

## Vision
CircuitCraft ist eine kostenlose, webbasierte Lernplattform, die es Auszubildenden der Elektrotechnik ermöglicht, elektrische Schaltungen intuitiv zu entwerfen, zu simulieren und zu erlernen. Unser Ziel ist es, die bestmöglichen digitalen Werkzeuge für die Ausbildung bereitzustellen und eine Alternative zu teurer, lizenzbasierter Software zu schaffen.

## Phase 1: Kernfunktionalität & Simulation (Ziel: Vorzeigbare Version)
In dieser Phase konzentrieren wir uns auf eine einwandfreie Simulationserfahrung und die grundlegenden Schaltplantypen, um eine überzeugende und nützliche Anwendung zu schaffen.

### Priorität 1: Robuste Simulation & Editor-Verbesserungen

- [ ] Finalisierung der Simulationslogik: Überprüfung und Optimierung der Logik für alle vorhandenen Bauteile, insbesondere für Zeitrelais (ZeitRelaisEin), Schütze (SchuetzSpule) und die korrekte Ansteuerung von Kontakten (Schließer, Öffner) basierend auf dem Label. Die Simulation muss zuverlässig und nachvollziehbar sein.
- [ ] Verbesserung der Verbindungen: Einführung von manuell setzbaren Wegpunkten, um die Übersichtlichkeit komplexer Schaltungen zu verbessern.
- [ ] Einführung von Messwerkzeugen: Virtuelle Messgeräte (Voltmeter/Amperemeter) hinzufügen, um Spannungen und Ströme direkt in der Simulation zu messen und anzuzeigen.
- [ ] Visuelles Feedback: Deutlicheres visuelles Feedback während der Simulation (z.B. animierte Stromflüsse, farbliche Hervorhebung aktiver Bauteile und Leitungen).

### Priorität 2: Detaillierte Schaltplantypen

- [ ] Vollständige Implementierung der Projekttypen: Die Auswahl beim Projektstart (Hauptstromkreis, Steuerstromkreis, Übersichtsschaltplan, Stromlaufplan in zusammenhängender/aufgelöster Darstellung, Installationsschaltplan) muss die verfügbare Komponentenpalette und die Editor-Regeln (z.B. Linienfarben, Symbole) konsequent anpassen.
- [ ] Erweiterung der Komponentenbibliothek: Hinzufügen der wichtigsten Bauteile für Hauptstromkreise und Installationspläne, die über die reine Steuerungs-Logik hinausgehen (z.B. Motorschutzschalter, verschiedene Sicherungstypen, mehrpolige Schalter).
