"use client"; 
import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Download, Lightbulb, Info, ChevronLeft, Play } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

import type { ElectricalComponent, Connection, Point, PaletteComponentFirebaseData, ProjectType, SimulatedComponentState, SimulatedConnectionState } from '@/types/circuit';
import { COMPONENT_DEFINITIONS } from '@/config/component-definitions';
import { MOCK_PALETTE_COMPONENTS, getPaletteComponentById } from '@/config/mock-palette-data';

import DraggableComponent from '@/components/circuit/DraggableComponent';
import ComponentEditDialog from '@/components/modals/ComponentEditDialog';
import ConfirmDeleteDialog from '@/components/modals/ConfirmDeleteDialog';
import PropertiesSidebar from '@/components/sidebars/PropertiesSidebar';
import ComponentPalette from '@/components/sidebars/ComponentPalette';
import CircuitCanvas from '@/components/canvas/CircuitCanvas';
import AiSuggestionDialog from '@/components/modals/AiSuggestionDialog';
import { exportSvg } from '@/lib/svg-export';

const DesignerPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const projectName = searchParams.get('projectName') || "Unbenanntes Projekt";
  const projectType = searchParams.get('projectType') as ProjectType | null || "Steuerstromkreis";

  const [components, setComponents] = useState<ElectricalComponent[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const [simulatedComponentStates, setSimulatedComponentStates] = useState<{ [key: string]: SimulatedComponentState }>({});
  const [simulatedConnectionStates, setSimulatedConnectionStates] = useState<{ [key: string]: SimulatedConnectionState }>({});

  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  
  const [connectingPin, setConnectingPin] = useState<{ componentId: string; pinName: string, coords: Point } | null>(null);
  const [currentMouseSvgCoords, setCurrentMouseSvgCoords] = useState<Point | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [componentToEdit, setComponentToEdit] = useState<ElectricalComponent | null>(null);
  
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'component' | 'connection'; id: string } | null>(null);

  const [selectedComponentForSidebar, setSelectedComponentForSidebar] = useState<ElectricalComponent | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isPropertiesSidebarOpen, setIsPropertiesSidebarOpen] = useState(false);
  
  const { toast } = useToast();

  // --- SIMULATION LOGIC ---
  const runSimulationStep = useCallback(() => {
    setSimulatedComponentStates(currentSimStates => {
      let newSimCompStates = JSON.parse(JSON.stringify(currentSimStates));

      // 1. Kontakte anhand gesteuerter Spulen aktualisieren
      components.forEach(comp => {
        const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
        if (paletteComp?.simulation?.controlledBy === 'label_match') {
          const controllingCoils = components.filter(c =>
            c.label === comp.label &&
            getPaletteComponentById(c.firebaseComponentId)?.simulation?.affectingLabel
          );

          const isEnergized = controllingCoils.some(coil => newSimCompStates[coil.id]?.isEnergized);

          const targetState = isEnergized
            ? paletteComp.simulation.outputPinStateOnEnergized
            : (paletteComp.simulation.outputPinStateOnDeEnergized || paletteComp.simulation.initialContactState);

          if (JSON.stringify(newSimCompStates[comp.id].currentContactState) !== JSON.stringify(targetState)) {
            newSimCompStates[comp.id].currentContactState = { ...targetState };
          }
        }
      });

      // 2. Sets für beide Strompfade erstellen
      const energizedFrom24V = new Set<string>();
      const energizedFrom0V = new Set<string>();

      components.forEach(comp => {
        if (comp.type === '24V') energizedFrom24V.add(`${comp.id}/out`);
        if (comp.type === '0V') energizedFrom0V.add(`${comp.id}/in`);
      });

      const propagate = (energizedSet: Set<string>) => {
        for (let i = 0; i < (components.length + connections.length) * 2; i++) {
          let changed = false;
          connections.forEach(conn => {
            const startKey = `${conn.startComponentId}/${conn.startPinName}`;
            const endKey = `${conn.endComponentId}/${conn.endPinName}`;

            const startState = newSimCompStates[conn.startComponentId];
            const endState = newSimCompStates[conn.endComponentId];
            if (!startState || !endState) return;

            const startConducts = startState.currentContactState?.[conn.startPinName] !== 'open';
            const endConducts = endState.currentContactState?.[conn.endPinName] !== 'open';

            if (energizedSet.has(startKey) && startConducts && !energizedSet.has(endKey) && endConducts) {
              energizedSet.add(endKey);
              changed = true;
            }
            if (energizedSet.has(endKey) && endConducts && !energizedSet.has(startKey) && startConducts) {
              energizedSet.add(startKey);
              changed = true;
            }
          });
          if (!changed) break;
        }
      };

      propagate(energizedFrom24V);
      propagate(energizedFrom0V);

      // 3. Komponenten- und Verbindungszustände aktualisieren
      components.forEach(comp => {
        const simConfig = getPaletteComponentById(comp.firebaseComponentId)?.simulation;
        if (simConfig?.energizePins && simConfig.energizePins.length === 2) {
          const pin1 = `${comp.id}/${simConfig.energizePins[0]}`;
          const pin2 = `${comp.id}/${simConfig.energizePins[1]}`;

          const isEnergized =
            (energizedFrom24V.has(pin1) && energizedFrom0V.has(pin2)) ||
            (energizedFrom24V.has(pin2) && energizedFrom0V.has(pin1));

          newSimCompStates[comp.id].isEnergized = isEnergized;
        }
      });

      const newConnStates = connections.reduce((acc, conn) => {
        const startKey = `${conn.startComponentId}/${conn.startPinName}`;
        const endKey = `${conn.endComponentId}/${conn.endPinName}`;
        const isConducting =
          (energizedFrom24V.has(startKey) && energizedFrom24V.has(endKey)) ||
          (energizedFrom0V.has(startKey) && energizedFrom0V.has(endKey));
        acc[conn.id] = { isConducting };
        return acc;
      }, {} as { [key: string]: SimulatedConnectionState });

      setSimulatedConnectionStates(newConnStates);

      return newSimCompStates;
    });
  }, [components, connections]);

  useEffect(() => {
    if (isSimulating) {
      runSimulationStep();
    }
  }, [isSimulating, components, connections, runSimulationStep]);

  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => {
      const nextIsSimulating = !prev;
      if (nextIsSimulating) {
        const initialStates = components.reduce((acc, comp) => {
          const simConfig = getPaletteComponentById(comp.firebaseComponentId)?.simulation;
          acc[comp.id] = { isEnergized: false, currentContactState: { ...(simConfig?.initialContactState || {}) }};
          return acc;
        }, {} as {[key:string]: SimulatedComponentState});
        setSimulatedComponentStates(initialStates);
        setSimulatedConnectionStates(connections.reduce((acc, conn) => ({...acc, [conn.id]: {isConducting: false}}), {}));
      }
      return nextIsSimulating;
    });
  }, [components, connections]);
  
  const handleComponentClick = useCallback((id: string, isDoubleClick = false) => {
    if (isSimulating) {
        const component = components.find(c => c.id === id);
        const simConfig = getPaletteComponentById(component?.firebaseComponentId)?.simulation;

        if (component && simConfig?.interactable) {
            setSimulatedComponentStates(prev => {
                const currentSimState = prev[id];
                const isActiveState = JSON.stringify(currentSimState.currentContactState) === JSON.stringify(simConfig.outputPinStateOnEnergized);
                const nextContactState = isActiveState 
                    ? (simConfig.outputPinStateOnDeEnergized || simConfig.initialContactState || {}) 
                    : (simConfig.outputPinStateOnEnergized || {});
                
                return {
                    ...prev,
                    [id]: {
                        ...currentSimState,
                        currentContactState: nextContactState
                    }
                };
            });
        }
        return;
    }
    
    if (isDoubleClick) {
       const comp = components.find(c => c.id === id);
       if(comp) {
        setComponentToEdit(comp);
        setIsEditModalOpen(true);
       }
    } else {
        setSelectedComponentForSidebar(components.find(c => c.id === id) || null);
        setSelectedConnectionId(null);
        setIsPropertiesSidebarOpen(true);
    }
  }, [isSimulating, components]);

  const addComponent = (paletteItem: PaletteComponentFirebaseData) => {
    const newId = `${paletteItem.id.replace(/[^a-z0-9]/gi, '')}-${Date.now()}`;
    const newComponent: ElectricalComponent = {
      id: newId, type: paletteItem.type, firebaseComponentId: paletteItem.id, x: 150, y: 150,
      label: `${paletteItem.defaultLabelPrefix}${components.filter(c => c.type === paletteItem.type).length + 1}`,
      displayPinLabels: { ...(paletteItem.initialPinLabels || {}) }, scale: 1.0,
    };
    setComponents(prev => [...prev, newComponent]);
  };
  
  // ... other handlers
  const getAbsolutePinCoordinates = () => ({x:0, y:0}); // Simplified
  const handleMouseDownComponent = () => {};
  
  return (
     <div className="flex flex-row h-screen w-full bg-background p-3 gap-3 overflow-hidden">
        <ComponentPalette onAddComponent={addComponent} isOpen={true} onToggle={()=>{}} paletteComponents={MOCK_PALETTE_COMPONENTS} isSimulating={isSimulating} />
        <div className="flex-1 flex flex-col items-stretch p-0 rounded-lg shadow-md bg-card min-w-0">
            <div className="flex justify-between items-center p-4 border-b border-border">
                <h1 className="text-2xl font-bold text-primary">{projectName}</h1>
                <Button variant="outline" size="sm" onClick={toggleSimulation}>
                    <Play className="mr-2 h-4 w-4" />
                    {isSimulating ? 'Simulation beenden' : 'Simulation starten'}
                </Button>
            </div>
            <div className="flex-grow p-4 overflow-auto relative min-h-0">
                <CircuitCanvas
                    svgRef={svgRef}
                    components={components}
                    connections={connections}
                    connectingPin={connectingPin}
                    currentMouseSvgCoords={currentMouseSvgCoords}
                    getAbsolutePinCoordinates={getAbsolutePinCoordinates as any}
                    onMouseDownComponent={handleMouseDownComponent}
                    onMouseUpComponent={() => {}}
                    onPinClick={()=>{}}
                    onComponentClick={handleComponentClick}
                    onConnectionClick={()=>{}}
                    onWaypointMouseDown={()=>{}}
                    onWaypointDoubleClick={()=>{}}
                    width={800} height={700}
                    isSimulating={isSimulating}
                    isMeasuring={false}
                    measurements={[]}
                    simulatedConnectionStates={simulatedConnectionStates}
                    simulatedComponentStates={simulatedComponentStates}
                    selectedConnectionId={selectedConnectionId}
                    projectType={projectType}
                />
            </div>
        </div>
    </div>
  );
};

export default function DesignerPage() {
    return (
        <Suspense fallback={<div>Lade Projektparameter...</div>}>
            <DesignerPageContent />
        </Suspense>
    );
}
