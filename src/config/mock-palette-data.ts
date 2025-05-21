
import type { PaletteComponentFirebaseData } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from './component-definitions';

export const MOCK_PALETTE_COMPONENTS: PaletteComponentFirebaseData[] = [
  // Energieversorgung
  {
    id: 'spannung_24v',
    name: '24V DC Quelle',
    type: '24V',
    abbreviation: 'G',
    defaultLabelPrefix: '+24V',
    category: 'Energieversorgung',
    description: 'Gleichspannungsquelle für den Steuerstromkreis.',
    hasToggleState: false,
    hasEditablePins: false,
    initialPinLabels: { 'out': '' },
    resizable: false,
    defaultSize: { width: COMPONENT_DEFINITIONS['24V'].width, height: COMPONENT_DEFINITIONS['24V'].height },
    simulation: {
      interactable: false,
      controlLogic: 'pass_through', // Acts as a source
      controlledBy: 'voltage', // Implicitly provides voltage
      energizePins: ['out'], // This pin provides power
    }
  },
  {
    id: 'masse_0v',
    name: '0V DC Masse',
    type: '0V',
    abbreviation: 'G',
    defaultLabelPrefix: '0V',
    category: 'Energieversorgung',
    description: 'Bezugspotential für den Steuerstromkreis.',
    hasToggleState: false,
    hasEditablePins: false,
    initialPinLabels: { 'in': '' },
    resizable: false,
    defaultSize: { width: COMPONENT_DEFINITIONS['0V'].width, height: COMPONENT_DEFINITIONS['0V'].height },
    simulation: {
      interactable: false,
      controlLogic: 'pass_through', // Acts as a sink
      controlledBy: 'voltage',
    }
  },
  // Befehlsgeräte
  {
    id: 'taster_schliesser_steuerung', // Unique ID for control circuit version
    name: 'Taster (Schließer NO)',
    type: 'Schließer', // Standard type for control circuit
    abbreviation: 'S',
    defaultLabelPrefix: 'S',
    category: 'Befehlsgeräte (Steuerstrom)',
    description: 'Schließt einen Kontakt, solange er betätigt wird. (Normally Open)',
    hasToggleState: true,
    hasEditablePins: true,
    initialPinLabels: { '13': '13', '14': '14' },
    resizable: true,
    defaultSize: { width: COMPONENT_DEFINITIONS['Schließer'].width, height: COMPONENT_DEFINITIONS['Schließer'].height },
    minScale: 0.5, maxScale: 2.0, scaleStep: 0.1,
    simulation: {
      interactable: true,
      controlLogic: 'toggle_on_press',
      controlledBy: 'user',
      initialContactState: { "13": "open", "14": "open" }, // Assuming default state for simulation
      outputPinStateOnEnergized: { "13": "closed", "14": "closed" }, // When pressed
      outputPinStateOnDeEnergized: { "13": "open", "14": "open" }, // When released
    }
  },
  {
    id: 'taster_oeffner_steuerung', // Unique ID
    name: 'Taster (Öffner NC)',
    type: 'Öffner', // Standard type
    abbreviation: 'S',
    defaultLabelPrefix: 'S',
    category: 'Befehlsgeräte (Steuerstrom)',
    description: 'Öffnet einen Kontakt, solange er betätigt wird. (Normally Closed)',
    hasToggleState: true,
    hasEditablePins: true,
    initialPinLabels: { '11': '11', '12': '12' },
    resizable: true,
    defaultSize: { width: COMPONENT_DEFINITIONS['Öffner'].width, height: COMPONENT_DEFINITIONS['Öffner'].height },
    minScale: 0.5, maxScale: 2.0, scaleStep: 0.1,
    simulation: {
      interactable: true,
      controlLogic: 'toggle_on_press',
      controlledBy: 'user',
      initialContactState: { "11": "closed", "12": "closed" },
      outputPinStateOnEnergized: { "11": "open", "12": "open" }, // When pressed
      outputPinStateOnDeEnergized: { "11": "closed", "12": "closed" }, // When released
    }
  },
  {
    id: 'not_aus_taster_steuerung', // Unique ID
    name: 'Not-Aus-Taster',
    type: 'Öffner',
    paletteIconType: 'NotAusTaster',
    abbreviation: 'S',
    defaultLabelPrefix: 'SQ',
    category: 'Befehlsgeräte (Steuerstrom)',
    description: 'Sicherheitsrelevanter Öffner mit mechanischer Verriegelung.',
    hasToggleState: true,
    hasEditablePins: true,
    initialPinLabels: { '11': '11', '12': '12' },
    resizable: true,
    defaultSize: { width: COMPONENT_DEFINITIONS['Öffner'].width, height: COMPONENT_DEFINITIONS['Öffner'].height },
    minScale: 0.8, maxScale: 1.5, scaleStep: 0.1,
    simulation: {
      interactable: true,
      controlLogic: 'toggle_on_click', // Stays pressed until manually reset (simulated by toggle)
      controlledBy: 'user',
      initialContactState: { "11": "closed", "12": "closed" },
      outputPinStateOnEnergized: { "11": "open", "12": "open" }, // When activated
      outputPinStateOnDeEnergized: { "11": "closed", "12": "closed" }, // When reset
    }
  },
  // Speichernde / Verarbeitende
  {
    id: 'schuetzspule',
    name: 'Schützspule',
    type: 'SchuetzSpule',
    abbreviation: 'K',
    defaultLabelPrefix: 'K',
    category: 'Speichernde / Verarbeitende (Steuerstrom)',
    description: 'Elektromagnetische Spule zur Ansteuerung von Kontakten.',
    hasToggleState: false,
    hasEditablePins: true,
    initialPinLabels: { 'A1': 'A1', 'A2': 'A2' },
    resizable: true,
    defaultSize: { width: COMPONENT_DEFINITIONS['SchuetzSpule'].width, height: COMPONENT_DEFINITIONS['SchuetzSpule'].height },
    minScale: 0.7, maxScale: 1.8, scaleStep: 0.1,
    simulation: {
      interactable: false,
      controlLogic: 'energize_coil',
      controlledBy: 'voltage',
      energizePins: ['A1', 'A2'],
      affectingLabel: true,
    }
  },
  {
    id: 'zeitrelais_ein',
    name: 'Zeitrelais (Einschaltverzögert)',
    type: 'ZeitRelaisEin',
    abbreviation: 'KT',
    defaultLabelPrefix: 'KT',
    category: 'Speichernde / Verarbeitende (Steuerstrom)',
    description: 'Kontakt schließt/öffnet nach Verzögerung.',
    hasToggleState: false,
    hasEditablePins: true,
    initialPinLabels: { 'A1': 'A1', 'A2': 'A2', 'T': '5s' },
    resizable: true,
    defaultSize: { width: COMPONENT_DEFINITIONS['ZeitRelaisEin'].width, height: COMPONENT_DEFINITIONS['ZeitRelaisEin'].height },
    minScale: 0.7, maxScale: 1.8, scaleStep: 0.1,
    simulation: {
      interactable: false,
      controlLogic: 'timer_on_delay',
      controlledBy: 'voltage',
      energizePins: ['A1', 'A2'],
      affectingLabel: true,
      timerDurationMs: 5000, // Default, could be parsed from 'T' label
      outputPinStateOnEnergized: {}, // Logic for contact state change after timer
      outputPinStateOnDeEnergized: {},
    }
  },
  // Stellglieder
  {
    id: 'motor_steuerung',
    name: 'Motor (Steuerstrom)',
    type: 'Motor',
    abbreviation: 'M',
    defaultLabelPrefix: 'M',
    category: 'Stellglieder (Steuerstrom)',
    description: 'Stellglied, das einen Motor repräsentiert.',
    hasToggleState: false,
    hasEditablePins: true,
    initialPinLabels: { 'A1': 'A1', 'A2': 'A2' },
    resizable: true,
    defaultSize: { width: COMPONENT_DEFINITIONS['Motor'].width, height: COMPONENT_DEFINITIONS['Motor'].height },
    minScale: 0.5, maxScale: 2.5, scaleStep: 0.1,
    simulation: {
      interactable: false,
      controlLogic: 'visualize_energized',
      controlledBy: 'voltage',
      energizePins: ['A1', 'A2'],
    }
  },
  {
    id: 'lampe_steuerung',
    name: 'Lampe / Meldeleuchte',
    type: 'Lampe',
    abbreviation: 'H',
    defaultLabelPrefix: 'H',
    category: 'Stellglieder (Steuerstrom)',
    description: 'Zeigt optisch einen Zustand an.',
    hasToggleState: false,
    hasEditablePins: true,
    initialPinLabels: { 'X1': 'X1', 'X2': 'X2' },
    resizable: true,
    defaultSize: { width: COMPONENT_DEFINITIONS['Lampe'].width, height: COMPONENT_DEFINITIONS['Lampe'].height },
    minScale: 0.5, maxScale: 2.0, scaleStep: 0.1,
    simulation: {
      interactable: false,
      controlLogic: 'visualize_energized',
      controlledBy: 'voltage',
      energizePins: ['X1', 'X2'],
    }
  },

  // Installationselemente
  {
    id: 'abzweigdose_install',
    name: 'Abzweigdose',
    type: 'Abzweigdose',
    abbreviation: 'X',
    defaultLabelPrefix: 'X',
    category: 'Installationselemente',
    description: 'Verteilerdose für Leitungen.',
    hasToggleState: false,
    hasEditablePins: false, // Pins are fixed
    initialPinLabels: { 'N': 'N', 'E': 'E', 'S': 'S', 'W': 'W' }, // Example pins
    resizable: true,
    defaultSize: { width: COMPONENT_DEFINITIONS['Abzweigdose']?.width || 50, height: COMPONENT_DEFINITIONS['Abzweigdose']?.height || 50 },
    minScale: 0.8, maxScale: 1.5, scaleStep: 0.1,
    simulation: {
      interactable: false,
      controlLogic: 'pass_through',
      controlledBy: 'voltage',
    }
  },
  {
    id: 'taster_schliesser_install',
    name: 'Taster (Installation)',
    type: 'SchliesserInstallation',
    abbreviation: 'S',
    defaultLabelPrefix: 'S',
    category: 'Installationselemente',
    description: 'Taster für Installationspläne.',
    hasToggleState: true,
    hasEditablePins: true, // Usually fixed in installation symbols but can be kept for consistency
    initialPinLabels: { 'L': 'L', 'Out': 'Out' },
    resizable: true,
    defaultSize: { width: COMPONENT_DEFINITIONS['SchliesserInstallation']?.width || 30, height: COMPONENT_DEFINITIONS['SchliesserInstallation']?.height || 30 },
    minScale: 0.8, maxScale: 1.5, scaleStep: 0.1,
    simulation: {
      interactable: true,
      controlLogic: 'toggle_on_press',
      controlledBy: 'user',
      initialContactState: { "L": "open", "Out": "open" }, // Assuming L is input, Out is output
      outputPinStateOnEnergized: { "L": "closed", "Out": "closed" },
      outputPinStateOnDeEnergized: { "L": "open", "Out": "open" },
    }
  },
  {
    id: 'lampe_install',
    name: 'Leuchte (Installation)',
    type: 'LampeInstallation',
    abbreviation: 'E',
    defaultLabelPrefix: 'E',
    category: 'Installationselemente',
    description: 'Leuchtensymbol für Installationspläne.',
    hasToggleState: false,
    hasEditablePins: true, // Usually fixed
    initialPinLabels: { 'L': 'L', 'N': 'N' },
    resizable: true,
    defaultSize: { width: COMPONENT_DEFINITIONS['LampeInstallation']?.width || 30, height: COMPONENT_DEFINITIONS['LampeInstallation']?.height || 30 },
    minScale: 0.8, maxScale: 1.5, scaleStep: 0.1,
    simulation: {
      interactable: false,
      controlLogic: 'visualize_energized',
      controlledBy: 'voltage',
      energizePins: ['L', 'N'],
    }
  },
];

export const getPaletteComponentById = (id: string | undefined): PaletteComponentFirebaseData | undefined => {
  if (!id) return undefined;
  return MOCK_PALETTE_COMPONENTS.find(p => p.id === id);
};
