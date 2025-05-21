import type React from 'react';
import { COMPONENT_DEFINITIONS } from '@/config/component-definitions';
import type { ElectricalComponent, Point } from '@/types/circuit';

interface DraggableComponentProps {
  component: ElectricalComponent;
  onMouseDown: (e: React.MouseEvent<SVGGElement>, id: string) => void;
  onPinClick: (componentId: string, pinName: string, pinCoords: Point) => void;
  onComponentClick: (id: string, isDoubleClick?: boolean) => void;
  connectingPin: { componentId: string; pinName: string } | null;
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  onMouseDown,
  onPinClick,
  onComponentClick,
  connectingPin,
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
      onComponentClick(component.id);
    }
  };

  const handleComponentDoubleClick = (e: React.MouseEvent<SVGGElement>) => {
    if (!(e.target instanceof SVGElement && e.target.classList.contains('pin-circle'))) {
      onComponentClick(component.id, true);
    }
  };

  return (
    <g
      transform={`translate(${component.x}, ${component.y})`}
      onMouseDown={handleComponentMouseDown}
      onClick={handleComponentClick}
      onDoubleClick={handleComponentDoubleClick}
      style={{ cursor: 'grab' }}
      data-testid={`component-${component.id}`}
    >
      {definition.render(component.label, component.state, component.displayPinLabels)}
      {Object.entries(definition.pins).map(([pinName, pinDef]) => {
        const isSelectedPin = connectingPin?.componentId === component.id && connectingPin?.pinName === pinName;
        return (
          <circle
            key={pinName}
            cx={pinDef.x}
            cy={pinDef.y}
            r={6} // Slightly larger pin click area
            fill={isSelectedPin ? 'hsl(var(--ring))' : 'hsl(var(--primary))'}
            opacity={0.6}
            className="pin-circle"
            onMouseDown={(e) => {
              e.stopPropagation();
              onPinClick(component.id, pinName, { x: component.x + pinDef.x, y: component.y + pinDef.y });
            }}
            style={{ cursor: 'pointer' }}
            data-testid={`pin-${component.id}-${pinName}`}
          />
        );
      })}
    </g>
  );
};

export default DraggableComponent;
