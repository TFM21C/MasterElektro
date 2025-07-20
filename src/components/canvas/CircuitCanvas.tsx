import type React from 'react';
import DraggableComponent from '@/components/circuit/DraggableComponent';
import type { ElectricalComponent, Connection, Point, SimulatedConnectionState, SimulatedComponentState, ProjectType } from '@/types/circuit';
import { renderView } from '@/lib/view-renderer';

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
  onComponentClick: (id: string, isDoubleClick?: boolean, clickCoords?: Point) => void;
  onConnectionClick: (connectionId: string, clickCoords: Point) => void;
  onWaypointMouseDown: (connectionId: string, waypointIndex: number) => void;
  onWaypointDoubleClick: (connectionId: string, waypointIndex: number) => void;
  viewBoxWidth: number;
  viewBoxHeight: number;
  isSimulating: boolean;
  isMeasuring: boolean;
  measurements: {id: number, x: number, y: number, value: string}[];
  simulatedConnectionStates: { [key: string]: SimulatedConnectionState };
  simulatedComponentStates: { [key: string]: SimulatedComponentState };
  selectedConnectionId?: string | null;
  projectType?: ProjectType | null;
  snapLines?: { x: number | null; y: number | null };
  onCanvasMouseDown?: (e: React.MouseEvent<SVGSVGElement>) => void;
  selectionRect?: { x: number; y: number; width: number; height: number } | null;
  selectedComponentIds?: string[];
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
  viewBoxWidth,
  viewBoxHeight,
  isSimulating,
  isMeasuring,
  measurements,
  simulatedConnectionStates,
  simulatedComponentStates,
  selectedConnectionId,
  projectType,
  snapLines,
  onCanvasMouseDown,
  selectionRect,
  selectedComponentIds
}) => {

  const viewData = projectType
    ? renderView(components, connections, projectType)
    : { components, connections };
  const viewComponents = viewData.components;
  const viewConnections = viewData.connections;

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
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className="border border-border bg-card rounded-lg shadow-inner flex-grow"
      data-testid="circuit-canvas"
      style={{ cursor: isMeasuring ? 'crosshair' : undefined }}
      onMouseDown={onCanvasMouseDown}
    >
      {projectType === 'Stromlaufplan in zusammenhängender Darstellung' && (
        <g pointerEvents="none">
          <line x1="25" y1="0" x2="25" y2={viewBoxHeight} stroke="red" strokeWidth="2" />
          <line x1="45" y1="0" x2="45" y2={viewBoxHeight} stroke="blue" strokeWidth="2" />
          <line x1="65" y1="0" x2="65" y2={viewBoxHeight} stroke="greenyellow" strokeWidth="2" strokeDasharray="4 2" />
        </g>
      )}
      {viewComponents.map(comp => (
        <DraggableComponent
          key={comp.id}
          component={comp}
          onMouseDown={onMouseDownComponent}
          onMouseUp={onMouseUpComponent}
          onPinClick={onPinClick}
          onComponentClick={onComponentClick}
          connectingPin={connectingPin ? {componentId: connectingPin.componentId, pinName: connectingPin.pinName} : null}
          isSimulating={isSimulating}
          isMeasuring={isMeasuring}
          simulatedState={simulatedComponentStates[comp.id]}
          selected={selectedComponentIds?.includes(comp.id)}
        />
      ))}

      {viewConnections.map(conn => {
        const startCoords = getAbsolutePinCoordinates(conn.startComponentId, conn.startPinName);
        const endCoords = getAbsolutePinCoordinates(conn.endComponentId, conn.endPinName);

        if (!startCoords || !endCoords) return null;

        const isConducting = isSimulating && simulatedConnectionStates[conn.id]?.isConducting;
        const strokeColor = getLineColor(conn, !!isConducting);
        const strokeWidth = conn.id === selectedConnectionId && !isSimulating ? 3 : (isSimulating && isConducting ? 2.5 : 1.5);
        
        const pathPoints = [startCoords, ...(conn.waypoints || []), endCoords];
        const linePath = pathPoints.map((p, i) => (i === 0 ? 'M' : 'L') + ` ${p.x} ${p.y}`).join(' ');

        const renderOverviewTicks = () => {
          if (projectType !== 'Übersichtsschaltplan') return null;
          const num = conn.totalWires ?? conn.numberOfWires ?? 1;
          if (num < 2) return null;

          const midIndex = Math.floor(pathPoints.length / 2);
          const start = pathPoints[midIndex - 1] || pathPoints[0];
          const end = pathPoints[midIndex] || pathPoints[pathPoints.length - 1];
          const mx = (start.x + end.x) / 2;
          const my = (start.y + end.y) / 2;
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / len; // perpendicular normal
          const ny = dx / len;
          const tickLen = 6;
          const spacing = 8;

          const tickElements = Array.from({ length: num }, (_, i) => {
            const offset = (i - (num - 1) / 2) * spacing;
            const cx = mx + nx * offset;
            const cy = my + ny * offset;
            const x1 = cx - nx * tickLen / 2;
            const y1 = cy - ny * tickLen / 2;
            const x2 = cx + nx * tickLen / 2;
            const y2 = cy + ny * tickLen / 2;
            return <line key={`tick-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth={1} />;
          });

          const textX = mx + nx * ((num - 1) / 2 * spacing + 10);
          const textY = my + ny * ((num - 1) / 2 * spacing + 10);
          return (
            <g>
              {tickElements}
              <text x={textX} y={textY} fontSize="10px" fill={strokeColor}>{num}</text>
            </g>
          );
        };

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
              style={{ cursor: isMeasuring ? 'crosshair' : 'pointer' }}
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
              style={{ cursor: isMeasuring ? 'crosshair' : 'pointer' }}
            />
            {renderOverviewTicks()}
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
                    style={{ cursor: isMeasuring ? 'crosshair' : 'move' }}
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
          y2={viewBoxHeight}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="4 2"
        />
      )}
      {snapLines && snapLines.y !== null && (
        <line
          x1={0}
          y1={snapLines.y}
          x2={viewBoxWidth}
          y2={snapLines.y}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="4 2"
        />
      )}

      {selectionRect && (
        <rect
          x={selectionRect.x}
          y={selectionRect.y}
          width={selectionRect.width}
          height={selectionRect.height}
          fill="rgba(100,100,255,0.2)"
          stroke="hsl(var(--ring))"
          strokeDasharray="4 2"
        />
      )}

      {measurements.map(m => (
        <text key={m.id} x={m.x} y={m.y} fill="hsl(var(--destructive))" fontSize="12px" textAnchor="middle">
          {m.value}
        </text>
      ))}

      {/* Strompfad-Nummerierung am unteren Rand */}
      {Array.from({ length: Math.floor(viewBoxWidth / 25) }, (_, i) => i + 1).map(num => (
        <text
          key={`path-${num}`}
          x={num * 25 - 12.5}
          y={viewBoxHeight - 5}
          fontSize="10px"
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
        >
          {num}
        </text>
      ))}
    </svg>
  );
};

export default CircuitCanvas;
