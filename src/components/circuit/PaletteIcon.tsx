import type React from 'react';

interface PaletteIconProps {
  type: string; // This will now be PaletteComponentFirebaseData.type or .paletteIconType
}

const PaletteIcon: React.FC<PaletteIconProps> = ({ type }) => {
  let iconContent: JSX.Element | null = null;
  const viewBox = "0 0 40 40";
  const paletteStrokeWidth = 3; // Increased for better visibility
  const symbolStrokeColor = "black";
  const symbolFillColor = "white"; 

  switch (type) {
    case '24V':
      iconContent = (
        <>
          <line x1="5" y1="25" x2="35" y2="25" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <text x="20" y="18" fontSize="18" textAnchor="middle" fill={symbolStrokeColor} fontWeight="bold">+</text>
        </>
      );
      break;
    case '0V':
      iconContent = (
        <>
          <line x1="5" y1="15" x2="35" y2="15" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <text x="20" y="30" fontSize="12" textAnchor="middle" fill={symbolStrokeColor} fontWeight="bold">0V</text>
        </>
      );
      break;
    case 'Schließer': // Normally Open (NO)
      iconContent = (
        <>
          <line x1="20" y1="2" x2="20" y2="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="22" x2="20" y2="38" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="12" y1="18" x2="20" y2="22" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      break;
    case 'Öffner': // Normally Closed (NC)
      iconContent = (
        <>
          <line x1="20" y1="2" x2="20" y2="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="22" x2="20" y2="38" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="18" x2="28" y2="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="28" y1="18" x2="20" y2="22" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      break;
    case 'NotAusTaster': // Specific icon for Not-Aus in palette
      iconContent = ( // Example: Öffner with a red circle around it or filled red
        <>
          <circle cx="20" cy="20" r="19" fill="hsl(var(--destructive))" stroke="black" strokeWidth="1"/>
          <g transform="scale(0.7) translate(8.5, 8.5)"> {/* Scale down the Öffner symbol */}
            <line x1="20" y1="2" x2="20" y2="18" stroke={symbolFillColor} strokeWidth={paletteStrokeWidth} />
            <line x1="20" y1="22" x2="20" y2="38" stroke={symbolFillColor} strokeWidth={paletteStrokeWidth} />
            <line x1="20" y1="18" x2="28" y2="18" stroke={symbolFillColor} strokeWidth={paletteStrokeWidth} />
            <line x1="28" y1="18" x2="20" y2="22" stroke={symbolFillColor} strokeWidth={paletteStrokeWidth} />
          </g>
        </>
      );
      break;
    case 'Motor':
      iconContent = (
        <circle cx="20" cy="20" r="16" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
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
    case 'SchuetzSpule':
      iconContent = (
        <rect x="8" y="12" width="24" height="16" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
      );
      break;
    case 'ZeitRelaisEin': // Simple box with a 'T'
      iconContent = (
        <>
          <rect x="8" y="8" width="24" height="24" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
          <text x="20" y="26" fontSize="18" textAnchor="middle" fill={symbolStrokeColor} fontWeight="bold">T</text>
        </>
      );
      break;
    default:
      // Placeholder for unknown types
      iconContent = (
        <rect x="5" y="5" width="30" height="30" stroke="grey" strokeWidth="1" fill="lightgrey" />
      );
      return null; 
  }

  return (
    <svg width="40" height="40" viewBox={viewBox} className="mb-1 bg-white rounded">
      {iconContent}
    </svg>
  );
};

export default PaletteIcon;
