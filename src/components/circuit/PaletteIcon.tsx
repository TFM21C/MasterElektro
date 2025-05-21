import type React from 'react';
import { COMPONENT_DEFINITIONS } from '@/config/component-definitions';

interface PaletteIconProps {
  type: string;
}

const PaletteIcon: React.FC<PaletteIconProps> = ({ type }) => {
  const definition = COMPONENT_DEFINITIONS[type];
  if (!definition) return null;

  let iconContent: JSX.Element | null = null;
  let viewBox = `0 0 ${definition.width} ${definition.height}`;
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  const paletteStrokeWidth = 1.5; // Adjusted for better visual on white
  const symbolStrokeColor = '#333333'; // Hardcoded dark gray for symbol strokes
  const symbolFillColor = '#333333';   // Hardcoded dark gray for symbol text like 'M'

  // Simplified rendering for palette icons, focusing on recognizability
  switch (type) {
    case 'Schließer':
      iconContent = (
        <>
          <line x1="20" y1="5" x2="20" y2="15" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="25" x2="20" y2="35" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="10" y1="15" x2="20" y2="25" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      viewBox = '0 0 40 40';
      scale = 1.1; 
      translateX = (48 - 40 * scale) / (2 * scale); 
      translateY = (48 - 40 * scale) / (2 * scale); 
      break;
    case 'Öffner':
      iconContent = (
        <>
          <line x1="20" y1="5" x2="20" y2="15" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="25" x2="20" y2="35" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="15" x2="25" y2="15" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="25" y1="15" x2="20" y2="25" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      viewBox = '0 0 40 40';
      scale = 1.1; 
      translateX = (48 - 40 * scale) / (2 * scale); 
      translateY = (48 - 40 * scale) / (2 * scale); 
      break;
    case 'Motor':
      iconContent = (
        <>
          <circle cx="40" cy="40" r="28" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill="none" />
          <text x="40" y="45" fontSize="24px" textAnchor="middle" stroke="none" fill={symbolFillColor}>M</text>
        </>
      );
      viewBox = '0 0 80 80';
      scale = 0.55; 
      translateX = (48 - 80 * scale) / (2 * scale); 
      translateY = (48 - 80 * scale) / (2 * scale); 
      break;
    case 'Lampe':
      iconContent = (
        <>
          <circle cx="30" cy="30" r="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill="none" />
          <line x1="18" y1="18" x2="42" y2="42" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="18" y1="42" x2="42" y2="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      viewBox = '0 0 60 60';
      scale = 0.73; 
      translateX = (48 - 60 * scale) / (2 * scale); 
      translateY = (48 - 60 * scale) / (2 * scale); 
      break;
    default:
      return null; 
  }

  return (
    <svg width="48" height="48" viewBox={viewBox} className="mb-1 bg-white rounded p-1"> {/* Changed bg-card to bg-white */}
      <g transform={`scale(${scale}) translate(${translateX}, ${translateY})`}>
        {iconContent}
      </g>
    </svg>
  );
};

export default PaletteIcon;
