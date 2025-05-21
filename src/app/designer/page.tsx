
"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Download, Lightbulb, Info, ChevronLeft, Play } from 'lucide-react'; // Play Icon hinzugefügt
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
  const [isPropertiesSidebarOpen, setIsPropertiesSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isAiSuggestionModalOpen, setIsAiSuggestionModalOpen] = useState(false);

  const { toast } = useToast();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 700 });

  // Simulation States
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedComponentStates, setSimulatedComponentStates] = useState<{ [key: string]: SimulatedComponentState }>({});
  const [simulatedConnectionStates, setSimulatedConnectionStates] = useState<{ [key: string]: SimulatedConnectionState }>({});
  const activeTimerTimeouts = useRef<NodeJS.Timeout[]>([]);
  const [pressedComponentId, setPressedComponentId] = useState<string | null>(null);


  const filteredPaletteComponents = MOCK_PALETTE_COMPONENTS.filter(comp => {
    if (!projectType || projectType === "Steuerstromkreis") { // Default or Steuerstromkreis shows most
      return true; 
    }
    // TODO: Implement actual filtering based on projectType and component categories/types
    return true; 
  });

  const getAbsolutePinCoordinates = useCallback((componentId: string, pinName: string): Point | null => {
    const component = components.find(c => c.id === componentId);
    if (!component) return null;
    const definition = COMPONENT_DEFINITIONS[component.type];
    if (!definition || !definition.pins[pinName]) return null;

    const pinDef = definition.pins[pinName];
    const scale = component.scale || 1;
    
    return { 
      x: component.x + pinDef.x * scale, 
      y: component.y + pinDef.y * scale 
    };
  }, [components]);

  const handleMouseDownComponent = (e: React.MouseEvent<SVGGElement>, id: string) => {
    if (isSimulating) {
      handleComponentMouseDownInSim(id);
      return;
    }
    const component = components.find(c => c.id === id);
    if (component && svgRef.current) {
      setDraggingComponentId(id);
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        const svgPoint = svgRef.current.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const pointInSvg = svgPoint.matrixTransform(CTM.inverse());
        setOffset({
          x: pointInSvg.x - component.x,
          y: pointInSvg.y - component.y,
        });
      }
    }
  };
  
  const handleComponentMouseUpInSim = useCallback(() => {
    if (pressedComponentId) {
        const component = components.find(c => c.id === pressedComponentId);
        const paletteComp = component ? getPaletteComponentById(component.firebaseComponentId) : null;

        if (component && paletteComp && paletteComp.simulation?.controlLogic === 'toggle_on_press') {
            setSimulatedComponentStates(prev => ({
                ...prev,
                [component.id]: {
                    ...prev[component.id],
                    currentContactState: { ...(paletteComp.simulation?.initialContactState || {}) }
                }
            }));
        }
        setPressedComponentId(null);
    }
  }, [pressedComponentId, components, setSimulatedComponentStates]);


  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!svgRef.current) return;
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;

    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const pointInSvg = svgPoint.matrixTransform(CTM.inverse());
    
    setCurrentMouseSvgCoords(pointInSvg);

    if (draggingComponentId && !isSimulating) {
      setComponents(prevComponents =>
        prevComponents.map(comp =>
          comp.id === draggingComponentId
            ? { ...comp, x: pointInSvg.x - offset.x, y: pointInSvg.y - offset.y }
            : comp
        )
      );
    }
  }, [draggingComponentId, offset, isSimulating]);

  const handleMouseUp = useCallback(() => {
    if (isSimulating) {
      handleComponentMouseUpInSim();
    }
    setDraggingComponentId(null);
  }, [isSimulating, handleComponentMouseUpInSim]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasDimensions({ width: Math.max(width, 300), height: Math.max(height - 50, 300) });
      }
    });

    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    return () => {
      if (canvasContainerRef.current) {
        resizeObserver.unobserve(canvasContainerRef.current);
      }
    };
  }, []);

  const runSimulationStep = useCallback(() => {
    if (!isSimulating) return;

    let newSimCompStates = JSON.parse(JSON.stringify(simulatedComponentStates)) as typeof simulatedComponentStates;
    let newSimConnStates = JSON.parse(JSON.stringify(simulatedConnectionStates)) as typeof simulatedConnectionStates;
    
    let changed = true;
    const maxIterations = components.length + connections.length + 5; // Safety break for complex loops
    let iterations = 0;

    // Reset all conduction before recalculating
    Object.keys(newSimConnStates).forEach(id => newSimConnStates[id].isConducting = false);
    Object.keys(newSimCompStates).forEach(id => {
        const compDef = getPaletteComponentById(components.find(c=>c.id === id)?.firebaseComponentId);
        if (compDef?.simulation?.controlLogic === 'visualize_energized' || compDef?.simulation?.controlLogic === 'energize_coil') {
            newSimCompStates[id].isEnergized = false;
        }
    });


    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        const poweredPins = new Set<string>(); // "componentId/pinName"

        // Start with 24V sources
        components.forEach(comp => {
            const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
            if (paletteComp?.type === '24V') {
                poweredPins.add(`${comp.id}/out`);
            }
        });

        let iterationChangedPins = true;
        while(iterationChangedPins){
            iterationChangedPins = false;
            connections.forEach(conn => {
                const startPinKey = `${conn.startComponentId}/${conn.startPinName}`;
                const endPinKey = `${conn.endComponentId}/${conn.endPinName}`;

                let currentLeadsToPinPowered = false;
                if (poweredPins.has(startPinKey)) {
                    const startComp = components.find(c => c.id === conn.startComponentId);
                    const startPaletteComp = startComp ? getPaletteComponentById(startComp.firebaseComponentId) : null;
                    const startCompState = newSimCompStates[conn.startComponentId];
                    
                    if (startCompState?.currentContactState && startCompState.currentContactState[conn.startPinName] === 'closed') {
                        currentLeadsToPinPowered = true;
                    } else if (!startCompState?.currentContactState || !startPaletteComp?.simulation?.initialContactState) { 
                        // Default pass-through for components without explicit contact states (like 24V source pin)
                        currentLeadsToPinPowered = true;
                    }
                }

                if (currentLeadsToPinPowered) {
                    if (!newSimConnStates[conn.id].isConducting) {
                        newSimConnStates[conn.id].isConducting = true;
                        changed = true;
                    }
                    if (!poweredPins.has(endPinKey)) {
                        poweredPins.add(endPinKey);
                        iterationChangedPins = true;
                        changed = true;
                    }
                }
            });
        }

        // Update component states based on powered pins
        components.forEach(comp => {
            const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
            if (!paletteComp?.simulation) return;

            const compState = newSimCompStates[comp.id];

            if (paletteComp.simulation.controlLogic === 'energize_coil' || paletteComp.simulation.controlLogic === 'visualize_energized' || paletteComp.simulation.controlLogic === 'timer_on_delay') {
                const energizePins = paletteComp.simulation.energizePins || [];
                const allEnergizePinsPowered = energizePins.every(pinName => poweredPins.has(`${comp.id}/${pinName}`));
                
                if (allEnergizePinsPowered && !compState.isEnergized) {
                    newSimCompStates[comp.id].isEnergized = true;
                    changed = true;

                    if (paletteComp.simulation.controlLogic === 'timer_on_delay' && !compState.timerActive) {
                        newSimCompStates[comp.id].timerActive = true;
                        const duration = paletteComp.simulation.timerDurationMs || 0;
                        newSimCompStates[comp.id].timerRemaining = duration;
                        
                        const timerId = setTimeout(() => {
                           setSimulatedComponentStates(prev => ({
                               ...prev,
                               [comp.id]: {
                                   ...prev[comp.id],
                                   isEnergized: true, // Timer output, might be different from coil energization
                                   currentContactState: paletteComp.simulation?.outputPinStateOnEnergized || {}, // Update contacts
                                   timerActive: false,
                                   timerRemaining: 0,
                               }
                           }));
                        }, duration);
                        activeTimerTimeouts.current.push(timerId);
                    }
                } else if (!allEnergizePinsPowered && compState.isEnergized) {
                     if (paletteComp.simulation.controlLogic !== 'timer_on_delay' || !compState.timerActive) {
                        newSimCompStates[comp.id].isEnergized = false;
                        changed = true;
                     }
                }
            }

            // Update contacts controlled by coils
            if (paletteComp.simulation.controlledBy === 'label_match' && comp.label) {
                const controllingCoil = components.find(c => {
                    const p = getPaletteComponentById(c.firebaseComponentId);
                    return p?.simulation?.affectingLabel === true && c.label === comp.label && p.simulation.controlLogic === 'energize_coil';
                });
                if (controllingCoil) {
                    const coilState = newSimCompStates[controllingCoil.id];
                    const newContactState = coilState?.isEnergized 
                        ? paletteComp.simulation.outputPinStateOnEnergized 
                        : paletteComp.simulation.outputPinStateOnDeEnergized;
                    if (JSON.stringify(newSimCompStates[comp.id].currentContactState) !== JSON.stringify(newContactState)) {
                        newSimCompStates[comp.id].currentContactState = newContactState;
                        changed = true;
                    }
                }
            }
        });
    } // end while(changed)

    setSimulatedComponentStates(newSimCompStates);
    setSimulatedConnectionStates(newSimConnStates);

  }, [isSimulating, components, connections, simulatedComponentStates, simulatedConnectionStates, setSimulatedComponentStates, setSimulatedConnectionStates]);

  useEffect(() => {
    if (isSimulating) {
      runSimulationStep();
    }
  }, [isSimulating, simulatedComponentStates]); // Run simulation when states change

  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => {
      const newSimulatingState = !prev;
      if (newSimulatingState) {
        const initialSimStates: { [key: string]: SimulatedComponentState } = {};
        components.forEach(comp => {
          const paletteComp = getPaletteComponentById(comp.firebaseComponentId);
          initialSimStates[comp.id] = {
            isEnergized: false,
            currentContactState: { ...(paletteComp?.simulation?.initialContactState || {}) },
            timerActive: false,
            timerRemaining: null,
            isLocked: paletteComp?.type === 'NotAusTaster' ? false : undefined, // Specific for NotAus
          };
        });
        setSimulatedComponentStates(initialSimStates);

        const initialConnStates: { [key: string]: SimulatedConnectionState } = {};
        connections.forEach(conn => {
          initialConnStates[conn.id] = { isConducting: false };
        });
        setSimulatedConnectionStates(initialConnStates);
        // runSimulationStep(); // Initial run will be triggered by useEffect
      } else {
        setSimulatedComponentStates({});
        setSimulatedConnectionStates({});
        activeTimerTimeouts.current.forEach(clearTimeout);
        activeTimerTimeouts.current = [];
        setPressedComponentId(null);
      }
      return newSimulatingState;
    });
  }, [components, connections, setIsSimulating, setSimulatedComponentStates, setSimulatedConnectionStates]);


  const handlePinClick = (componentId: string, pinName: string, pinCoords: Point) => {
    if (isSimulating) return; // No new connections in simulation mode

    if (connectingPin) {
      if (connectingPin.componentId === componentId && connectingPin.pinName === pinName) {
        setConnectingPin(null);
        return;
      }
      const connectionExists = connections.some(conn =>
        (conn.startComponentId === connectingPin.componentId && conn.startPinName === connectingPin.pinName &&
         conn.endComponentId === componentId && conn.endPinName === pinName) ||
        (conn.startComponentId === componentId && conn.startPinName === pinName &&
         conn.endComponentId === connectingPin.componentId && conn.endPinName === connectingPin.pinName)
      );

      if (!connectionExists) {
        setConnections(prev => [
          ...prev,
          {
            id: `conn-${Date.now()}`,
            startComponentId: connectingPin.componentId,
            startPinName: connectingPin.pinName,
            endComponentId: componentId,
            endPinName: pinName,
          },
        ]);
        toast({ title: "Verbindung erstellt", description: `Zwischen ${connectingPin.componentId}/${connectingPin.pinName} und ${componentId}/${pinName}.` });
      } else {
        toast({ title: "Verbindung existiert bereits", variant: "destructive" });
      }
      setConnectingPin(null);
    } else {
      setConnectingPin({ componentId, pinName, coords: pinCoords });
    }
  };

  const handleComponentClick = (id: string, isDoubleClick = false) => {
    const component = components.find(c => c.id === id);
    if (!component) return;
    
    const paletteDef = getPaletteComponentById(component.firebaseComponentId);

    if (isSimulating) {
        if (paletteDef?.simulation?.interactable && paletteDef.simulation.controlLogic === 'toggle_on_click') {
            setSimulatedComponentStates(prev => {
                const currentPinStates = prev[id]?.currentContactState || {};
                const newPinStates: { [key: string]: 'open' | 'closed' } = {};
                // Toggle each pin based on its current state vs initial/active states
                Object.keys(paletteDef.simulation?.initialContactState || {}).forEach(pinKey => {
                     // This is a simplified toggle, assumes two states.
                    const isActive = Object.values(currentPinStates).every(s => s === 'closed'); // Example: if all are closed, it's "active"
                    if (isActive) { // if "active", toggle to "inactive" state
                        newPinStates[pinKey] = paletteDef.simulation?.initialContactState?.[pinKey] || 'open';
                    } else { // if "inactive", toggle to "active" state
                         newPinStates[pinKey] = (paletteDef.simulation?.outputPinStateOnEnergized?.[pinKey] || 
                                                paletteDef.simulation?.affectsPins?.[pinKey]?.active) || 'closed';

                    }
                });
                return { ...prev, [id]: { ...prev[id], currentContactState: newPinStates } };
            });
        }
        return; // No modal or sidebar in simulation for now
    }

    if (isDoubleClick) {
      setComponentToEdit(component);
      setIsEditModalOpen(true);
      setIsPropertiesSidebarOpen(false);
    } else {
      if (paletteDef?.hasToggleState && !connectingPin && !isSimulating) { // Only toggle if not simulating
        const definition = COMPONENT_DEFINITIONS[component.type];
        if (definition?.initialState) { 
           setComponents(prev =>
            prev.map(comp => {
              if (comp.id === id) {
                const newState = { ...(comp.state || definition.initialState) }; 
                if (comp.type === 'Schließer') newState.isOpen = !newState.isOpen;
                else if (comp.type === 'Öffner') newState.isClosed = !newState.isClosed;
                return { ...comp, state: newState };
              }
              return comp;
            })
          );
        }
      }
      setSelectedComponentForSidebar(component);
      setIsPropertiesSidebarOpen(true);
    }
  };

  const handleComponentMouseDownInSim = (id: string) => {
    const component = components.find(c => c.id === id);
    const paletteComp = component ? getPaletteComponentById(component.firebaseComponentId) : null;

    if (component && paletteComp && paletteComp.simulation?.interactable && paletteComp.simulation.controlLogic === 'toggle_on_press') {
        setPressedComponentId(id);
        setSimulatedComponentStates(prev => {
            const newContactState: { [key: string]: 'open' | 'closed' } = {};
            const activePins = paletteComp.simulation?.outputPinStateOnEnergized || paletteComp.simulation?.affectsPins;
            if (activePins) {
                 Object.keys(activePins).forEach(pinKey => {
                    newContactState[pinKey] = (activePins as any)[pinKey]?.active || 'closed';
                 });
            }
            return {
                ...prev,
                [component.id]: {
                    ...prev[component.id],
                    currentContactState: newContactState
                }
            };
        });
    }
  };
  
  const handleSaveComponentChanges = (id: string, newLabel: string, newPinLabels: Record<string, string>) => {
    setComponents(prev =>
      prev.map(comp =>
        comp.id === id ? { ...comp, label: newLabel, displayPinLabels: newPinLabels } : comp
      )
    );
    if (selectedComponentForSidebar?.id === id) {
      setSelectedComponentForSidebar(prev => prev ? { ...prev, label: newLabel, displayPinLabels: newPinLabels } : null);
    }
    toast({ title: "Komponente gespeichert", description: `Änderungen an ${newLabel} wurden übernommen.` });
  };

  const handleUpdateComponentFromSidebar = (id: string, updates: Partial<ElectricalComponent>) => {
    setComponents(prev =>
      prev.map(comp => (comp.id === id ? { ...comp, ...updates } : comp))
    );
    setSelectedComponentForSidebar(prev => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  };

  const addComponent = (paletteItem: PaletteComponentFirebaseData) => {
    if (isSimulating) {
        toast({ title: "Aktion nicht erlaubt", description: "Bauteile können nicht während der Simulation hinzugefügt werden.", variant: "destructive" });
        return;
    }
    const newId = `${paletteItem.id.replace(/[^a-z0-9]/gi, '')}-${Date.now()}`;
    const definition = COMPONENT_DEFINITIONS[paletteItem.type];
    
    const existingOfType = components.filter(c => c.firebaseComponentId === paletteItem.id).length;
    let newLabel = `${paletteItem.defaultLabelPrefix}${existingOfType + 1}`;
    if (paletteItem.defaultLabelPrefix === '+24V' || paletteItem.defaultLabelPrefix === '0V') {
      newLabel = paletteItem.defaultLabelPrefix; 
      if (components.some(c => c.label === newLabel)) { 
        newLabel = `${paletteItem.defaultLabelPrefix}${existingOfType + 1}`;
      }
    }

    const newComponent: ElectricalComponent = {
      id: newId,
      type: paletteItem.type,
      firebaseComponentId: paletteItem.id,
      x: 100 + components.length * 10, 
      y: 100 + components.length * 10,
      label: newLabel,
      state: definition?.initialState ? { ...definition.initialState } : undefined,
      displayPinLabels: { ...(paletteItem.initialPinLabels || {}) },
      scale: 1.0, 
      width: null, 
      height: null, 
    };
    setComponents(prev => [...prev, newComponent]);
    setComponentToEdit(newComponent); 
    setIsEditModalOpen(true);
    setIsPropertiesSidebarOpen(false);
    toast({ title: "Komponente hinzugefügt", description: `${newLabel} (${paletteItem.name}) wurde der Arbeitsfläche hinzugefügt.` });
  };

  const confirmDelete = (type: 'component' | 'connection', id: string) => {
    if (isSimulating) {
        toast({ title: "Aktion nicht erlaubt", description: "Elemente können nicht während der Simulation gelöscht werden.", variant: "destructive" });
        return;
    }
    setDeleteTarget({ type, id });
    setIsConfirmDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const componentLabel = components.find(c=>c.id === deleteTarget.id)?.label;
    if (deleteTarget.type === 'component') {
      setComponents(prev => prev.filter(comp => comp.id !== deleteTarget.id));
      setConnections(prev => prev.filter(conn => conn.startComponentId !== deleteTarget.id && conn.endComponentId !== deleteTarget.id));
      if (connectingPin?.componentId === deleteTarget.id) setConnectingPin(null);
      if (selectedComponentForSidebar?.id === deleteTarget.id) {
        setSelectedComponentForSidebar(null);
        setIsPropertiesSidebarOpen(false);
      }
       toast({ title: "Komponente gelöscht", description: `Komponente "${componentLabel || deleteTarget.id}" entfernt.` });
    } else if (deleteTarget.type === 'connection') {
      setConnections(prev => prev.filter(conn => conn.id !== deleteTarget.id));
      toast({ title: "Verbindung gelöscht", description: `Verbindung ${deleteTarget.id} entfernt.` });
    }
    setIsConfirmDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleConnectionContextMenu = (e: React.MouseEvent<SVGLineElement>, connectionId: string) => {
    e.preventDefault();
    if (isSimulating) return;
    confirmDelete('connection', connectionId);
  };
  
  const handleExportSVG = () => {
    exportSvg(svgRef.current, `${projectName}_CircuitCraft.svg`);
    toast({ title: "SVG Exportiert", description: "Ihre Schaltung wurde als SVG heruntergeladen." });
  };


  return (
    <div className="flex flex-row h-screen w-full bg-background p-3 gap-3 overflow-hidden">
      <ComponentPalette
        onAddComponent={addComponent}
        isOpen={isPaletteOpen}
        onToggle={() => setIsPaletteOpen(!isPaletteOpen)}
        paletteComponents={filteredPaletteComponents} 
        isSimulating={isSimulating}
      />

      <div ref={canvasContainerRef} className="flex-1 flex flex-col items-stretch p-0 rounded-lg shadow-md bg-card min-w-0">
        <div className="flex justify-between items-center p-4 border-b border-border">
            <div>
                <Link href="/" passHref>
                    <Button variant="outline" size="sm" className="mb-2 flex items-center">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Zurück zur Startseite
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-primary">{projectName}</h1>
                <p className="text-sm text-muted-foreground">Projekttyp: {projectType}</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={toggleSimulation}>
                    <Play className="mr-2 h-4 w-4" />
                    {isSimulating ? 'Simulation beenden' : 'Simulation starten'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsAiSuggestionModalOpen(true)}>
                    <Lightbulb className="mr-2 h-4 w-4" /> KI Vorschlag
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportSVG}>
                    <Download className="mr-2 h-4 w-4" /> SVG Export
                </Button>
            </div>
        </div>
        
        <div className="flex-grow p-4 overflow-auto relative min-h-0">
          <CircuitCanvas
            svgRef={svgRef}
            components={components}
            connections={connections}
            connectingPin={connectingPin}
            currentMouseSvgCoords={currentMouseSvgCoords}
            getAbsolutePinCoordinates={getAbsolutePinCoordinates}
            onMouseDownComponent={handleMouseDownComponent}
            onPinClick={handlePinClick}
            onComponentClick={handleComponentClick}
            onConnectionContextMenu={handleConnectionContextMenu}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            isSimulating={isSimulating}
            simulatedConnectionStates={simulatedConnectionStates}
            simulatedComponentStates={simulatedComponentStates}
          />
        </div>

        <Accordion type="single" collapsible className="w-full p-4 border-t border-border">
          <AccordionItem value="info">
            <AccordionTrigger className="text-sm hover:no-underline bg-gray-900 text-white hover:bg-gray-700 border border-gray-700 rounded-md px-4 py-2">
                <Info className="mr-2 h-4 w-4" /> Informationen & Bedienung
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-1 pt-2">
              <p><strong>Ziehen:</strong> Komponenten verschieben (nur im Bearbeitungsmodus).</p>
              <p><strong>Verbinden:</strong> Blauen Anschlusspunkt klicken, dann Zielpunkt klicken (nur im Bearbeitungsmodus).</p>
              <p><strong>Schalten (Simulation):</strong> Auf Schalter/Taster klicken, um Zustand zu ändern (wenn Simulation aktiv).</p>
              <p><strong>Bearbeiten:</strong> Doppelklick auf Komponente für Details (Modal, nur Bearbeitungsmodus).</p>
              <p><strong>Details:</strong> Klick auf Komponente öffnet rechte Seitenleiste (nur Bearbeitungsmodus).</p>
              <p><strong>Löschen:</strong> Komponente über Seitenleiste, Verbindung per Rechtsklick (nur Bearbeitungsmodus).</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {isPropertiesSidebarOpen && selectedComponentForSidebar && ( 
        <div className={`transition-all duration-300 ease-in-out ${isPropertiesSidebarOpen ? 'w-72' : 'w-0'} overflow-hidden shrink-0`}>
             <PropertiesSidebar
                component={selectedComponentForSidebar}
                paletteComponent={getPaletteComponentById(selectedComponentForSidebar.firebaseComponentId)}
                onClose={() => setIsPropertiesSidebarOpen(false)}
                onUpdateComponent={handleUpdateComponentFromSidebar}
                onDeleteComponent={(id) => confirmDelete('component', id)}
                isSimulating={isSimulating}
              />
        </div>
      )}
      

      {componentToEdit && (
        <ComponentEditDialog
          component={componentToEdit}
          paletteComponent={getPaletteComponentById(componentToEdit.firebaseComponentId)}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveComponentChanges}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          isOpen={isConfirmDeleteModalOpen}
          message={`Möchten Sie ${deleteTarget.type === 'component' ? `die Komponente "${components.find(c=>c.id === deleteTarget.id)?.label || deleteTarget.id}"` : 'diese Verbindung'} wirklich löschen?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmDeleteModalOpen(false)}
        />
      )}

      <AiSuggestionDialog 
        isOpen={isAiSuggestionModalOpen}
        onClose={() => setIsAiSuggestionModalOpen(false)}
      />
    </div>
  );
}

// Wrap the component with Suspense for useSearchParams
export default function DesignerPage() {
  return (
    <Suspense fallback={<div>Lade Projektparameter...</div>}>
      <DesignerPageContent />
    </Suspense>
  );
}

