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
  'Schließer': { 
    width: 80, 
    height: 60, 
    render: (label, state, displayPinLabels = { '13': '13', '14': '14' }) => (
      <>
        <line x1="25" y1="0" x2="25" y2="22.5" className="line" />
        <line x1="25" y1="37.5" x2="25" y2="60" className="line" />
        {state?.isOpen ? (
          <line x1="15" y1="22.5" x2="25" y2="37.5" className="line" /> 
        ) : (
          <line x1="25" y1="22.5" x2="25" y2="37.5" className="line" />
        )}
        <text x="15" y="18" className="text-pin">{displayPinLabels['13']}</text>
        <text x="15" y="48" className="text-pin">{displayPinLabels['14']}</text>
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
  'Öffner': { 
    width: 80, 
    height: 60, 
    render: (label, state, displayPinLabels = { '11': '11', '12': '12' }) => (
      <>
        <line x1="25" y1="0" x2="25" y2="22.5" className="line" />
        <line x1="25" y1="37.5" x2="25" y2="60" className="line" />
        {state?.isClosed ? (
          <>
            <line x1="25" y1="22.5" x2="30" y2="22.5" className="line" /> 
            <line x1="30" y1="22.5" x2="25" y2="37.5" className="line" /> 
          </>
        ) : (
          <line x1="25" y1="22.5" x2="25" y2="37.5" className="line" />
        )}
        <text x="15" y="18" className="text-pin">{displayPinLabels['11']}</text>
        <text x="15" y="48" className="text-pin">{displayPinLabels['12']}</text>
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
  'Motor': { // This is for the main canvas, showing A1/A2 for control
    width: 100, 
    height: 100, 
    render: (label, _state, displayPinLabels = { 'A1': 'A1', 'A2': 'A2' }) => (
      <>
        <circle cx="50" cy="50" r="37.5" className="symbol" />
        <text x="50" y="53" fontSize="30px" textAnchor="middle" className="font-bold fill-foreground">M</text>
        <text x="95" y="50" className="component-text">{label}</text> 
        <text x="50" y="5" className="text-pin">{displayPinLabels['A1']}</text>
        <text x="50" y="95" className="text-pin">{displayPinLabels['A2']}</text>
      </>
    ),
    pins: {
      'A1': { x: 50, y: 12.5, label: 'A1' }, 
      'A2': { x: 50, y: 87.5, label: 'A2' }
    }
  },
  'Lampe': {
    width: 90,  
    height: 75, 
    render: (label, _state, displayPinLabels = { 'X1': 'X1', 'X2': 'X2' }) => (
      <>
        <circle cx="37.5" cy="37.5" r="25" className="symbol" />
        <line x1={37.5 - 25 / Math.sqrt(2)} y1={37.5 - 25 / Math.sqrt(2)} x2={37.5 + 25 / Math.sqrt(2)} y2={37.5 + 25 / Math.sqrt(2)} className="line" />
        <line x1={37.5 - 25 / Math.sqrt(2)} y1={37.5 + 25 / Math.sqrt(2)} x2={37.5 + 25 / Math.sqrt(2)} y2={37.5 - 25 / Math.sqrt(2)} className="line" />
        <text x="70" y="37.5" className="component-text">{label}</text>
        <text x="37.5" y="7.5" className="text-pin">{displayPinLabels['X1']}</text>
        <text x="37.5" y="67.5" className="text-pin">{displayPinLabels['X2']}</text>
      </>
    ),
    pins: {
      'X1': { x: 37.5, y: 12.5, label: 'X1' }, 
      'X2': { x: 37.5, y: 62.5, label: 'X2' } 
    }
  },
  'SchuetzSpule': {
    width: 60,
    height: 40,
    render: (label, _state, displayPinLabels = { 'A1': 'A1', 'A2': 'A2' }) => (
      <>
        <rect x="5" y="5" width="50" height="30" className="symbol" />
        <text x="30" y="-5" className="text-pin">{displayPinLabels['A1']}</text>
        <text x="30" y="50" className="text-pin">{displayPinLabels['A2']}</text>
        <text x="70" y="20" className="component-text">{label}</text>
      </>
    ),
    pins: {
      'A1': { x: 30, y: 5, label: 'A1' },
      'A2': { x: 30, y: 35, label: 'A2' }
    }
  },
  'ZeitRelaisEin': { // Einschaltverzögert (On-delay timer)
    width: 70,
    height: 50,
    render: (label, _state, displayPinLabels = { 'A1': 'A1', 'A2': 'A2', 'T': 'T' }) => (
      <>
        <rect x="5" y="5" width="60" height="40" className="symbol" />
        {/* Small X or clock symbol for timer */}
        <line x1="15" y1="15" x2="25" y2="25" className="line stroke-muted-foreground" />
        <line x1="15" y1="25" x2="25" y2="15" className="line stroke-muted-foreground" />
        <text x="35" y="-5" className="text-pin">{displayPinLabels['A1']}</text>
        <text x="35" y="55" className="text-pin">{displayPinLabels['A2']}</text>
        <text x="5" y="0" className="text-pin">{displayPinLabels['T']}</text>
        <text x="80" y="25" className="component-text">{label}</text>
      </>
    ),
    pins: {
      'A1': { x: 35, y: 5, label: 'A1' },
      'A2': { x: 35, y: 45, label: 'A2' },
      'T': {x: 5, y: 25, label: 'T'} // Not a connectable pin, but for displaying time value
    }
  },
};
