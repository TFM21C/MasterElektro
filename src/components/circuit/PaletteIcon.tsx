import type React from 'react';

interface PaletteIconProps {
  type: string;
}

const PaletteIcon: React.FC<PaletteIconProps> = ({ type }) => {
  let iconContent: JSX.Element | null = null;
  const viewBox = "0 0 40 40"; // Fixed for all icons
  const paletteStrokeWidth = 2; // Prominent stroke width
  const symbolStrokeColor = "black";
  const symbolFillColor = "white"; // Fill for closed shapes like circles

  switch (type) {
    case 'Schließer':
      iconContent = (
        <>
          {/* Centered: Fixed contact part at x=25. Moving contact from x=15 to x=25. */}
          {/* Vertical lines for fixed contact */}
          <line x1="25" y1="5" x2="25" y2="15" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="25" y1="25" x2="25" y2="35" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          {/* Diagonal line for normally open contact */}
          <line x1="15" y1="15" x2="25" y2="25" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      break;
    case 'Öffner':
      iconContent = (
        <>
          {/* Centered: Fixed contact part at x=15. Moving contact related point at x=25. */}
          {/* Vertical lines for fixed contact */}
          <line x1="15" y1="5" x2="15" y2="15" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="15" y1="25" x2="15" y2="35" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          {/* "Nose" - horizontal line for normally closed contact */}
          <line x1="15" y1="15" x2="25" y2="15" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          {/* Diagonal line for normally closed contact */}
          <line x1="25" y1="15" x2="15" y2="25" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      break;
    case 'Motor':
      iconContent = (
        <>
          <circle cx="20" cy="20" r="16" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
        </>
      );
      break;
    case 'Lampe':
      iconContent = (
        <>
          <circle cx="20" cy="20" r="16" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
          <line x1="10" y1="10" x2="30" y2="30" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="10" y1="30" x2="30" y2="10" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      break;
    default:
      // Optionally render a placeholder or return null for unhandled types
      return null; 
  }

  return (
    <svg width="40" height="40" viewBox={viewBox} className="mb-1 bg-white rounded">
      {/* SVG content is drawn directly, no further <g> transform needed for centering if coordinates are absolute to viewBox */}
      {iconContent}
    </svg>
  );
};

export default PaletteIcon;
