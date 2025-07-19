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
  onMouseUpComponent: (id: string) => void; 
  onPinClick: (componentId: string, pinName: string, pinCoords: Point) => void;
  onComponentClick: (id: string, isDoubleClick?: boolean) => void;
  onConnectionClick: (connectionId: string, clickCoords: Point) => void;
  onWaypointMouseDown: (connectionId: string, waypointIndex: number) => void;
  onWaypointDoubleClick: (connectionId: string, waypointIndex: number) => void;
  width: number;
  height: number;
  isSimulating: boolean;
  simulatedConnectionStates: { [key: string]: SimulatedConnectionState };
  simulatedComponentStates: { [key: string]: SimulatedComponentState };
  selectedConnectionId?: string | null;
  projectType?: ProjectType | null;
  snapLines?: { x: number | null; y: number | null };
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
  onWaypointMouseDown,
  onWaypointDoubleClick,
  width,
  height,
  isSimulating,
  simulatedConnectionStates,
  simulatedComponentStates,
  selectedConnectionId,
  projectType,
  snapLines
}) => {

  const getLineColor = (connection: Connection, isConducting: boolean) => {
    if (isSimulating) {
      return isConducting ? 'hsl(var(--destructive))' : 'hsl(var(--primary-foreground))';
    }
    if (projectType === "Installationsschaltplan") {
      if (connection.color === 'L1' || connection.color === 'L') return 'brown';
      if (connection.color === 'N') return 'blue';
      if (connection.color === 'PE') return 'greenyellow';
      return 'black'; 
    }
    return 'hsl(var(--primary))';
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
        
        const pathPoints = [startCoords, ...(conn.waypoints || []), endCoords];
        const linePath = pathPoints.map((p, i) => (i === 0 ? 'M' : 'L') + ` ${p.x} ${p.y}`).join(' ');

        return (
          <g key={conn.id} >
            <path
              d={linePath}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              className={isSimulating && isConducting ? "anim-stroke-flow" : ""}
              onClick={(e) => {
                 if(svgRef.current) {
                    const CTM = svgRef.current.getScreenCTM();
                    if(CTM) {
                        const svgPoint = svgRef.current.createSVGPoint();
                        svgPoint.x = e.clientX;
                        svgPoint.y = e.clientY;
                        const pointInSvg = svgPoint.matrixTransform(CTM.inverse());
                        onConnectionClick(conn.id, pointInSvg);
                    }
                 }
              }}
              style={{ cursor: 'pointer' }}
            />
            {/* Invisible wider line for easier clicking */}
            <path
              d={linePath}
              stroke="transparent"
              strokeWidth="10"
              fill="none"
              className={isSimulating && isConducting ? "anim-stroke-flow" : ""}
              onClick={(e) => {
                if(svgRef.current) {
                   const CTM = svgRef.current.getScreenCTM();
                   if(CTM) {
                       const svgPoint = svgRef.current.createSVGPoint();
                        svgPoint.x = e.clientX;
                        svgPoint.y = e.clientY;
                        const pointInSvg = svgPoint.matrixTransform(CTM.inverse());
                        onConnectionClick(conn.id, pointInSvg);
                    }
                 }
              }}
            />
             {!isSimulating && conn.waypoints?.map((wp, index) => (
                <circle
                    key={index}
                    cx={wp.x}
                    cy={wp.y}
                    r={5}
                    fill="hsl(var(--ring))"
                    stroke="white"
                    strokeWidth={2}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onWaypointMouseDown(conn.id, index);
                    }}
                     onDoubleClick={(e) => {
                        e.stopPropagation();
                        onWaypointDoubleClick(conn.id, index);
                     }}
                    style={{ cursor: 'move' }}
                />
            ))}
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

      {snapLines && snapLines.x !== null && (
        <line
          x1={snapLines.x}
          y1={0}
          x2={snapLines.x}
          y2={height}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="4 2"
        />
      )}
      {snapLines && snapLines.y !== null && (
        <line
          x1={0}
          y1={snapLines.y}
          x2={width}
          y2={snapLines.y}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="4 2"
        />
      )}
    </svg>
  );
};

export default CircuitCanvas;
