import * as React from "react";

const PELeitung: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="260" height="20" viewBox="0 0 260 20" {...props}>
    <text x="0" y="15" fontSize="14" fontFamily="Arial">PE</text>
    <line x1="30" y1="10" x2="240" y2="10" stroke="green" strokeWidth="3" />
    <circle cx="240" cy="10" r="5" fill="white" stroke="black" strokeWidth="2" data-pin-id="out" data-type="stromleitung" />
  </svg>
);

export default PELeitung;
