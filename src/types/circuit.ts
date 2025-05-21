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
  initialDisplayPinLabels?: Record<string, string>;
}

export interface ElectricalComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  label: string;
  state?: ComponentState;
  displayPinLabels?: Record<string, string>;
}

export interface Connection {
  id: string;
  startComponentId: string;
  startPinName: string;
  endComponentId: string;
  endPinName: string;
}

export type Point = { x: number; y: number };
