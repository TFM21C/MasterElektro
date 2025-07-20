
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
    displayPinLabels?: Record<string, string>,
    simulatedState?: SimulatedComponentState, // Added for simulation
    componentId?: string // Added for simulation, if needed by render
  ) => JSX.Element;
  pins?: Record<string, PinDefinition>;
  initialState?: ComponentState;
  initialDisplayPinLabels?: Record<string, string>;
}

export interface PaletteComponentSimulationConfig {
  interactable: boolean;
  controlLogic: 'toggle_on_press' | 'toggle_on_click' | 'energize_coil' | 'visualize_energized' | 'timer_on_delay' | 'timer_off_delay' | 'pass_through' | 'fixed_open' | 'fixed_closed';
  controlledBy?: 'user' | 'voltage' | 'label_match';
  initialContactState?: { [pinId: string]: 'open' | 'closed' };
  affectingLabel?: boolean; // For coils, true if they affect contacts with the same label
  energizePins?: string[]; // Pins that need voltage to energize the component
  outputPinStateOnEnergized?: { [pinId: string]: 'open' | 'closed' }; // For contacts/switches
  outputPinStateOnDeEnergized?: { [pinId: string]: 'open' | 'closed' }; // For contacts/switches
  timerDurationMs?: number; // For timer relays
  timerPin?: string; // Pin holding the timer value if applicable
}

export interface PaletteComponentFirebaseData {
  id: string;
  name: string;
  type: string;
  abbreviation: string;
  defaultLabelPrefix: string;
  category: string;
  description: string;
  hasToggleState: boolean; // Consider removing if covered by simulation config
  hasEditablePins: boolean;
  initialPinLabels: Record<string, string>;
  paletteIconType?: string;

  voltageType?: 'DC_POSITIVE' | 'DC_NEGATIVE' | 'AC_L' | 'NEUTRAL' | 'PE';

  resizable?: boolean;
  defaultSize?: { width: number; height: number };
  minScale?: number;
  maxScale?: number;
  scaleStep?: number;

  simulation?: PaletteComponentSimulationConfig; // Added for simulation
}

export interface ElectricalComponent {
  id: string;
  type: string;
  firebaseComponentId: string; // ID from PaletteComponentFirebaseData
  x: number;
  y: number;
  label: string;
  state?: ComponentState; // Base state
  displayPinLabels?: Record<string, string>;

  scale?: number;
  width?: number | null;
  height?: number | null;
}

export type Point = { x: number; y: number };

export interface Connection {
  id:string;
  startComponentId: string;
  startPinName: string;
  endComponentId: string;
  endPinName: string;
  color?: string; // For Installationsschaltplan
  numberOfWires?: number; // For Installationsschaltplan
  waypoints?: Point[]; // For Installationsschaltplan
}

export const ProjectTypes = [
  "Hauptstromkreis",
  "Steuerstromkreis",
  "Übersichtsschaltplan",
  "Stromlaufplan in zusammenhängender Darstellung",
  "Stromlaufplan in aufgelöster Darstellung",
  "Installationsschaltplan", // Added new project type
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
  isSimulating?: boolean; // Added for simulation state persistence
}

// Simulation-specific states (managed in frontend, not directly in ProjectData for Firebase in this iteration)
export interface SimulatedComponentState {
  isEnergized?: boolean;
  currentContactState?: { [pinName: string]: 'open' | 'closed' };
  timerRemaining?: number | null;
  timerActive?: boolean;
  isLocked?: boolean; // e.g. for Not-Aus
  // Any other dynamic state during simulation
}

export interface SimulatedConnectionState {
  isConducting: boolean;
}
