import type React from 'react';
import DraggableComponent from '@/components/circuit/DraggableComponent';
import type { ElectricalComponent, Connection, Point } from '@/types/circuit';

interface CircuitCanvasProps {
  svgRef: React.RefObject<SVGSVGElement>;
  components: ElectricalComponent[];
  connections: Connection[];
  connectingPin: { componentId: string; pinName: string; coords: Point } | null;
  currentMouseSvgCoords: Point | null;
  getAbsolutePinCoordinates: (componentId: string, pinName: string) => Point | null;
  onMouseDownComponent: (e: React.MouseEvent<SVGGElement>, id: string) => void;
  onPinClick: (componentId: string, pinName: string, pinCoords: Point) => void;
  onComponentClick: (id: string, isDoubleClick?: boolean) => void;
  onConnectionContextMenu: (e: React.MouseEvent<SVGLineElement>, connectionId: string) => void;
  width: number;
  height: number;
}

const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  svgRef,
  components,
  connections,
  connectingPin,
  currentMouseSvgCoords,
  getAbsolutePinCoordinates,
  onMouseDownComponent,
  onPinClick,
  onComponentClick,
  onConnectionContextMenu,
  width,
  height
}) => {
  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="border border-border bg-card rounded-lg shadow-inner flex-grow" // Changed bg-background to bg-card
      data-testid="circuit-canvas"
    >
      {/* SVG Styles are in globals.css now */}

      {/* Render Components */}
      {components.map(comp => (
        <DraggableComponent
          key={comp.id}
          component={comp}
          onMouseDown={onMouseDownComponent}
          onPinClick={onPinClick}
          onComponentClick={onComponentClick}
          connectingPin={connectingPin ? {componentId: connectingPin.componentId, pinName: connectingPin.pinName} : null}
        />
      ))}

      {/* Render Connections */}
      {connections.map(conn => {
        const startCoords = getAbsolutePinCoordinates(conn.startComponentId, conn.startPinName);
        const endCoords = getAbsolutePinCoordinates(conn.endComponentId, conn.endPinName);

        if (!startCoords || !endCoords) return null;

        // Calculate midpoint for the invisible wider line for easier clicking
        const midX = (startCoords.x + endCoords.x) / 2;
        const midY = (startCoords.y + endCoords.y) / 2;
        const length = Math.sqrt(Math.pow(endCoords.x - startCoords.x, 2) + Math.pow(endCoords.y - startCoords.y, 2));
        const angle = Math.atan2(endCoords.y - startCoords.y, endCoords.x - startCoords.x) * 180 / Math.PI;


        return (
          <g key={conn.id} onContextMenu={(e) => onConnectionContextMenu(e as any, conn.id)} style={{ cursor: 'pointer' }}>
             {/* Invisible wider line for easier context menu triggering */}
            <line
              x1={startCoords.x}
              y1={startCoords.y}
              x2={endCoords.x}
              y2={endCoords.y}
              stroke="transparent"
              strokeWidth="10" // Wider stroke for easier interaction
            />
            {/* Visible line */}
            <line
              x1={startCoords.x}
              y1={startCoords.y}
              x2={endCoords.x}
              y2={endCoords.y}
              className="line stroke-[hsl(var(--primary))] stroke-2"
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      })}
      
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
        </marker>
      </defs>

      {/* Render temporary connection line while connecting */}
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
