// Using .tsx because it contains JSX in render functions
import type { ComponentDefinition, SimulatedComponentState } from '@/types/circuit';

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
  },
  'L1': {
    width: 100,
    height: 20,
    render: (label) => (
      <>
        <line x1="0" y1="10" x2="100" y2="10" className="line" />
        <text x="-20" y="12" className="component-text">{label}</text>
      </>
    ),
  },
  'L2': {
    width: 100,
    height: 20,
    render: (label) => (
      <>
        <line x1="0" y1="10" x2="100" y2="10" className="line" />
        <text x="-20" y="12" className="component-text">{label}</text>
      </>
    ),
  },
  'L3': {
    width: 100,
    height: 20,
    render: (label) => (
      <>
        <line x1="0" y1="10" x2="100" y2="10" className="line" />
        <text x="-20" y="12" className="component-text">{label}</text>
      </>
    ),
  },
  'N': {
    width: 100,
    height: 20,
    render: (label) => (
      <>
        <line x1="0" y1="10" x2="100" y2="10" className="line" />
        <text x="-20" y="12" className="component-text">{label}</text>
      </>
    ),
  },
  'PE': {
    width: 100,
    height: 20,
    render: (label) => (
      <>
        <line x1="0" y1="10" x2="100" y2="10" className="line" />
        <text x="-20" y="12" className="component-text">{label}</text>
      </>
    ),
  },
  'Schließer': {
    width: 80,
    height: 60,
    render: (label, _state, displayPinLabels = { '13': '13', '14': '14' }, simulatedState) => {
        const isClosed = simulatedState?.currentContactState?.['13'] === 'closed' &&
                          simulatedState?.currentContactState?.['14'] === 'closed';
        return (
            <>
                <line x1="25" y1="0" x2="25" y2="22.5" className="line" />
                <line x1="25" y1="37.5" x2="25" y2="60" className="line" />
                {isClosed ? (
                    <line x1="25" y1="22.5" x2="25" y2="37.5" className="line stroke-[hsl(var(--destructive))] stroke-2 transition-all duration-100" />
                ) : (
                    <line x1="15" y1="22.5" x2="25" y2="37.5" className="line transition-all duration-100" />
                )}
                <text x="15" y="18" className="text-pin">{displayPinLabels['13']}</text>
                <text x="15" y="48" className="text-pin">{displayPinLabels['14']}</text>
                <text x="55" y="30" className="component-text">{label}</text>
            </>
        );
    },
    pins: {
      '13': { x: 25, y: 0, label: '13' },
      '14': { x: 25, y: 60, label: '14' }
    },
    initialDisplayPinLabels: { '13': '13', '14': '14' }
  },
  'Öffner': {
    width: 80,
    height: 60,
    render: (label, _state, displayPinLabels = { '11': '11', '12': '12' }, simulatedState) => {
        // isClosed ist 'true' im Ruhezustand eines Öffners (Normally Closed)
        const isClosed = simulatedState?.currentContactState?.['11'] === 'closed' &&
                          simulatedState?.currentContactState?.['12'] === 'closed';
        return (
            <>
                <line x1="25" y1="0" x2="25" y2="22.5" className="line" />
                <line x1="25" y1="37.5" x2="25" y2="60" className="line" />

                {isClosed ? (
                    // RUHEZUSTAND: Zeichne geschlossenen Kontakt
                    <>
                        <line x1="25" y1="22.5" x2="30" y2="22.5" className="line transition-all duration-100" />
                        <line x1="30" y1="22.5" x2="25" y2="37.5" className="line transition-all duration-100" />
                    </>
                ) : (
                    // BETÄTIGTER ZUSTAND: Zeichne offenen Kontakt (schräge Linie)
                    <line x1="15" y1="22.5" x2="25" y2="37.5" className="line stroke-[hsl(var(--destructive))] stroke-2 transition-all duration-100" />
                )}

                <text x="15" y="18" className="text-pin">{displayPinLabels['11']}</text>
                <text x="15" y="48" className="text-pin">{displayPinLabels['12']}</text>
                <text x="55" y="30" className="component-text">{label}</text>
            </>
        );
    },
    pins: {
      '11': { x: 25, y: 0, label: '11' },
      '12': { x: 25, y: 60, label: '12' }
    },
    initialDisplayPinLabels: { '11': '11', '12': '12' }
  },
  'Motor': {
    width: 100,
    height: 100,
    render: (label, _state, displayPinLabels = { 'A1': 'A1', 'A2': 'A2' }, simulatedState) => (
      <>
        <circle cx="50" cy="50" r="37.5" className="symbol" fill={simulatedState?.isEnergized ? 'hsl(var(--primary))' : 'hsl(var(--card))'} />
        <text x="50" y="53" fontSize="30px" textAnchor="middle" className="font-bold" fill={simulatedState?.isEnergized ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'}>M</text>
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
    render: (label, _state, displayPinLabels = { 'X1': 'X1', 'X2': 'X2' }, simulatedState) => (
      <>
        <rect x="12.5" y="12.5" width="50" height="50" fill="none" stroke="black" strokeWidth={1.5} />
        <circle
            cx="37.5"
            cy="37.5"
            r="25"
            className={`symbol transition-all duration-300 ${simulatedState?.isEnergized ? 'lamp-glow' : ''}`}
            style={{ fill: simulatedState?.isEnergized ? 'yellow' : 'hsl(var(--card))' }}
        />
        <line
            x1={37.5 - 25 / Math.sqrt(2)}
            y1={37.5 - 25 / Math.sqrt(2)}
            x2={37.5 + 25 / Math.sqrt(2)}
            y2={37.5 + 25 / Math.sqrt(2)}
            stroke="black"
            strokeWidth={1.5}
            fill="none"
        />
        <line
            x1={37.5 - 25 / Math.sqrt(2)}
            y1={37.5 + 25 / Math.sqrt(2)}
            x2={37.5 + 25 / Math.sqrt(2)}
            y2={37.5 - 25 / Math.sqrt(2)}
            stroke="black"
            strokeWidth={1.5}
            fill="none"
        />
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
    render: (label, _state, displayPinLabels = { 'A1': 'A1', 'A2': 'A2' }, simulatedState) => (
      <>
        <rect x="5" y="5" width="50" height="30" className="symbol" fill={simulatedState?.isEnergized ? 'hsl(var(--primary))' : 'hsl(var(--card))'} />
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
  'ZeitRelaisEin': {
    width: 70,
    height: 50,
    render: (label, _state, displayPinLabels = { 'A1': 'A1', 'A2': 'A2', 'T': 'T' }, simulatedState) => (
      <>
        <rect x="5" y="5" width="60" height="40" className="symbol" fill={simulatedState?.isEnergized ? 'hsl(var(--primary))' : 'hsl(var(--card))'} />
        <line x1="15" y1="15" x2="25" y2="25" className="line stroke-muted-foreground" />
        <line x1="15" y1="25" x2="25" y2="15" className="line stroke-muted-foreground" />
        {simulatedState?.timerActive && (
            <text x="35" y="25" fontSize="10px" textAnchor="middle" fill="hsl(var(--destructive))">
                {((simulatedState.timerRemaining || 0) / 1000).toFixed(1)}s
            </text>
        )}
        <text x="35" y="-5" className="text-pin">{displayPinLabels['A1']}</text>
        <text x="35" y="55" className="text-pin">{displayPinLabels['A2']}</text>
        <text x="5" y="0" className="text-pin">{displayPinLabels['T']}</text>
        <text x="80" y="25" className="component-text">{label}</text>
      </>
    ),
    pins: {
      'A1': { x: 35, y: 5, label: 'A1' },
      'A2': { x: 35, y: 45, label: 'A2' },
      'T': { x: 5, y: 25, label: 'T' }
    }
  },
  // Installation specific components
  'Abzweigdose': {
    width: 50,
    height: 50,
    render: (label) => (
      <>
        <rect x="1" y="1" width="48" height="48" fill="none" stroke="black" strokeDasharray="4 2" />
        <text x="25" y="60" textAnchor="middle" className="component-text text-xs">{label}</text>
      </>
    ),
    pins: {
      'N': { x: 25, y: 1, label: 'N' },  // North
      'E': { x: 49, y: 25, label: 'E' },  // East
      'S': { x: 25, y: 49, label: 'S' },  // South
      'W': { x: 1, y: 25, label: 'W' },   // West
    }
  },
  'AbzweigdoseRect': {
    width: 50,
    height: 40,
    render: (label) => (
      <>
        <rect x="1" y="1" width="48" height="38" fill="none" stroke="black" strokeDasharray="4 2" />
        <text x="25" y="-5" textAnchor="middle" className="component-text text-xs">{label}</text>
      </>
    ),
    pins: {
      'N': { x: 25, y: 0, label: 'N' },
      'E': { x: 50, y: 20, label: 'E' },
      'S': { x: 25, y: 40, label: 'S' },
      'W': { x: 0, y: 20, label: 'W' },
    }
  },
  'SchliesserInstallation': {
    width: 30,
    height: 30,
    render: (label, _state, displayPinLabels = { 'L': 'L', 'Out': '' }, simulatedState) => {
      const isClosed = simulatedState?.currentContactState?.L === 'closed';
      return (
        <>
          <rect x="1" y="1" width="28" height="28" className="symbol stroke-2" fill="none" />
          <line x1="15" y1="5" x2="15" y2="12" className="line" strokeWidth="1.5" />
          <line x1="15" y1="18" x2="15" y2="25" className="line" strokeWidth="1.5" />
          {isClosed ? (
            <line x1="15" y1="12" x2="15" y2="18" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
          ) : (
            <line x1="10" y1="12" x2="15" y2="18" className="line" strokeWidth="1.5" />
          )}
          <text x="15" y="38" textAnchor="middle" className="component-text text-xs">{label}</text>
        </>
      );
    },
    pins: {
      'L': { x: 15, y: 1, label: 'L' },
      'Out': { x: 15, y: 29, label: 'Out' }
    }
  },

  'Ausschalter': {
    width: 30,
    height: 30,
    render: (label, _state, displayPinLabels = { 'L': 'L', 'Out': '' }, simulatedState) => {
      const isClosed = simulatedState?.currentContactState?.L === 'closed';
      return (
        <>
          <rect x="1" y="1" width="28" height="28" className="symbol stroke-2" fill="none" />
          <circle cx="15" cy="4" r="2" className="line" fill="none" />
          <line x1="15" y1="6" x2="15" y2="12" className="line" strokeWidth="1.5" />
          <line x1="15" y1="18" x2="15" y2="25" className="line" strokeWidth="1.5" />
          {isClosed ? (
            <line x1="15" y1="12" x2="15" y2="18" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
          ) : (
            <line x1="10" y1="12" x2="15" y2="18" className="line" strokeWidth="1.5" />
          )}
          <text x="15" y="38" textAnchor="middle" className="component-text text-xs">{label}</text>
        </>
      );
    },
    pins: {
      'L': { x: 15, y: 1, label: 'L' },
      'Out': { x: 15, y: 29, label: 'Out' }
    }
  },
  'LampeInstallation': {
    width: 30,
    height: 30,
    render: (label, _state, _displayPinLabels, simulatedState) => (
      <>
        <rect x="1" y="1" width="28" height="28" className="symbol stroke-2" fill="none" />
        <circle
          cx="15"
          cy="15"
          r="10"
          className="symbol stroke-2"
          style={{ fill: simulatedState?.isEnergized ? 'yellow' : 'hsl(var(--card))' }}
        />
        <line x1="9" y1="9" x2="21" y2="21" stroke="black" strokeWidth="1.5" fill="none" />
        <line x1="9" y1="21" x2="21" y2="9" stroke="black" strokeWidth="1.5" fill="none" />
        <text x="15" y="38" textAnchor="middle" className="component-text text-xs">{label}</text>
      </>
    ),
    pins: {
      'L': { x: 15, y: 1, label: 'L' },
      'N': { x: 15, y: 29, label: 'N' }
    }
  },

  // ---- Hauptstromkreis & Schutzgeräte ----
  'Motorschutzschalter': {
    width: 120,
    height: 60,
    render: (label, _state, displayPinLabels = {
      'L1': 'L1', 'T1': 'T1',
      'L2': 'L2', 'T2': 'T2',
      'L3': 'L3', 'T3': 'T3'
    }, simulatedState) => {
      const isClosed = (pin: string) => simulatedState?.currentContactState?.[pin] !== 'open';
      const drawPole = (x: number, pinTop: string, pinBottom: string) => (
        <>
          <line x1={x} y1={0} x2={x} y2={15} className="line" />
          <line x1={x} y1={45} x2={x} y2={60} className="line" />
          {isClosed(pinTop) && isClosed(pinBottom) ? (
            <line x1={x} y1={15} x2={x} y2={45} className="line stroke-[hsl(var(--destructive))] stroke-2" />
          ) : (
            <line x1={x - 10} y1={15} x2={x} y2={45} className="line" />
          )}
        </>
      );
      return (
        <>
          {drawPole(20, 'L1', 'T1')}
          {drawPole(60, 'L2', 'T2')}
          {drawPole(100, 'L3', 'T3')}
          <text x="20" y="-5" className="text-pin">{displayPinLabels['L1']}</text>
          <text x="20" y="70" className="text-pin">{displayPinLabels['T1']}</text>
          <text x="60" y="-5" className="text-pin">{displayPinLabels['L2']}</text>
          <text x="60" y="70" className="text-pin">{displayPinLabels['T2']}</text>
          <text x="100" y="-5" className="text-pin">{displayPinLabels['L3']}</text>
          <text x="100" y="70" className="text-pin">{displayPinLabels['T3']}</text>
          <text x="130" y="30" className="component-text">{label}</text>
        </>
      );
    },
    pins: {
      'L1': { x: 20, y: 0, label: 'L1' },
      'T1': { x: 20, y: 60, label: 'T1' },
      'L2': { x: 60, y: 0, label: 'L2' },
      'T2': { x: 60, y: 60, label: 'T2' },
      'L3': { x: 100, y: 0, label: 'L3' },
      'T3': { x: 100, y: 60, label: 'T3' }
    }
  },
  'Sicherung': {
    width: 60,
    height: 30,
    render: (label, _state, displayPinLabels = { 'in': '', 'out': '' }, simulatedState) => (
      <>
        <rect x="10" y="5" width="40" height="20" className="symbol" />
        {simulatedState?.currentContactState?.['in'] !== 'open' && simulatedState?.currentContactState?.['out'] !== 'open' ? (
          <line x1="10" y1="15" x2="50" y2="15" className="line stroke-[hsl(var(--destructive))]" />
        ) : (
          <line x1="10" y1="15" x2="50" y2="15" className="line" strokeDasharray="2 2" />
        )}
        <text x="30" y="-5" className="component-text">{label}</text>
        <text x="0" y="17" className="text-pin">{displayPinLabels['in']}</text>
        <text x="60" y="17" className="text-pin">{displayPinLabels['out']}</text>
      </>
    ),
    pins: {
      'in': { x: 0, y: 15, label: 'in' },
      'out': { x: 60, y: 15, label: 'out' }
    }
  },
  'Fehlerstromschutzschalter': {
    width: 140,
    height: 80,
    render: (label, _state, displayPinLabels = {
      'L1': 'L1', 'L1out': "L1'",
      'L2': 'L2', 'L2out': "L2'",
      'L3': 'L3', 'L3out': "L3'",
      'N': 'N',   'Nout': "N'"
    }, simulatedState) => {
      const isClosed = (pinTop: string, pinBottom: string) => (
        simulatedState?.currentContactState?.[pinTop] !== 'open' &&
        simulatedState?.currentContactState?.[pinBottom] !== 'open'
      );
      const drawPole = (x: number, pTop: string, pBot: string) => (
        <>
          <line x1={x} y1={0} x2={x} y2={25} className="line" />
          <line x1={x} y1={55} x2={x} y2={80} className="line" />
          {isClosed(pTop, pBot) ? (
            <line x1={x} y1={25} x2={x} y2={55} className="line stroke-[hsl(var(--destructive))] stroke-2" />
          ) : (
            <line x1={x - 10} y1={25} x2={x} y2={55} className="line" />
          )}
        </>
      );
      return (
        <>
          {drawPole(20, 'L1', 'L1out')}
          {drawPole(60, 'L2', 'L2out')}
          {drawPole(100, 'L3', 'L3out')}
          {drawPole(130, 'N', 'Nout')}
          <circle cx="40" cy="40" r="10" className="symbol" />
          <rect x="70" y="35" width="10" height="10" className="symbol" />
          <text x="20" y="-5" className="text-pin">{displayPinLabels['L1']}</text>
          <text x="20" y="90" className="text-pin">{displayPinLabels['L1out']}</text>
          <text x="60" y="-5" className="text-pin">{displayPinLabels['L2']}</text>
          <text x="60" y="90" className="text-pin">{displayPinLabels['L2out']}</text>
          <text x="100" y="-5" className="text-pin">{displayPinLabels['L3']}</text>
          <text x="100" y="90" className="text-pin">{displayPinLabels['L3out']}</text>
          <text x="130" y="-5" className="text-pin">{displayPinLabels['N']}</text>
          <text x="130" y="90" className="text-pin">{displayPinLabels['Nout']}</text>
          <text x="150" y="40" className="component-text">{label}</text>
        </>
      );
    },
    pins: {
      'L1': { x: 20, y: 0, label: 'L1' },
      'L1out': { x: 20, y: 80, label: "L1'" },
      'L2': { x: 60, y: 0, label: 'L2' },
      'L2out': { x: 60, y: 80, label: "L2'" },
      'L3': { x: 100, y: 0, label: 'L3' },
      'L3out': { x: 100, y: 80, label: "L3'" },
      'N': { x: 130, y: 0, label: 'N' },
      'Nout': { x: 130, y: 80, label: "N'" }
    }
  },
  'Steckdose': {
    width: 30,
    height: 30,
    render: (label) => (
      <>
        <path d="M5 20 a10 10 0 0 1 20 0" className="line" />
        <line x1="12" y1="20" x2="12" y2="24" className="line" />
        <line x1="18" y1="20" x2="18" y2="24" className="line" />
        <line x1="15" y1="22" x2="15" y2="26" className="line" />
        <text x="15" y="38" textAnchor="middle" className="component-text text-xs">{label}</text>
      </>
    ),
    pins: {
      'L': { x: 1, y: 15, label: 'L' },
      'N': { x: 29, y: 15, label: 'N' },
      'PE': { x: 15, y: 29, label: 'PE' }
    }
  },
  'Wechselschalter': {
    width: 30,
    height: 30,
    render: (label, _state, displayPinLabels = { 'L': 'L', 'Ausgang1': '1', 'Ausgang2': '2' }, simulatedState) => {
      const toAusgang1 = simulatedState?.currentContactState?.Ausgang1 === 'closed';
      const wiperX = toAusgang1 ? 8 : 22;
      const inactiveX = toAusgang1 ? 22 : 8;
      return (
        <>
          <rect x="1" y="1" width="28" height="28" className="symbol stroke-2" fill="none" />
          <line x1="15" y1="5" x2="15" y2="15" className="line" strokeWidth="1.5" />
          <line x1="8" y1="22" x2="8" y2="25" className="line" strokeWidth="1.5" />
          <line x1="22" y1="22" x2="22" y2="25" className="line" strokeWidth="1.5" />
          <line x1="15" y1="15" x2={inactiveX} y2="22" className="line" strokeWidth="1.5" />
          <line x1="15" y1="15" x2={wiperX} y2="22" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
          <text x="15" y="38" textAnchor="middle" className="component-text text-xs">{label}</text>
        </>
      );
    },
    pins: {
      'L': { x: 15, y: 1, label: 'L' },
      'Ausgang1': { x: 1, y: 25, label: '1' },
      'Ausgang2': { x: 29, y: 25, label: '2' }
    },
    initialDisplayPinLabels: { 'L': 'L', 'Ausgang1': '1', 'Ausgang2': '2' }
  },
  'Grenztaster': {
    width: 30,
    height: 30,
    render: (label, _state, displayPinLabels = { 'in': 'in', 'out': 'out' }, simulatedState) => {
      const isClosed = simulatedState?.currentContactState?.in === 'closed';
      return (
        <>
          <circle cx="15" cy="15" r="14" className="symbol stroke-2" />
          <line x1="15" y1="5" x2="15" y2="12" className="line" strokeWidth="1.5" />
          <line x1="15" y1="18" x2="15" y2="25" className="line" strokeWidth="1.5" />
          {isClosed ? (
            <line x1="15" y1="12" x2="15" y2="18" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
          ) : (
            <line x1="10" y1="12" x2="15" y2="18" className="line" strokeWidth="1.5" />
          )}
          <line x1="5" y1="3" x2="10" y2="8" className="line" strokeWidth="1.5" />
          <line x1="7" y1="3" x2="5" y2="5" className="line" strokeWidth="1.5" />
          <text x="15" y="38" textAnchor="middle" className="component-text text-xs">{label}</text>
        </>
      );
    },
    pins: {
      'in': { x: 15, y: 1, label: 'in' },
      'out': { x: 15, y: 29, label: 'out' }
    }
  },
  'Serienschalter': {
    width: 40,
    height: 30,
    render: (label, _state, _displayPinLabels, simulatedState) => {
      const closed1 = simulatedState?.currentContactState?.['1'] === 'closed';
      const closed2 = simulatedState?.currentContactState?.['2'] === 'closed';
      return (
        <>
          <rect x="1" y="1" width="38" height="28" className="symbol stroke-2" />
          <line x1="12" y1="5" x2="12" y2="25" className="line" />
          <line x1="12" y1="10" x2="16" y2="10" className="line" strokeWidth="1.5" />
          <line x1="24" y1="10" x2="28" y2="10" className="line" strokeWidth="1.5" />
          {closed1 ? (
            <line x1="16" y1="10" x2="24" y2="10" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
          ) : (
            <line x1="16" y1="6" x2="24" y2="10" className="line" strokeWidth="1.5" />
          )}
          <line x1="12" y1="20" x2="16" y2="20" className="line" strokeWidth="1.5" />
          <line x1="24" y1="20" x2="28" y2="20" className="line" strokeWidth="1.5" />
          {closed2 ? (
            <line x1="16" y1="20" x2="24" y2="20" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
          ) : (
            <line x1="16" y1="16" x2="24" y2="20" className="line" strokeWidth="1.5" />
          )}
          <text x="20" y="35" textAnchor="middle" className="component-text text-xs">{label}</text>
        </>
      );
    },
    pins: {
      'L': { x: 0, y: 15, label: 'L' },
      '1': { x: 40, y: 10, label: '1' },
      '2': { x: 40, y: 20, label: '2' }
    },
    initialDisplayPinLabels: { 'L': 'L', '1': '1', '2': '2' }
  },
  'Kreuzschalter': {
    width: 40,
    height: 30,
    render: (label, _state, _displayPinLabels, simulatedState) => {
      const isCross = simulatedState?.currentContactState?.cross === 'closed';
      return (
        <>
          <rect x="1" y="1" width="38" height="28" className="symbol stroke-2" />
          {isCross ? (
            <>
              <line x1="5" y1="10" x2="35" y2="20" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
              <line x1="5" y1="20" x2="35" y2="10" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
              <line x1="5" y1="10" x2="35" y2="10" className="line" strokeWidth="1.5" />
              <line x1="5" y1="20" x2="35" y2="20" className="line" strokeWidth="1.5" />
            </>
          ) : (
            <>
              <line x1="5" y1="10" x2="35" y2="10" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
              <line x1="5" y1="20" x2="35" y2="20" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
              <line x1="5" y1="10" x2="35" y2="20" className="line" strokeWidth="1.5" />
              <line x1="5" y1="20" x2="35" y2="10" className="line" strokeWidth="1.5" />
            </>
          )}
          <text x="20" y="35" textAnchor="middle" className="component-text text-xs">{label}</text>
        </>
      );
    },
    pins: {
      '1': { x: 0, y: 10, label: '1' },
      '2': { x: 0, y: 20, label: '2' },
      '3': { x: 40, y: 10, label: '3' },
      '4': { x: 40, y: 20, label: '4' }
    },
    initialDisplayPinLabels: { '1': '1', '2': '2', '3': '3', '4': '4' }
  },
  'SchalterSteckdoseKombi': {
    width: 30,
    height: 60,
    render: (label, _state, _displayPinLabels, simulatedState) => {
      const isClosed = simulatedState?.currentContactState?.SchaltOut === 'closed';
      return (
        <>
          <rect x="1" y="1" width="28" height="58" className="symbol stroke-2" />
          <line x1="15" y1="5" x2="15" y2="12" className="line" strokeWidth="1.5" />
          <line x1="15" y1="18" x2="15" y2="25" className="line" strokeWidth="1.5" />
          {isClosed ? (
            <line x1="15" y1="12" x2="15" y2="18" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
          ) : (
            <line x1="10" y1="12" x2="15" y2="18" className="line" strokeWidth="1.5" />
          )}
          <path d="M5 50 a10 10 0 0 1 20 0" className="line" />
          <line x1="12" y1="50" x2="12" y2="54" className="line" />
          <line x1="18" y1="50" x2="18" y2="54" className="line" />
          <line x1="15" y1="52" x2="15" y2="56" className="line" />
          <text x="15" y="68" textAnchor="middle" className="component-text text-xs">{label}</text>
        </>
      );
    },
    pins: {
      'SchalterL': { x: 15, y: 1, label: 'L' },
      'SchaltOut': { x: 15, y: 29, label: '1' },
      'L': { x: 1, y: 45, label: 'L' },
      'N': { x: 29, y: 45, label: 'N' },
      'PE': { x: 15, y: 59, label: 'PE' }
    },
    initialDisplayPinLabels: { 'SchalterL': 'L', 'SchaltOut': '1', 'L': 'L', 'N': 'N', 'PE': 'PE' }
  },
  'TasterKontrolllicht': {
    width: 30,
    height: 40,
    render: (label, _state, _displayPinLabels, simulatedState) => {
      const isPressed = simulatedState?.currentContactState?.Out === 'closed';
      const lampOn = simulatedState?.isEnergized;
      return (
        <>
          <rect x="1" y="1" width="28" height="38" className="symbol stroke-2" />
          <line x1="15" y1="5" x2="15" y2="12" className="line" strokeWidth="1.5" />
          <line x1="15" y1="18" x2="15" y2="25" className="line" strokeWidth="1.5" />
          {isPressed ? (
            <line x1="15" y1="12" x2="15" y2="18" className="line stroke-[hsl(var(--destructive))]" strokeWidth="1.5" />
          ) : (
            <line x1="10" y1="12" x2="15" y2="18" className="line" strokeWidth="1.5" />
          )}
          <circle cx="23" cy="15" r="4" className="symbol stroke-2" style={{ fill: lampOn ? 'yellow' : 'hsl(var(--card))' }} />
          <line x1="20" y1="12" x2="26" y2="18" stroke="black" strokeWidth="1" fill="none" />
          <line x1="20" y1="18" x2="26" y2="12" stroke="black" strokeWidth="1" fill="none" />
          <text x="15" y="46" textAnchor="middle" className="component-text text-xs">{label}</text>
        </>
      );
    },
    pins: {
      'L': { x: 15, y: 1, label: 'L' },
      'Out': { x: 15, y: 39, label: 'Out' },
      'N': { x: 29, y: 20, label: 'N' }
    },
    initialDisplayPinLabels: { 'L': 'L', 'Out': 'Out', 'N': 'N' }
  },
};