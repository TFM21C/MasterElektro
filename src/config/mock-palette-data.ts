import type { PaletteComponentFirebaseData } from '@/types/circuit';

export const MOCK_PALETTE_COMPONENTS: PaletteComponentFirebaseData[] = [
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
  },
  {
    id: 'taster_schliesser',
    name: 'Taster (Schließer NO)',
    type: 'Schließer',
    abbreviation: 'S',
    defaultLabelPrefix: 'S',
    category: 'Befehlsgeräte',
    description: 'Schließt einen Kontakt, solange er betätigt wird. (Normally Open)',
    hasToggleState: true,
    hasEditablePins: true,
    initialPinLabels: { '13': '13', '14': '14' },
  },
  {
    id: 'taster_oeffner',
    name: 'Taster (Öffner NC)',
    type: 'Öffner',
    abbreviation: 'S',
    defaultLabelPrefix: 'S',
    category: 'Befehlsgeräte',
    description: 'Öffnet einen Kontakt, solange er betätigt wird. (Normally Closed)',
    hasToggleState: true,
    hasEditablePins: true,
    initialPinLabels: { '11': '11', '12': '12' },
  },
  {
    id: 'not_aus_taster',
    name: 'Not-Aus-Taster',
    type: 'Öffner', // Uses Öffner rendering logic on canvas
    paletteIconType: 'NotAusTaster', // Specific icon for palette
    abbreviation: 'S',
    defaultLabelPrefix: 'SQ',
    category: 'Befehlsgeräte',
    description: 'Sicherheitsrelevanter Öffner mit mechanischer Verriegelung. Zur Notabschaltung.',
    hasToggleState: true, // Typically latching, but can be simplified for now
    hasEditablePins: true,
    initialPinLabels: { '11': '11', '12': '12' },
  },
  {
    id: 'schuetzspule',
    name: 'Schützspule',
    type: 'SchuetzSpule',
    abbreviation: 'K',
    defaultLabelPrefix: 'K',
    category: 'Speichernde / Verarbeitende',
    description: 'Elektromagnetische Spule zur Ansteuerung von Leistungskontakten.',
    hasToggleState: false,
    hasEditablePins: true,
    initialPinLabels: { 'A1': 'A1', 'A2': 'A2' },
  },
  {
    id: 'zeitrelais_ein',
    name: 'Zeitrelais (Einschaltverzögert)',
    type: 'ZeitRelaisEin',
    abbreviation: 'KT',
    defaultLabelPrefix: 'KT',
    category: 'Speichernde / Verarbeitende',
    description: 'Kontakt schließt/öffnet nach einer einstellbaren Verzögerungszeit.',
    hasToggleState: false, // The coil itself doesn't toggle, its contacts do (not modeled yet)
    hasEditablePins: true, // A1/A2 for coil, T for time setting
    initialPinLabels: { 'A1': 'A1', 'A2': 'A2', 'T': '5s' },
  },
  {
    id: 'motor_steuerung', // Changed id to avoid conflict if 'Motor' is also for power
    name: 'Motor (Steuerstrom)',
    type: 'Motor', // Could be a smaller representation or a generic coil if only for control circuit
    abbreviation: 'M',
    defaultLabelPrefix: 'M',
    category: 'Stellglieder',
    description: 'Stellglied, das einen Motor im Hauptstromkreis repräsentiert.',
    hasToggleState: false,
    hasEditablePins: true,
    // For control circuit, typically A1/A2 for the contactor coil that controls the motor
    initialPinLabels: { 'A1': 'A1', 'A2': 'A2' },
  },
  {
    id: 'lampe',
    name: 'Lampe / Meldeleuchte',
    type: 'Lampe',
    abbreviation: 'H',
    defaultLabelPrefix: 'H',
    category: 'Stellglieder',
    description: 'Zeigt optisch einen Zustand an.',
    hasToggleState: false,
    hasEditablePins: true,
    initialPinLabels: { 'X1': 'X1', 'X2': 'X2' },
  },
];

// Helper to find a palette component by its firebase ID
export const getPaletteComponentById = (id: string): PaletteComponentFirebaseData | undefined => {
  return MOCK_PALETTE_COMPONENTS.find(p => p.id === id);
};
