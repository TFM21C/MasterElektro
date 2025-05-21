// Using .tsx because it contains JSX in render functions
import type { ComponentDefinition } from '@/types/circuit';

export const COMPONENT_DEFINITIONS: Record<string, ComponentDefinition> = {
  '24V': {
    width: 100,
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
    width: 100,
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
    width: 40,
    height: 40,
    render: (label, state, displayPinLabels = { '13': '13', '14': '14' }) => (
      <>
        <line x1="20" y1="0" x2="20" y2="15" className="line" />
        <line x1="20" y1="25" x2="20" y2="40" className="line" />
        {state?.isOpen ? (
          <line x1="10" y1="15" x2="20" y2="25" className="line" />
        ) : (
          <line x1="20" y1="15" x2="20" y2="25" className="line" />
        )}
        <text x="10" y="7" className="text-pin">{displayPinLabels['13']}</text>
        <text x="10" y="33" className="text-pin">{displayPinLabels['14']}</text>
        <text x="45" y="20" className="component-text">{label}</text>
      </>
    ),
    pins: {
      '13': { x: 20, y: 0, label: '13' },
      '14': { x: 20, y: 40, label: '14' }
    },
    initialState: { isOpen: true },
    initialDisplayPinLabels: { '13': '13', '14': '14' }
  },
  'Öffner': { // Normally Closed (NC)
    width: 40,
    height: 40,
    render: (label, state, displayPinLabels = { '11': '11', '12': '12' }) => (
      <>
        <line x1="20" y1="0" x2="20" y2="15" className="line" />
        <line x1="20" y1="25" x2="20" y2="40" className="line" />
        {state?.isClosed ? (
          <>
            <line x1="20" y1="15" x2="25" y2="15" className="line" />
            <line x1="25" y1="15" x2="20" y2="25" className="line" />
          </>
        ) : (
          <line x1="20" y1="15" x2="20" y2="25" className="line" />
        )}
        <text x="10" y="7" className="text-pin">{displayPinLabels['11']}</text>
        <text x="10" y="33" className="text-pin">{displayPinLabels['12']}</text>
        <text x="45" y="20" className="component-text">{label}</text>
      </>
    ),
    pins: {
      '11': { x: 20, y: 0, label: '11' },
      '12': { x: 20, y: 40, label: '12' }
    },
    initialState: { isClosed: true },
    initialDisplayPinLabels: { '11': '11', '12': '12' }
  },
  'Motor': {
    width: 80,
    height: 80,
    render: (label) => (
      <>
        <circle cx="40" cy="40" r="30" className="symbol" />
        <text x="40" y="43" fontSize="24px" textAnchor="middle" className="font-bold fill-foreground">M</text>
        <text x="75" y="40" className="component-text">{label}</text>
        <text x="40" y="5" className="text-pin">A1</text>
        <text x="40" y="75" className="text-pin">A2</text>
      </>
    ),
    pins: {
      'A1': { x: 40, y: 10, label: 'A1' },
      'A2': { x: 40, y: 70, label: 'A2' }
    }
  },
  'Lampe': {
    width: 60,
    height: 60,
    render: (label) => (
      <>
        <circle cx="30" cy="30" r="20" className="symbol" />
        <line x1="15" y1="15" x2="45" y2="45" className="line" />
        <line x1="15" y1="45" x2="45" y2="15" className="line" />
        <text x="55" y="30" className="component-text">{label}</text>
        <text x="30" y="5" className="text-pin">X1</text>
        <text x="30" y="55" className="text-pin">X2</text>
      </>
    ),
    pins: {
      'X1': { x: 30, y: 10, label: 'X1' },
      'X2': { x: 30, y: 50, label: 'X2' }
    }
  }
};
