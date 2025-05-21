export interface PinDefinition {
  x: number;
  y: number;
  label: string;
}

export interface ComponentState {
  isOpen?: boolean;
  isClosed?: boolean;
  // Add other state properties as needed
}

export interface ComponentDefinition {
  width: number;
  height: number;
  render: (
    label: string,
    state?: ComponentState,
    displayPinLabels?: Record<string, string>
  ) => JSX.Element;
  pins: Record<string, PinDefinition>;
  initialState?: ComponentState;
  initialDisplayPinLabels?: Record<string, string>; // Kept for legacy or direct definition if needed
}

// New type for data structure mimicking Firebase paletteComponents
export interface PaletteComponentFirebaseData {
  id: string; // e.g., 'schliesser', 'spannung_24v'
  name: string; // Display name for palette, e.g., "Taster (Schließer NO)"
  type: string; // Internal type for rendering, e.g., "Schließer", "SchuetzSpule"
  abbreviation: string; // e.g., "S", "K", "H"
  defaultLabelPrefix: string; // e.g., "S", "K", "+24V"
  category: string; // For grouping in palette, e.g., "Befehlsgeräte"
  description: string; // Short description
  hasToggleState: boolean; // If component state can be toggled by click
  hasEditablePins: boolean; // If pin labels are editable
  initialPinLabels: Record<string, string>; // Default pin labels, e.g., {"13": "13", "14": "14"}
  // Potentially add a field for specific palette icon rendering if different from canvas type
  paletteIconType?: string; // e.g. 'NotAusTasterIcon' if different from 'Öffner'
}

export interface ElectricalComponent {
  id: string; // Unique instance ID on canvas
  type: string; // Corresponds to key in COMPONENT_DEFINITIONS and paletteComponent.type
  firebaseComponentId: string; // The 'id' from the paletteComponents (e.g., 'schliesser')
  x: number;
  y: number;
  label: string;
  state?: ComponentState;
  displayPinLabels?: Record<string, string>; // User-defined pin labels
}

export type Point = { x: number; y: number };

export interface Connection {
  id: string;
  startComponentId: string;
  startPinName: string;
  endComponentId: string;
  endPinName: string;
}

export const ProjectTypes = [
  "Hauptstromkreis",
  "Steuerstromkreis",
  "Übersichtsschaltplan",
  "Stromlaufplan in zusammenhängender Darstellung",
  "Stromlaufplan in aufgelöster Darstellung",
] as const;

export type ProjectType = (typeof ProjectTypes)[number];

export interface ProjectData {
  id: string;
  projectName: string;
  projectType: ProjectType;
  creatorName?: string;
  createdAt: Date;
  lastModified: Date;
  components: ElectricalComponent[];
  connections: Connection[];
}