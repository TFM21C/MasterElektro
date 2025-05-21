
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
  width: number; // Represents the base, unscaled width
  height: number; // Represents the base, unscaled height
  render: (
    label: string,
    state?: ComponentState,
    displayPinLabels?: Record<string, string>
  ) => JSX.Element;
  pins: Record<string, PinDefinition>;
  initialState?: ComponentState;
  initialDisplayPinLabels?: Record<string, string>;
}

// New type for data structure mimicking Firebase paletteComponents
export interface PaletteComponentFirebaseData {
  id: string; 
  name: string; 
  type: string; 
  abbreviation: string; 
  defaultLabelPrefix: string; 
  category: string; 
  description: string; 
  hasToggleState: boolean; 
  hasEditablePins: boolean; 
  initialPinLabels: Record<string, string>; 
  paletteIconType?: string;

  // New fields for resizing
  resizable?: boolean;
  defaultSize?: { width: number; height: number };
  minScale?: number;
  maxScale?: number;
  scaleStep?: number;
}

export interface ElectricalComponent {
  id: string; 
  type: string; 
  firebaseComponentId: string; 
  x: number;
  y: number;
  label: string;
  state?: ComponentState;
  displayPinLabels?: Record<string, string>; 

  // New fields for resizing
  scale?: number; // Scaling factor, e.g., 1.0 for original, 1.2 for 120%
  width?: number | null; // Optional explicit width, overrides scale for width if set
  height?: number | null; // Optional explicit height, overrides scale for height if set
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
