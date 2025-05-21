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
  const paletteStrokeWidth = 2;

  // Simplified rendering for palette icons, focusing on recognizability
  switch (type) {
    case 'Schließer':
      iconContent = (
        <>
          <line x1="20" y1="5" x2="20" y2="15" stroke="currentColor" strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="25" x2="20" y2="35" stroke="currentColor" strokeWidth={paletteStrokeWidth} />
          <line x1="10" y1="15" x2="20" y2="25" stroke="currentColor" strokeWidth={paletteStrokeWidth} />
        </>
      );
      viewBox = '0 0 40 40';
      scale = 1.1; // Adjusted scale
      translateX = (48 - 40 * scale) / (2 * scale); // Recalculated for 48px container
      translateY = (48 - 40 * scale) / (2 * scale); // Recalculated for 48px container
      break;
    case 'Öffner':
      iconContent = (
        <>
          <line x1="20" y1="5" x2="20" y2="15" stroke="currentColor" strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="25" x2="20" y2="35" stroke="currentColor" strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="15" x2="25" y2="15" stroke="currentColor" strokeWidth={paletteStrokeWidth} />
          <line x1="25" y1="15" x2="20" y2="25" stroke="currentColor" strokeWidth={paletteStrokeWidth} />
        </>
      );
      viewBox = '0 0 40 40';
      scale = 1.1; // Adjusted scale
      translateX = (48 - 40 * scale) / (2 * scale); // Recalculated for 48px container
      translateY = (48 - 40 * scale) / (2 * scale); // Recalculated for 48px container
      break;
    case 'Motor':
      iconContent = (
        <>
          <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth={paletteStrokeWidth} fill="none" />
          <text x="40" y="45" fontSize="24px" textAnchor="middle" stroke="currentColor" fill="currentColor">M</text>
        </>
      );
      viewBox = '0 0 80 80';
      scale = 0.55; // Adjusted scale
      translateX = (48 - 80 * scale) / (2 * scale); // Recalculated for 48px container
      translateY = (48 - 80 * scale) / (2 * scale); // Recalculated for 48px container
      break;
    case 'Lampe':
      iconContent = (
        <>
          <circle cx="30" cy="30" r="18" stroke="currentColor" strokeWidth={paletteStrokeWidth} fill="none" />
          <line x1="18" y1="18" x2="42" y2="42" stroke="currentColor" strokeWidth={paletteStrokeWidth} />
          <line x1="18" y1="42" x2="42" y2="18" stroke="currentColor" strokeWidth={paletteStrokeWidth} />
        </>
      );
      viewBox = '0 0 60 60';
      scale = 0.73; // Adjusted scale
      translateX = (48 - 60 * scale) / (2 * scale); // Recalculated for 48px container
      translateY = (48 - 60 * scale) / (2 * scale); // Recalculated for 48px container
      break;
    default:
      return null; // Or a placeholder
  }

  return (
    <svg width="48" height="48" viewBox={viewBox} className="mb-1 text-primary-foreground group-hover:text-accent-foreground"> {/* Increased size */}
      <g transform={`scale(${scale}) translate(${translateX}, ${translateY})`}>
        {iconContent}
      </g>
    </svg>
  );
};

export default PaletteIcon;
