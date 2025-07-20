import * as React from "react";

const Energieversorgung400V: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="260" height="240" viewBox="0 0 260 240" {...props}>
    <g id="Energieversorgung400V">
      <text x="0" y="20" fontSize="14" fontFamily="Arial">L1</text>
      <line x1="30" y1="20" x2="240" y2="20" stroke="red" strokeWidth="3" />
      <circle cx="240" cy="20" r="5" fill="white" stroke="black" strokeWidth="2" />

      <text x="0" y="60" fontSize="14" fontFamily="Arial">L2</text>
      <line x1="30" y1="60" x2="240" y2="60" stroke="black" strokeWidth="3" />
      <circle cx="240" cy="60" r="5" fill="white" stroke="black" strokeWidth="2" />

      <text x="0" y="100" fontSize="14" fontFamily="Arial">L3</text>
      <line x1="30" y1="100" x2="240" y2="100" stroke="blue" strokeWidth="3" />
      <circle cx="240" cy="100" r="5" fill="white" stroke="black" strokeWidth="2" />

      <text x="0" y="140" fontSize="14" fontFamily="Arial">N</text>
      <line x1="30" y1="140" x2="240" y2="140" stroke="blue" strokeDasharray="6,4" strokeWidth="2" />
      <circle cx="240" cy="140" r="5" fill="white" stroke="black" strokeWidth="2" />

      <text x="0" y="180" fontSize="14" fontFamily="Arial">PE</text>
      <line x1="30" y1="180" x2="240" y2="180" stroke="green" strokeWidth="3" />
      <circle cx="240" cy="180" r="5" fill="white" stroke="black" strokeWidth="2" />
    </g>
  </svg>
);

export default Energieversorgung400V;
