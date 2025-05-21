
import type React from 'react';
import DraggableComponent from '@/components/circuit/DraggableComponent';
import type { ElectricalComponent, Connection, Point, SimulatedConnectionState, SimulatedComponentState, ProjectType } from '@/types/circuit';

interface CircuitCanvasProps {
  svgRef: React.RefObject<SVGSVGElement>;
  components: ElectricalComponent[];
  connections: Connection[];
  connectingPin: { componentId: string; pinName: string; coords: Point } | null;
  currentMouseSvgCoords: Point | null;
  getAbsolutePinCoordinates: (componentId: string, pinName: string) => Point | null;
  onMouseDownComponent: (e: React.MouseEvent<SVGGElement>, id: string) => void;
  onMouseUpComponent: (id: string) => void; // For simulation interaction
  onPinClick: (componentId: string, pinName: string, pinCoords: Point) => void;
  onComponentClick: (id: string, isDoubleClick?: boolean) => void;
  onConnectionClick: (connectionId: string) => void; // For selecting connection to show in sidebar
  width: number;
  height: number;
  isSimulating: boolean;
  simulatedConnectionStates: { [key: string]: SimulatedConnectionState };
  simulatedComponentStates: { [key: string]: SimulatedComponentState };
  selectedConnectionId?: string | null;
  projectType?: ProjectType | null;
}

const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  svgRef,
  components,
  connections,
  connectingPin,
  currentMouseSvgCoords,
  getAbsolutePinCoordinates,
  onMouseDownComponent,
  onMouseUpComponent,
  onPinClick,
  onComponentClick,
  onConnectionClick,
  width,
  height,
  isSimulating,
  simulatedConnectionStates,
  simulatedComponentStates,
  selectedConnectionId,
  projectType
}) => {

  const getLineColor = (connection: Connection, isConducting: boolean) => {
    if (isSimulating) {
      return isConducting ? 'hsl(var(--destructive))' : 'hsl(var(--primary-foreground))'; // Red for conducting, standard for not
    }
    if (projectType === "Installationsschaltplan") {
      if (connection.color === 'L1' || connection.color === 'L') return 'brown';
      if (connection.color === 'N') return 'blue';
      if (connection.color === 'PE') return 'greenyellow'; // Typically green-yellow
      return 'black'; // Default for installation plan
    }
    return 'hsl(var(--primary))'; // Default for other plans
  };


  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="border border-border bg-card rounded-lg shadow-inner flex-grow"
      data-testid="circuit-canvas"
    >
      {components.map(comp => (
        <DraggableComponent
          key={comp.id}
          component={comp}
          onMouseDown={onMouseDownComponent}
          onMouseUp={onMouseUpComponent}
          onPinClick={onPinClick}
          onComponentClick={onComponentClick}
          connectingPin={connectingPin ? {componentId: connectingPin.componentId, pinName: connectingPin.pinName} : null}
          isSimulating={isSimulating}
          simulatedState={simulatedComponentStates[comp.id]}
        />
      ))}

      {connections.map(conn => {
        const startCoords = getAbsolutePinCoordinates(conn.startComponentId, conn.startPinName);
        const endCoords = getAbsolutePinCoordinates(conn.endComponentId, conn.endPinName);

        if (!startCoords || !endCoords) return null;

        const isConducting = isSimulating && simulatedConnectionStates[conn.id]?.isConducting;
        const strokeColor = getLineColor(conn, !!isConducting);
        const strokeWidth = conn.id === selectedConnectionId && !isSimulating ? 3 : (isSimulating && isConducting ? 2.5 : 1.5);
        
        let linePath = `M ${startCoords.x} ${startCoords.y}`;
        if (conn.waypoints && conn.waypoints.length > 0) {
            conn.waypoints.forEach(wp => {
                linePath += ` L ${wp.x} ${wp.y}`;
            });
        }
        linePath += ` L ${endCoords.x} ${endCoords.y}`;

        const wireSymbols = [];
        if (projectType === "Installationsschaltplan" && conn.numberOfWires && conn.numberOfWires > 1) {
            const numWires = conn.numberOfWires;
            // Calculate midpoint and angle for a representative segment (e.g., start to end, or middle waypoint segment)
            let p1 = startCoords;
            let p2 = conn.waypoints && conn.waypoints.length > 0 ? conn.waypoints[0] : endCoords;
            if (conn.waypoints && conn.waypoints.length > 1) { // Use a middle segment if many waypoints
                const midIndex = Math.floor(conn.waypoints.length / 2);
                p1 = conn.waypoints[midIndex -1] || startCoords;
                p2 = conn.waypoints[midIndex];
            }


            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x); // Angle of the segment
            const symbolOffset = 5; // How far from the line center the symbols start
            const symbolLength = 8; // Length of each wire symbol line
            const symbolSpacing = 2.5; // Spacing between wire symbols

            for (let i = 0; i < numWires; i++) {
                // Position for each wire symbol perpendicular to the line
                const perpX = Math.sin(angle) * (symbolOffset + i * symbolSpacing - (numWires-1)*symbolSpacing/2) ;
                const perpY = -Math.cos(angle) * (symbolOffset + i * symbolSpacing - (numWires-1)*symbolSpacing/2);

                wireSymbols.push(
                    <line
                        key={`wire-${conn.id}-${i}`}
                        x1={midX + perpX - Math.cos(angle) * symbolLength / 2}
                        y1={midY + perpY - Math.sin(angle) * symbolLength / 2}
                        x2={midX + perpX + Math.cos(angle) * symbolLength / 2}
                        y2={midY + perpY + Math.sin(angle) * symbolLength / 2}
                        stroke={strokeColor}
                        strokeWidth="1"
                    />
                );
            }
        }


        return (
          <g key={conn.id} onClick={() => onConnectionClick(conn.id)} style={{ cursor: 'pointer' }}>
            <path
              d={linePath}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={isSimulating && isConducting ? "4 2" : "none"} // Dashed if conducting in sim
            />
            {wireSymbols}
            {/* Invisible wider line for easier clicking, if path is complex, this might need adjustment */}
            <path
              d={linePath}
              stroke="transparent"
              strokeWidth="10"
              fill="none"
            />
          </g>
        );
      })}

      {connectingPin && currentMouseSvgCoords && connectingPin.coords && (
        <line
          x1={connectingPin.coords.x}
          y1={connectingPin.coords.y}
          x2={currentMouseSvgCoords.x}
          y2={currentMouseSvgCoords.y}
          className="line stroke-[hsl(var(--ring))] stroke-2"
          strokeDasharray="5,5"
        />
      )}
    </svg>
  );
};

export default CircuitCanvas;
