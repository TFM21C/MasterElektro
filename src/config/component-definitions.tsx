// Using .tsx because it contains JSX in render functions
import type { ComponentDefinition } from '@/types/circuit';

export const COMPONENT_DEFINITIONS: Record<string, ComponentDefinition> = {
  '24V': {
    width: 100, // No change, typically just a line
    height: 20,
    render: (label) => (
      <>
        <line x1="0" y1="10" x2="100" y2="10" className="line" />
        <text x="-25" y="12" className="component-text">{label}</text>
      </>
    ),
    pins: {
      'out': { x: 100, y: 10, label: '' }
    }
  },
  '0V': {
    width: 100, // No change
    height: 20,
    render: (label) => (
      <>
        <line x1="0" y1="10" x2="100" y2="10" className="line" />
        <text x="-20" y="12" className="component-text">{label}</text>
      </>
    ),
    pins: {
      'in': { x: 100, y: 10, label: '' }
    }
  },
  'Schließer': { // Normally Open (NO)
    width: 80, // Increased width to accommodate label
    height: 60, // Increased height
    render: (label, state, displayPinLabels = { '13': '13', '14': '14' }) => (
      <>
        {/* Main vertical lines */}
        <line x1="25" y1="0" x2="25" y2="22.5" className="line" />
        <line x1="25" y1="37.5" x2="25" y2="60" className="line" />
        {/* Switch element */}
        {state?.isOpen ? (
          <line x1="15" y1="22.5" x2="25" y2="37.5" className="line" /> // Diagonal for open
        ) : (
           // This state (closed Schliesser) is unusual but visualised if state is forced
          <line x1="25" y1="22.5" x2="25" y2="37.5" className="line" />
        )}
        {/* Pin labels */}
        <text x="15" y="18" className="text-pin">{displayPinLabels['13']}</text>
        <text x="15" y="48" className="text-pin">{displayPinLabels['14']}</text>
        {/* Component label */}
        <text x="55" y="30" className="component-text">{label}</text>
      </>
    ),
    pins: {
      '13': { x: 25, y: 0, label: '13' },
      '14': { x: 25, y: 60, label: '14' }
    },
    initialState: { isOpen: true },
    initialDisplayPinLabels: { '13': '13', '14': '14' }
  },
  'Öffner': { // Normally Closed (NC)
    width: 80, // Increased width
    height: 60, // Increased height
    render: (label, state, displayPinLabels = { '11': '11', '12': '12' }) => (
      <>
        {/* Main vertical lines */}
        <line x1="25" y1="0" x2="25" y2="22.5" className="line" />
        <line x1="25" y1="37.5" x2="25" y2="60" className="line" />
        {/* Switch element (Normally Closed) */}
        {state?.isClosed ? (
          <>
            <line x1="25" y1="22.5" x2="30" y2="22.5" className="line" /> 
            <line x1="30" y1="22.5" x2="25" y2="37.5" className="line" /> 
          </>
        ) : (
          // This state (open Oeffner) is unusual but visualised if state is forced
          <line x1="25" y1="22.5" x2="25" y2="37.5" className="line" />
        )}
        {/* Pin labels */}
        <text x="15" y="18" className="text-pin">{displayPinLabels['11']}</text>
        <text x="15" y="48" className="text-pin">{displayPinLabels['12']}</text>
        {/* Component label */}
        <text x="55" y="30" className="component-text">{label}</text>
      </>
    ),
    pins: {
      '11': { x: 25, y: 0, label: '11' },
      '12': { x: 25, y: 60, label: '12' }
    },
    initialState: { isClosed: true },
    initialDisplayPinLabels: { '11': '11', '12': '12' }
  },
  'Motor': {
    width: 100, // Increased width
    height: 100, // Increased height
    render: (label) => (
      <>
        <circle cx="50" cy="50" r="37.5" className="symbol" />
        <text x="50" y="53" fontSize="30px" textAnchor="middle" className="font-bold fill-foreground">M</text>
        <text x="95" y="50" className="component-text">{label}</text> 
        <text x="50" y="5" className="text-pin">A1</text>
        <text x="50" y="95" className="text-pin">A2</text>
      </>
    ),
    pins: {
      'A1': { x: 50, y: 12.5, label: 'A1' }, // Pins are on the circle edge
      'A2': { x: 50, y: 87.5, label: 'A2' }  // Pins are on the circle edge
    }
  },
  'Lampe': {
    width: 90,  // Increased width
    height: 75, // Increased height
    render: (label) => (
      <>
        <circle cx="37.5" cy="37.5" r="25" className="symbol" />
        <line x1={37.5 - 25 / Math.sqrt(2)} y1={37.5 - 25 / Math.sqrt(2)} x2={37.5 + 25 / Math.sqrt(2)} y2={37.5 + 25 / Math.sqrt(2)} className="line" />
        <line x1={37.5 - 25 / Math.sqrt(2)} y1={37.5 + 25 / Math.sqrt(2)} x2={37.5 + 25 / Math.sqrt(2)} y2={37.5 - 25 / Math.sqrt(2)} className="line" />
        <text x="70" y="37.5" className="component-text">{label}</text>
        <text x="37.5" y="7.5" className="text-pin">X1</text>
        <text x="37.5" y="67.5" className="text-pin">X2</text>
      </>
    ),
    pins: {
      'X1': { x: 37.5, y: 12.5, label: 'X1' }, // Pins are on the circle edge
      'X2': { x: 37.5, y: 62.5, label: 'X2' }  // Pins are on the circle edge
    }
  }
};
