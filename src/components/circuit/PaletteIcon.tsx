
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
    case 'Schließer':
      iconContent = (
        <>
          <line x1="20" y1="2" x2="20" y2="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="22" x2="20" y2="38" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="12" y1="18" x2="20" y2="22" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      break;
    case 'Öffner':
      iconContent = (
        <>
          <line x1="20" y1="2" x2="20" y2="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="22" x2="20" y2="38" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="20" y1="18" x2="28" y2="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="28" y1="18" x2="20" y2="22" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      break;
    case 'NotAusTaster':
      iconContent = (
        <>
          <circle cx="20" cy="20" r="19" fill="hsl(var(--destructive))" stroke="black" strokeWidth="1"/>
          <g transform="scale(0.7) translate(8.5, 8.5)">
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
        <circle cx="20" cy="20" r="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
      );
      break;
    case 'Lampe':
      iconContent = (
        <>
          <circle cx="20" cy="20" r="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
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
    case 'ZeitRelaisEin':
      iconContent = (
        <>
          <rect x="8" y="8" width="24" height="24" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
          <text x="20" y="26" fontSize="18" textAnchor="middle" fill={symbolStrokeColor} fontWeight="bold">T</text>
        </>
      );
      break;
    // Installation specific icons
    case 'Abzweigdose':
      iconContent = (
        <rect x="6" y="6" width="28" height="28" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill="none" strokeDasharray="4 2" />
      );
      break;
    case 'AbzweigdoseRect':
      iconContent = (
        <rect x="6" y="10" width="28" height="20" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill="none" strokeDasharray="4 2" />
      );
      break;
    case 'SchliesserInstallation':
      iconContent = (
        <>
          <rect x="6" y="6" width="28" height="28" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill="none" />
          <line x1="20" y1="12" x2="20" y2="18" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="20" y1="22" x2="20" y2="28" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="15" y1="18" x2="20" y2="22" stroke={symbolStrokeColor} strokeWidth="2" />
        </>
      );
      break;
    case 'LampeInstallation':
       iconContent = (
        <>
          <rect x="6" y="6" width="28" height="28" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill="none" />
          <circle cx="20" cy="20" r="10" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
          <line x1="12" y1="12" x2="28" y2="28" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
          <line x1="12" y1="28" x2="28" y2="12" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} />
        </>
      );
      break;
    case 'Steckdose':
      iconContent = (
        <>
          <rect x="6" y="6" width="28" height="28" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill="none" />
          <path d="M10 26 a10 10 0 0 1 20 0" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill="none" />
          <line x1="18" y1="26" x2="18" y2="30" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="22" y1="26" x2="22" y2="30" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="20" y1="24" x2="20" y2="30" stroke={symbolStrokeColor} strokeWidth="2" />
        </>
      );
      break;
    case 'Wechselschalter':
      iconContent = (
        <>
          <rect x="6" y="6" width="28" height="28" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill="none" />
          <line x1="20" y1="10" x2="20" y2="20" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="12" y1="24" x2="28" y2="24" stroke={symbolStrokeColor} strokeWidth="2" />
        </>
      );
      break;
    case 'Ausschalter':
      iconContent = (
        <>
          <rect x="6" y="6" width="28" height="28" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill="none" />
          <circle cx="20" cy="9" r="3" stroke={symbolStrokeColor} strokeWidth="2" fill="none" />
          <line x1="20" y1="12" x2="20" y2="18" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="20" y1="22" x2="20" y2="28" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="15" y1="18" x2="20" y2="22" stroke={symbolStrokeColor} strokeWidth="2" />
        </>
      );
      break;
    case 'Grenztaster':
      iconContent = (
        <>
          <circle cx="20" cy="20" r="18" stroke={symbolStrokeColor} strokeWidth={paletteStrokeWidth} fill={symbolFillColor} />
          <line x1="20" y1="8" x2="20" y2="18" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="20" y1="22" x2="20" y2="32" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="14" y1="18" x2="20" y2="22" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="8" y1="6" x2="14" y2="12" stroke={symbolStrokeColor} strokeWidth="2" />
        </>
      );
      break;
    case 'Energieversorgung400V':
      iconContent = (
        <>
          <line x1="5" y1="8" x2="35" y2="8" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="5" y1="16" x2="35" y2="16" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="5" y1="24" x2="35" y2="24" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="5" y1="32" x2="35" y2="32" stroke={symbolStrokeColor} strokeWidth="2" />
          <line x1="5" y1="38" x2="35" y2="38" stroke={symbolStrokeColor} strokeWidth="2" />
        </>
      );
      break;
    case 'L1Leitung':
      iconContent = (
        <>
          <line x1="5" y1="20" x2="35" y2="20" stroke="red" strokeWidth="3" />
          <circle cx="35" cy="20" r="4" stroke="black" strokeWidth="1" fill="white" />
        </>
      );
      break;
    case 'L2Leitung':
      iconContent = (
        <>
          <line x1="5" y1="20" x2="35" y2="20" stroke="black" strokeWidth="3" />
          <circle cx="35" cy="20" r="4" stroke="black" strokeWidth="1" fill="white" />
        </>
      );
      break;
    case 'L3Leitung':
      iconContent = (
        <>
          <line x1="5" y1="20" x2="35" y2="20" stroke="gray" strokeWidth="3" />
          <circle cx="35" cy="20" r="4" stroke="black" strokeWidth="1" fill="white" />
        </>
      );
      break;
    case 'NLeitung':
      iconContent = (
        <>
          <line x1="5" y1="20" x2="35" y2="20" stroke="blue" strokeWidth="3" />
          <circle cx="35" cy="20" r="4" stroke="black" strokeWidth="1" fill="white" />
        </>
      );
      break;
    case 'PELeitung':
      iconContent = (
        <>
          <line x1="5" y1="20" x2="35" y2="20" stroke="green" strokeWidth="3" />
          <circle cx="35" cy="20" r="4" stroke="black" strokeWidth="1" fill="white" />
        </>
      );
      break;
    default:
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
