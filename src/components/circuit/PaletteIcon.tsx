import type React from 'react';

interface PaletteIconProps {
  type: string;
}

const PaletteIcon: React.FC<PaletteIconProps> = ({ type }) => {
  let iconContent: JSX.Element | null = null;
  const viewBox = "0 0 40 40";
  const paletteStrokeWidth = 2; 
  const symbolStrokeColor = "black";
  const symbolFillColor = "white";

  switch (type) {
    case 'Schließer':
      iconContent = (
        <>
          {/* Fixed contact lines, almost full height */}
          <line x1="20" y1="2" x2="20" y2="17.5" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="22.5" x2="20" y2="38" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          {/* Diagonal line for normally open contact, wider span */}
          <line x1="10" y1="17.5" x2="20" y2="22.5" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      break;
    case 'Öffner':
      iconContent = (
        <>
          {/* Fixed contact lines, almost full height */}
          <line x1="20" y1="2" x2="20" y2="17.5" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="22.5" x2="20" y2="38" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          {/* "Nose" - horizontal line for normally closed contact, wider span */}
          <line x1="20" y1="17.5" x2="30" y2="17.5" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          {/* Diagonal line for normally closed contact */}
          <line x1="30" y1="17.5" x2="20" y2="22.5" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      break;
    case 'Motor':
      iconContent = (
        <>
          <circle cx="20" cy="20" r="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
        </>
      );
      break;
    case 'Lampe':
      iconContent = (
        <>
          <circle cx="20" cy="20" r="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
          <line x1="8" y1="8" x2="32" y2="32" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="8" y1="32" x2="32" y2="8" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      break;
    default:
      return null; 
  }

  return (
    <svg width="40" height="40" viewBox={viewBox} className="mb-1 bg-white rounded">
      {iconContent}
    </svg>
  );
};

export default PaletteIcon;
