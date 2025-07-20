
import React from 'react';
import { COMPONENT_DEFINITIONS } from '@/config/component-definitions';
import type { ElectricalComponent, Point, SimulatedComponentState } from '@/types/circuit';

interface DraggableComponentProps {
  component: ElectricalComponent;
  onMouseDown: (e: React.MouseEvent<SVGGElement>, id: string) => void;
  onMouseUp: (id: string) => void;
  onPinClick: (componentId: string, pinName: string, pinCoords: Point) => void;
  onComponentClick: (id: string, isDoubleClick?: boolean, clickCoords?: Point) => void;
  connectingPin: { componentId: string; pinName: string } | null;
  isSimulating?: boolean;
  isMeasuring?: boolean;
  simulatedState?: SimulatedComponentState;
  selected?: boolean;
  highlighted?: boolean;
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  onMouseDown,
  onMouseUp,
  onPinClick,
  onComponentClick,
  connectingPin,
  isSimulating,
  isMeasuring,
  simulatedState,
  selected,
  highlighted,
}) => {
  const definition = COMPONENT_DEFINITIONS[component.type];
  if (!definition) return null;

  const handleComponentMouseDown = (e: React.MouseEvent<SVGGElement>) => {
    if (!(e.target instanceof SVGElement && e.target.classList.contains('pin-circle'))) {
      onMouseDown(e, component.id);
    }
  };
  
  const handleComponentClick = (e: React.MouseEvent<SVGGElement>) => {
    if (!(e.target instanceof SVGElement && e.target.classList.contains('pin-circle'))) {
      const svg = (e.currentTarget as SVGGElement).ownerSVGElement;
      let coords: Point | undefined;
      if (svg) {
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const local = pt.matrixTransform(ctm.inverse());
          coords = { x: local.x, y: local.y };
        }
      }
      onComponentClick(component.id, false, coords);
    }
  };

  const handleComponentMouseUp = () => {
    onMouseUp(component.id);
  };

  const handleComponentDoubleClick = (e: React.MouseEvent<SVGGElement>) => {
    if (!(e.target instanceof SVGElement && e.target.classList.contains('pin-circle'))) {
      const svg = (e.currentTarget as SVGGElement).ownerSVGElement;
      let coords: Point | undefined;
      if (svg) {
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const local = pt.matrixTransform(ctm.inverse());
          coords = { x: local.x, y: local.y };
        }
      }
      onComponentClick(component.id, true, coords);
    }
  };

  const scale = component.scale || 1;
  const width = (component.width ?? definition.width) * scale;
  const height = (component.height ?? definition.height) * scale;

  return (
    <g
      transform={`translate(${component.x}, ${component.y}) scale(${scale})`}
      onMouseDown={isSimulating ? undefined : handleComponentMouseDown}
      onMouseUp={isSimulating ? undefined : handleComponentMouseUp}
      onClick={handleComponentClick}
      onDoubleClick={isSimulating ? undefined : handleComponentDoubleClick}
      style={{ cursor: isMeasuring ? 'crosshair' : (isSimulating ? 'pointer' : 'grab') }}
      data-testid={`component-${component.id}`}
    >
      {/* The definition.render function draws the component at its base size.
          The scale transform applied to this <g> element handles the visual scaling. */}
      {definition.render(
        component.label,
        component.state,
        component.displayPinLabels,
        simulatedState,
        component.id
      )}

      {selected && (
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="none"
          stroke="hsl(var(--ring))"
          strokeDasharray="4 2"
          pointerEvents="none"
        />
      )}
      {!selected && highlighted && (
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="none"
          stroke="hsl(var(--ring))"
          strokeDasharray="2 2"
          pointerEvents="none"
        />
      )}
      
      {/* Pin circles are also drawn within this scaled group.
          Their cx/cy are relative to the unscaled component origin. */}
      {Object.entries(definition.pins || {}).map(([pinName, pinDef]) => {
        const isSelectedPin = connectingPin?.componentId === component.id && connectingPin?.pinName === pinName;
        return (
          <circle
            key={pinName}
            cx={pinDef.x}
            cy={pinDef.y}
            r={6 / scale} // Adjust pin radius inversely to scale to maintain apparent size
            fill={isSelectedPin ? 'hsl(var(--ring))' : 'hsl(var(--primary))'}
            opacity={0.6}
            className="pin-circle"
            onMouseDown={(e) => {
              if (isSimulating) return;
              e.stopPropagation();
              // Calculate absolute pin coordinates considering the component's position and scale
              const absolutePinX = component.x + pinDef.x * scale;
              const absolutePinY = component.y + pinDef.y * scale;
              onPinClick(component.id, pinName, { x: absolutePinX, y: absolutePinY });
            }}
            style={{ cursor: isMeasuring ? 'crosshair' : 'pointer' }}
            data-testid={`pin-${component.id}-${pinName}`}
          />
        );
      })}
    </g>
  );
};

export default DraggableComponent;
